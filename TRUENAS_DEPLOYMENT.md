# Distribuera WestBudget med Dockage på TrueNAS

Absolut! Dockage (eller Portainer) gör det mycket smidigare eftersom du kan använda en "Stack" fil (`docker-compose.yml`) istället för att klicka i massa menyer.

## Steg 1: GitHub & Docker Hub (Samma som förut)

Wait for the GitHub Action to build the image (e.g., `800121/westbudget:latest`).
Se till att du har gjort **Steg 1** i den förra guiden (skaffat Docker Token och lagt in på GitHub).

## Steg 2: Installera i Dockage

1.  Öppna **Dockage**.
2.  Klicka på **+ Compose** (eller "Add Stack").
3.  Ge stacken namnet `westbudget`.
4.  I den stora textrutan, klistra in innehållet från filen `docker-compose.yml` som jag skapat i din mapp.

    **VIKTIGT - Ändra följande i texten du klistrar in:**
    *   `image`: Ändra `ditt_anvandarnamn` till `800121` (eller ditt Docker Hub-namn om du har ett annat).
    *   `environment`: Fyll i dina riktiga nycklar istället för `din_url`, `din_nyckel` osv. (Du hittar dem i din `.env` fil på datorn).
    *   `volumes`: Ändra `/mnt/pool/data/...` till en mapp som faktiskt finns på din NAS där du vill spara kvitton.

5.  Klicka på **Deploy**.

## Uppdatera senare

När du har pushat ny kod till GitHub och den har byggt klart:
1.  Gå in i Dockage på din NAS.
2.  Gå till `westbudget` stacken.
3.  Klicka på **Update** (eller "Pull & Redeploy").
