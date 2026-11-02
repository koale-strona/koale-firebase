/*
 * Koala.ai — lokalny, edukacyjny silnik regułowy.
 * Bez zewnętrznych modeli AI, kluczy API i zależności.
 * Obsługuje bazę wiedzy, naukę krok po kroku i matematykę.
 * Nie jest modelem językowym ogólnego przeznaczenia.
 */

const MAX_QUESTION_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 24;
const MAX_MATH_LENGTH = 180;
const MAX_MATH_TOKENS = 80;

const knowledge = [
  {
    title: "Rzeczownik",
    keywords: ["rzeczownik", "co to jest rzeczownik"],
    short: "Rzeczownik nazywa osoby, zwierzęta, rzeczy, miejsca, zjawiska i pojęcia.",
    explanation: "Odpowiada na pytania: kto? co? Odmienia się przez przypadki i liczby. Występuje w rodzaju męskim, żeńskim lub nijakim.",
    example: "W zdaniu „Pies biega” wyraz „pies” jest rzeczownikiem. Inne przykłady: uczeń, książka, szkoła, radość.",
    related: "Rzeczownik często występuje z przymiotnikiem, który opisuje jego cechy.",
    check: "W zdaniu „Zielony kot śpi” wskaż rzeczownik."
  },
  {
    title: "Czasownik",
    keywords: ["czasownik", "co to jest czasownik"],
    short: "Czasownik oznacza czynność, stan lub proces.",
    explanation: "Odpowiada na pytania: co robi? co się z nim dzieje? Czasowniki występują w czasie przeszłym, teraźniejszym i przyszłym oraz odmieniają się przez osoby i liczby.",
    example: "W zdaniu „Ola czyta książkę” wyraz „czyta” jest czasownikiem. Inne przykłady: pisze, biega, śpi.",
    related: "Czasownik jest ważnym elementem orzeczenia w zdaniu.",
    check: "Znajdź czasownik w zdaniu: „Dzieci grają w piłkę”."
  },
  {
    title: "Przymiotnik",
    keywords: ["przymiotnik", "co to jest przymiotnik"],
    short: "Przymiotnik określa cechy osób, rzeczy i zjawisk.",
    explanation: "Odpowiada na pytania: jaki? jaka? jakie? Dopasowuje się do rzeczownika pod względem rodzaju, liczby i przypadku.",
    example: "W wyrażeniu „zielona trawa” wyraz „zielona” jest przymiotnikiem. Inne przykłady: wysoki budynek, ciekawe książki.",
    related: "Przymiotnik najczęściej opisuje rzeczownik.",
    check: "Który wyraz jest przymiotnikiem: „mały pies szybko biegnie”?"
  },
  {
    title: "Przysłówek",
    keywords: ["przysłówek", "przyslowek", "co to jest przysłówek"],
    short: "Przysłówek określa sposób, miejsce, czas lub stopień wykonywania czynności.",
    explanation: "Odpowiada między innymi na pytania: jak? gdzie? kiedy? Często określa czasownik.",
    example: "W zdaniu „Ola biegnie szybko” wyraz „szybko” jest przysłówkiem. Inne przykłady: daleko, wczoraj, bardzo.",
    related: "Od wielu przymiotników można utworzyć przysłówki, np. szybki — szybko.",
    check: "Jakim pytaniem rozpoznasz przysłówek „wczoraj”?"
  },
  {
    title: "Zaimek",
    keywords: ["zaimek", "co to jest zaimek"],
    short: "Zaimek zastępuje inne części mowy, najczęściej rzeczownik, przymiotnik lub liczebnik.",
    explanation: "Dzięki zaimkom nie musimy stale powtarzać tych samych wyrazów. Przykłady pytań: kto? jaki? ile? czyj?",
    example: "Zamiast „Ania wzięła książkę Ani” możemy powiedzieć „Ania wzięła swoją książkę”. Wyraz „swoją” jest zaimkiem.",
    related: "Przykłady zaimków: ja, ty, on, ona, mój, ten, tyle, kto.",
    check: "W zdaniu „Ona czyta swoją książkę” wskaż dwa zaimki."
  },
  {
    title: "Liczby pierwsze",
    keywords: ["liczba pierwsza", "liczby pierwsze"],
    short: "Liczba pierwsza to liczba naturalna większa od 1, która ma dokładnie dwa dzielniki: 1 i samą siebie.",
    explanation: "Aby sprawdzić, czy liczba jest pierwsza, szukamy dzielników innych niż 1 i ona sama. Jeśli żadnego nie ma, liczba jest pierwsza.",
    example: "2, 3, 5, 7, 11 i 13 są pierwsze. 9 nie jest pierwsza, bo dzieli się przez 3.",
    related: "Liczba 2 jest jedyną parzystą liczbą pierwszą. Liczba 1 nie jest pierwsza.",
    check: "Czy 15 jest liczbą pierwszą? Spróbuj znaleźć jej dzielnik oprócz 1 i 15."
  },
  {
    title: "Ułamki zwykłe",
    keywords: ["ułamek zwykły", "ulamek zwykly", "ułamek", "ulamek", "ułamki", "ulamki"],
    short: "Ułamek zwykły przedstawia część całości. Składa się z licznika i mianownika.",
    explanation: "Mianownik jest pod kreską i mówi, na ile równych części podzielono całość. Licznik jest nad kreską i mówi, ile części wybrano.",
    example: "W ułamku 3/4 mianownik 4 oznacza cztery równe części, a licznik 3 oznacza trzy wybrane części.",
    related: "Ułamki można skracać, rozszerzać, dodawać, odejmować, mnożyć i dzielić.",
    check: "W ułamku 2/5 wskaż licznik i mianownik."
  },
  {
    title: "Procenty",
    keywords: ["procent", "procenty", "co to jest procent"],
    short: "Procent oznacza jedną setną całości. Zapisujemy go symbolem %.",
    explanation: "100% to całość, 50% to połowa, 25% to jedna czwarta, a 10% to jedna dziesiąta. Procent zamieniamy na ułamek dziesiętny, dzieląc przez 100.",
    example: "20% z 50 to 10, ponieważ 20/100 × 50 = 10.",
    related: "Procenty wykorzystujemy m.in. przy obniżkach, podwyżkach, wynikach i statystykach.",
    check: "Ile wynosi 10% z 80?"
  },
  {
    title: "Pole kwadratu",
    keywords: ["pole kwadratu", "jak obliczyć pole kwadratu", "jak obliczyc pole kwadratu"],
    short: "Pole kwadratu obliczamy ze wzoru P = a × a, czyli P = a².",
    explanation: "Litera a oznacza długość boku. Pole opisuje powierzchnię figury, dlatego wynik zapisujemy w jednostkach kwadratowych, np. cm².",
    example: "Jeśli bok ma 4 cm, to P = 4 × 4 = 16 cm².",
    related: "Obwód kwadratu obliczamy ze wzoru O = 4 × a.",
    check: "Kwadrat ma bok 5 cm. Jaki jest jego wzór na pole i wynik?"
  },
  {
    title: "Pole prostokąta",
    keywords: ["pole prostokąta", "pole prostokata", "prostokąt", "prostokat"],
    short: "Pole prostokąta obliczamy ze wzoru P = a × b.",
    explanation: "Mnożymy długość jednego boku przez długość drugiego boku. Wynik zapisujemy w jednostkach kwadratowych.",
    example: "Dla boków 6 cm i 3 cm: P = 6 × 3 = 18 cm².",
    related: "Obwód prostokąta to O = 2a + 2b.",
    check: "Prostokąt ma boki 7 cm i 2 cm. Jak obliczysz jego pole?"
  },
  {
    title: "Obwód kwadratu",
    keywords: ["obwód kwadratu", "obwod kwadratu"],
    short: "Obwód kwadratu obliczamy ze wzoru O = 4 × a.",
    explanation: "Kwadrat ma cztery równe boki. Obwód to suma długości wszystkich boków.",
    example: "Jeśli bok ma 3 cm, obwód wynosi 3 + 3 + 3 + 3 = 12 cm.",
    related: "Pole kwadratu obliczamy ze wzoru P = a². Obwód i pole to różne wielkości.",
    check: "Kwadrat ma bok 6 cm. Jaki jest jego obwód?"
  },
    {
    title: "Obwód prostokąta",
    keywords: ["obwód prostokąta", "obwod prostokata"],
    short: "Obwód prostokąta obliczamy ze wzoru O = 2a + 2b.",
    explanation: "Dodajemy długości wszystkich czterech boków. Przeciwległe boki prostokąta są równe.",
    example: "Dla boków 5 cm i 3 cm: O = 5 + 3 + 5 + 3 = 16 cm.",
    related: "Pole prostokąta obliczamy ze wzoru P = a × b.",
    check: "Prostokąt ma boki 8 cm i 4 cm. Oblicz jego obwód."
  },
  {
    title: "Fotosynteza",
    keywords: ["fotosynteza", "co to jest fotosynteza"],
    short: "Fotosynteza to proces, w którym rośliny wykorzystują energię światła do wytwarzania substancji organicznych.",
    explanation: "Rośliny pobierają wodę i dwutlenek węgla. Dzięki energii światła i chlorofilowi wytwarzają związki organiczne, między innymi glukozę. W procesie uwalnia się tlen.",
    example: "Liście pobierają światło słoneczne, a roślina wykorzystuje jego energię podczas fotosyntezy.",
    related: "Fotosynteza dostarcza materii organicznej i uwalnia tlen.",
    check: "Jakie dwa surowce roślina pobiera do fotosyntezy?"
  },
  {
    title: "Oddychanie komórkowe",
    keywords: ["oddychanie komórkowe", "oddychanie komorkowe"],
    short: "Oddychanie komórkowe to proces uwalniania energii ze związków organicznych.",
    explanation: "W oddychaniu tlenowym komórki wykorzystują tlen do rozkładania glukozy. Powstają dwutlenek węgla, woda i energia magazynowana między innymi w ATP.",
    example: "Komórki mięśni wykorzystują energię uzyskaną w oddychaniu komórkowym do pracy.",
    related: "Fotosynteza magazynuje energię w związkach organicznych, a oddychanie komórkowe pozwala ją uwalniać.",
    check: "Jaki gaz jest wykorzystywany w oddychaniu tlenowym?"
  },
  {
    title: "Komórka",
    keywords: ["komórka biologiczna", "komorka biologiczna", "komórka", "komorka"],
    short: "Komórka jest podstawową jednostką budowy i funkcjonowania organizmów.",
    explanation: "Wiele komórek zawiera błonę komórkową, cytoplazmę i materiał genetyczny. Komórki roślinne mają dodatkowo m.in. ścianę komórkową i chloroplasty.",
    example: "Komórki mięśniowe umożliwiają ruch, a komórki nerwowe uczestniczą w przekazywaniu informacji.",
    related: "Wiele komórek może tworzyć tkanki, narządy i układy narządów.",
    check: "Wymień jedną strukturę charakterystyczną dla komórki roślinnej."
  },
  {
    title: "Układ Słoneczny",
    keywords: ["układ słoneczny", "uklad sloneczny", "planety układu słonecznego", "planety ukladu slonecznego"],
    short: "Układ Słoneczny składa się ze Słońca oraz krążących wokół niego planet i innych ciał niebieskich.",
    explanation: "Grawitacja Słońca utrzymuje planety na orbitach. W Układzie Słonecznym znajdują się też księżyce, planety karłowate, asteroidy i komety.",
    example: "Osiem planet to: Merkury, Wenus, Ziemia, Mars, Jowisz, Saturn, Uran i Neptun.",
    related: "Ziemia jest trzecią planetą od Słońca.",
    check: "Która planeta znajduje się najbliżej Słońca?"
  },
  {
    title: "Grawitacja",
    keywords: ["grawitacja", "co to jest grawitacja"],
    short: "Grawitacja to oddziaływanie, dzięki któremu obiekty posiadające masę przyciągają się.",
    explanation: "Siła przyciągania zależy między innymi od mas obiektów i odległości między nimi. Grawitacja Ziemi utrzymuje nas na jej powierzchni.",
    example: "Gdy puścisz piłkę, spada ona w kierunku podłoża wskutek przyciągania grawitacyjnego Ziemi.",
    related: "Grawitacja wpływa także na ruch Księżyca wokół Ziemi i planet wokół Słońca.",
    check: "Dlaczego piłka puszczona z ręki spada na ziemię?"
  },
  {
    title: "Atom",
    keywords: ["atom", "co to jest atom", "budowa atomu"],
    short: "Atom to podstawowa jednostka budowy pierwiastka chemicznego.",
    explanation: "Atom składa się z jądra, w którym znajdują się protony i neutrony, oraz elektronów znajdujących się wokół jądra.",
    example: "Atom wodoru ma jeden proton w jądrze i zwykle jeden elektron.",
    related: "Liczba protonów określa, jaki to pierwiastek chemiczny.",
    check: "Jak nazywają się cząstki znajdujące się w jądrze atomu?"
  },
  {
    title: "Energia",
    keywords: ["energia", "co to jest energia", "energia kinetyczna", "energia potencjalna"],
    short: "Energia opisuje zdolność układu do wykonania pracy lub wywołania zmian.",
    explanation: "Wyróżnia się między innymi energię kinetyczną, potencjalną, cieplną, chemiczną i elektryczną. Energia może zmieniać formę.",
    example: "Poruszający się rower ma energię kinetyczną, a podniesiony przedmiot — energię potencjalną grawitacji.",
    related: "Zgodnie z zasadą zachowania energii nie znika ona, lecz ulega przemianom.",
    check: "Jaką energię ma poruszający się rower?"
  },
  {
    title: "Demokracja",
    keywords: ["demokracja", "co to jest demokracja"],
    short: "Demokracja to forma rządów, w której obywatele mają udział w podejmowaniu decyzji publicznych.",
    explanation: "Obywatele mogą uczestniczyć w życiu politycznym między innymi poprzez wybory. Ważne są też prawa obywatelskie, pluralizm i praworządność.",
    example: "Wybory parlamentarne są jednym ze sposobów udziału obywateli w demokracji.",
    related: "Demokracja może mieć różne formy i rozwiązania instytucjonalne.",
    check: "W jaki sposób obywatele mogą uczestniczyć w demokracji?"
  },
  {
    title: "Pan Tadeusz",
    keywords: ["pan tadeusz", "autor pana tadeusza", "kto napisał pana tadeusza", "kto napisal pana tadeusza"],
    short: "Autorem epopei „Pan Tadeusz” jest Adam Mickiewicz.",
    explanation: "Utwór został wydany w 1834 roku. Jego pełny tytuł brzmi „Pan Tadeusz, czyli Ostatni zajazd na Litwie”.",
    example: "Akcja utworu rozgrywa się na Litwie, a ważne tematy to życie szlachty i tęsknota za ojczyzną.",
    related: "Adam Mickiewicz jest jednym z najważniejszych polskich poetów romantycznych.",
    check: "Kto jest autorem „Pana Tadeusza”?"
  },
  {
    title: "Druga wojna światowa",
    keywords: ["druga wojna światowa", "druga wojna swiatowa", "ii wojna światowa", "ii wojna swiatowa"],
    short: "II wojna światowa trwała od 1939 do 1945 roku.",
    explanation: "Rozpoczęła się 1 września 1939 roku atakiem Niemiec na Polskę. Był to największy konflikt zbrojny w historii.",
    example: "W Europie wojna zakończyła się w maju 1945 roku, a kapitulacja Japonii nastąpiła we wrześniu 1945 roku.",
    related: "Skutkami wojny były ogromne straty ludzkie, zniszczenia miast i zmiany granic państw.",
    check: "W którym roku rozpoczęła się II wojna światowa?"
  },
  {
    title: "Najdłuższa rzeka Polski",
    keywords: ["najdłuższa rzeka polski", "najdluzsza rzeka polski", "wisła", "wisla"],
    short: "Najdłuższą rzeką Polski jest Wisła.",
    explanation: "Wisła ma około 1047 km długości. Przepływa przez wiele regionów Polski i uchodzi do Morza Bałtyckiego.",
    example: "Do ważnych miast położonych nad Wisłą należą Kraków, Warszawa i Toruń.",
    related: "Wisła jest ważnym elementem geografii i historii Polski.",
    check: "Do jakiego morza uchodzi Wisła?"
  }
];
function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:()[\]{}"'„”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(text, phrase) {
  return (` ${text} `).includes(` ${normalize(phrase)} `);
}

function findKnowledge(question) {
  const text = normalize(question);
  let best = null;
  let bestScore = 0;

  for (const item of knowledge) {
    for (const keyword of item.keywords) {
      const normalizedKeyword = normalize(keyword);

      if (
        containsPhrase(text, normalizedKeyword) &&
        normalizedKeyword.length > bestScore
      ) {
        best = item;
        bestScore = normalizedKeyword.length;
      }
    }
  }

  return best;
}

function getIntent(question) {
  const text = normalize(question);

  if (/\b(notatk\w*|podsumuj\w*|podsumowani\w*|skroc\w*|najwazniejsz\w*)\b/.test(text)) {
    return "summary";
  }

  if (/\b(przyklad\w*|podaj przyklad|daj przyklad)\b/.test(text)) {
    return "example";
  }

  if (/\b(prosciej|latwiej|nie rozumiem|wytlumacz\w*|wyjasn\w*|po ludzku)\b/.test(text)) {
    return "simple";
  }

  if (/\b(dlaczego|czemu|z jakiego powodu)\b/.test(text)) {
    return "why";
  }

  if (/\b(rozwin\w*|rozszerz\w*|dokladniej|wiecej|opowiedz wiecej|szerzej)\b/.test(text)) {
    return "expand";
  }

  if (/\b(sprawdz mnie|zrob quiz|przepytaj mnie|pytanie sprawdzajace)\b/.test(text)) {
    return "quiz";
  }

  return "normal";
}

function isFollowUp(question) {
  const text = normalize(question);

  return (
    /^(a\s+)?(mozesz\s+mi\s+to\s+)?(wyjasn\w*|wytlumacz\w*|dlaczego|czemu|jak to|rozwin\w*|rozszerz\w*|dokladniej|wiecej|przyklad|podaj przyklad|daj przyklad|prosciej|latwiej|nie rozumiem|zrob notatk\w*|podsumuj\w*|sprawdz mnie|przepytaj mnie)( .*)?$/.test(text) ||
    /\b(notatk\w*|podsumuj\w*|podsumowani\w*)\b/.test(text)
  );
}

function isTopicChange(question) {
  const text = normalize(question);

  return /\b(zmienmy temat|zmien temat|zmieniamy temat|przejdzmy do|teraz matm\w*|teraz matematy\w*|teraz biologi\w*|teraz histori\w*|teraz geograf\w*|teraz polski)\b/.test(text);
}

function formatNumber(value) {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 8
  }).format(value);
}

function formatKnowledge(item, intent = "normal") {
  if (!item) return null;

  if (intent === "example") {
    return `🐨 Przyjrzyjmy się przykładowi: ${item.title}

${item.example}

🎓 Sprawdź, czy rozumiesz:
${item.check}`;
  }

  if (intent === "simple") {
    return `🐨 Wyjaśnię to prostszymi słowami.

${item.title}

${item.short}

Pomyśl o tym na takim przykładzie:
${item.example}

Czy teraz jest to bardziej zrozumiałe?`;
  }

  if (intent === "summary") {
    return `📝 KRÓTKA NOTATKA — ${item.title}

• Najważniejsze:
${item.short}

• Warto zapamiętać:
${item.explanation}

• Przykład:
${item.example}`;
  }

  if (intent === "why") {
    return `🐨 Dlaczego to jest ważne?

${item.related}

Przyjrzyjmy się temu dokładniej:
${item.explanation}`;
  }

  if (intent === "expand") {
    return `📚 ROZWINIĘCIE TEMATU: ${item.title}

1. PODSTAWOWA DEFINICJA
${item.short}

2. DOKŁADNIEJSZE WYJAŚNIENIE
${item.explanation}

3. PRZYKŁAD
${item.example}

4. CO WARTO ZAPAMIĘTAĆ?
${item.related}

🎓 SPRAWDŹ SWOJĄ WIEDZĘ
${item.check}`;
  }

  if (intent === "quiz") {
    return `🎓 Czas sprawdzić Twoją wiedzę!

Temat: ${item.title}

Pytanie:
${item.check}

Spróbuj odpowiedzieć samodzielnie. Nie podam od razu rozwiązania! 🐨`;
  }

  return `🐨 ${item.title}

NAJWAŻNIEJSZE:
${item.short}

WYJAŚNIENIE:
${item.explanation}

PRZYKŁAD:
${item.example}

🎓 SPRAWDŹ, CZY ROZUMIESZ:
${item.check}

Możesz poprosić mnie o prostsze wyjaśnienie, przykład albo krótką notatkę.`;
}

function getPreviousUserQuestion(history) {
  if (!Array.isArray(history)) return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];

    if (
      item &&
      item.role === "user" &&
      typeof item.text === "string"
    ) {
      return item.text;
    }
  }

  return null;
}

function getPreviousAnswer(history) {
  if (!Array.isArray(history)) return "";

  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];

    if (
      item &&
      item.role === "model" &&
      typeof item.text === "string"
    ) {
      return item.text;
    }
  }

  return "";
}

function getPreviousTopic(history) {
  if (!Array.isArray(history)) return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];

    if (!item || item.role !== "user" || typeof item.text !== "string") {
      continue;
    }

    if (isTopicChange(item.text)) {
      return null;
    }

    const topic = findKnowledge(item.text);

    if (topic) {
      return topic;
    }
  }

  return null;
}
// ==========================================
// MATEMATYKA — NORMALIZACJA DZIAŁAŃ
// ==========================================

function cleanMathExpression(input) {
  let expression = String(input || "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  expression = expression
    .replace(/^(a\s+)?(ile to(?: jest)?|ile jest|oblicz|policz(?: mi)?|rozwiaz(?: mi)?|wynik)\s+/, "")
    .replace(/[?!=]+$/g, "")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\b(pomnozone przez|mnozone przez|razy)\b/g, "*")
    .replace(/\b(plus|dodac)\b/g, "+")
    .replace(/\b(minus|odjac)\b/g, "-")
    .replace(/\b(podzielone przez|dzielone przez|podzielic przez|podziel przez)\b/g, "/")
    .replace(/\b(do potegi|podniesione do potegi)\b/g, "^")
    .replace(/(\d)\s*[x×]\s*(?=[\d(])/g, "$1 * ")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, " ")
    .trim();

  return expression;
}


// ==========================================
// ROZPOZNAWANIE PROSTYCH DZIAŁAŃ
// ==========================================

function parseSimpleArithmetic(input) {
  const expression = cleanMathExpression(input);

  const match = expression.match(
    /^(-?\d+)\s*([+\-*/])\s*(-?\d+)$/
  );

  if (!match) return null;

  return {
    a: BigInt(match[1]),
    operator: match[2],
    b: BigInt(match[3])
  };
}


// ==========================================
// POMOCNICZE FORMATOWANIE SŁUPKÓW
// ==========================================

function alignRight(value, width) {
  return String(value).padStart(width, " ");
}

function formatColumnWork(a, b, operator, result) {
  if (!["+", "-", "*", "/"].includes(operator)) {
    return "";
  }

  if (b === 0n && operator === "/") {
    return "Nie można dzielić przez zero.";
  }

  if (a < 0n || b < 0n) {
    return `Działanie na liczbach ujemnych:\n${a} ${operator} ${b} = ${result}\n\nNajpierw ustalamy znak wyniku, a następnie wykonujemy działanie na wartościach bezwzględnych.`;
  }

  const width = Math.max(
    a.toString().length,
    b.toString().length + 1,
    result.toString().length
  );

  const top = alignRight(a.toString(), width);
  const bottom = alignRight(
    `${operator}${b.toString()}`,
    width
  );

  const line = "─".repeat(width);

  // DODAWANIE I ODEJMOWANIE
  if (operator === "+" || operator === "-") {
    return [
      top,
      bottom,
      line,
      alignRight(result.toString(), width)
    ].join("\n");
  }

  // MNOŻENIE
  if (operator === "*") {
    if (b === 0n) {
      return [
        top,
        bottom,
        line,
        alignRight("0", width)
      ].join("\n");
    }

    const partials = b
      .toString()
      .split("")
      .reverse()
      .map((digit, index) => {
        const part =
          a * BigInt(digit) * (10n ** BigInt(index));

        const shifted =
          part.toString() + "0".repeat(index);

        return alignRight(shifted, width);
      });

    if (partials.length === 1) {
      return [
        top,
        bottom,
        line,
        alignRight(result.toString(), width)
      ].join("\n");
    }

    return [
      top,
      bottom,
      line,
      ...partials,
      line,
      alignRight(result.toString(), width)
    ].join("\n");
  }

  // DZIELENIE
  const quotient = a / b;
  const remainder = a % b;

  return [
    `${a} : ${b}`,
    "────────",
    `Wynik: ${quotient}`,
    remainder !== 0n ? `Reszta: ${remainder}` : "Reszta: 0"
  ].join("\n");
}


// ==========================================
// WYJAŚNIANIE DZIAŁAŃ
// ==========================================

function explainCalculation(question) {
  const parsed = parseSimpleArithmetic(question);

  if (!parsed) return null;

  const { a, b, operator } = parsed;

  if (operator === "/" && b === 0n) {
    return "Nie można dzielić przez zero.";
  }

  let result;
  let explanation;
  let topic;

  switch (operator) {
    case "*":
      result = a * b;
      topic = "Mnożenie";

      explanation =
        `Mnożenie oznacza wielokrotne dodawanie tej samej liczby.

` +
        `W naszym przykładzie mamy ${a} × ${b}.

` +
        (
          b > 0n && b <= 10n
            ? `${Array(Number(b)).fill(a.toString()).join(" + ")} = ${result}.`
            : `Mnożymy ${a} przez ${b}, otrzymując ${result}.`
        );

      break;

    case "+":
      result = a + b;
      topic = "Dodawanie";

      explanation =
        `Dodawanie polega na łączeniu dwóch wartości.

` +
        `Zaczynamy od ${a} i dokładamy ${b}.

` +
        `${a} + ${b} = ${result}.`;

      break;

    case "-":
      result = a - b;
      topic = "Odejmowanie";

      explanation =
        `Odejmowanie pokazuje, ile zostaje po zabraniu części.

` +
        `Od ${a} odejmujemy ${b}.

` +
        `${a} - ${b} = ${result}.`;

      break;

    case "/":
      result = a / b;
      topic = "Dzielenie";

      explanation =
        `Dzielenie polega na rozdzieleniu liczby ${a} na ${b} równych części.

` +
        `Iloraz wynosi ${result}.`;

      break;

    default:
      return null;
  }

  return `🐨 WYJAŚNIENIE KROK PO KROKU

${topic}

${explanation}

ZAPIS SŁUPKIEM:

${formatColumnWork(a, b, operator, result)}

💡 ZAPAMIĘTAJ:
Nie chodzi tylko o poznanie wyniku. Ważne jest zrozumienie, dlaczego właśnie taki wynik otrzymaliśmy.

🎓 SPRÓBUJ SAM:
${operator === "*"
  ? `${a} × ${b + 1n}`
  : operator === "+"
    ? `${a} + ${b + 1n}`
    : operator === "-"
      ? `${a} - ${b + 1n}`
      : `${a} / ${b + 1n}`}

Spróbuj rozwiązać to samodzielnie! 🐨`;
}


// ==========================================
// BEZPIECZNY PARSER MATEMATYCZNY
// ==========================================

function calculate(text) {
  const expression = cleanMathExpression(text);

  if (
    !expression ||
    expression.length > MAX_MATH_LENGTH
  ) {
    return null;
  }

  // OBSŁUGA PROCENTÓW

  const original = String(text || "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(ile to(?: jest)?|oblicz|policz(?: mi)?)\s+/, "")
    .trim();

  const percent = original.match(
    /^(-?\d+(?:[.,]\d+)?)\s*(?:%|procent(?:y|ow|a)?)\s*(?:z\s*)?(-?\d+(?:[.,]\d+)?)\s*[?]?$/
  );

  if (percent) {
    const a = Number(percent[1].replace(",", "."));
    const b = Number(percent[2].replace(",", "."));

    const result = a * b / 100;

    if (!Number.isFinite(result)) return null;

    return `🐨 WYNIK: ${formatNumber(result)}

KROK 1:
Zamieniamy procent na ułamek:
${a}% = ${formatNumber(a / 100)}.

KROK 2:
Mnożymy przez całość:
${formatNumber(a / 100)} × ${formatNumber(b)}.

KROK 3:
Otrzymujemy:
${formatNumber(result)}.

💡 Procent oznacza jedną setną całości.`;
  }

  // PROSTE DZIAŁANIA NA DUŻYCH LICZBACH

  const simple = parseSimpleArithmetic(text);

  if (simple) {
    const { a, b, operator } = simple;

    if (operator === "/" && b === 0n) {
      return "Nie można dzielić przez zero.";
    }

    let result;

    if (operator === "+") {
      result = a + b;
    } else if (operator === "-") {
      result = a - b;
    } else if (operator === "*") {
      result = a * b;
    } else {
      result = a / b;
    }

    const column = formatColumnWork(
      a,
      b,
      operator,
      result
    );

    const remainder =
      operator === "/" ? a % b : 0n;

    return `🐨 WYNIK DZIAŁANIA: ${result.toLocaleString("pl-PL")}

ZAPIS SŁUPKIEM:

${column}

${
  remainder !== 0n
    ? `Dzielenie daje resztę ${remainder}.`
    : "Działanie zostało wykonane dokładnie."
}

💡 Chcesz, żebym wyjaśniła każdy krok? Napisz „wyjaśnij”.`;
  }

  // DZIAŁANIA Z NAWIASAMI, POTĘGAMI I LICZBAMI DZIESIĘTNYMI

  const tokens = [];
  const tokenPattern =
    /\s*(\d+(?:\.\d+)?|[()+\-*/^])\s*/gy;

  let position = 0;

  while (position < expression.length) {
    tokenPattern.lastIndex = position;

    const match = tokenPattern.exec(expression);

    if (!match) return null;

    tokens.push(match[1]);

    if (tokens.length > MAX_MATH_TOKENS) {
      return null;
    }

    position = tokenPattern.lastIndex;
  }

  if (!tokens.length) return null;

  let index = 0;

  function primary() {
    const token = tokens[index];

    if (token === "(") {
      index++;

      const value = addition();

      if (tokens[index] !== ")") {
        throw new Error("Brak zamykającego nawiasu.");
      }

      index++;

      return value;
    }

    if (/^\d/.test(token || "")) {
      index++;

      return Number(token);
    }

    throw new Error("Nieprawidłowa liczba.");
  }

  function unary() {
    if (tokens[index] === "+") {
      index++;
      return unary();
    }

    if (tokens[index] === "-") {
      index++;
      return -unary();
    }

    return primary();
  }

  function power() {
    const left = unary();

    if (tokens[index] === "^") {
      index++;

      const right = power();

      if (Math.abs(right) > 10) {
        throw new Error("Zbyt duża potęga.");
      }

      return left ** right;
    }

    return left;
  }

  function multiplication() {
    let value = power();

    while (
      ["*", "/"].includes(tokens[index])
    ) {
      const operator = tokens[index++];
      const right = power();

      if (operator === "/" && right === 0) {
        throw new Error("Dzielenie przez zero.");
      }

      value = operator === "*"
        ? value * right
        : value / right;
    }

    return value;
  }

  function addition() {
    let value = multiplication();

    while (
      tokens[index] === "+" ||
      tokens[index] === "-"
    ) {
      const operator = tokens[index++];
      const right = multiplication();

      value = operator === "+"
        ? value + right
        : value - right;
    }

    return value;
  }

  try {
    const result = addition();

    if (
      index !== tokens.length ||
      !Number.isFinite(result)
    ) {
      return null;
    }

    return `🐨 WYNIK: ${formatNumber(result)}

💡 KOLEJNOŚĆ DZIAŁAŃ:
1. Nawiasy.
2. Potęgi.
3. Mnożenie i dzielenie.
4. Dodawanie i odejmowanie.

Warto znać tę kolejność, ponieważ wpływa ona na prawidłowy wynik.`;
  } catch (error) {
    if (error.message === "Dzielenie przez zero.") {
      return "Nie można dzielić przez zero.";
    }

    return null;
  }
}
// ==========================================
// GŁÓWNA FUNKCJA ODPOWIEDZI KOALI
// ==========================================

function isGreetingMessage(question) {
  const value = normalize(question);

  return /^(hej|czesc|siema|witaj|hello|hi|dzien dobry|dobry wieczor|elo|hejka)[!. ]*$/i
    .test(value);
}


function isCurrentInformationQuestion(question) {
  const value = normalize(question);

  return /\b(aktualnie|obecnie|teraz|dzisiaj|wczoraj|jutro|najnowsze|najnowszy|najnowsza|na zywo|aktualne wyniki|co sie dzieje)\b/i
    .test(value);
}


function getMathInput(question) {
  return String(question || "")
    .trim()
    .replace(
      /^(?:a\s+)?(?:wyjasnij|wytlumacz|oblicz|policz|rozwiaz)(?:\s+mi)?(?:\s+prosze)?\s+/i,
      ""
    )
    .trim();
}


function createLearningHint(question) {
  const topic = String(question || "").trim();

  return `🐨 Chętnie pomogę Ci się tego nauczyć!

Nie chcę zgadywać, jeśli nie mam jeszcze wystarczającej wiedzy o tym zagadnieniu.

Możemy zrobić to tak:

1. Najpierw ustalimy, co oznacza temat.
2. Następnie wyjaśnię go prostymi słowami.
3. Pokażę przykład.
4. Na końcu dostaniesz krótkie zadanie do samodzielnego rozwiązania.

Napisz, którą część tematu „${topic}” chcesz zrozumieć, albo wklej zadanie z lekcji.`;
}


// ==========================================
// BEZPIECZNE PRZETWARZANIE HISTORII
// ==========================================

function getSafeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(item => item && typeof item === "object")
    .slice(-MAX_HISTORY_ITEMS);
}


// ==========================================
// GŁÓWNA FUNKCJA SILNIKA
// ==========================================

export function answerQuestion(question, history = []) {
  try {
    const text = String(question ?? "").trim();

    if (!text) {
      return "🐨 Napisz pytanie lub wklej zadanie, a razem je rozwiążemy!";
    }

    if (text.length > MAX_QUESTION_LENGTH) {
      return `Twoja wiadomość jest za długa. Skróć ją do maksymalnie ${MAX_QUESTION_LENGTH} znaków i spróbuj ponownie.`;
    }

    const safeHistory = getSafeHistory(history);
    const normalized = normalize(text);
    const intent = getIntent(text);

    // POWITANIE

    if (isGreetingMessage(text)) {
      return "Hej! 🐨 Jestem Koala!\n\nMogę pomóc Ci z matematyką, językiem polskim, przyrodą i innymi szkolnymi tematami.\n\nMożemy rozwiązywać zadania krok po kroku albo zrobić krótką powtórkę przed sprawdzianem.";
    }

    // PYTANIA O AKTUALNE WYDARZENIA

    if (isCurrentInformationQuestion(text)) {
      return "🐨 Nie mam dostępu do bieżących wiadomości ani danych na żywo. Moja wiedza jest zapisana w lokalnej bazie, więc nie chcę podawać niezweryfikowanych aktualności.\n\nMożesz wkleić artykuł lub informacje, a pomogę Ci je zrozumieć i streścić.";
    }

    // KONTYNUACJA POPRZEDNIEJ ROZMOWY

    if (isFollowUp(text)) {
      const previousQuestion =
        getPreviousUserQuestion(safeHistory);

      if (previousQuestion) {
        const previousCalculation =
          explainCalculation(previousQuestion);

        if (previousCalculation) {
          return previousCalculation;
        }

        const previousKnowledge =
          findKnowledge(previousQuestion);

        if (previousKnowledge) {
          return formatKnowledge(
            previousKnowledge,
            intent
          );
        }
      }

      const previousAnswer =
        getPreviousAnswer(safeHistory);

      if (previousAnswer) {
        return `🐨 Jasne, możemy to rozwinąć.\n\nW poprzedniej odpowiedzi pojawił się temat, który warto dokładniej przećwiczyć.\n\nNapisz, czego dokładnie nie rozumiesz, a wyjaśnię to prostszymi słowami i pokażę przykład.`;
      }
    }

    // OBLICZENIA MATEMATYCZNE

    const mathInput = getMathInput(text);

    const calculationExplanation =
      explainCalculation(mathInput);

    if (
      calculationExplanation &&
      /\b(wyjasnij|wytlumacz|krok po kroku|dlaczego|jak to zrobic)\b/i.test(normalized)
    ) {
      return calculationExplanation;
    }

    const calculation = calculate(text);

    if (calculation !== null) {
      return calculation;
    }

    // WYSZUKIWANIE W BAZIE WIEDZY

    const knowledgeItem = findKnowledge(text);

    if (knowledgeItem) {
      return formatKnowledge(
        knowledgeItem,
        intent
      );
    }

    // NAUKA I ĆWICZENIA

    if (
      /\b(naucz mnie|chce sie nauczyc|nauczysz mnie|zrobmy cwiczenia|przygotuj mnie|przepytaj mnie|sprawdz mnie)\b/i.test(normalized)
    ) {
      return `🐨 Zrobimy to razem!

Najpierw wybierz temat, którego chcesz się nauczyć.

Mogę przygotować:
• proste wyjaśnienie,
• przykłady,
• krótką notatkę,
• pytania sprawdzające,
• zadania do samodzielnego rozwiązania.

Napisz nazwę tematu, a zaczniemy.`;
    }

    // PROŚBA O NOTATKĘ BEZ PODANEGO TEMATU

    if (
      /\b(notatke|notatka|podsumowanie|streszczenie|quiz|test)\b/i.test(normalized)
    ) {
      return "🐨 Jasne! Z jakiego tematu mam przygotować notatkę albo quiz?\n\nPodaj temat lub wklej materiał z lekcji. Na tej podstawie przygotuję pomoc do nauki.";
    }

    // PYTANIA, KTÓRYCH NIE MA W BAZIE

    return `🐨 Nie znalazłam jeszcze tego zagadnienia w mojej lokalnej bazie wiedzy.

Nie chcę wymyślać odpowiedzi i przedstawiać jej jako pewnej.

Możesz:
1. Podać więcej szczegółów.
2. Wkleić treść zadania.
3. Przesłać fragment notatki z lekcji.
4. Napisać, którą część zagadnienia chcesz zrozumieć.

Spróbuję pomóc Ci przejść przez temat krok po kroku.`;

  } catch (error) {
    return "🐨 Coś poszło nie tak podczas przygotowywania odpowiedzi. Spróbuj napisać pytanie inaczej.";
  }
}