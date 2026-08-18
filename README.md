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
2. **Chercher dans les groupes LinkedIn** : trouver des opportunités dans des groupes spécialisés
3. **Générer un fichier Excel** : avec toutes les offres trouvées

### Via OpenCode

Donnez ce prompt :
```
Recherche des offres de Développeur Backend PHP sur LinkedIn au Maroc, génère un fichier Excel
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
