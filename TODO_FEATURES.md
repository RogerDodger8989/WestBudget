# TODO: Nya Funktioner för WestBudget

## 1. Avancerad sökning & filter
**Status:** ✅ Implementerad

### Funktioner:
- ✅ Avancerad sökning med flera kriterier samtidigt
- ✅ Kombinera filter (datum, belopp, kategori, status, fritext)
- ✅ Spara sökningar som favoriter
- ✅ Sök i alla fält (titel, beskrivning, noteringar, referens)
- ✅ Datumintervall-sökning
- ✅ Beloppsintervall-sökning
- ✅ Multi-select för kategorier
- ✅ Multi-select för status ✅ (nyss implementerad)

### Implementation:
- [x] Skapa `AdvancedSearchModal` komponent
- [x] Lägg till filter-logik i `TransactionsTab`
- [x] Lägg till filter-logik i `AgreementsTab` ✅ (nyss implementerad)
- [x] Implementera sparade sökningar
- [x] Uppdatera API för avancerad sökning (backend)

---

## 2. Anpassade rapporter
**Status:** ✅ Implementerad

### Funktioner:
- ✅ Skapa egna rapportmallar
- ✅ Välj kategorier att inkludera
- ✅ Välj datumintervall
- ✅ Välj visualiseringar (diagram, tabeller, KPI-kort)
- ✅ Spara och återanvänd mallar
- ✅ Exportera anpassade rapporter till PDF/CSV ✅ (nyss implementerad)

### Implementation:
- [x] Skapa `CustomReportBuilder` komponent ✅
- [x] Implementera rapportmall-system i databasen ✅
- [x] Bygg rapport-generator med valbara komponenter ✅
- [x] Lägg till spara/ladda rapportmallar ✅
- [x] Integrera med befintlig rapport-funktionalitet ✅

---

## 4. Dashboard widgets
**Status:** ✅ Implementerad

### Funktioner:
- ✅ Anpassningsbar dashboard med dra-och-släpp (enkel implementation)
- ✅ Olika widget-typer:
  - ✅ KPI-kort (Inkomst, Utgifter, Netto)
  - ✅ Diagram (linje, stapel, cirkel) - recharts implementerad ✅
  - ✅ Transaktionslista
  - ✅ Kategorifördelning
  - ✅ Sparande-progress ✅ (nyss implementerad)
  - ✅ Lån-översikt ✅ (nyss implementerad)
- ✅ Spara dashboard-layout
- ✅ Återställ till standardlayout (via edit mode)

### Implementation:
- [x] Implementera drag-and-drop (enkel implementation utan externa bibliotek)
- [x] Skapa widget-komponenter (KPIWidget, ChartWidget, TransactionListWidget, CategoryDistributionWidget)
- [x] Bygg widget-configurator (WidgetConfigModal)
- [x] Spara widget-layout i databasen
- [x] Uppdatera `OverviewTab` med widget-system
- [x] Lägg till widget-inställningar (färger, titel, konfiguration)
- [x] Integrera riktiga diagram-bibliotek (recharts) ✅ (nyss implementerad)

---

## 5. Tema-anpassning
**Status:** ✅ Implementerad

### Funktioner:
- ✅ Fler fördefinierade färgteman:
  - ✅ Indigo (nuvarande)
  - ✅ Blå
  - ✅ Grön
  - ✅ Lila
  - ✅ Röd
  - ✅ Amber
- ✅ Anpassa primärfärg
- ✅ Anpassa sekundärfärg
- ✅ Anpassa accentfärg
- ✅ Förhandsgranska tema
- ✅ Spara anpassade teman

### Implementation:
- [x] Skapa tema-system i CSS/Tailwind ✅
- [x] Implementera färgväljare (color picker) ✅
- [x] Lägg till tema-inställningar i `SettingsTab` ✅
- [x] Spara teman i databasen ✅
- [x] Uppdatera alla komponenter för att använda tema-färger ✅
- [x] Lägg till förhandsgranskning av tema ✅

---

## Prioritering

1. **Avancerad sökning & filter** - Hög prioritet (används ofta) ✅
2. **Dashboard widgets** - Hög prioritet (förbättrar UX) ✅
3. **Tema-anpassning** - Medel prioritet (estetiskt) ✅
4. **Anpassade rapporter** - Medel prioritet (användbart) ✅

---

## Tekniska Anteckningar

### Backend-ändringar som behövs:
- ✅ Ny tabell för `saved_searches` - Implementerad
- ✅ Ny tabell för `report_templates` - Implementerad
- ✅ Ny tabell för `dashboard_layouts` - Implementerad
- ✅ Ny tabell för `custom_themes` - Implementerad

### Frontend-ändringar:
- Nya komponenter för varje funktion
- Uppdateringar av befintliga komponenter
- Ny state management för widgets och teman
- Integration med befintlig API

