# Stripe Setup Guide

## 1. Skapa Stripe-konto

1. Gå till [stripe.com](https://stripe.com) och skapa ett konto
2. Verifiera ditt konto och aktivera det

## 2. Hämta API Keys

1. Gå till [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigera till **Developers** → **API keys**
3. Kopiera:
   - **Publishable key** (för frontend, om du vill använda Stripe.js direkt)
   - **Secret key** (för backend)

## 3. Skapa en Price (Månadsvis Premium)

**VIKTIGT:** Du behöver ett **Price ID** (börjar med `price_`), INTE ett Product ID (börjar med `prod_`).

1. Gå till **Products** → **Add product** (eller **Produkter** → **Lägg till produkt**)
2. Fyll i:
   - **Name**: "Premium Subscription"
   - **Description**: "Monthly Premium subscription for WestBudget"
   - **Pricing model**: Recurring (Återkommande)
   - **Price**: Välj belopp (t.ex. 99 SEK/månad)
   - **Billing period**: Monthly (Månadsvis)
3. Klicka **Save product** (Spara produkt)
4. **Kopiera PRICE ID** (börjar med `price_`) - INTE Product ID (som börjar med `prod_`)
   - Price ID ser ut så här: `price_1ABC123xyz...`
   - Product ID ser ut så här: `prod_ABC123xyz...` ← INTE DETTA!
   - Om du ser båda, använd det som börjar med `price_`

## 4. Konfigurera Miljövariabler

Skapa en `.env`-fil i projektets rot (eller sätt environment variables):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... (eller sk_live_... för produktion)
STRIPE_PUBLISHABLE_KEY=pk_test_... (eller pk_live_... för produktion)
STRIPE_PRICE_ID=price_... (din Price ID från steg 3)
STRIPE_WEBHOOK_SECRET=whsec_... (se steg 5)
```

## 5. Konfigurera Webhook

**Viktigt:** Stripe CLI behövs **ENDAST för lokal utveckling**. Slutanvändare behöver inte Stripe CLI alls. I produktion konfigureras webhooks direkt i Stripe Dashboard.

### Development (lokalt):

**Stripe CLI är bara för dig som utvecklare för att testa webhooks lokalt. Det spelar ingen roll vilken OS-version du installerar - det påverkar inte produktion.**

1. **Installera Stripe CLI (endast för lokal utveckling):**
   
   **För Windows (din utvecklingsmiljö):**
   - **Alternativ 1 (Rekommenderat):** Använd Scoop (Windows package manager)
     ```powershell
     # Installera Scoop först (om du inte har det):
     Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
     irm get.scoop.sh | iex
     
     # Installera Stripe CLI:
     scoop install stripe
     ```
   
   - **Alternativ 2:** Ladda ner direkt från Stripe
     - Gå till [Stripe CLI Releases](https://github.com/stripe/stripe-cli/releases/latest)
     - Ladda ner `stripe_X.X.X_windows_x86_64.zip`
     - Extrahera zip-filen till en mapp (t.ex. `C:\Program Files\stripe-cli`)
     - Lägg till mappen i PATH (se instruktioner nedan)
     
     **Så här lägger du till i PATH (Windows 10/11):**
     1. Öppna **Start-menyn** och sök efter "Miljövariabler" eller "Environment Variables"
     2. Klicka på **"Redigera systemmiljövariabler"** (Edit the system environment variables)
     3. Klicka på knappen **"Miljövariabler"** (Environment Variables) längst ner
     4. Under **"Systemvariabler"** (System variables), hitta och välj **"Path"**
     5. Klicka på **"Redigera"** (Edit)
     6. Klicka på **"Ny"** (New)
     7. Skriv in sökvägen till mappen där du extraherade Stripe CLI (t.ex. `C:\Program Files\stripe-cli`)
     8. Klicka **"OK"** på alla dialogrutor
     9. **Starta om PowerShell/Terminal** för att ändringarna ska gälla
     
     **Alternativt (snabbare metod):**
     - Flytta `stripe.exe` till en mapp som redan är i PATH, t.ex.:
       - `C:\Windows\System32` (kräver admin-rättigheter)
       - Eller skapa en mapp `C:\Tools` och lägg till den i PATH en gång

2. **Verifiera installationen:**
   ```bash
   stripe --version
   ```

3. **Logga in:**
   ```bash
   stripe login
   ```
   Detta öppnar en webbläsare där du loggar in med ditt Stripe-konto.

4. **Starta din Flask-server (i en terminal):**
   ```bash
   python app.py
   ```
   - Servern ska köra på `http://localhost:5000`
   - **Låt denna terminal köra** - öppna en ny terminal för nästa steg

5. **Forward webhooks till din lokala server (i en NY terminal):**
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
   - Detta startar en lokal webhook-listener som vidarebefordrar events till din Flask-server
   - **Låt denna terminal också köra** medan du testar
   - Du kommer se meddelanden när webhooks tas emot

6. **Kopiera webhook signing secret:**
   - När du startar `stripe listen` visas en **webhook signing secret** i terminalen
   - Det ser ut ungefär så här:
     ```
     > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
     ```
   - **Kopiera** hela secret:et (börjar med `whsec_`)

7. **Sätt webhook secret i din `.env`-fil:**
   - Skapa eller öppna en `.env`-fil i projektets rotmapp (samma mapp som `app.py`)
   - Lägg till:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
   - (Ersätt `whsec_xxxxxxxxxxxxx` med det faktiska secret:et du kopierade)

8. **Starta om din Flask-server:**
   - Stoppa Flask-servern (tryck `Ctrl+C` i terminalen där den körs)
   - Starta den igen: `python app.py`
   - Nu kommer den läsa webhook secret:et från `.env`-filen

**Testa att det fungerar:**
- Gör en test-betalning i appen (använd test-kort: `4242 4242 4242 4242`)
- Du bör se webhook-events i terminalen där `stripe listen` körs
- Du bör också se loggar i Flask-server terminalen när webhooks tas emot

**Viktigt:**
- Stripe CLI (`stripe listen`) måste köra samtidigt som din Flask-server
- Du behöver INTE skapa webhook i Stripe Dashboard för lokal testning
- Denna webhook secret är bara för lokal utveckling - i produktion använder du en annan secret från Stripe Dashboard

### Production (för slutanvändare):

**I produktion behöver du INTE Stripe CLI. Webhooks konfigureras direkt i Stripe Dashboard.**

**Steg-för-steg guide:**

1. **Logga in på Stripe Dashboard:**
   - Gå till [https://dashboard.stripe.com](https://dashboard.stripe.com)
   - Logga in med ditt Stripe-konto

2. **Navigera till Händelsedestinationer/Webhooks:**
   
   **Metod 1: Direkt URL (enklast)**
   - Gå direkt till: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   - Eller: [https://dashboard.stripe.com/events](https://dashboard.stripe.com/events)
   
   **Metod 2: Via sökfunktion**
   - Klicka på sökfältet längst upp (ikon med "Q Sök")
   - Skriv "webhooks", "händelsedestinationer" eller "event destinations"
   - Välj från sökresultaten

3. **Skapa ny händelsedestination:**
   - Klicka på knappen **"+ Skapa en händelsedestination"** eller **"+ Create event destination"**
   - Du kommer nu se en 3-stegs guide

4. **Steg 1: Välj händelser (Select events):**
   - Under **"API-version"**: Låt den vara som den är (t.ex. "2025-12-15.clover")
   - Under **"Händelser"** (Events): 
     - **Använd sökfältet** längst upp: "Hitta en händelse genom namn eller beskrivning..."
     - Sök efter varje event en i taget och kryssa i dem:
       - Sök: `checkout.session.completed` → kryssa i
       - Sök: `invoice.payment_succeeded` → kryssa i
       - Sök: `invoice.payment_failed` → kryssa i
       - Sök: `customer.subscription.updated` → kryssa i
       - Sök: `customer.subscription.deleted` → kryssa i
     - **Alternativt:** Scrolla ner i listan och expandera kategorierna (klicka på ">") för att hitta events manuellt
     - Du kan se hur många events du valt i fliken **"Valda händelser"** (Selected events) - det ska stå "5" när du är klar
   - Klicka **"Fortsätt →"** (Continue →) längst ner till höger när du valt alla 5 events

5. **Steg 2: Välj destinationstyp (Select destination type):**
   - Välj **"Webhook endpoint"** eller **"Webhook"**
   - Klicka **"Fortsätt →"**

6. **Steg 3: Konfigurera destination (Configure destination):**
   - **Endpoint URL**: Detta är URL:en till din backend-server där Stripe ska skicka webhooks
   
   **För lokal utveckling/testning:**
   - **ANVÄND STRIPE CLI** - Du behöver INTE skapa webhook i Dashboard för lokal testning!
   - Stripe CLI forwardar automatiskt webhooks till `localhost:5000/api/payments/webhook`
   - Se instruktioner nedan under "Development (lokalt)" sektionen
   
   **För produktion:**
   - **Endpoint URL** = Din produktionsdomän + `/api/payments/webhook`
   - Exempel om din server är på `https://api.westbudget.se`:
     ```
     https://api.westbudget.se/api/payments/webhook
     ```
   - Exempel om din server är på `https://westbudget.se`:
     ```
     https://westbudget.se/api/payments/webhook
     ```
   - **VIKTIGT:** Din server MÅSTE vara tillgänglig via HTTPS (inte HTTP) för att Stripe ska kunna skicka webhooks
   
   - **Description** (valfritt): T.ex. "WestBudget Production Webhook"
   - Klicka **"Skapa destination"** eller **"Create destination"** för att spara

7. **Kopiera Signing Secret:**
   - Efter att du skapat endpoint:en, klicka på den i listan
   - Under **"Signing secret"** finns en knapp med ett öga-ikon (visa/dölj)
   - Klicka på **"Reveal"** (eller **"Visa"**) för att visa secret:et
   - Klicka på kopierings-ikonen bredvid secret:et för att kopiera
   - Secret:et börjar med `whsec_`

8. **Sätt Signing Secret i produktion:**
   - Lägg till i din produktionsmiljövariabel `STRIPE_WEBHOOK_SECRET`
   - På din server/hosting-plattform (t.ex. Heroku, AWS, Azure)
   - I din `.env`-fil för produktion (aldrig commit denna fil!)
   - Starta om din server så att den läser den nya miljövariabeln

**Tips:**
- Om du inte ser "Add endpoint"-knappen, kontrollera att du är i rätt vy (Developers → Webhooks)
- Se till att du är i **"Live mode"** (inte Test mode) om du konfigurerar för produktion
- Du kan växla mellan Test och Live mode med en switch längst upp i Dashboard

## 6. Testa Integrationen

### Testa Checkout:

1. Logga in i appen
2. Gå till **Inställningar** → **License Status**
3. Klicka på **Uppgradera till Premium**
4. Du kommer att omdirigeras till Stripe Checkout
5. Använd test-kort: `4242 4242 4242 4242`
   - Expiry: Valfritt framtida datum
   - CVC: Valfritt 3-siffrigt nummer
   - ZIP: Valfritt

### Testa Webhooks (lokalt):

1. Starta Stripe CLI: `stripe listen --forward-to localhost:5000/api/payments/webhook`
2. Utför en test-betalning
3. Kontrollera att webhook-events tas emot i terminalen

## 7. Produktionschecklista

- [ ] Byt till **Live mode** i Stripe Dashboard
- [ ] Uppdatera API keys till live keys
- [ ] Konfigurera produktions-webhook
- [ ] Testa hela flödet i produktion
- [ ] Säkerställ att SSL-certifikat är aktivt (HTTPS krävs för webhooks)
- [ ] Konfigurera e-postnotifikationer i Stripe Dashboard
- [ ] Sätt upp automatiska e-postmeddelanden för:
  - Betalningsbekräftelser
  - Misslyckade betalningar
  - Prenumerationsuppdateringar

## 8. Säkerhet

- ✅ **ALDRIG** committa API keys till git
- ✅ Använd `.env`-fil och lägg till i `.gitignore`
- ✅ Använd olika keys för development och production
- ✅ Rotera keys regelbundet
- ✅ Använd webhook signatures för att verifiera att events kommer från Stripe

## 9. Övervakning

- Övervaka Stripe Dashboard regelbundet för:
  - Misslyckade betalningar
  - Avbrutna prenumerationer
  - Webhook-fel
- Sätt upp alerts i Stripe Dashboard för viktiga events

## 10. Support

Om du stöter på problem:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Discord](https://discord.gg/stripe)

