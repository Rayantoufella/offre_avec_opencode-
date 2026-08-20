# Automatisation des Candidatures

Systeme d'automatisation des candidatures via OpenCode + Browser MCP.

## Premiere utilisation (apres le clone)

Voici exactement ce qu'il faut faire :

### 1. Installer les dependances

```powershell
npm install
```

### 2. Installer l'extension Chrome

1. Ouvrez Chrome
2. Allez sur `chrome://extensions/`
3. Activez **Mode Developpeur** (en haut a droite)
4. Cliquez sur **Charger l'extension non empaquetee**
5. Selectionnez le dossier `extension/mcp-file-upload/`

### 3. Installer Browser MCP

1. Installez l'extension Browser MCP dans Chrome
2. Activez-la
3. Verifiez qu'elle est connectee (icone dans la barre d'outils)

### 4. Connecter Gmail

1. Dans Chrome, allez sur https://mail.google.com
2. Connectez-vous a votre compte Gmail

### 5. Lancer OpenCode

1. Ouvrez OpenCode dans le dossier du projet
2. OpenCode vous saluera et vous demandera ce que vous voulez faire:

```
Bonjour! Je suis votre assistant de recherche d'emploi.

Que souhaitez-vous faire aujourd'hui?

  1. Rechercher de nouvelles offres d'emploi
  2. Envoyer des candidatures depuis un fichier Excel
  3. Configurer le systeme
  4. Verifier que tout fonctionne

Tapez le numero de votre choix.
```

3. Suivez les instructions guidees selon votre choix

**Par defaut, AUCUN email n'est envoye** (mode simulation).

---

## Architecture

```
OpenCode (agent IA)
    |
    +--> lit Excel (scripts/excel/)
    +--> valide CV (scripts/validation/)
    +--> genere emails (scripts/gmail/)
    +--> navigue Gmail via Browser MCP
    +--> attache CV via MCP File Upload Helper
    +--> met a jour Excel
```

**Regle absolue** : On utilise UNIQUEMENT le Chrome existant via Browser MCP.
Jamais de nouveau Chrome, jamais de Playwright pour Gmail.

## Structure du projet

```
/
+-- README.md
+-- package.json
+-- .env.example
+-- .gitignore
+-- opencode.json
+-- docs/
|   +-- USER_GUIDE.md
+-- prompts/
|   +-- 00_greeting.txt      # Guide conversationnel (point d'entree)
|   +-- 01_start.txt ... 20_deep_research.txt
+-- scripts/
|   +-- excel/
|   |   +-- column-detector.js
|   |   +-- analyzer.js
|   |   +-- writer.js
|   +-- gmail/
|   |   +-- email-generator.js
|   |   +-- email-sender.js
|   +-- upload/
|   |   +-- server.js
|   |   +-- client.js
|   |   +-- test-upload.js
|   +-- validation/
|   |   +-- cv-validator.js
|   |   +-- cv-parser.js
|   |   +-- offer-validator.js
|   +-- workflow/
|   |   +-- orchestrator.js
|   |   +-- dry-run.js
|   |   +-- test-one.js
|   +-- deep-research/
|   |   +-- profile-analyzer.js
|   |   +-- research-planner.js
|   |   +-- query-generator.js
|   |   +-- data-processor.js
|   |   +-- deduplicator.js
|   |   +-- matcher.js
|   |   +-- excel-exporter.js
|   |   +-- research-orchestrator.js
|   |   +-- utils.js
|   +-- research/
|   |   +-- browser-research.js
|   |   +-- excel-generator.js
|   |   +-- research-orchestrator.js
|   +-- diagnostic/
|       +-- check-all.js
+-- sites/
|   +-- linkedin.js
|   +-- indeed.js
|   +-- rekrute.js
+-- extension/
|   +-- mcp-file-upload/
|       +-- manifest.json
|       +-- background.js
+-- tests/
|   +-- excel.test.js
|   +-- cv-validator.test.js
|   +-- email-generator.test.js
|   +-- offer-validator.test.js
|   +-- upload.test.js
|   +-- workflow.test.js
|   +-- research-planner.test.js
|   +-- query-generator.test.js
|   +-- deduplicator.test.js
|   +-- matcher.test.js
|   +-- data-processor.test.js
+-- data/
|   +-- cv/
|   |   +-- .gitkeep
|   +-- research/
|       +-- profile.json
|       +-- research_plan.json
|       +-- search_queries.json
|       +-- raw_jobs.json
|       +-- processed_jobs.json
|       +-- deduplicated_jobs.json
|       +-- matched_jobs.json
|       +-- deep_research_results.xlsx
+-- logs/
    +-- .gitkeep
```

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run check` | Diagnostic complet du systeme |
| `npm run analyze-excel` | Analyser le fichier Excel |
| `npm run dry-run` | Simulation (aucun email envoye) |
| `npm run test-one` | Tester une seule candidature |
| `npm start` | Generer les candidatures (JSON) |
| `npm run research` | Lancer la recherche d'offres (Playwright) |
| `npm run deep-research` | Deep Research - analyser profil + planifier |
| `npm run deep-research:process` | Traiter les donnees collectees + generer Excel |
| `npm test` | Lancer les tests |

## Deep Research - Recherche Approfondie

Le module Deep Research est un agent intelligent qui trouve, analyse, verifie et classe les offres d'emploi.

### Fonctionnalites

- **Analyse du profil** : extraction des competences, technologies, experience depuis le CV
- **Plan de recherche** : generation automatique de strategie de recherche
- **Requetes intelligentes** : variations de recherche adaptees au profil
- **Multi-sources** : LinkedIn, Indeed, pages carriere, sites d'emploi
- **Verification** : chaque offre est verifiee comme reelle
- **Deduplication** : detection et suppression des doublons
- **Matching** : score de pertinence 0-100 contre le profil
- **Raisons detaillees** : explications du match ET des competences manquantes
- **Filtrage** : filtrer par score, ville, contrat, technologies
- **Excel** : export formate avec URLs cliquables, dropdowns, couleurs

### Utilisation

#### Via OpenCode (recommande)

Donnez ce prompt :
```
Deep research les offres Backend Laravel au Maroc qui correspondent a mon profil
```

ou :
```
Fais une recherche approfondie sur LinkedIn et les sites d'emploi accessibles et genere-moi un Excel avec les meilleures offres
```

#### Via la ligne de commande

```powershell
# Phase 1 : Analyser le profil + planifier
npm run deep-research -- --cv "data/cv/CV.pdf" --request "Backend Laravel Maroc"

# Phase 2 : Scraping via OpenCode + Browser MCP (manuel)
# ... OpenCode cherche les offres ...

# Phase 3 : Traiter + generer Excel
npm run deep-research:process

# Avec filtres
npm run deep-research:process -- --min-score 65 --location Casablanca
npm run deep-research:process -- --contract CDI --tech PHP,Laravel
```

### Architecture

```
scripts/deep-research/
+-- profile-analyzer.js      # Analyse du profil candidat
+-- research-planner.js      # Strategie de recherche
+-- query-generator.js       # Generation de requetes
+-- data-processor.js        # Traitement des donnees brutes
+-- deduplicator.js          # Detection des doublons
+-- matcher.js               # Score de pertinence + raisons
+-- excel-exporter.js        # Export Excel avec hyperlinks + dropdowns
+-- research-orchestrator.js # Orchestrateur principal
+-- utils.js                 # Utilitaires partages
```

### Flux de travail

```
Phase 1 (Automatique):
  [1/3] Analyse du profil CV        -> profile-analyzer.js
  [2/3] Strategie de recherche      -> research-planner.js
  [3/3] Requetes generees           -> query-generator.js

Phase 2 (Manuelle — OpenCode + Browser MCP):
  [ ] LinkedIn recherche
  [ ] Indeed recherche
  [ ] Pages carriere
  [ ] Verification des URLs
  [ ] Sauvegarde dans raw_jobs.json

Phase 3 (Automatique):
  [1/4] Traitement des donnees      -> data-processor.js
  [2/4] Deduplication               -> deduplicator.js
  [3/4] Matching et classement      -> matcher.js
  [4/4] Export Excel                -> excel-exporter.js
```

### Options de filtrage (Phase 3)

```powershell
--min-score 65      Score minimum (0-100)
--location Casablanca  Filtrer par ville
--contract CDI      Filtrer par type de contrat
--tech PHP,Laravel  Filtrer par technologies
```

### Excel de sortie

Colonnes : Entreprise, Poste, Localisation, Type contrat, Mode travail, Technologies, Experience, Email candidature, URL offre (cliquable), URL candidature, Source, Match Score, Niveau pertinence, Raisons du match, Competences manquantes, Commentaires, Statut candidature (dropdown)

### Limites

- LinkedIn necessite d'etre connecte dans Chrome
- Les pages carriere dependent du site cible
- Le scoring est base sur les mots-cles du CV
- Les emails ne sont jamais inventes

## Securite

- **DRY_RUN=true** par defaut : aucun email n'est envoye
- Le CV n'est jamais envoye sans verification
- Aucun email n'est envoye sans confirmation explicite
- Le fichier `.env` est ignore par git

## Erreurs frequentes

### "Extension non connectee"
Reinstallez l'extension via `chrome://extensions/` et rechargez la page.

### "Gmail non connecte"
Connectez-vous a Gmail dans le Chrome controle par Browser MCP.

### "CV introuvable"
Placez votre CV dans `data/cv/` et verifiez le nom dans `.env`.

### "raw_jobs.json introuvable"
1. Lancez d'abord : `npm run deep-research -- --cv "..." --request "..."`
2. Scraping via OpenCode + Browser MCP
3. Puis : `npm run deep-research:process`

## License

MIT
