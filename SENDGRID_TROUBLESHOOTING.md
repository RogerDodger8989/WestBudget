# SendGrid Felsökning - 403 Forbidden

## Problem
Du får felet "HTTP Error 403: Forbidden" när du försöker skicka e-post via SendGrid.

## Lösningar

### 1. Verifiera Avsändaradress (Viktigast!)

SendGrid kräver att avsändaradressen är verifierad innan du kan skicka e-post.

**Steg:**
1. Logga in på [SendGrid Dashboard](https://app.sendgrid.com)
2. Gå till **Settings** → **Sender Authentication**
3. Klicka på **Verify a Single Sender** (för test) eller **Authenticate Your Domain** (för produktion)
4. Följ instruktionerna för att verifiera din e-postadress
5. Kontrollera din e-post och klicka på verifieringslänken

**Viktigt:** Du kan bara skicka från verifierade adresser!

### 2. Kontrollera API Key Behörigheter

1. Gå till **Settings** → **API Keys** i SendGrid Dashboard
2. Klicka på din API key
3. Kontrollera att **Mail Send** behörighet är aktiverad
4. Om inte, skapa en ny API key med "Full Access" eller "Restricted Access" med Mail Send aktiverat

### 3. Kontrollera API Key

1. Gå till **Settings** → **API Keys**
2. Kopiera din API key (den börjar med `SG.`)
3. Kontrollera att den är korrekt satt i miljövariabeln:
   ```bash
   # Windows PowerShell
   $env:SENDGRID_API_KEY="SG.din_api_key_här"
   
   # Kontrollera att den är satt
   echo $env:SENDGRID_API_KEY
   ```

### 4. Testa API Key

Du kan testa din API key direkt:

```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

sg = SendGridAPIClient('SG.din_api_key_här')
message = Mail(
    from_email='noreply@westbudget.se',  # Måste vara verifierad!
    to_emails='test@example.com',
    subject='Test',
    html_content='<strong>Test</strong>'
)
response = sg.send(message)
print(f"Status: {response.status_code}")
```

### 5. Kontrollera SendGrid Dashboard för Fel

1. Gå till **Activity** i SendGrid Dashboard
2. Kolla om det finns några felmeddelanden
3. Kolla **Suppressions** för att se om e-postadressen är blockerad

### 6. Vanliga Fel och Lösningar

**403 Forbidden:**
- ✅ Avsändaradressen är inte verifierad → Verifiera i SendGrid Dashboard
- ✅ API key saknar behörighet → Skapa ny API key med Mail Send behörighet
- ✅ API key är felaktig → Kontrollera att den är korrekt kopierad

**401 Unauthorized:**
- ✅ API key är ogiltig → Skapa en ny API key

**400 Bad Request:**
- ✅ E-postformat är felaktigt → Kontrollera att e-postadresserna är korrekt formaterade

## Snabb Checklista

- [ ] Avsändaradressen är verifierad i SendGrid Dashboard
- [ ] API key har "Mail Send" behörighet
- [ ] API key är korrekt satt i miljövariabeln
- [ ] API key börjar med `SG.`
- [ ] Backend-servern har startats om efter att API key satts

## Testa Efter Fix

1. Starta om backend-servern
2. Försök skicka e-post igen
3. Kolla backend-terminalen för detaljerade felmeddelanden
4. Kolla SendGrid Dashboard → Activity för att se om e-posten skickades

## Alternativ: Använd Test-läge

Om du bara vill testa funktionaliteten utan att verifiera en adress:

1. SendGrid kommer att logga lösenordet i backend-konsolen
2. Du kan kopiera lösenordet manuellt och skicka det till användaren
3. När SendGrid är korrekt konfigurerad kommer e-posten att skickas automatiskt

