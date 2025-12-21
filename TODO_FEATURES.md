# TODO: WestBudget - Licenssystem & Electron Distribution

## Översikt
Detta dokument beskriver implementationen av licenssystem, användarhantering, betalningsintegration och Electron-distribution för WestBudget.

---

## 1. Användarhantering & Autentisering
**Status:** ✅ Implementerad

### Funktioner:
- [x] Användarregistrering (e-post + lösenord)
- [x] Inloggning (e-post + lösenord)
- [x] Lösenordsåterställning (via SendGrid e-post)
- [x] JWT-token baserad autentisering
- [x] Session-hantering (kom ihåg mig)
- [x] Logout-funktionalitet
- [x] Profilhantering (uppdatera e-post, lösenord)

### Implementation:
- [x] Skapa `users` tabell i databasen
  - id, email, password_hash, created_at, updated_at, last_login
- [x] Backend endpoints:
  - [x] `POST /api/auth/register` - Registrera ny användare
  - [x] `POST /api/auth/login` - Logga in
  - [x] `POST /api/auth/logout` - Logga ut
  - [x] `POST /api/auth/forgot-password` - Begär lösenordsåterställning
  - [x] `POST /api/auth/reset-password` - Återställ lösenord
  - [x] `GET /api/auth/me` - Hämta aktuell användare
  - [x] `PUT /api/auth/profile` - Uppdatera profil
- [x] Frontend komponenter:
  - [x] `LoginModal` - Inloggningsmodal
  - [x] `RegisterModal` - Registreringsmodal
  - [x] `ForgotPasswordModal` - Glömt lösenord
  - [x] `ResetPasswordModal` - Återställ lösenord
  - [x] `UserProfile` - Profilhantering i Settings (delvis)
- [x] Integrera SendGrid för e-postutskick
- [x] Säkerhet:
  - [x] Hasha lösenord med bcrypt
  - [x] JWT-token med expiration
  - [ ] Rate limiting för login/register (TODO)
  - [ ] E-postverifiering (valfritt - TODO)

---

## 2. Licenssystem
**Status:** ✅ Implementerad

### Funktioner:
- [x] Två licensnivåer: Trial (30 dagar) och Premium (månadsvis)
- [x] Automatisk trial-period för nya användare
- [x] Licensvalidering (online med offline-fallback)
- [x] Grace period (7 dagar offline-användning)
- [x] Licensstatus-visning i appen
- [x] Varningar när trial/licens går ut snart

### Implementation:
- [x] Skapa `licenses` tabell i databasen
  - id, user_id, license_type (trial/premium), status (active/expired/cancelled), 
    starts_at, expires_at, created_at, updated_at, last_validated_at
- [x] Skapa `license_validations` tabell (för logging)
  - id, license_id, validation_type (online/offline), success, error_message, created_at
- [x] Backend endpoints:
  - [x] `GET /api/licenses/current` - Hämta aktuell licens
  - [x] `POST /api/licenses/validate` - Validera licens (online)
  - [x] `GET /api/licenses/status` - Hämta licensstatus
- [x] Licensvalideringslogik:
  - [x] Online-validering vid app-start (om internet finns)
  - [x] Offline-cache (spara senaste validering lokalt)
  - [x] Grace period (tillåt användning i 7 dagar utan validering)
  - [x] Automatisk validering i bakgrunden
- [x] Frontend komponenter:
  - [x] `LicenseStatus` - Visa licensstatus i Settings
  - [x] `LicenseGate` - Blockera appen när licens är ogiltig
  - [ ] `TrialBanner` - Varning när trial går ut snart (TODO)
  - [ ] `LicenseExpiredModal` - Modal när licens har gått ut (TODO)
- [x] Feature flags baserat på licens:
  - [x] Trial: Alla funktioner (begränsad tid)
  - [x] Premium: Alla funktioner (obegränsat)

---

## 3. Betalningsintegration (Stripe)
**Status:** ✅ Implementerad

### Funktioner:
- [x] Stripe Checkout integration
- [x] Månadsvis prenumeration
- [x] Automatisk fakturering
- [x] Hantera prenumerationsuppdateringar
- [x] Hantera avbokningar
- [x] Webhook-hantering för Stripe events

### Implementation:
- [ ] Skapa `subscriptions` tabell i databasen
  - id, user_id, stripe_subscription_id, stripe_customer_id, 
    status (active/cancelled/past_due), current_period_start, 
    current_period_end, created_at, updated_at
- [ ] Skapa `payments` tabell (för historik)
  - id, user_id, subscription_id, stripe_payment_intent_id, 
    amount, currency, status, created_at
- [ ] Backend endpoints:
  - [ ] `POST /api/payments/create-checkout` - Skapa Stripe Checkout session
  - [ ] `POST /api/payments/webhook` - Hantera Stripe webhooks
  - [ ] `GET /api/payments/history` - Hämta betalningshistorik
  - [ ] `POST /api/payments/cancel` - Avbryt prenumeration
  - [ ] `POST /api/payments/resume` - Återuppta prenumeration
- [ ] Stripe webhook events att hantera:
  - [ ] `checkout.session.completed` - Prenumeration aktiverad
  - [ ] `invoice.payment_succeeded` - Månadsbetalning lyckades
  - [ ] `invoice.payment_failed` - Månadsbetalning misslyckades
  - [ ] `customer.subscription.updated` - Prenumeration uppdaterad
  - [ ] `customer.subscription.deleted` - Prenumeration avbruten
- [ ] Frontend komponenter:
  - [ ] `UpgradeToPremium` - Knapp/modal för att uppgradera
  - [ ] `SubscriptionManagement` - Hantera prenumeration i Settings
  - [ ] `PaymentHistory` - Visa betalningshistorik
- [ ] Säkerhet:
  - [ ] Verifiera Stripe webhook signatures
  - [ ] Idempotency keys för webhooks
  - [ ] Säker hantering av Stripe API keys

---

## 4. Admin Panel (Inbyggt i appen)
**Status:** ✅ Implementerad (delvis)

### Funktioner:
- [x] Användarhantering (skapa, redigera, radera användare)
- [x] Licenshantering (se alla licenser, manuellt aktivera/inaktivera)
- [x] Användningsstatistik (dashboard med metrics - placeholder)
- [x] Betalningshantering (se transaktioner - refunds TODO)
- [ ] Systeminställningar (TODO)

### Implementation:
- [ ] Lägg till `role` kolumn i `users` tabell (admin/user)
- [ ] Skapa `AdminPanel` komponent i Settings
- [ ] Backend endpoints (kräver admin-roll):
  - [ ] `GET /api/admin/users` - Lista alla användare
  - [ ] `POST /api/admin/users` - Skapa ny användare
  - [ ] `PUT /api/admin/users/:id` - Uppdatera användare
  - [ ] `DELETE /api/admin/users/:id` - Radera användare
  - [ ] `GET /api/admin/licenses` - Lista alla licenser
  - [ ] `PUT /api/admin/licenses/:id` - Uppdatera licens
  - [ ] `GET /api/admin/statistics` - Hämta användningsstatistik
  - [ ] `GET /api/admin/payments` - Lista alla betalningar
- [ ] Frontend komponenter:
  - [ ] `AdminUsersTab` - Användarhantering
  - [ ] `AdminLicensesTab` - Licenshantering
  - [ ] `AdminStatisticsTab` - Användningsstatistik
  - [ ] `AdminPaymentsTab` - Betalningshantering
- [ ] Statistik att visa:
  - [ ] Totalt antal användare (trial/premium)
  - [ ] Nya användare per månad
  - [ ] Aktiva prenumerationer
  - [ ] MRR (Monthly Recurring Revenue)
  - [ ] Churn rate
  - [ ] Användningsstatistik (transaktioner, avtal, etc.)

---

## 5. Electron Distribution & Installer
**Status:** 🔄 Delvis implementerad

### Funktioner:
- [x] Electron Builder konfiguration
- [x] Windows installer (.exe) - konfigurerad
- [x] macOS installer (.dmg) - konfigurerad
- [x] Linux installer (.AppImage eller .deb) - konfigurerad
- [ ] Code signing (Windows/macOS) - TODO
- [ ] Auto-update funktionalitet - TODO (electron-updater saknas)
- [ ] Update server setup - TODO

### Implementation:
- [x] Installera Electron Builder:
  - [x] `npm install --save-dev electron-builder`
- [x] Konfigurera `electron-builder` i `package.json`:
  - [x] Windows konfiguration
  - [x] macOS konfiguration
  - [x] Linux konfiguration
  - [x] Icons och metadata
- [x] Skapa build scripts:
  - [x] `npm run electron:build:win` - Bygg Windows installer
  - [x] `npm run electron:build:mac` - Bygg macOS installer
  - [x] `npm run electron:build:linux` - Bygg Linux installer
  - [x] `npm run electron:build` - Bygg alla plattformar
- [ ] Code signing:
  - [ ] Windows: Code signing certificate (TODO - kräver köp av certifikat)
  - [ ] macOS: Apple Developer certificate (TODO - kräver Apple Developer-konto)
  - [ ] Konfigurera i electron-builder (TODO)
- [x] Auto-update:
  - [x] Installera `electron-updater` (redan importerad i main.js)
  - [ ] Konfigurera update server (GitHub Releases eller egen server) - TODO
  - [ ] Implementera update check i appen - TODO (delvis implementerad)
  - [ ] Update UI (visa när update finns, progress bar) - TODO
- [ ] Update server (valfritt - kan använda GitHub Releases):
  - [ ] Hosta `latest.yml` / `latest-mac.yml` / `latest-linux.yml` - TODO
  - [ ] Hosta installer-filer - TODO
  - [ ] Versionering (SemVer) - TODO

---

## 6. Integration & Testing
**Status:** 🔄 Pågående

### Funktioner:
- [ ] Integrera alla system
- [ ] Testa hela flödet
- [ ] Error handling
- [ ] Logging

### Implementation:
- [ ] Integrera användarhantering med licenssystem
- [ ] Integrera betalning med licensaktivering
- [ ] Testa trial → premium upgrade flow
- [ ] Testa licensvalidering (online/offline)
- [ ] Testa admin-panel funktionalitet
- [ ] Error handling:
  - [ ] Nätverksfel
  - [ ] Betalningsfel
  - [ ] Licensvalideringsfel
- [ ] Logging:
  - [ ] Användaraktiviteter
  - [ ] Licensvalideringar
  - [ ] Betalningar
  - [ ] Errors

---

## Prioritering

1. **Användarhantering & Autentisering** - Grunden för allt annat
2. **Licenssystem** - Kärnfunktionalitet
3. **Betalningsintegration (Stripe)** - För att kunna ta betalt
4. **Admin Panel** - För att hantera systemet
5. **Electron Distribution** - För att distribuera appen
6. **Integration & Testing** - Säkerställa att allt fungerar tillsammans

---

## Tekniska Anteckningar

### Backend-ändringar som behövs:
- [x] Ny tabell: `users` (användare)
- [x] Ny tabell: `licenses` (licenser)
- [x] Ny tabell: `license_validations` (valideringslogg)
- [x] Ny tabell: `subscriptions` (prenumerationer)
- [x] Ny tabell: `payments` (betalningar)
- [x] Middleware för autentisering (JWT)
- [x] Middleware för licensvalidering
- [x] Middleware för admin-check
- [x] Stripe webhook endpoint
- [x] SendGrid integration för e-post

### Frontend-ändringar:
- [x] Login/Register modals
- [x] User profile i Settings (delvis)
- [x] License status i Settings
- [x] Upgrade to Premium UI
- [x] Subscription management
- [x] Admin Panel (ny tab i Settings)
- [ ] Auto-update UI (TODO)
- [x] Auth context/provider
- [x] License context/provider

### Externa tjänster:
- [x] Stripe account och API keys (konfigurerad)
- [x] SendGrid account och API keys (konfigurerad)
- [ ] Update server (GitHub Releases eller egen) - TODO
- [ ] Code signing certificates (valfritt men rekommenderat) - TODO

---

## Milstolpar

### Milstolpe 1: Grundläggande autentisering
- Användare kan registrera sig och logga in
- E-postverifiering fungerar
- JWT-tokens fungerar

### Milstolpe 2: Licenssystem
- Trial-period fungerar
- Licensvalidering fungerar (online/offline)
- Premium-flaggor fungerar

### Milstolpe 3: Betalning
- Stripe integration fungerar
- Användare kan köpa Premium
- Webhooks fungerar

### Milstolpe 4: Admin Panel
- Admin kan hantera användare
- Admin kan se statistik
- Admin kan hantera licenser

### Milstolpe 5: Distribution
- Installers fungerar för alla plattformar
- Auto-update fungerar
- Appen kan distribueras

---

## Nästa steg

1. Börja med användarhantering (databas + backend endpoints)
2. Implementera inloggning i frontend
3. Lägg till licenssystem
4. Integrera Stripe
5. Bygg admin-panel
6. Sätt upp Electron distribution
