# Återbetalningar enligt Svensk Lag

## Översikt

Enligt svensk lag (konsumentköplagen och distansavtalslagen) har kunder rätt att ångra köp inom 14 dagar från köpet, utan att ange skäl.

## Lagstiftning

### Distansavtalslagen (2005:59)
- **14 dagars ångerrätt** för distansavtal (t.ex. onlineköp)
- Gäller för tjänster som prenumerationer
- Gäller från det att avtalet ingås

### Konsumentköplagen (1990:932)
- Reglerar köp av varor och tjänster
- Ångerrätt gäller även för digitala tjänster

## Praktisk Implementering

### 1. Ångerrätt för Prenumerationer

**Vad gäller:**
- Kunder har 14 dagar på sig att ångra en prenumeration
- Ångerrätten börjar från det att avtalet ingås
- Om tjänsten börjar användas innan ångerfristen gått ut, kan ångerrätten försvinna

**Undantag:**
- Om kunden har börjat använda tjänsten och samtyckt till att ångerrätten försvinner
- För digitalt innehåll som levereras omedelbart (t.ex. nedladdning)

### 2. Återbetalningsprocess

**Steg för att hantera återbetalning:**

1. **Verifiera ångerrätt**
   - Kontrollera att köpet skedde inom de senaste 14 dagarna
   - Kontrollera att tjänsten inte har använts fullt ut
   - Kontrollera att kunden inte har samtyckt till att förlora ångerrätten

2. **Avbryt prenumerationen**
   - Avbryt prenumerationen i Stripe
   - Uppdatera licensstatus i systemet
   - Logga återbetalningen

3. **Genomför återbetalning**
   - Använd Stripe's refund API
   - Återbetal hela beloppet om tjänsten inte använts
   - Återbetal proportionellt om tjänsten delvis använts

4. **Meddela kunden**
   - Skicka bekräftelse på återbetalning
   - Uppdatera kundens licensstatus

## Stripe Implementation

### Återbetalning via Stripe API

```python
import stripe

# Återbetal hela beloppet
refund = stripe.Refund.create(
    payment_intent='pi_xxxxx',  # Payment Intent ID
    amount=5000,  # Belopp i öre (50 SEK)
    reason='requested_by_customer'  # eller 'duplicate', 'fraudulent'
)

# Återbetal proportionellt (delvis)
refund = stripe.Refund.create(
    payment_intent='pi_xxxxx',
    amount=2500,  # Hälften av beloppet
    reason='requested_by_customer'
)
```

### Automatisk Återbetalning vid Avbokning

När en kund avbokar inom 14 dagar:
1. Avbryt prenumerationen i Stripe
2. Hitta senaste betalningen
3. Genomför återbetalning
4. Uppdatera licensstatus

## Praktiska Exempel

### Scenario 1: Ångerrätt inom 14 dagar

**Situation:**
- Kunden köpte prenumeration 2025-01-01
- Kunden begär återbetalning 2025-01-10 (9 dagar senare)
- Tjänsten har använts delvis

**Åtgärder:**
1. ✅ Ångerrätt gäller (inom 14 dagar)
2. Avbryt prenumerationen
3. Beräkna proportionell återbetalning baserat på användning
4. Genomför återbetalning via Stripe
5. Uppdatera licensstatus till "Avslutad"

### Scenario 2: Ångerrätt efter 14 dagar

**Situation:**
- Kunden köpte prenumeration 2025-01-01
- Kunden begär återbetalning 2025-01-20 (19 dagar senare)

**Åtgärder:**
1. ❌ Ångerrätt gäller inte längre
2. Erbjud alternativ:
   - Avbryt prenumerationen (ingen återbetalning)
   - Pausa prenumerationen
   - Erbjud rabatt för att behålla kunden

### Scenario 3: Full användning innan ångerfrist

**Situation:**
- Kunden köpte prenumeration 2025-01-01
- Kunden använde tjänsten fullt ut och samtyckte till att förlora ångerrätten
- Kunden begär återbetalning 2025-01-10

**Åtgärder:**
1. ❌ Ångerrätt gäller inte (tjänsten använts fullt ut)
2. Förklara för kunden att ångerrätten inte gäller
3. Erbjud alternativ (pausa, avbryt utan återbetalning)

## Backend Implementation

### Endpoint för Återbetalning

```python
@app.route('/api/admin/refunds', methods=['POST'])
@require_admin
def create_refund():
    """Create a refund for a customer (admin only)"""
    data = request.get_json()
    payment_intent_id = data.get('payment_intent_id')
    amount = data.get('amount')  # Optional, för delvis återbetalning
    reason = data.get('reason', 'requested_by_customer')
    
    try:
        if amount:
            # Delvis återbetalning
            refund = stripe.Refund.create(
                payment_intent=payment_intent_id,
                amount=amount,
                reason=reason
            )
        else:
            # Hela beloppet
            refund = stripe.Refund.create(
                payment_intent=payment_intent_id,
                reason=reason
            )
        
        # Log refund in database
        # Update subscription/license status
        # Send confirmation email
        
        return jsonify({
            'success': True,
            'refund_id': refund.id,
            'amount': refund.amount,
            'status': refund.status
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({'error': str(e)}), 400
```

### Kontrollera Ångerrätt

```python
def check_cancellation_right(subscription_date):
    """Check if customer has right to cancel within 14 days"""
    from datetime import datetime, timedelta
    
    purchase_date = datetime.fromisoformat(subscription_date)
    days_since_purchase = (datetime.now() - purchase_date).days
    
    return days_since_purchase <= 14
```

## Kundkommunikation

### E-postmall för Återbetalning

**Ämne:** Bekräftelse på återbetalning - WestBudget

**Innehåll:**
```
Hej [Kundnamn],

Vi har mottagit din begäran om återbetalning för din WestBudget-prenumeration.

Återbetalningsdetaljer:
- Belopp: [Belopp] SEK
- Betalningsmetod: [Korttyp] ****[Sista 4 siffrorna]
- Förväntad tid: 5-10 bankdagar

Din prenumeration har avbrutits och du kommer inte att debiteras framöver.

Om du har frågor, kontakta oss.

Vänliga hälsningar,
WestBudget-teamet
```

## Best Practices

1. **Var transparent**
   - Informera kunder tydligt om ångerrätt
   - Visa ångerfristen tydligt vid köp

2. **Automatisera processen**
   - Skapa automatisk återbetalning för avbokningar inom 14 dagar
   - Logga alla återbetalningar

3. **Dokumentera allt**
   - Spara alla återbetalningar i databasen
   - Behåll korrespondens med kunder

4. **Följ lagstiftningen**
   - Respektera 14-dagarsregeln
   - Informera kunder om undantag

5. **Var snabb**
   - Genomför återbetalningar inom 14 dagar från begäran
   - Meddela kunden omedelbart

## Ytterligare Resurser

- [Konsumentverket - Ångerrätt](https://www.konsumentverket.se/)
- [Stripe Refunds Documentation](https://stripe.com/docs/refunds)
- [Distansavtalslagen (2005:59)](https://www.riksdagen.se/sv/dokument-lagar/dokument/svensk-forfattningssamling/lag-200559-om-distansavtal-och_sfs-2005-59)

