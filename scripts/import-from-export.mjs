import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "koale-366a0";
const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialPath) throw new Error("Ustaw GOOGLE_APPLICATION_CREDENTIALS na ścieżkę do prywatnego pliku service account.");
const credential = JSON.parse(await readFile(credentialPath, "utf8"));
initializeApp({ credential: cert(credential), projectId });
const auth = getAuth();
const db = getFirestore();
const sourcePath = process.argv[2] || "migration-data.json";
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const usersCsvPath = process.argv[3];
const normalize = value => String(value || "").trim().toLocaleLowerCase("pl-PL").normalize("NFKC");
const hash = value => createHash("sha256").update(String(value)).digest("hex");
function parseCsv(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted && ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (!quoted && ch === delimiter) { row.push(cell); cell = ""; }
    else if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = "";
    } else cell += ch;
  }
  row.push(cell); if (row.some(value => value.trim())) rows.push(row);
  if (!rows.length) return [];
  const key = value => value.trim().toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const headers = rows[0].map(key);
  const nameCol = headers.findIndex(value => ["name", "nazwa", "uzytkownik", "username", "login"].includes(value));
  const passCol = headers.findIndex(value => ["password", "haslo", "pass"].includes(value));
  const roleCol = headers.findIndex(value => ["role", "rola", "ranga"].includes(value));
  const classCol = headers.findIndex(value => ["class", "klasa", "className".toLowerCase()].includes(value));
  const hasHeader = nameCol >= 0 || passCol >= 0 || roleCol >= 0;
  const body = hasHeader ? rows.slice(1) : rows;
  return body.map(cells => ({
    name: cells[hasHeader ? (nameCol >= 0 ? nameCol : 0) : 0] || "",
    password: cells[hasHeader ? (passCol >= 0 ? passCol : 1) : 1] || "",
    role: cells[hasHeader ? (roleCol >= 0 ? roleCol : 2) : 2] || "student",
    class: cells[hasHeader ? (classCol >= 0 ? classCol : 3) : 3] || "6"
  }));
}
const importedUsers = usersCsvPath
  ? parseCsv(await readFile(usersCsvPath, "utf8"))
  : (Array.isArray(source.users) ? source.users : []);
if (usersCsvPath && importedUsers.length === 0) throw new Error("Plik CSV nie zawiera rozpoznanych kont. Sprawdź, czy wyeksportowano właściwą zakładkę Użytkownicy.");
let usersAdded = 0;
let recordsAdded = 0;
const failures = [];

for (const row of importedUsers) {
  const name = String(row.name || "").trim();
  const password = String(row.password || "");
  if (!name || !password) { failures.push(`${name || "(bez nazwy)"}: brak hasła; konto pominięte`); continue; }
  if (password.length < 6) { failures.push(`${name}: hasło krótsze niż 6 znaków; Firebase nie przyjmie go`); continue; }
  const normalized = normalize(name);
  const key = hash(normalized);
  const uid = `k_${key.slice(0, 40)}`;
  const email = `${uid}@${projectId}.firebaseapp.com`;
  const profile = {
    name,
    role: ["student", "nauczyciel", "moderator", "admin", "sadmin"].includes(String(row.role || "student").toLowerCase()) ? String(row.role || "student").toLowerCase() : "student",
    class: String(row.class || "6"), email, disabled: false,
    createdAt: FieldValue.serverTimestamp()
  };
  try {
    try { await auth.createUser({ uid, email, password, displayName: name }); }
    catch (error) {
      if (error.code !== "auth/uid-already-exists") throw error;
      await auth.updateUser(uid, { email, password, displayName: name, disabled: false });
    }
    const batch = db.batch();
    batch.set(db.collection("users").doc(uid), profile, { merge: true });
    batch.set(db.collection("usernames").doc(key), { uid, email, name, normalizedName: normalized });
    await batch.commit();
    usersAdded++;
  } catch (error) { failures.push(`${name}: ${error.message}`); }
}

for (const row of (Array.isArray(source.data) ? source.data : [])) {
  if (!row || typeof row !== "object" || !row.type) continue;
  const type = String(row.type);
  const id = String(row.id || `${Date.now()}_${Math.random()}`);
  const docId = hash(`${type}\0${id}`);
  try {
    await db.collection("records").doc(docId).set({ ...row, type, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    recordsAdded++;
  } catch (error) { failures.push(`Dane ${type}/${id}: ${error.message}`); }
}

for (const [game, rows] of Object.entries(source.leaderboards || {})) {
  for (const row of (Array.isArray(rows) ? rows : [])) {
    const name = String(row.name || "").trim();
    const score = Math.max(0, Math.floor(Number(row.score) || 0));
    if (!name) continue;
    const id = hash(`${game}:${normalize(name)}`);
    try {
      await db.collection("leaderboards").doc(id).set({ game, uid: `legacy_${id.slice(0, 35)}`, name, score, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } catch (error) { failures.push(`Ranking ${game}/${name}: ${error.message}`); }
  }
}

console.log(`Zaimportowane konta: ${usersAdded}`);
console.log(`Zaimportowane rekordy: ${recordsAdded}`);
if (failures.length) {
  console.log("Problemy do sprawdzenia:");
  for (const issue of failures) console.log(`- ${issue}`);
}
