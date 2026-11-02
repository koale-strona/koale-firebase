import { answerQuestion } from "./koala-engine.mjs";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 24;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ answer: "Ta funkcja obsługuje żądania POST." }, 405);
  }
  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ answer: "Nie udało się odczytać wiadomości. Wyślij ją ponownie." }, 400); }
  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    return jsonResponse({ answer: "Napisz pytanie, a Koala spróbuje Ci pomóc." }, 400);
  }
  const message = body.message.trim();
  if (message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse({ answer: `Wiadomość jest za długa. Maksymalnie ${MAX_MESSAGE_LENGTH} znaków.` }, 413);
  }
  if (typeof body.image === "string" && body.image.length > 0) {
    return jsonResponse({ answer: "🐨 W tej wersji nie potrafię jeszcze odczytywać obrazów. Wklej treść zadania jako tekst, a spróbuję Ci pomóc." });
  }
  const history = Array.isArray(body.history)
    ? body.history.filter(item => item && typeof item === "object").slice(-MAX_HISTORY_ITEMS)
    : [];
  try {
    const answer = answerQuestion(message, history);
    return jsonResponse({ answer: typeof answer === "string" ? answer : "Nie udało mi się przygotować odpowiedzi. Spróbuj ponownie." });
  } catch (error) {
    console.error("Koala function error:", error);
    return jsonResponse({ answer: "🐨 Wystąpił błąd podczas przygotowywania odpowiedzi. Spróbuj ponownie." }, 500);
  }
}
