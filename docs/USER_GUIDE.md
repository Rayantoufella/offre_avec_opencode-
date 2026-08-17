# Guide Utilisateur - Automatisation des Candidatures

Ce guide est ecrit pour quelqu'un qui ne connait pas la programmation.
Suivez chaque etape dans l'ordre.

---

## ETAPE 1 - Verifier que Node.js est installe

### Ce que vous faites
Ouvrez PowerShell (l'application noire sur votre ordinateur).

### Commande exacte a taper
```powershell
node --version
```

### Ce que vous devez voir
Un message comme : `v24.18.0` ou `v20.11.0`

### Si vous voyez une erreur
"node : terme non reconnu" ou "command not found"
- Allez sur https://nodejs.org
- Cliquez sur "LTS" (recommande)
- Installez en cliquant "Suivant" a chaque etape
- Redemarrez PowerShell
- Reessayez `node --version`

---

## ETAPE 2 - Installer les dependances

### Ce que vous faites
Vous etes toujours dans le dossier du projet dans PowerShell.

### Commande exacte a taper
```powershell
npm install
```

### Ce que vous devez voir
Un message indiquant que les packages sont installes.
Ca peut prendre 1-2 minutes.

### En cas d'erreur
Reessayez une fois. Si ca ne marche toujours pas, verifiez votre connexion internet.

---

## ETAPE 3 - Configurer le fichier .env

### Ce que vous faites
Vous allez creer un fichier de configuration avec vos chemins.

### Commande exacte a taper
```powershell
copy .env.example .env
notepad .env
```

### Ce que vous devez faire
Le bloc-notes s'ouvre. Remplissez les lignes :

```
CV_PATH=data/cv/mon_cv.pdf
EXCEL_PATH=data/offres.xlsx
```

Remplacez :
- `mon_cv.pdf` par le nom reel de votre CV
- `offres.xlsx` par le nom reel de votre fichier Excel

Sauvegardez (Ctrl+S) et fermez le bloc-notes.

---

## ETAPE 4 - Placer votre CV

### Ce que vous faites
Copiez votre CV PDF dans le dossier `data/cv/`.

### Comment faire
1. Ouvrez l'explorateur de fichiers
2. Allez dans le dossier du projet
3. Ouvrez le dossier `data/cv/`
4. Copiez-collez votre CV PDF ici
5. Verifiez que le fichier est bien un PDF

### Important
- Le fichier doit etre au format PDF
- Le nom du fichier doit correspondre a ce que vous avez mis dans `.env`
- Ne mettez pas d'espace dans le nom du fichier si possible

---

## ETAPE 5 - Placer votre Excel

### Ce que vous faites
Copiez votre fichier Excel dans le dossier `data/`.

### Comment faire
1. Copiez votre fichier Excel
2. Collez-le dans le dossier `data/` du projet
3. Verifiez que le nom correspond a ce que vous avez mis dans `.env`

### Important
- Le fichier peut etre `.xlsx` ou `.xls`
- Les colonnes seront detectees automatiquement
- Le systeme comprend les noms de colonnes francais et anglais

---

## ETAPE 6 - Installer l'extension Chrome

### Ce que vous faites
Vous allez charger l'extension Chrome dans votre navigateur.

### Comment faire
1. Ouvrez Google Chrome
2. Dans la barre d'adresse, tapez : `chrome://extensions/`
3. En haut a droite, activez "Mode Developpeur"
4. Cliquez sur "Charger l'extension non emballee"
5. Naviguez jusqu'au dossier `extension/mcp-file-upload/` du projet
6. Selectionnez ce dossier
7. L'extension apparait dans la liste

### Ce que vous devez voir
L'extension "MCP File Upload Helper" apparait activee.

---

## ETAPE 7 - Connecter Browser MCP

### Ce que vous faites
Assurez-vous que Browser MCP est connecte a Chrome.

### Comment faire
1. Verifiez que l'extension Browser MCP est installee dans Chrome
2. Verifiez qu'elle est activee
3. Verifiez qu'elle a les permissions necessaires

### Si Browser MCP n'est pas installe
Consultez la documentation de Browser MCP pour l'installer.

---

## ETAPE 8 - Connecter Gmail

### Ce que vous faites
Ouvrez Gmail dans Chrome et connectez-vous.

### Comment faire
1. Dans Chrome, allez sur https://mail.google.com
2. Connectez-vous a votre compte Gmail
3. Verifiez que vous voyez votre boite de reception

### Important
- Gmail doit etre ouvert dans le Chrome controle par Browser MCP
- NE PAS ouvrir Gmail dans un autre navigateur
- NE PAS ouvrir un autre Chrome

---

## ETAPE 9 - Verifier le systeme

### Ce que vous faites
Lancez la verification complete.

### Commande exacte a taper
```powershell
npm run check
```

### Ce que vous devez voir
Un rapport avec des [OK] pour chaque element.

Si vous voyez des [ECHEC], corrigez le probleme indique avant de continuer.

---

## ETAPE 10 - Analyser l'Excel

### Ce que vous faites
L'analyse du fichier Excel.

### Commande exacte a taper
```powershell
npm run analyze-excel
```

### Ce que vous devez voir
Un rapport indiquant :
- Le nombre total d'offres
- Les offres valides
- Les problemes detectes

---

## ETAPE 11 - Test d'une seule candidature

### Ce que vous faites
Testez avec une seule offre.

### Commande exacte a taper
```powershell
npm run test-one
```

### Ce que vous devez voir
L'email est prepare dans Gmail. Vous pouvez le verifier.
AUCUN email n'est envoye.

---

## ETAPE 12 - Lancement en mode simulation

### Ce que vous faites
Lancez le traitement en mode simulation.

### Commande exacte a taper
```powershell
npm run dry-run
```

### Ce que vous devez voir
Le systeme analyse les offres et prepare les emails.
AUCUN email n'est envoye.

---

## ETAPE 13 - Utiliser OpenCode pour envoyer les candidatures

### Ce que vous faites
Vous allez utiliser OpenCode (l'assistant IA) pour envoyer les emails via Browser MCP.

### Comment faire

1. Ouvrez OpenCode dans le dossier du projet :
```powershell
opencode
```

2. Donnez ce prompt a OpenCode :
```
Analyse le fichier Excel et prepare les candidatures
```
OpenCode va lancer `node scripts/workflow/orchestrator.js` qui analyse l'Excel et genere le fichier `data/emails/emails-prepared.json`.

3. Quand c'est pret, donnez ce prompt :
```
Lance la campagne de candidatures avec le fichier data/emails/emails-prepared.json
```

4. OpenCode va :
   - Lire le fichier JSON
   - Pour chaque offre, ouvrir Gmail via Browser MCP
   - Remplir destinataire, objet, corps
   - Attacher le CV
   - Verifier la piece jointe
   - Si DRY_RUN=true : ne pas envoyer (simulation)
   - Si DRY_RUN=false : envoyer l'email

### Prompts disponibles dans le dossier prompts/

| Prompt | Utilite |
|--------|---------|
| 01_start.txt | Demander les fichiers Excel et CV |
| 02_check_mcp.txt | Verifier que Browser MCP marche |
| 03_check_chrome.txt | Verifier que Chrome repond |
| 04_check_gmail.txt | Verifier que Gmail est connecte |
| 05_check_upload.txt | Verifier le serveur upload |
| 06_analyze_excel.txt | Analyser le fichier Excel |
| 07_test_cv.txt | Verifier que le CV est valide |
| 08_test_one_application.txt | Tester une seule candidature |
| 09_final_check.txt | Verification finale |
| 10_start_campaign.txt | Lancer la campagne |

### Important
- Par defaut, AUCUN email n'est envoye (DRY_RUN=true)
- Pour l'envoi reel, changez DRY_RUN=false dans .env
- Verifiez toujours les emails dans Gmail avant l'envoi

---

## ETAPE 14 - Lancement reel (sans OpenCode)

### Ce que vous faites
Pour envoyer sans OpenCode, changez le mode et lancez directement.

### Comment faire
1. Ouvrez le fichier `.env`
2. Changez `DRY_RUN=true` en `DRY_RUN=false`
3. Sauvegardez
4. Lancez :
```powershell
npm start
```

### Attention
- Assurez-vous que tout est correct avant
- Verifiez les emails dans Gmail avant l'envoi
- Le systeme envoie un par un

---

## Problemes frequents

### "Node.js non installe"
Allez sur https://nodejs.org et installez-le.

### "CV introuvable"
Copiez votre CV dans `data/cv/` et verifiez le nom dans `.env`.

### "Extension non connectee"
Reinstallez l'extension via `chrome://extensions/`.

### "Gmail non connecte"
Connectez-vous a Gmail dans Chrome.

### "Serveur upload non demarre"
Le serveur demarre automatiquement. Si ca ne marche pas, redemarrez.

### L'Excel n'est pas detecte
Verifiez le chemin dans `.env`. Le fichier doit etre dans `data/`.

---

## Securite

- Par defaut, AUCUN email n'est envoye (DRY_RUN=true)
- Vos donnees restent sur votre ordinateur
- Aucun mot de passe n'est stocke
- Le CV n'est jamais envoye sans votre accord
