# Återstående Uppgifter från TODO_FEATURES.md

## Prioriterade Uppgifter

### 1. Electron Auto-Update (Hög prioritet)
**Status:** ✅ Implementerad

**Vad som är gjort:**
- [x] Implementera update check i `main.js` (redan implementerad)
- [x] Skapa Update UI-komponent i frontend (`AutoUpdateNotification.jsx`)
- [x] Integrera i `App.jsx`
- [ ] Konfigurera GitHub Releases som update server (TODO - kräver GitHub repo)
- [ ] Testa auto-update funktionalitet (TODO - kräver byggd app)

**Steg kvar:**
1. Konfigurera GitHub Releases i `package.json` publish-sektion (uppdatera owner/repo)
2. Bygg app och testa auto-update funktionalitet

---

### 2. Admin Panel - Förbättringar
**Status:** ✅ Grundfunktionalitet klar

**Vad som är gjort:**
- [x] Implementera riktig statistik (MRR, churn rate, revenue, subscriptions, etc.)
- [x] Diagram över nya användare (senaste 6 månaderna)
- [x] Detaljerad användningsstatistik

**Vad som saknas:**
- [ ] Implementera refund-funktionalitet för betalningar
- [ ] Systeminställningar-sektion

**Steg:**
1. ~~Implementera statistik-beräkningar i backend~~ ✅ Klar
2. Skapa refund-endpoint för Stripe
3. Skapa Systeminställningar-komponent

---

### 3. Licenssystem - Förbättringar
**Status:** ✅ Implementerad

**Vad som är gjort:**
- [x] `TrialBanner` - Varning när trial går ut snart
- [x] `LicenseExpiredModal` - Modal när licens har gått ut
- [x] Integrerad i `LicenseGate`

---

### 4. Säkerhet - Förbättringar
**Status:** ✅ Implementerad

**Vad som är gjort:**
- [x] Rate limiting för login/register endpoints (Flask-Limiter)
- [x] Rate limiting för forgot-password och reset-password
- [x] Globala rate limits (200/dag, 50/timme)

**Vad som saknas:**
- [ ] E-postverifiering (valfritt)

**Steg:**
1. ~~Installera `flask-limiter` eller liknande~~ ✅ Klar
2. ~~Implementera rate limiting för auth-endpoints~~ ✅ Klar
3. (Valfritt) Implementera e-postverifiering vid registrering

---

### 5. Code Signing (Låg prioritet)
**Status:** ⏳ Ej påbörjad

**Vad som behövs:**
- [ ] Köpa code signing certificate för Windows
- [ ] Skaffa Apple Developer-konto för macOS
- [ ] Konfigurera i electron-builder

**Notera:** Detta är valfritt men rekommenderat för produktion.

---

## Snabbvinstar (Kan göras direkt)

### 1. TrialBanner Komponent
Skapa en banner som varnar när trial går ut snart (7 dagar kvar).

### 2. LicenseExpiredModal
Modal som visas när licensen har gått ut.

### 3. Update Notification UI
Enkel komponent som visar när update finns tillgänglig.

### 4. Admin Statistics - Riktig Data
Ersätt placeholder med riktig statistik från databasen.

---

## Nästa Steg

1. **Börja med Electron Auto-Update** - Viktigt för distribution
2. **Förbättra Admin Statistics** - Ger värde för admin
3. **Lägg till TrialBanner och LicenseExpiredModal** - Förbättrar UX
4. **Implementera Rate Limiting** - Förbättrar säkerhet

