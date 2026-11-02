KOALE + FIREBASE — INSTRUKCJA
============================

W paczce są trzy strony:
- index.html + netlify/ — osobna strona zadań i serwer Firebase.
- hub/index.html — portal Koale z logowaniem do Firebase.
- games/index.html — osobna strona gier połączona z rankingiem Firebase.

WAŻNE: nie wysyłaj nikomu pliku migration-data.json ani klucza service account.
Eksport zawiera dotychczasowe hasła. Klucz service account daje dostęp do bazy.

1. Przygotuj Firebase
---------------------
1) W Firebase Console wybierz projekt koale-366a0.
2) Authentication > Sign-in method > włącz Email/Password.
3) Firestore Database > utwórz bazę danych. Wybierz europe-central2 (Warszawa), jeśli konsola pozwoli.
4) W ustawieniach reguł Firestore wklej zawartość firestore.rules i opublikuj.
   Aplikacja łączy się z bazą przez funkcję serwerową Netlify; reguły blokują
   bezpośredni dostęp strony do danych.
5) Google Cloud Console > IAM i administracja > Konta usługi. Utwórz konto
   usługi dla projektu, nadaj mu dostęp administratora Firebase,
   wygeneruj klucz JSON i pobierz go na swój komputer. Nie dodawaj klucza
   do folderu strony ani do GitHuba.

2. Przenieś dane ze starej bazy
-------------------------------
1) Otwórz lokalny plik migration-export.html w przeglądarce.
2) Wpisz adres starego Apps Script oraz login/hasło administratora starej strony.
3) Kliknij „Zaloguj i pobierz eksport”. Zapisze się plik migration-data.json.
   Przechowuj go prywatnie. Eksport pobiera także wyniki widoczne w rankingach
   (top 10 dla każdej gry).
4) Zainstaluj Node.js na komputerze, otwórz PowerShell w głównym folderze
   rozpakowanej paczki i wpisz:

   npm install
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\pełna\ścieżka\service-account.json"
   node scripts/import-from-export.mjs "C:\pełna\ścieżka\migration-data.json"

5) Na końcu zobaczysz liczbę przeniesionych kont i rekordów. Jeśli skrypt
   zgłosi hasło krótsze niż 6 znaków, trzeba ustawić temu kontu nowe hasło;
   Firebase nie przyjmuje krótszych haseł.

3. Opublikuj strony w Netlify
-----------------------------
Najprościej połącz repozytorium GitHub z Netlify, aby Netlify zbudował funkcje.

A) Strona zadań i funkcje:
   jako katalog publikacji ustaw główny folder paczki.
   W Netlify > Site configuration > Environment variables dodaj:
   FIREBASE_PROJECT_ID = koale-366a0
   FIREBASE_SERVICE_ACCOUNT = cała zawartość pobranego pliku JSON service account
   FIREBASE_WEB_API_KEY = klucz apiKey z konfiguracji Firebase
   Zapisz zmienne i uruchom nowy deploy.

B) Hub Koale:
   utwórz osobną witrynę Netlify z katalogu hub. Podłącz własną domenę huba.

C) Gry:
   utwórz osobną witrynę Netlify z katalogu games. Podłącz domenę koalegry.netlify.app.

4. Dodawanie kont
-----------------
Po wdrożeniu zaloguj się na konto o roli sadmin. W menu pojawi się „Konta”.
Tam można dodawać uczniów, nauczycieli i administratorów oraz ustawiać role
i klasy. Nowe hasło musi mieć co najmniej 6 znaków.

Jeśli stare konta mają inną rolę niż sadmin, zmień rolę wybranego konta w
Firebase Console w kolekcji users albo poproś obecnego administratora aplikacji,
aby nadał ją w panelu kont.

Pliki netlify/functions/koala.mjs i koala-engine.mjs obsługują Koala AI.
Nie potrzebują klucza zewnętrznego modelu.
