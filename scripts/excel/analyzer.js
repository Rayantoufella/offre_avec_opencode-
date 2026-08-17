import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { detectColumns, getColumnIndex } from './column-detector.js';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

export function readExcel(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier Excel introuvable : ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (!['.xlsx', '.xls', '.xlsm', '.csv'].includes(ext)) {
    throw new Error(`Format non supporte : ${ext}`);
  }

  const workbook = XLSX.read(filePath, { type: 'file' });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('Le fichier Excel ne contient aucune feuille');
  }

  log.info({ sheetNames }, 'Feuilles detectees');
  return workbook;
}

export function getMainSheet(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (data.length === 0) {
    throw new Error('La feuille est vide');
  }

  const headers = data[0].map(h => String(h).trim());
  const rows = data.slice(1);

  return { sheetName, headers, rows, totalRows: rows.length };
}

export function analyzeExcel(filePath) {
  const workbook = readExcel(filePath);
  const { sheetName, headers, rows, totalRows } = getMainSheet(workbook);
  const { mapping, unmapped } = detectColumns(headers);

  const emailIndex = getColumnIndex(mapping, 'EMAIL');
  const entrepriseIndex = getColumnIndex(mapping, 'ENTREPRISE');
  const posteIndex = getColumnIndex(mapping, 'POSTE');

  const results = [];
  const seen = new Map();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const entry = { row: rowNum, data: {} };

    for (const [field, info] of Object.entries(mapping)) {
      entry.data[field] = row[info.index] || '';
    }

    const email = emailIndex >= 0 ? String(row[emailIndex] || '').trim() : '';
    const entreprise = entrepriseIndex >= 0 ? String(row[entrepriseIndex] || '').trim() : '';
    const poste = posteIndex >= 0 ? String(row[posteIndex] || '').trim() : '';

    entry.email = email;
    entry.entreprise = entreprise;
    entry.poste = poste;

    if (!email) {
      entry.status = 'SKIP';
      entry.reason = 'Email manquant';
    } else if (!isValidEmail(email)) {
      entry.status = 'SKIP';
      entry.reason = 'Email invalide';
    } else if (!entreprise) {
      entry.status = 'INCOMPLETE';
      entry.reason = 'Entreprise manquante';
    } else if (!poste) {
      entry.status = 'INCOMPLETE';
      entry.reason = 'Poste manquant';
    } else {
      const key = `${normalize(entreprise)}|${normalize(poste)}`;
      if (seen.has(key)) {
        entry.status = 'DUPLICATE';
        entry.reason = `Doublon de la ligne ${seen.get(key)}`;
      } else {
        seen.set(key, rowNum);
        entry.status = 'VALID';
        entry.reason = null;
      }
    }

    results.push(entry);
  }

  const summary = {
    total: results.length,
    valid: results.filter(r => r.status === 'VALID').length,
    incomplete: results.filter(r => r.status === 'INCOMPLETE').length,
    skip: results.filter(r => r.status === 'SKIP').length,
    duplicate: results.filter(r => r.status === 'DUPLICATE').length,
    failed: results.filter(r => r.status === 'FAILED').length
  };

  log.info({ summary }, 'Analyse Excel terminee');
  return { sheetName, headers, mapping, unmapped, results, summary, totalRows };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function printReport(analysis) {
  const { summary, results, mapping, unmapped } = analysis;

  console.log('\n========== RAPPORT D\'ANALYSE EXCEL ==========\n');
  console.log(`TOTAL   : ${summary.total}`);
  console.log(`VALID   : ${summary.valid}`);
  console.log(`INCOMPLETE : ${summary.incomplete}`);
  console.log(`SKIP    : ${summary.skip}`);
  console.log(`DUPLICATE : ${summary.duplicate}`);
  console.log(`FAILED  : ${summary.failed}`);

  console.log('\n--- Colonnes detectees ---');
  for (const [field, info] of Object.entries(mapping)) {
    console.log(`  ${field} <- "${info.originalName}" (confiance: ${(info.confidence * 100).toFixed(0)}%)`);
  }

  if (unmapped.length > 0) {
    console.log('\n--- Colonnes non mappÃ©es ---');
    for (const u of unmapped) {
      console.log(`  "${u.header}"`);
    }
  }

  const problems = results.filter(r => r.status !== 'VALID');
  if (problems.length > 0) {
    console.log('\n--- Problemes ---');
    for (const p of problems) {
      console.log(`  Ligne ${p.row}: ${p.entreprise || 'N/A'} | ${p.poste || 'N/A'} | ${p.status} | ${p.reason}`);
    }
  }

  console.log('\n==============================================\n');
}

if (process.argv[1] && process.argv[1].endsWith('analyzer.js')) {
  const filePath = process.argv[2] || process.env.EXCEL_PATH;
  if (!filePath) {
    console.error('Usage: node scripts/excel/analyzer.js <fichier.xlsx>');
    process.exit(1);
  }
  try {
    const analysis = analyzeExcel(filePath);
    printReport(analysis);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}
