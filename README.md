# Foodicted 🥗📷

Foodicted ist eine Smartphone-App, mit der du den Inhalt deines Kühlschranks per
Kamera erfasst. Eine KI erkennt die Lebensmittel und schlägt dir darauf basierend
Rezepte vor - passend zu deinen Präferenzen (z. B. gesund, eiweißreich, vegetarisch,
schnell zubereitet).

## Architektur

```
foodicted/
├── backend/   Node.js/TypeScript API (Express) - Bilderkennung & Rezeptgenerierung via Claude
└── mobile/    React Native / Expo App (TypeScript) - Kamera, Präferenzen, Rezeptanzeige
```

**Ablauf:**

1. Die App nimmt ein Foto des Kühlschranks/der Vorratskammer auf (Kamera oder Galerie).
2. Das Backend schickt das Foto an Claude (Vision), das erkennt strukturiert alle
   sichtbaren Lebensmittel (Name, Kategorie, geschätzte Menge, Confidence-Score).
3. Der Nutzer kann die erkannte Liste in der App noch anpassen (Zutaten entfernen/hinzufügen).
4. Zusammen mit den gespeicherten Präferenzen (Ziel, Diät, Allergien, Zeitbudget, ...)
   generiert Claude 2-4 passende Rezeptvorschläge inklusive Nährwertangaben.
5. Optional: Das Backend kann Zutaten gegen die **Open Food Facts**-Datenbank
   abgleichen (kostenlos, offen, kein API-Key nötig) für echte Produktdaten/Nährwerte.

## Voraussetzungen

- Node.js >= 18
- Ein Anthropic API Key ([console.anthropic.com](https://console.anthropic.com/))
- Für die App: Expo Go auf dem Smartphone (einfachster Weg) oder ein
  iOS-/Android-Simulator

## Backend starten

```bash
cd backend
cp .env.example .env
# .env öffnen und ANTHROPIC_API_KEY eintragen
npm install
npm run dev
```

Der Server läuft dann auf `http://localhost:4000`. Health-Check: `GET /health`.

### API-Endpunkte

| Methode | Pfad                    | Beschreibung                                                        |
|---------|--------------------------|----------------------------------------------------------------------|
| POST    | `/api/fridge/analyze`   | Foto (multipart `image` oder JSON `{ imageBase64, mediaType }`) → erkannte Zutaten |
| POST    | `/api/recipes/generate` | `{ items, preferences }` → 2-4 Rezeptvorschläge mit Nährwerten      |
| GET     | `/api/food/search?q=`   | Freitextsuche in der Open Food Facts Datenbank                      |
| GET     | `/api/food/barcode/:code` | Produktsuche per Barcode (EAN/UPC) via Open Food Facts             |

## Mobile App starten

```bash
cd mobile
npm install
npm start
```

Danach den QR-Code mit der **Expo Go**-App auf deinem Smartphone scannen
(iOS/Android). Wichtig: Trage in `mobile/app.json` unter `expo.extra.apiBaseUrl`
die Adresse deines Backends ein - bei lokalem Testen auf einem echten Gerät
reicht `http://localhost:4000` **nicht**, da das Handy nicht dasselbe `localhost`
wie dein Rechner hat. Nutze stattdessen die lokale Netzwerk-IP deines Rechners,
z. B. `http://192.168.1.23:4000`, oder tunnle das Backend (z. B. mit `ngrok`).

## Warum Open Food Facts?

[Open Food Facts](https://world.openfoodfacts.org) ist eine freie, community-betriebene
Datenbank mit Millionen Lebensmittelprodukten (Name, Marke, Nährwerte, Nutri-Score) -
komplett kostenlos nutzbar, ohne API-Key oder Nutzungslimits im normalen Rahmen.
Sie eignet sich gut, um KI-generierte Rezepte mit echten Produktdaten/Barcodes
anzureichern, ersetzt aber nicht die Bilderkennung selbst (dafür ist die Datenbank
nicht gedacht - sie kennt keine "losen" Lebensmittel wie eine frische Paprika im Kühlschrank).

## Nächste Schritte / Ideen für Ausbau

- Rezepte & Präferenzen serverseitig persistieren (aktuell nur lokal auf dem Gerät via AsyncStorage)
- Nutzerkonten, Rezept-Favoriten, Einkaufsliste aus `missingIngredients` generieren
- Barcode-Scanner in der App integrieren (`expo-camera` unterstützt das bereits)
- Push-Benachrichtigung "dein Gemüse wird bald schlecht" auf Basis der erkannten Mengen
- Offline-Fallback / Caching der letzten Analyse
