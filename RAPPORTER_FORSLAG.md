# Rapporter-sidan - Förslag och Ideer

## 🎯 Mål
Skapa en professionell rapportsida som kan användas för:
- Bankförhandlingar
- Visning av ekonomi
- Budgetplanering
- Ekonomisk analys
- Privat ekonomi (inte företag)

---

## 📊 1. Datumväljare och Jämförelse

### Nuvarande:
- ✅ Denna Månad, Föregående Månad, Hela Året, Anpassad

### Förbättringar:
- **Jämförelse-läge:**
  - Toggle: "Jämför med föregående period"
  - Visa två kolumner: "Denna period" vs "Föregående period"
  - Visa förändring i % och kr
  - Färgkodning: grönt för förbättring, rött för försämring

- **År-till-år jämförelse:**
  - "Jämför med samma period förra året"
  - Användbart för att se trender

- **Kvartalsväljare:** (TA BORT - inte relevant för privat ekonomi)

---

## 📄 2. Rapporter att Skriva Ut (PDF/Print)

### A. Resultaträkning (P&L)
- **Innehåll:**
  - Total inkomst
  - Total utgift
  - Nettoresultat
  - Uppdelning per kategori
  - Månadsvis/jämförelse
- **Format:** Professionell PDF med logo, datum, signaturrad

### B. Låneanalys (Framtida funktion)
- **Innehåll:**
  - Total skuld
  - Månadsvis amortering
  - Månadsvis ränta
  - Total räntekostnad per år
  - Återstående skuld
  - Amorteringsplan
- **Format:** Tabell + diagram (amortering vs ränta)

### C. Kassaflödesanalys
- **Innehåll:**
  - Inkomster per månad
  - Utgifter per månad
  - Netto kassaflöde
  - Trend över tid
- **Format:** Vattenfallsdiagram + tabell

### D. Kategorianalys
- **Innehåll:**
  - Top 10 utgiftskategorier
  - Top 10 inkomstkategorier
  - Procentuell fördelning
  - Jämförelse med föregående period
- **Format:** Cirkeldiagram + tabell

### E. Budget vs Faktiskt
- **Innehåll:**
  - Planerad budget
  - Faktiska utgifter
  - Avvikelse
  - Per kategori
- **Format:** Jämförelsetabell

### F. Ekonomisammanfattning (för Banken)
- **Innehåll:**
  - Inkomststabilitet (genomsnitt, min, max)
  - Utgiftstrender
  - Sparande/sparande%
  - Skuldsättningsgrad (om lån finns)
  - Lönsamhet
  - Kassaflöde
- **Format:** Professionell PDF med sammanfattning

---

## 📈 3. Statistik och KPI:er

### Finansiella KPI:er:
- **Genomsnittlig månadsinkomst** (3, 6, 12 månader)
- **Genomsnittlig månadsutgift** (3, 6, 12 månader)
- **Sparande/sparande%** (inkomst - utgift)
- **Största utgiftskategori** (denna månad/år)
- **Största inkomstkälla**
- **Utgiftstrend** (ökning/minskning %)
- **Inkomststabilitet** (variationskoefficient)

### Visualiseringar:
- **Stapeldiagram:** Inkomster vs Utgifter (månadsvis)
- **Linjediagram:** Trend över tid (inkomst, utgift, netto)
- **Cirkeldiagram:** Kostnadsfördelning per kategori
- **Vattenfallsdiagram:** Kassaflöde (start → inkomster → utgifter → slut)
- **Heatmap:** Månadsvis kategorifördelning
- **Sparklines:** Mini-trender för snabb överblick

---

## 🏦 4. För Banken - Specifika Rapporter

### A. Kassaflödesanalys
- **Vad banken vill se:**
  - Stabil inkomst
  - Kontrollerade utgifter
  - Positivt kassaflöde
  - Sparande

### B. Inkomststabilitet
- **Visa:**
  - Genomsnittlig månadsinkomst
  - Min/max inkomst
  - Variationskoefficient
  - Trend (ökande/minskande)

### C. Utgiftstrender
- **Visa:**
  - Utgifter per kategori
  - Trend över tid
  - Största utgiftsposter
  - Potential för besparingar

### D. Sparandehistorik
- **Visa:**
  - Månadsvis sparande
  - Genomsnittligt sparande
  - Sparande%
  - Trend

### E. Låneanalys (Framtida funktion)
- **Visa:**
  - Total skuld
  - Skuld/inkomst ratio
  - Månadsvis amortering vs ränta
  - Amorteringsplan
  - Total räntekostnad
  - Återstående skuld över tid

---

## 🎨 5. Design och Layout

### Förslag på Layout:

```
┌─────────────────────────────────────────────────┐
│  Rapporter  [Datumväljare]  [Jämför] [Exportera]│
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌─────────────┐             │
│  │ KPI Cards   │  │ KPI Cards   │             │
│  └─────────────┘  └─────────────┘             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Resultaträkning (Stapeldiagram)        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐             │
│  │ Momsrapport │  │ Kategorier  │             │
│  │             │  │ (Cirkel)    │             │
│  └─────────────┘  └─────────────┘             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Kassaflöde (Vattenfall)                │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐             │
│  │ Trend       │  │ Top Kategorier│          │
│  │ (Linje)     │  │ (Tabell)    │             │
│  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────┘
```

---

## 🖨️ 6. Export-funktioner

### Format:
- **PDF:** Professionell rapport med logo, datum, sidnummer
- **Excel/CSV:** Data för vidare analys
- **Print:** Print-optimerad layout

### Innehåll i export:
- Logo (användarens egen logo)
- Rapporttyp och datumintervall
- Alla diagram och tabeller
- Sammanfattning
- Fotnoter och förklaringar

---

## 📋 7. Specifika Rapporter

### A. Månadsrapport
- Snabb överblick av månaden
- Inkomst, utgift, netto
- Top 5 kategorier
- Jämförelse med föregående månad

### B. Låneöversikt
- Total skuld
- Månadsvis amortering vs ränta
- Återstående skuld
- Räntekostnad per år

### C. Årsrapport
- Fullständig ekonomisammanfattning
- Alla KPI:er
- Jämförelse år-till-år
- Prognos för nästa år

### D. Bankrapport
- Kassaflödesanalys
- Inkomststabilitet
- Utgiftstrender
- Sparande
- Skuldsättning (om tillämpligt)

---

## 🎯 Prioritering

### Fas 1 (Grundläggande):
1. ✅ Förbättra datumväljare (kvartal, jämförelse)
2. ✅ KPI-cards (genomsnitt, sparande, trend)
3. ✅ Förbättra diagram (stapel, linje, cirkel)
4. ✅ PDF-export för Resultaträkning

### Fas 2 (Avancerat):
5. Jämförelse-läge (denna vs föregående period)
6. Kassaflödesanalys
7. Budget vs Faktiskt
8. Bankrapport (specifik för banken)

### Fas 3 (Premium):
9. Heatmap (månadsvis kategorifördelning)
10. Prognos/förutsägelse
11. Excel-export med formler
12. Anpassningsbara rapportmallar

---

## 💡 Ytterligare Ideer

- **Rapportmallar:** Privat, Bank
- **Spara rapporter:** Spara favorit-rapporter för snabb åtkomst
- **Schemalagd export:** Automatisk månadsrapport via e-post
- **Delning:** Dela rapporter via länk (säkert)
- **Kommentarer:** Lägg till kommentarer i rapporter
- **Logo:** Använd användarens egen logo i PDF-export

## 🏦 Lån-funktionalitet (Framtida)

### När lån implementeras:
- **Låneöversikt:**
  - Total skuld
  - Månadsvis amortering
  - Månadsvis ränta
  - Återstående skuld över tid

- **Låneanalys i rapporter:**
  - Amortering vs ränta (diagram)
  - Total räntekostnad per år
  - Skuld/inkomst ratio
  - Amorteringsplan

- **Integration med rapporter:**
  - Inkludera lånekostnader i utgiftsanalys
  - Visa netto efter lån
  - Sparande efter lån

---

## 🚀 Nästa Steg

**Uppdaterat baserat på feedback:**
- ❌ Ta bort: Skattedeklaration, Kvartalsväljare (Q1-Q4)
- ✅ Fokus: Privat ekonomi (inte företag)
- ✅ Logo: Använd användarens egen logo i PDF-export
- ✅ Framtida: Lån-funktionalitet (amortering vs ränta)

**Rekommenderad ordning:**
1. KPI-cards
2. Förbättrade diagram
3. PDF-export (med logo)
4. Jämförelse-läge
5. Kassaflödesanalys
6. Bankrapport

**När lån implementeras:**
- Låneanalys i rapporter
- Amortering vs ränta diagram
- Integration med utgiftsanalys

---

## 📸 Logo

**Användaren har en logo de vill använda!**
- Var ska logon sparas? (t.ex. `frontend/public/logo.png`)
- Vilket format? (PNG, SVG, etc.)
- Ska den visas i appen också, eller bara i PDF-export?

**Vill du dela logon så kan jag integrera den i PDF-exporten?**

