# Automatisation des Candidatures

Systeme d'automatisation des candidatures via OpenCode + Browser MCP.

## Premiere utilisation (apres le clone)

Voici exactement ce qu'il faut faire, etape par etape :

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
6. L'extension "MCP File Upload Helper" apparait dans la liste

### 3. Installer Browser MCP

1. Installez l'extension Browser MCP dans Chrome
2. Activez-la
3. Verifiez qu'elle est connectee (icone dans la barre d'outils)

### 4. Connecter Gmail

1. Dans Chrome, allez sur https://mail.google.com
2. Connectez-vous a votre compte Gmail
3. Verifiez que vous voyez votre boite de reception

### 5. Placer votre CV

1. Copiez votre CV PDF dans le dossier `data/cv/`
2. Le nom du fichier ne doit pas contenir d'espace

### 6. Placer votre Excel

1. Copiez votre fichier Excel dans le dossier `data/`
2. Le fichier doit contenir au minimum une colonne "Email" et une colonne "Entreprise"

### 7. Configurer le fichier .env

```powershell
copy .env.example .env
notepad .env
```

Remplissez les lignes :
```
CV_PATH=data/cv/votre_cv.pdf
EXCEL_PATH=data/votre_fichier.xlsx
DRY_RUN=true
```

### 8. Verifier que tout marche

```powershell
npm run check
```

Vous devez voir [OK] partout.

### 9. Generer les candidatures

```powershell
npm start
```

Le fichier `data/emails/emails-prepared.json` est cree.

### 10. Envoyer via OpenCode

1. Ouvrez OpenCode dans le dossier du projet
2. Donnez ce prompt :
   ```
   Lance la campagne de candidatures avec le fichier data/emails/emails-prepared.json
   ```
3. OpenCode va ouvrir Gmail, remplir les emails, attacher le CV

**Par defaut, AUCUN email n'est envoye** (mode simulation). Pour envoyer vraiment, changez `DRY_RUN=false` dans `.env`.

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

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run check` | Diagnostic complet du systeme |
| `npm run analyze-excel` | Analyser le fichier Excel |
| `npm run dry-run` | Simulation (aucun email envoye) |
| `npm run test-one` | Tester une seule candidature |
| `npm start` | Generer les candidatures (JSON) |
| `npm test` | Lancer les tests |

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
