# TODO: WestBudget - Licenssystem & Electron Distribution

## Översikt
Detta dokument beskriver implementationen av licenssystem, användarhantering, betalningsintegration och Electron-distribution för WestBudget.

---

## 1. Användarhantering & Autentisering
**Status:** ⏳ Ej påbörjad

### Funktioner:
- [ ] Användarregistrering (e-post + lösenord)
- [ ] Inloggning (e-post + lösenord)
- [ ] Lösenordsåterställning (via SendGrid e-post)
- [ ] JWT-token baserad autentisering
- [ ] Session-hantering (kom ihåg mig)
- [ ] Logout-funktionalitet
- [ ] Profilhantering (uppdatera e-post, lösenord)

### Implementation:
- [ ] Skapa `users` tabell i databasen
  - id, email, password_hash, created_at, updated_at, last_login
- [ ] Backend endpoints:
  - [ ] `POST /api/auth/register` - Registrera ny användare
  - [ ] `POST /api/auth/login` - Logga in
  - [ ] `POST /api/auth/logout` - Logga ut
  - [ ] `POST /api/auth/forgot-password` - Begär lösenordsåterställning
  - [ ] `POST /api/auth/reset-password` - Återställ lösenord
  - [ ] `GET /api/auth/me` - Hämta aktuell användare
  - [ ] `PUT /api/auth/profile` - Uppdatera profil
- [ ] Frontend komponenter:
  - [ ] `LoginModal` - Inloggningsmodal
  - [ ] `RegisterModal` - Registreringsmodal
  - [ ] `ForgotPasswordModal` - Glömt lösenord
  - [ ] `UserProfile` - Profilhantering i Settings
- [ ] Integrera SendGrid för e-postutskick
- [ ] Säkerhet:
  - [ ] Hasha lösenord med bcrypt
  - [ ] JWT-token med expiration
  - [ ] Rate limiting för login/register
  - [ ] E-postverifiering (valfritt)

---

## 2. Licenssystem
**Status:** ⏳ Ej påbörjad

### Funktioner:
- [ ] Två licensnivåer: Trial (30 dagar) och Premium (månadsvis)
- [ ] Automatisk trial-period för nya användare
- [ ] Licensvalidering (online med offline-fallback)
- [ ] Grace period (7 dagar offline-användning)
- [ ] Licensstatus-visning i appen
- [ ] Varningar när trial/licens går ut snart

### Implementation:
- [ ] Skapa `licenses` tabell i databasen
  - id, user_id, license_type (trial/premium), status (active/expired/cancelled), 
    starts_at, expires_at, created_at, updated_at, last_validated_at
- [ ] Skapa `license_validations` tabell (för logging)
  - id, license_id, validation_type (online/offline), success, error_message, created_at
- [ ] Backend endpoints:
  - [ ] `GET /api/licenses/current` - Hämta aktuell licens
  - [ ] `POST /api/licenses/validate` - Validera licens (online)
  - [ ] `GET /api/licenses/status` - Hämta licensstatus
- [ ] Licensvalideringslogik:
  - [ ] Online-validering vid app-start (om internet finns)
  - [ ] Offline-cache (spara senaste validering lokalt)
  - [ ] Grace period (tillåt användning i 7 dagar utan validering)
  - [ ] Automatisk validering i bakgrunden
- [ ] Frontend komponenter:
  - [ ] `LicenseStatus` - Visa licensstatus i Settings
  - [ ] `TrialBanner` - Varning när trial går ut snart
  - [ ] `LicenseExpiredModal` - Modal när licens har gått ut
- [ ] Feature flags baserat på licens:
  - [ ] Trial: Alla funktioner (begränsad tid)
  - [ ] Premium: Alla funktioner (obegränsat)

---

## 3. Betalningsintegration (Stripe)
**Status:** ⏳ Ej påbörjad

### Funktioner:
- [ ] Stripe Checkout integration
- [ ] Månadsvis prenumeration
- [ ] Automatisk fakturering
- [ ] Hantera prenumerationsuppdateringar
- [ ] Hantera avbokningar
- [ ] Webhook-hantering för Stripe events

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
**Status:** ⏳ Ej påbörjad

### Funktioner:
- [ ] Användarhantering (skapa, redigera, radera användare)
- [ ] Licenshantering (se alla licenser, manuellt aktivera/inaktivera)
- [ ] Användningsstatistik (dashboard med metrics)
- [ ] Betalningshantering (se transaktioner, refunds)
- [ ] Systeminställningar

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
**Status:** ⏳ Ej påbörjad

### Funktioner:
- [ ] Electron Builder konfiguration
- [ ] Windows installer (.exe)
- [ ] macOS installer (.dmg)
- [ ] Linux installer (.AppImage eller .deb)
- [ ] Code signing (Windows/macOS)
- [ ] Auto-update funktionalitet
- [ ] Update server setup

### Implementation:
- [ ] Installera Electron Builder:
  - [ ] `npm install --save-dev electron-builder`
- [ ] Konfigurera `electron-builder` i `package.json`:
  - [ ] Windows konfiguration
  - [ ] macOS konfiguration
  - [ ] Linux konfiguration
  - [ ] Icons och metadata
- [ ] Skapa build scripts:
  - [ ] `npm run build:win` - Bygg Windows installer
  - [ ] `npm run build:mac` - Bygg macOS installer
  - [ ] `npm run build:linux` - Bygg Linux installer
  - [ ] `npm run build:all` - Bygg alla plattformar
- [ ] Code signing:
  - [ ] Windows: Code signing certificate
  - [ ] macOS: Apple Developer certificate
  - [ ] Konfigurera i electron-builder
- [ ] Auto-update:
  - [ ] Installera `electron-updater`
  - [ ] Konfigurera update server (GitHub Releases eller egen server)
  - [ ] Implementera update check i appen
  - [ ] Update UI (visa när update finns, progress bar)
- [ ] Update server (valfritt - kan använda GitHub Releases):
  - [ ] Hosta `latest.yml` / `latest-mac.yml` / `latest-linux.yml`
  - [ ] Hosta installer-filer
  - [ ] Versionering (SemVer)

---

## 6. Integration & Testing
**Status:** ⏳ Ej påbörjad

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
- [ ] Ny tabell: `users` (användare)
- [ ] Ny tabell: `licenses` (licenser)
- [ ] Ny tabell: `license_validations` (valideringslogg)
- [ ] Ny tabell: `subscriptions` (prenumerationer)
- [ ] Ny tabell: `payments` (betalningar)
- [ ] Middleware för autentisering (JWT)
- [ ] Middleware för licensvalidering
- [ ] Middleware för admin-check
- [ ] Stripe webhook endpoint
- [ ] SendGrid integration för e-post

### Frontend-ändringar:
- [ ] Login/Register modals
- [ ] User profile i Settings
- [ ] License status i Settings
- [ ] Upgrade to Premium UI
- [ ] Subscription management
- [ ] Admin Panel (ny tab i Settings)
- [ ] Auto-update UI
- [ ] Auth context/provider
- [ ] License context/provider

### Externa tjänster:
- [ ] Stripe account och API keys
- [ ] SendGrid account och API keys
- [ ] Update server (GitHub Releases eller egen)
- [ ] Code signing certificates (valfritt men rekommenderat)

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
