import fs from 'fs';
import path from 'path';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

export function validateCV(cvPath) {
  const result = {
    valid: false,
    path: cvPath,
    size: null,
    reason: null,
    extension: null,
    readable: false
  };

  if (!cvPath) {
    result.reason = 'Chemin du CV non fourni';
    log.warn(result.reason);
    return result;
  }

  result.extension = path.extname(cvPath).toLowerCase();

  if (result.extension !== '.pdf') {
    result.reason = `Extension invalide : ${result.extension} (PDF requis)`;
    log.warn(result.reason);
    return result;
  }

  if (!fs.existsSync(cvPath)) {
    result.reason = `Fichier introuvable : ${cvPath}`;
    log.warn(result.reason);
    return result;
  }

  try {
    fs.accessSync(cvPath, fs.constants.R_OK);
    result.readable = true;
  } catch {
    result.reason = 'Fichier non lisible (permission refusee)';
    log.warn(result.reason);
    return result;
  }

  const stats = fs.statSync(cvPath);
  result.size = stats.size;

  const maxSizeMB = parseInt(process.env.CV_MAX_SIZE_MB || '10', 10);
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (stats.size > maxBytes) {
    result.reason = `Fichier trop volumineux : ${(stats.size / 1024 / 1024).toFixed(1)} Mo (max: ${maxSizeMB} Mo)`;
    log.warn(result.reason);
    return result;
  }

  if (stats.size === 0) {
    result.reason = 'Fichier vide (0 octets)';
    log.warn(result.reason);
    return result;
  }

  result.valid = true;
  log.info({ path: cvPath, size: `${(stats.size / 1024).toFixed(1)} Ko` }, 'CV valide');
  return result;
}

export function checkCVFromEnv() {
  const cvPath = process.env.CV_PATH;
  if (!cvPath) {
    return {
      valid: false,
      reason: 'Variable CV_PATH non definie dans .env',
      path: null
    };
  }
  return validateCV(cvPath);
}

if (process.argv[1] && process.argv[1].endsWith('cv-validator.js')) {
  const cvPath = process.argv[2] || process.env.CV_PATH;
  if (!cvPath) {
    console.error('Usage: node scripts/validation/cv-validator.js <chemin_cv.pdf>');
    process.exit(1);
  }
  const result = validateCV(cvPath);
  if (result.valid) {
    console.log(`CV valide : ${result.path} (${(result.size / 1024).toFixed(1)} Ko)`);
  } else {
    console.error(`CV invalide : ${result.reason}`);
    process.exit(1);
  }
}
