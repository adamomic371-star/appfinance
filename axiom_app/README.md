# Axiom Flutter App

App di finanza personale cross-platform (Android, iOS, Web).

## 📁 Struttura

```
axiom_app/
├── lib/
│   ├── main.dart                          # Entry point
│   ├── app.dart                           # MaterialApp + Router
│   └── src/
│       ├── config/                        # Firebase, tema, costanti
│       ├── models/                        # Modelli dati
│       ├── services/                      # Firebase services
│       ├── providers/                     # State management (Provider)
│       ├── screens/                       # Schermate
│       │   ├── auth/                      # Login, Register, Reset
│       │   ├── home/                      # Dashboard, HomeShell
│       │   ├── transactions/              # Lista + Form
│       │   └── profile/                   # Profilo
│       ├── widgets/                       # Widget riutilizzabili
│       └── utils/                         # Formattazione
├── web/                                   # Web build
├── pubspec.yaml
└── setup.bat                              # Script setup
```

## 🚀 Setup

1. **Installa Flutter**: https://flutter.dev
2. **Configura Firebase**:
   ```bash
   dart pub global activate flutterfire_cli
   flutterfire configure --project=financeapp-556ae
   ```
3. **Avvia l'app**:
   ```bash
   cd axiom_app
   flutter pub get
   flutter run           # Sceglie piattaforma automaticamente
   flutter run -d chrome # Web
   flutter run -d android
   ```

## 🔥 Firebase

Lo stesso progetto del web app:
- **Project ID**: `financeapp-556ae`
- **Auth**: Email/Password
- **Database**: Realtime Database (europe-west1)
- **Messaging**: FCM

## 📱 Features Implementate

### Core (v1)
- [x] Login/Registrazione/Reset password
- [x] Dashboard (riepilogo, entrate/uscite, transazioni recenti)
- [x] Transazioni (CRUD, filtri, ricerca, selezione multipla)
- [x] Profilo (modifica nome, valuta, tema)
- [x] Temi Dark/Light
- [x] Bottom navigation (Dashboard, Transazioni, Profilo)

### In arrivo
- [ ] Accounts (gestione conti)
- [ ] Budget mensili per categoria
- [ ] Categorie personalizzate
- [ ] Obiettivi di risparmio
- [ ] Debiti/Prestiti
- [ ] Spese ricorrenti
- [ ] Report e grafici
- [ ] Gruppi spese condivise
- [ ] Fatture e clienti (Business)
- [ ] Portfolio investimenti
- [ ] Cashflow forecast

## 🔗 Syncing con Web App

La web app HTML/CSS/JS originale rimane in `app/` e `admin/`.
Il progetto Flutter in `axiom_app/` condivide lo stesso Firebase backend.
Tutti i dati transazionali sono sincronizzati automaticamente tramite Firebase Realtime Database.
