# TODO: Nya Funktioner för WestBudget

## 1. Avancerad sökning & filter
**Status:** ✅ Implementerad (delvis)

### Funktioner:
- ✅ Avancerad sökning med flera kriterier samtidigt
- ✅ Kombinera filter (datum, belopp, kategori, status, fritext)
- ✅ Spara sökningar som favoriter
- ✅ Sök i alla fält (titel, beskrivning, noteringar, referens)
- ✅ Datumintervall-sökning
- ✅ Beloppsintervall-sökning
- ✅ Multi-select för kategorier
- ⏳ Multi-select för status (endast en status kan väljas för nu)

### Implementation:
- [x] Skapa `AdvancedSearchModal` komponent
- [x] Lägg till filter-logik i `TransactionsTab`
- [ ] Lägg till filter-logik i `AgreementsTab` (nästa steg)
- [x] Implementera sparade sökningar
- [x] Uppdatera API för avancerad sökning (backend)

---

## 2. Anpassade rapporter
**Status:** ⏳ Pending

### Funktioner:
- Skapa egna rapportmallar
- Välj kategorier att inkludera
- Välj datumintervall
- Välj visualiseringar (diagram, tabeller, KPI-kort)
- Spara och återanvänd mallar
- Exportera anpassade rapporter till PDF/CSV

### Implementation:
- [ ] Skapa `CustomReportBuilder` komponent
- [ ] Implementera rapportmall-system i databasen
- [ ] Bygg rapport-generator med valbara komponenter
- [ ] Lägg till spara/ladda rapportmallar
- [ ] Integrera med befintlig rapport-funktionalitet

---

## 3. E-postrapporter
**Status:** ⏳ Pending

### Funktioner:
- Månadsvisa sammanfattningar via e-post
- Automatisk schemaläggning (varje månad)
- Anpassningsbar innehåll (välj vad som ska inkluderas)
- PDF-bilaga med detaljerad rapport
- Konfigurerbar e-postadress i inställningar

### Implementation:
- [ ] Implementera e-postfunktionalitet i backend (SMTP)
- [ ] Skapa e-postmallar (HTML)
- [ ] Lägg till schemaläggning (cron job eller scheduler)
- [ ] Skapa inställningar för e-postkonfiguration
- [ ] Implementera e-postvalidering
- [ ] Lägg till testfunktion för att skicka test-e-post

---

## 4. Dashboard widgets
**Status:** ⏳ Pending

### Funktioner:
- Anpassningsbar dashboard med dra-och-släpp
- Olika widget-typer:
  - KPI-kort (Inkomst, Utgifter, Netto)
  - Diagram (linje, stapel, cirkel)
  - Transaktionslista
  - Kategorifördelning
  - Sparande-progress
  - Lån-översikt
- Spara dashboard-layout
- Återställ till standardlayout

### Implementation:
- [ ] Implementera drag-and-drop bibliotek (react-dnd eller dnd-kit)
- [ ] Skapa widget-komponenter
- [ ] Bygg widget-configurator
- [ ] Spara widget-layout i databasen
- [ ] Uppdatera `OverviewTab` med widget-system
- [ ] Lägg till widget-inställningar (storlek, data, färger)

---

## 5. Tema-anpassning
**Status:** ⏳ Pending

### Funktioner:
- Fler fördefinierade färgteman:
  - Indigo (nuvarande)
  - Blå
  - Grön
  - Lila
  - Röd
  - Amber
- Anpassa primärfärg
- Anpassa sekundärfärg
- Anpassa accentfärg
- Förhandsgranska tema
- Spara anpassade teman

### Implementation:
- [ ] Skapa tema-system i CSS/Tailwind
- [ ] Implementera färgväljare (color picker)
- [ ] Lägg till tema-inställningar i `SettingsTab`
- [ ] Spara teman i databasen
- [ ] Uppdatera alla komponenter för att använda tema-färger
- [ ] Lägg till förhandsgranskning av tema

---

## Prioritering

1. **Avancerad sökning & filter** - Hög prioritet (används ofta)
2. **Dashboard widgets** - Hög prioritet (förbättrar UX)
3. **Tema-anpassning** - Medel prioritet (estetiskt)
4. **Anpassade rapporter** - Medel prioritet (användbart)
5. **E-postrapporter** - Låg prioritet (kräver backend-arbete)

---

## Tekniska Anteckningar

### Backend-ändringar som behövs:
- Ny tabell för `saved_searches`
- Ny tabell för `report_templates`
- Ny tabell för `dashboard_layouts`
- Ny tabell för `custom_themes`
- E-postkonfiguration i `settings`
- SMTP-integration för e-post

### Frontend-ändringar:
- Nya komponenter för varje funktion
- Uppdateringar av befintliga komponenter
- Ny state management för widgets och teman
- Integration med befintlig API

