KOALE + GOOGLE SHEETS — PACZKA DO PODMIANY
=========================================

Główna strona Koale znajduje się w hub/index.html.
Koale-Zadania: zadania/index.html. Gry: games/index.html.
Wszystkie zapisują dane przez istniejący Google Apps Script połączony z arkuszem.
Funkcje Koala AI pozostają w netlify/functions.

PODMIANA W GITHUB DESKTOP
1. Rozpakuj ZIP na komputerze.
2. Skopiuj zawartość rozpakowanego folderu do folderu sklonowanego repozytorium Koale.
3. Zastąp istniejące pliki, ale nie usuwaj ukrytego folderu .git.
4. W GitHub Desktop wpisz opis „Powrót do Google Sheets”, kliknij Commit to main, a potem Push origin.
5. W Netlify poczekaj, aż wdrożenie zakończy się statusem Published.

USTAWIENIA NETLIFY
W konfiguracji witryny koale.netlify.app ustaw Base directory puste (główny folder repozytorium).
Publish directory: hub
Functions directory: netlify/functions
Zmienne Firebase FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT i FIREBASE_WEB_API_KEY nie są potrzebne tej wersji.

Domena Apps Script użyta przez stronę jest zapisana w plikach HTML. Skrypt musi być wdrożony jako aplikacja internetowa i dostępny dla użytkowników strony.

PANEL ADMINA
Po zalogowaniu na konto sadmin można otworzyć Panel Admina, dodawać konta, ustawiać klasy i role oraz przeglądać i odpowiadać na zgłoszenia błędów. Dostępność tych akcji zależy od tego, czy wdrożony Apps Script obsługuje odpowiednie operacje.
