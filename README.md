# Automatisation des Candidatures

Systeme d'automatisation des candidatures via OpenCode + Browser MCP.

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

## Prérequis

- Node.js v18+ installe
- npm installe
- Chrome avec Browser MCP connecte
- Extension Chrome MCP File Upload Helper installee
- Fichier Excel avec les offres
- CV au format PDF

## Installation

### 1. Installer Node.js

```powershell
# Verifier si Node.js est installe
node --version

# Si non installe, telechargez sur https://nodejs.org
```

### 2. Installer les dependances

```powershell
npm install
```

### 3. Configurer l'environnement

```powershell
# Copier le fichier de configuration
copy .env.example .env

# Modifier le fichier .env avec vos chemins
notepad .env
```

Remplissez :
- `CV_PATH` : chemin vers votre CV PDF
- `EXCEL_PATH` : chemin vers votre fichier Excel

### 4. Installer l'extension Chrome

1. Ouvrez `chrome://extensions/`
2. Activez "Mode Developpeur"
3. Cliquez sur "Charger l'extension non emballee"
4. Selectionnez le dossier `extension/mcp-file-upload/`

### 5. Connecter Browser MCP

Assurez-vous que Browser MCP est connecte a Chrome.

## Utilisation

### Diagnostic complet

```powershell
npm run check
```

### Analyser l'Excel

```powershell
npm run analyze-excel
```

### Dry run (simulation)

```powershell
npm run dry-run
```

### Tester une seule candidature

```powershell
npm run test-one
```

### Lancer la campagne

```powershell
npm start
```

### Utiliser OpenCode

1. Ouvrez OpenCode dans le dossier du projet
2. Donnez ce prompt :
   ```
   Lance la campagne de candidatures avec le fichier data/emails/emails-prepared.json
   ```
3. OpenCode va :
   - Lire le fichier JSON généré par l'orchestrateur
   - Pour chaque offre, ouvrir Gmail via Browser MCP
   - Remplir destinataire, objet, corps
   - Attacher le CV
   - Si DRY_RUN=true : ne pas envoyer (simulation)
   - Si DRY_RUN=false : envoyer l'email

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
|   +-- diagnostic/
|       +-- check-all.js
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

## Securite

- **DRY_RUN=true** par defaut : aucun email n'est envoye
- Le CV n'est jamais envoye sans verification
- Aucun email n'est envoye sans confirmation explicite
- Les tokens et mots de passe ne sont jamais logges
- Le fichier `.env` est ignore par git

## Erreurs frequentes

### "Node.js non installe"
Installez Node.js depuis https://nodejs.org

### "CV introuvable"
Placez votre CV dans `data/cv/` et configurez `CV_PATH` dans `.env`

### "Extension non connectee"
Installez l'extension via `chrome://extensions/` et rechargez la page

### "Gmail non connecte"
Connectez-vous a Gmail dans le Chrome controle par Browser MCP

## Tests

```powershell
npm test
```

## License

MIT
