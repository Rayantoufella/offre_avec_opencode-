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
2. Donnez ce prompt :
   ```
   Je veux automatiser mes candidatures. Voici mon fichier Excel : C:\Users\...\offres.xlsx et mon CV : C:\Users\...\Cv.pdf
   ```
3. OpenCode va :
   - Creer automatiquement le fichier `.env`
   - Verifier le CV
   - Analyser l'Excel
   - Generer les candidatures
   - Vous demander pour envoyer

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
|   +-- 01_start.txt ... 10_start_campaign.txt
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
|   |   +-- offer-validator.js
|   +-- workflow/
|   |   +-- orchestrator.js
|   |   +-- dry-run.js
|   |   +-- test-one.js
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
|   +-- test-upload.html
|   +-- excel.test.js
|   +-- cv-validator.test.js
|   +-- email-generator.test.js
|   +-- offer-validator.test.js
|   +-- upload.test.js
|   +-- workflow.test.js
+-- data/
|   +-- cv/
|       +-- .gitkeep
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
| `npm run research` | Lancer la recherche d'offres |
| `npm test` | Lancer les tests |

## Recherche d'offres

Le module de recherche permet de :

1. **Scraper LinkedIn** : rechercher des offres, scroller, extraire les informations
2. **Chercher dans les groupes LinkedIn** : trouver des opportunitÃ©s dans des groupes spÃ©cialisÃ©s
3. **GÃ©nÃ©rer un fichier Excel** : avec toutes les offres trouvÃ©es

### Via OpenCode

Donnez ce prompt :
```
Recherche des offres de DÃ©veloppeur Backend PHP sur LinkedIn au Maroc, gÃ©nÃ¨re un fichier Excel
```

### Via la ligne de commande

```powershell
npm run research
```

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

## License

MIT

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
- **Classement** : tri par pertinence avec explications
- **Excel** : export formate avec toutes les informations

### Utilisation

#### Via OpenCode (recommande)

Donnez ce prompt :
`
Deep research les offres Backend Laravel au Maroc qui correspondent a mon profil
`

ou :

`
Fais une recherche approfondie sur LinkedIn et les sites d'emploi accessibles et genere-moi un Excel avec les meilleures offres
`

#### Via la ligne de commande

`powershell
# Lancer la recherche
npm run deep-research

# Traiter les donnees collectees
npm run deep-research:process
`

### Architecture

`
scripts/deep-research/
├── profile-analyzer.js      # Analyse du profil candidat
├── research-planner.js      # Strategie de recherche
├── query-generator.js       # Generation de requetes
├── data-processor.js        # Traitement des donnees brutes
├── deduplicator.js          # Detection des doublons
├── matcher.js               # Score de pertinence
├── excel-exporter.js        # Export Excel
├── research-orchestrator.js # Orchestrateur principal
└── utils.js                 # Utilitaires partages
`

### Flux de travail

`
[1/10] Profil analyse        → profile-analyzer.js
[2/10] Strategie creee        → research-planner.js
[3/10] Requetes generees      → query-generator.js
[4/10] LinkedIn recherche     → OpenCode + Browser MCP
[5/10] Indeed recherche       → OpenCode + Browser MCP
[6/10] Pages carriere         → OpenCode + Browser MCP
[7/10] Offres verifiees       → data-processor.js
[8/10] Doublons supprimes     → deduplicator.js
[9/10] Matching effectue      → matcher.js
[10/10] Excel genere          → excel-exporter.js
`

### Excel de sortie

Colonnes : Entreprise, Poste, Localisation, Type contrat, Mode travail, Technologies, Experience, Email candidature, URL offre, Source, Match Score, Niveau pertinence, Raisons du match, Statut candidature

### Limites

- LinkedIn necessite d'etre connecte dans Chrome
- Les pages carriere dependent du site cible
- Le scoring est base sur les mots-cles du CV
- Les emails ne sont jamais inventes
