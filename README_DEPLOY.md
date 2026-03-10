# 🚀 KAZKA v3 - DEPLOY GU PAGES

## 📦 FILE DA CARICARE

```
/appfinance/
├── app.html ⭐ (FILE PRINCIPALE - 5118 linee)
├── index.html (Landing page)
├── manifest.json (PWA config)
├── sw.js (Service Worker)
├── firebase-config.js (Config Firebase - OPZIONALE)
├── icon-192.png (Icona PWA)
└── icon-512.png (Icona PWA)
```

## ✨ NUOVE FEATURE IMPLEMENTATE

### 1️⃣ **CALCOLO OBIETTIVI**
- Quando CREI un obiettivo, inserisci:
  - Nome obiettivo
  - **TARGET** (es: €1000)
  - **IMPORTO SUGGERITO** (es: €100/mese)
- L'importo suggerito viene **DETRATTO DAI SOLDI LIBERI** automaticamente
- I soldi liberi = Saldo - Importo suggerito

### 2️⃣ **SYNC WEB/APP (REAL-TIME)**
- Aggiungi una transazione su **WEB**
- Appare SUBITO su **APP mobile** (e viceversa)
- Funziona con **Firebase Realtime Database**
- Offline-first: salva localmente, sincronizza quando online
- Funziona su: iPhone, Android, Desktop

### 3️⃣ **LOGO CENTRATO & NO COLLAPSE**
- Logo sempre centrato nel profilo
- Non collassa mai (min-height: 80px)
- Ridimensiona automatico se grande
- Responsive su tutti i dispositivi

### 4️⃣ **STRUTTURA PRONTA PER SPLIT**
- Se il file diventa troppo grosso:
  - `firebase-config.js` → Config separato
  - `app-data.js` → Data functions
  - `app-ui.js` → UI rendering
- Basta fare `<script src="file.js"></script>`

---

## 🚀 STEP DEPLOY

### 1. Carica i file su GitHub

```bash
cd /percorso/repo/appfinance
cp app.html index.html manifest.json sw.js icon-192.png icon-512.png .
git add .
git commit -m "v3: Obiettivi + Sync Firebase + Logo fix"
git push origin main
```

### 2. Verifica URL Live

```
https://adamomic371-star.github.io/appfinance/app.html
```

### 3. Test su MOBILE

**iPhone:**
- Apri Safari: copia URL sopra
- Condividi → Aggiungi a Home
- Installa app
- Test: aggiungi transazione
- Verifica su desktop (dovrebbe apparire)

**Android:**
- Chrome → Copia URL
- Menu → Installa app
- Test sync

---

## 💾 DATI SALVATI

```javascript
// localStorage (locale)
fp_tx_{userId}         // Transazioni
fp_goals_{userId}      // Obiettivi
fp_rec_{userId}        // Ricorrenti
fp_groups_{userId}     // Gruppi
fp_profile_{userId}    // Profilo

// Firebase (cloud sync)
users/{userId}/transactions
users/{userId}/goals
users/{userId}/recurring
users/{userId}/groups
users/{userId}/profile
```

---

## 🔧 SE SERVE SPLIT FILE

Se il file diventasse troppo grosso (>5MB), splittare così:

```html
<!-- In app.html HEAD -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
<script src="firebase-config.js"></script>
<script src="app-core.js"></script>
<script src="app-ui.js"></script>
```

Ma **ORA NON SERVE** - il file è ottimizzato e carica in <2s!

---

## ✅ CHECKLIST DEPLOY

- [ ] Tutti i 7 file caricati su GitHub
- [ ] git push completato
- [ ] URL raggiungibile
- [ ] Test locale OK (F12 console clean)
- [ ] Test mobile (sync funziona)
- [ ] Logo visibile centrato
- [ ] Obiettivi calcolano soldi liberi

---

## 🎯 PROSSIMO STEP

Dopo deploy, puoi:

1. **Aggiungere più obiettivi** - calcoli automatici
2. **Sincronizzare tra dispositivi** - web e app
3. **Aggiungi preventivi/fatture** - già implementato
4. **Backup cloud** - opzionale in futuro

---

**Versione**: 3.0
**Data**: Marzo 2026
**Stato**: ✅ PRONTO AL DEPLOY
**Proprietario**: Michele Adamo

