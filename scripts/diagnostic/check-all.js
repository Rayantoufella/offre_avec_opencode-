import { validateCV } from '../validation/cv-validator.js';
import { checkStatus } from '../upload/client.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function checkNode() {
  const result = { name: 'Node.js', ok: false, detail: '' };
  try {
    const { execSync } = await import('child_process');
    result.detail = execSync('node --version', { encoding: 'utf-8' }).trim();
    result.ok = true;
  } catch {
    result.detail = 'Node.js non installe';
  }
  return result;
}

async function checkNpm() {
  const result = { name: 'npm', ok: false, detail: '' };
  try {
    const { execSync } = await import('child_process');
    result.detail = execSync('npm --version', { encoding: 'utf-8' }).trim();
    result.ok = true;
  } catch {
    result.detail = 'npm non installe';
  }
  return result;
}

async function checkDependencies() {
  const result = { name: 'Dependances npm', ok: false, detail: '' };
  if (!fs.existsSync('node_modules')) {
    result.detail = 'node_modules/ introuvable. Lancez: npm install';
    return result;
  }

  const deps = ['dotenv', 'exceljs', 'ws', 'xlsx', 'pino'];
  const missing = deps.filter(d => !fs.existsSync(`node_modules/${d}`));

  if (missing.length > 0) {
    result.detail = `Manquantes: ${missing.join(', ')}. Lancez: npm install`;
    return result;
  }

  result.ok = true;
  result.detail = `${deps.length} dependances installees`;
  return result;
}

async function checkCV() {
  const result = { name: 'CV', ok: false, detail: '' };
  const cvPath = process.env.CV_PATH;

  if (!cvPath) {
    result.detail = 'CV_PATH non defini dans .env';
    return result;
  }

  const validation = validateCV(cvPath);
  if (validation.valid) {
    result.ok = true;
    result.detail = `${cvPath} (${(validation.size / 1024).toFixed(1)} Ko)`;
  } else {
    result.detail = validation.reason;
  }
  return result;
}

async function checkExcel() {
  const result = { name: 'Excel', ok: false, detail: '' };
  const excelPath = process.env.EXCEL_PATH;

  if (!excelPath) {
    result.detail = 'EXCEL_PATH non defini dans .env';
    return result;
  }

  if (!fs.existsSync(excelPath)) {
    result.detail = `Fichier introuvable: ${excelPath}`;
    return result;
  }

  result.ok = true;
  result.detail = excelPath;
  return result;
}

async function checkEnvFile() {
  const result = { name: 'Fichier .env', ok: false, detail: '' };
  if (!fs.existsSync('.env')) {
    result.detail = 'Fichier .env introuvable. Copiez .env.example en .env';
    return result;
  }

  const content = fs.readFileSync('.env', 'utf-8');
  const hasCvPath = content.includes('CV_PATH=') && !content.includes('CV_PATH=\n');
  const hasExcelPath = content.includes('EXCEL_PATH=') && !content.includes('EXCEL_PATH=\n');

  if (!hasCvPath || !hasExcelPath) {
    result.detail = 'CV_PATH ou EXCEL_PATH non rempli dans .env';
    return result;
  }

  result.ok = true;
  result.detail = 'Configure';
  return result;
}

async function checkUploadServer() {
  const result = { name: 'Serveur upload', ok: false, detail: '' };

  try {
    const status = await checkStatus();
    if (status.running) {
      result.ok = true;
      result.detail = `En marche (extensions: ${status.extensions})`;
    } else {
      result.detail = 'Non demarre. Lancez: npm run upload-server';
    }
  } catch {
    result.detail = 'Non demarre. Lancez: npm run upload-server';
  }
  return result;
}

async function checkExtension() {
  const result = { name: 'Extension Chrome', ok: false, detail: '' };

  try {
    const status = await checkStatus();
    if (status.extensionConnected) {
      result.ok = true;
      result.detail = `${status.extensions} extension(s) connectee(s)`;
    } else {
      result.detail = 'Non connectee. Installez l\'extension dans chrome://extensions/';
    }
  } catch {
    result.detail = 'Serveur upload non accessible';
  }
  return result;
}

async function runChecks() {
  console.log('========== DIAGNOSTIC DU SYSTEME ==========\n');

  const checks = [
    await checkNode(),
    await checkNpm(),
    await checkDependencies(),
    await checkEnvFile(),
    await checkCV(),
    await checkExcel(),
    await checkUploadServer(),
    await checkExtension()
  ];

  let allOk = true;

  for (const check of checks) {
    const status = check.ok ? 'OK' : 'ECHEC';
    const icon = check.ok ? '+' : '!';
    console.log(`  [${icon}] ${check.name}: ${status}`);
    console.log(`      ${check.detail}`);
    if (!check.ok) allOk = false;
  }

  console.log('\n========================================');

  if (allOk) {
    console.log('  TOUS LES TESTS SONT OK');
  } else {
    console.log('  DES PROBLEMES ONT ETE DETECTES');
    console.log('  Corrigez les elements marques ECHEC');
  }

  console.log('========================================\n');
  return allOk;
}

if (process.argv[1] && process.argv[1].endsWith('check-all.js')) {
  runChecks().then(ok => {
    process.exit(ok ? 0 : 1);
  });
}

export { runChecks };
