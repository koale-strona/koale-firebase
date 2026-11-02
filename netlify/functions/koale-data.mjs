import { createHash } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "koale-366a0";
const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || "AIzaSyBM0aPzV-jDk_qWVJMEsYFawhysOxmxdW0";
const allowedRoles = new Set(["student", "nauczyciel", "moderator", "admin", "sadmin"]);

function getServices() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("Brak FIREBASE_SERVICE_ACCOUNT w ustawieniach Netlify.");
    const serviceAccount = JSON.parse(raw);
    initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
  }
  return { auth: getAuth(), db: getFirestore() };
}
function json(result, statusCode = 200) {
  return { statusCode, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" }, body: JSON.stringify(result) };
}
function jsonp(callback, result, statusCode = 200) {
  if (!callback || !/^[A-Za-z_$][\w.$]*$/.test(callback)) return json(result, statusCode);
  return { statusCode, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" }, body: `${callback}(${JSON.stringify(result).replace(/</g, "\\u003c")});` };
}
function normalizeName(name) { return String(name || "").trim().toLocaleLowerCase("pl-PL").normalize("NFKC"); }
function keyFor(value) { return createHash("sha256").update(String(value)).digest("hex"); }
function recordKey(type, id) { return keyFor(`${String(type || "record")}\u0000${String(id || Date.now())}`); }
function publicProfile(profile, uid) {
  return { uid, name: String(profile.name || ""), role: String(profile.role || "student").toLowerCase(), class: String(profile.class || "6"), password: "" };
}
async function getProfile(db, uid) {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists ? snap.data() : null;
}
async function signIn(name, password, selectedClass, auth, db) {
  const normalized = normalizeName(name);
  const lookup = await db.collection("usernames").doc(keyFor(normalized)).get();
  if (!lookup.exists) return { success: false, error: "Nieprawidłowa nazwa użytkownika lub hasło." };
  const mapped = lookup.data();
  const profile = await getProfile(db, mapped.uid);
  if (!profile || profile.disabled) return { success: false, error: "To konto jest wyłączone." };
  if (selectedClass && profile.class && String(selectedClass).toLowerCase() !== String(profile.class).toLowerCase()) {
    return { success: false, error: "Wybrana klasa nie pasuje do konta." };
  }
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(WEB_API_KEY)}`;
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: mapped.email, password, returnSecureToken: true }) });
  const result = await response.json();
  if (!response.ok || !result.idToken) return { success: false, error: "Nieprawidłowa nazwa użytkownika lub hasło." };
  if (profile.disabled) return { success: false, error: "To konto jest wyłączone." };
  return { success: true, token: result.idToken, refreshToken: result.refreshToken, user: { name: profile.name, role: profile.role, class: profile.class || selectedClass || "6" } };
}
async function refreshIdToken(refreshToken) {
  if (!refreshToken) return null;
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(WEB_API_KEY)}`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken })
  });
  const result = await response.json();
  if (!response.ok || !result.id_token) return null;
  return { token: result.id_token, refreshToken: result.refresh_token || refreshToken };
}
async function authorize(token, refreshToken, auth) {
  try { return { decoded: await auth.verifyIdToken(token), token, refreshToken }; }
  catch (firstError) {
    const refreshed = await refreshIdToken(refreshToken);
    if (!refreshed) throw firstError;
    return { decoded: await auth.verifyIdToken(refreshed.token), ...refreshed };
  }
}
async function accountCreate(body, auth, db, actor) {
  if (actor.role !== "sadmin") throw new Error("Tylko Sadmin może tworzyć konta.");
  const name = String(body.name || "").trim();
  const password = String(body.password || "");
  const role = String(body.role || "student").toLowerCase();
  const className = String(body.class || "6");
  if (!name) throw new Error("Wpisz nazwę użytkownika.");
  if (password.length < 6) throw new Error("Firebase wymaga hasła o długości co najmniej 6 znaków.");
  if (!allowedRoles.has(role)) throw new Error("Nieprawidłowa rola.");
  const normalized = normalizeName(name);
  const userKey = keyFor(normalized);
  const lookupRef = db.collection("usernames").doc(userKey);
  if ((await lookupRef.get()).exists) throw new Error("Użytkownik o tej nazwie już istnieje.");
  const uid = `k_${userKey.slice(0, 40)}`;
  const email = `${uid}@${PROJECT_ID}.firebaseapp.com`;
  const created = await auth.createUser({ uid, email, password, displayName: name });
  const profile = { name, role, class: className, email, disabled: false, createdAt: FieldValue.serverTimestamp() };
  const batch = db.batch();
  batch.set(db.collection("users").doc(created.uid), profile);
  batch.set(lookupRef, { uid: created.uid, email, name, normalizedName: normalized });
  await batch.commit();
  return { success: true, user: publicProfile(profile, created.uid) };
}
async function adminUsers(db, actor) {
  if (!["sadmin", "admin"].includes(actor.role)) throw new Error("Brak uprawnień.");
  const snap = await db.collection("users").get();
  return snap.docs.map(doc => publicProfile(doc.data(), doc.id)).sort((a,b) => a.name.localeCompare(b.name, "pl"));
}
async function updateUserProfile(body, auth, db, actor) {
  if (actor.role !== "sadmin") throw new Error("Tylko Sadmin może zmieniać role i klasy.");
  const normalized = normalizeName(body.name);
  const lookupRef = db.collection("usernames").doc(keyFor(normalized));
  const lookup = await lookupRef.get();
  if (!lookup.exists) throw new Error("Nie znaleziono użytkownika.");
  const role = String(body.role || "student").toLowerCase();
  if (!allowedRoles.has(role)) throw new Error("Nieprawidłowa rola.");
  const profileRef = db.collection("users").doc(lookup.data().uid);
  await profileRef.update({ role, class: String(body.class || "6"), updatedAt: FieldValue.serverTimestamp() });
  return { success: true };
}
function toRecord(row) {
  const type = String(row.type || "").trim();
  const id = String(row.id || `${Date.now()}_${Math.random()}`);
  return { ...row, type, id, updatedAt: FieldValue.serverTimestamp() };
}
async function writeRecord(body, db, actor) {
  const action = String(body.action || "");
  const type = String(body.type || "");
  if (!type) throw new Error("Brak rodzaju danych.");
  if (["tasks", "answers", "notes"].includes(type) && !["sadmin", "admin", "nauczyciel"].includes(actor.role)) throw new Error("Brak uprawnień.");
  if (type === "moderation" && !["sadmin", "moderator"].includes(actor.role)) throw new Error("Brak uprawnień.");
  if (type === "bugReports" && action !== "add" && !["sadmin", "admin"].includes(actor.role)) throw new Error("Brak uprawnień.");
  if (action === "add") {
    const row = toRecord(body);
    await db.collection("records").doc(recordKey(type, row.id)).set(row);
    return { success: true };
  }
  if (action === "update") {
    const ref = db.collection("records").doc(recordKey(type, body.id));
    const changes = {};
    for (const field of ["status", "reply", "pinned", "content", "title", "subject", "className"]) if (body[field] !== undefined) changes[field] = body[field];
    changes.updatedAt = FieldValue.serverTimestamp();
    await ref.set(changes, { merge: true });
    return { success: true };
  }
  if (action === "delete") {
    if (type === "moderation" && !body.id && body.target) {
      let query = db.collection("records").where("type", "==", type).where("target", "==", String(body.target));
      if (body.moderationAction) query = query.where("moderationAction", "==", String(body.moderationAction));
      const rows = await query.get();
      const batch = db.batch(); rows.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit();
    } else {
      await db.collection("records").doc(recordKey(type, body.id)).delete();
    }
    return { success: true };
  }
  throw new Error("Nieobsługiwana operacja.");
}
async function gameBoard(action, params, auth, db, authorized) {
  if (!authorized) throw new Error("Zaloguj się, aby korzystać z rankingu.");
  const game = String(params.game || "");
  if (!new Set(["hop", "eucalyptus"]).has(game)) throw new Error("Nieznana gra.");
  const profile = await getProfile(db, authorized.decoded.uid);
  const scoreRef = db.collection("leaderboards").doc(keyFor(`${game}:${authorized.decoded.uid}`));
  if (action === "submitGameScore") {
    const score = Math.max(0, Math.floor(Number(params.score) || 0));
    const prior = await scoreRef.get();
    const oldScore = prior.exists ? Number(prior.data().score || 0) : 0;
    if (score > oldScore) await scoreRef.set({ game, uid: authorized.decoded.uid, name: `${profile?.name || "Gracz"}${profile?.class ? " kl. " + profile.class : ""}`, score, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  const all = await db.collection("leaderboards").where("game", "==", game).get();
  const scores = all.docs.map(doc => doc.data()).sort((a,b) => Number(b.score||0)-Number(a.score||0)).slice(0,10);
  const current = await scoreRef.get();
  return { success:true, top10:scores.map(row=>({name:row.name,score:row.score})), personalBest:current.exists?Number(current.data().score||0):0, user:profile?.name || "Gracz", token:authorized.token, refreshToken:authorized.refreshToken };
}
async function bootstrap(params, auth, db) {
  const token = String(params.token || "");
  let authorized = null;
  let profile = null;
  if (token) {
    authorized = await authorize(token, params.refreshToken, auth);
    profile = await getProfile(db, authorized.decoded.uid);
    if (!profile || profile.disabled) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
  }
  const recordSnap = await db.collection("records").get();
  let data = recordSnap.docs.map(doc => doc.data());
  if (!authorized) data = data.filter(row => ["tasks", "answers"].includes(row.type));
  else {
    const admin = ["sadmin", "admin", "nauczyciel", "moderator"].includes(profile.role);
    data = data.filter(row => {
      if (row.type === "studentNotes" || row.type === "bugReports") return admin || String(row.user || "").toLowerCase() === String(profile.name || "").toLowerCase();
      return true;
    });
  }
  const userRows = [];
  if (profile) {
    if (["sadmin", "admin", "moderator"].includes(profile.role)) {
      const snap = await db.collection("users").get();
      snap.docs.forEach(doc => userRows.push(publicProfile(doc.data(), doc.id)));
    } else userRows.push(publicProfile(profile, authorized.decoded.uid));
  }
  return { success:true, users:userRows, data, token:authorized?.token, refreshToken:authorized?.refreshToken };
}
async function route(event) {
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";
  const qs = event.queryStringParameters || {};
  let body = {};
  const contentType = event.headers?.["content-type"] || event.headers?.["Content-Type"] || "";
  if (method === "POST") {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString() : event.body || "";
    if (contentType.includes("application/json")) body = JSON.parse(raw || "{}");
    else { const form = new URLSearchParams(raw); body = JSON.parse(form.get("payload") || "{}"); }
  }
  const params = method === "GET" ? qs : body;
  const action = String(params.action || "");
  if (method === "GET" && action === "login") {
    const { auth, db } = getServices();
    return signIn(params.name, params.password, params.class, auth, db);
  }
  if (method === "GET" && action === "logout") return { success:true };
  if (method === "GET" && action === "maintenanceStatus") {
    const { db } = getServices(); const snap = await db.collection("settings").doc("global").get(); return { success:true, maintenance:!!snap.data()?.maintenance };
  }
  const { auth, db } = getServices();
  let authorized = null; let actor = null;
  if (params.token) {
    authorized = await authorize(String(params.token), String(params.refreshToken || ""), auth);
    actor = await getProfile(db, authorized.decoded.uid);
    if (!actor || actor.disabled) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    if (authorized.token !== params.token) { params.token = authorized.token; params.refreshToken = authorized.refreshToken; }
  }
  if (method === "GET" && action === "bootstrap") return bootstrap(params, auth, db);
  if (method === "GET" && action === "adminUsers") return { success:true, users:await adminUsers(db, actor || {}) , token:authorized?.token, refreshToken:authorized?.refreshToken };
  if (method === "GET" && ["gameLeaderboard", "submitGameScore"].includes(action)) return gameBoard(action, params, auth, db, authorized);
  if (method === "POST" && action === "createUser") return accountCreate(body, auth, db, actor || {});
  if (method === "POST" && action === "updateUserProfile") return updateUserProfile(body, auth, db, actor || {});
  if (method === "POST" && action === "maintenanceToggle") {
    if (actor?.role !== "sadmin") throw new Error("Tylko Sadmin może zmienić tryb przerwy.");
    const enabled = Boolean(body.maintenance);
    await db.collection("settings").doc("global").set({ maintenance:enabled, updatedAt:FieldValue.serverTimestamp() }, {merge:true});
    return { success:true, maintenance:enabled };
  }
  if (method === "POST") return writeRecord(body, db, actor || {});
  return { success:false, error:"Nieobsługiwana operacja." };
}

export const handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";
  if (method === "OPTIONS") return { statusCode:204, headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"}, body:"" };
  const params = event.queryStringParameters || {};
  const callback = params.callback;
  let result;
  let statusCode = 200;
  try { result = await route(event); }
  catch (error) { statusCode = 400; result = { success:false, error:String(error?.message || "Błąd Firebase.") }; }
  if (method === "POST") {
    const contentType = event.headers?.["content-type"] || event.headers?.["Content-Type"] || "";
    if (contentType.includes("application/json")) return json(result, statusCode);
    const raw = JSON.stringify({ source:"koale-apps-script", requestId: (()=>{try{const form=new URLSearchParams(event.body||"");const p=JSON.parse(form.get("payload")||"{}");return p.requestId||""}catch{return ""}})(), result }).replace(/</g,"\\u003c");
    return { statusCode, headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*"}, body:`<!doctype html><script>parent.postMessage(${raw},"*")</script>` };
  }
  return jsonp(callback, result, statusCode);
};
