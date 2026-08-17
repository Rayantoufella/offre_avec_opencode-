import { analyzeExcel, printReport } from '../excel/analyzer.js';
import { writeExcelStatus, prepareWriteData } from '../excel/writer.js';
import { validateCV } from '../validation/cv-validator.js';
import { generateEmail } from '../gmail/email-generator.js';
import { checkStatus } from '../upload/client.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

let uploadServerProcess = null;
let sigintRegistered = false;

async function startUploadServer() {
  const status = await checkStatus().catch(() => null);
  if (status && status.running) {
    console.log('  Serveur upload deja en marche (port ' + (process.env.UPLOAD_SERVER_PORT || 9011) + ')');
    uploadServerProcess = null;
    return;
  }
  console.log('Demarrage du serveur upload...');
  return new Promise((resolve, reject) => {
    let resolved = false;
    uploadServerProcess = spawn('node', [path.join(__dirname, '../upload/server.js')], {
      stdio: 'pipe',
      env: process.env
    });

    uploadServerProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('  [serveur] ' + msg.trim());
      if (!resolved && (msg.includes('Serveur HTTP demarre') || msg.includes('Serveur WebSocket demarre'))) {
        resolved = true;
        setTimeout(resolve, 1000);
      }
    });

    uploadServerProcess.stderr.on('data', (data) => {
      console.error('  [serveur] ' + data.toString().trim());
    });

    uploadServerProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Timeout demarrage serveur upload'));
      }
    }, 5000);
  });
}

function stopUploadServer() {
  if (uploadServerProcess) {
    uploadServerProcess.kill();
    uploadServerProcess = null;
    console.log('Serveur upload arrete');
  }
}

function writeEmailsFile(emails, excelFile) {
  const projectRoot = path.join(__dirname, '..', '..');
  const dataDir = path.join(projectRoot, 'data', 'emails');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'emails-prepared.json');
  const output = emails.map(e => ({
    row: e.row,
    entreprise: e.data.ENTREPRISE || e.entreprise || '',
    poste: e.data.POSTE || e.poste || '',
    email: e.email.to,
    subject: e.email.subject,
    body: e.email.body,
    type: e.email.type
  }));

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`   Fichier ecrit: ${outputPath}`);
  return outputPath;
}

async function runWorkflow(options = {}) {
  const { dryRun = true, testOne = false, excelPath, cvPath } = options;

  console.log('========================================');
  console.log('  AUTOMATISATION DES CANDIDATURES');
  console.log(`  Mode: ${dryRun ? 'DRY RUN (simulation)' : 'ENVOI REEL'}`);
  console.log('========================================\n');

  if (!sigintRegistered) {
    sigintRegistered = true;
    process.on('SIGINT', () => {
      console.log('\nInterruption detectee. Arret...');
      stopUploadServer();
      process.exit(0);
    });
  }

  try {
    console.log('1. Verification du CV...');
    const cvValidation = validateCV(cvPath || process.env.CV_PATH);
    if (!cvValidation.valid) {
      console.error(`   ARRET: ${cvValidation.reason}`);
      console.error('   Placez votre CV dans data/cv/ et configurez CV_PATH dans .env');
      return { success: false, error: 'CV invalide' };
    }
    console.log(`   OK: ${cvValidation.path}\n`);

    console.log('2. Analyse du fichier Excel...');
    const excelFile = excelPath || process.env.EXCEL_PATH;
    if (!excelFile) {
      console.error('   ARRET: EXCEL_PATH non defini');
      return { success: false, error: 'Excel non configure' };
    }
    const analysis = analyzeExcel(excelFile);
    printReport(analysis);
    console.log('');

    console.log('3. Demarrage du serveur upload...');
    await startUploadServer();
    console.log('');

    console.log('4. Verification du serveur upload...');
    const status = await checkStatus();
    if (!status.running) {
      console.error('   ECHEC: Serveur upload non demarre');
      return { success: false, error: 'Serveur upload inaccessible' };
    }
    console.log(`   Serveur: OK (extensions: ${status.extensions})\n`);

    console.log('5. Preparation des emails...');
    const validOffers = analysis.results.filter(r => r.status === 'VALID');
    const emails = validOffers.map(offer => ({
      ...offer,
      email: generateEmail(offer.data)
    }));

    console.log(`   ${emails.length} email(s) prepares\n`);

    console.log('6. Ecriture du fichier de candidatures...');
    const jsonPath = writeEmailsFile(emails, excelFile);
    console.log('');

    const report = {
      total: analysis.summary.total,
      valid: analysis.summary.valid,
      incomplete: analysis.summary.incomplete,
      skip: analysis.summary.skip,
      duplicate: analysis.summary.duplicate,
      emailsPrepared: emails.length,
      jsonFile: jsonPath,
      dryRun,
      timestamp: new Date().toISOString()
    };

    console.log('7. Rapport final...');
    console.log(JSON.stringify(report, null, 2));

    console.log('\n========================================');
    console.log('  PREPARATION TERMINEE');
    console.log('========================================');
    console.log('\nPour envoyer les candidatures, donnez ce prompt a OpenCode :');
    console.log('  "Lance la campagne de candidatures avec le fichier ' + jsonPath + '"');
    console.log('');

    return { success: true, report };
  } finally {
    stopUploadServer();
  }
}

if (process.argv[1] && process.argv[1].endsWith('orchestrator.js')) {
  const dryRun = process.env.DRY_RUN !== 'false';
  runWorkflow({ dryRun }).catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
}

export { runWorkflow, startUploadServer, stopUploadServer };
