# SendGrid Setup - Snabbguide

## Steg 1: Sätt Miljövariabler

I PowerShell, kör dessa kommandon:

```powershell
# Sätt SendGrid API key (ersätt med din riktiga key)
$env:SENDGRID_API_KEY="SG.r_xxxxxxxxxxxxxxxxxxxxx"

# Sätt avsändaradress (måste vara verifierad i SendGrid)
$env:SENDGRID_FROM_EMAIL="dennis800121@gmail.com"

# Sätt avsändarnamn
$env:SENDGRID_FROM_NAME="WestBudget"

# Sätt reset password URL
$env:RESET_PASSWORD_URL="http://localhost:5100"
```

## Steg 2: Verifiera att variablerna är satta

```powershell
echo $env:SENDGRID_API_KEY
echo $env:SENDGRID_FROM_EMAIL
echo $env:SENDGRID_FROM_NAME
```

## Steg 3: Starta Backend

**VIKTIGT:** Starta backend i **samma PowerShell-fönster** där du satte miljövariablerna!

```powershell
python app.py
```

## Alternativ: Använd Batch-fil

1. Redigera `set_sendgrid_env.bat` och ersätt `SG.r_xxxxxxxxxxxxxxxxxxxxx` med din riktiga API key
2. Kör batch-filen:
   ```powershell
   .\set_sendgrid_env.bat
   python app.py
   ```

## Testa E-post

1. Logga in som admin
2. Gå till Inställningar → Admin → Användare
3. Klicka på e-postikonen bredvid en användare
4. Ange ett lösenord och klicka "Skicka"
5. Kontrollera att e-posten skickas utan fel

## Felsökning

### Felet "403 Forbidden" kvarstår:
- ✅ Kontrollera att `SENDGRID_FROM_EMAIL` matchar den verifierade adressen i SendGrid Dashboard
- ✅ Kontrollera att backend startades i samma terminal där miljövariablerna satts
- ✅ Kontrollera att API key är korrekt (börjar med `SG.`)

### E-post skickas inte:
- Kolla backend-terminalen för felmeddelanden
- Kontrollera SendGrid Dashboard → Activity för att se om e-posten nådde SendGrid

