import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const TRACKING_FILE = path.resolve(__dirname, '../../data/suivi_candidatures.xlsx');

const TRACKING_COLUMNS = [
  { header: 'Entreprise', key: 'entreprise', width: 30 },
  { header: 'Poste', key: 'poste', width: 40 },
  { header: 'Lien Offre', key: 'lien_offre', width: 50 },
  { header: 'Recruteur (email)', key: 'recruteur_email', width: 35 },
  { header: 'Date DM envoye', key: 'date_envoi', width: 18 },
  { header: 'Lien Entreprise', key: 'lien_entreprise', width: 50 },
  { header: 'Notes', key: 'notes', width: 40 }
];

function getDefaultFilePath() {
  return TRACKING_FILE;
}

async function ensureFile(filePath) {
  filePath = filePath || getDefaultFilePath();

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Suivi Candidatures');

  worksheet.columns = TRACKING_COLUMNS.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  await workbook.xlsx.writeFile(filePath);
  log.info({ filePath }, 'Fichier de suivi cree');

  return filePath;
}

function formatDateFR(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function calculateFollowUpDate(sendDate, days = 7) {
  const d = sendDate instanceof Date ? new Date(sendDate) : new Date(sendDate);
  d.setDate(d.getDate() + days);
  return d;
}

function isDuplicate(worksheet, entreprise, poste, dateEnvoi) {
  let found = false;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const ent = String(row.getCell(1).value || '').trim().toLowerCase();
    const pos = String(row.getCell(2).value || '').trim().toLowerCase();
    const dat = String(row.getCell(5).value || '').trim();
    if (ent === entreprise.toLowerCase() &&
        pos === poste.toLowerCase() &&
        dat === dateEnvoi) {
      found = true;
    }
  });
  return found;
}

async function appendRow(data, filePath) {
  filePath = await ensureFile(filePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('Aucune feuille trouvee dans le fichier de suivi');
  }

  const now = new Date();
  const dateEnvoi = formatDateFR(now);

  if (isDuplicate(worksheet, data.entreprise || '', data.poste || '', dateEnvoi)) {
    log.info({ entreprise: data.entreprise, poste: data.poste }, 'Candidature deja enregistree aujourd\'hui');
    return { filePath, appended: false, reason: 'duplicate' };
  }

  const rowValues = [
    data.entreprise || '',
    data.poste || '',
    data.url_offre || data.lien_offre || '',
    data.email || data.recruteur_email || '',
    dateEnvoi,
    data.url_entreprise || data.lien_entreprise || '',
    data.notes || ''
  ];

  const row = worksheet.addRow(rowValues);

  const lienOffreCell = row.getCell(3);
  if (lienOffreCell.value && typeof lienOffreCell.value === 'string' && lienOffreCell.value.startsWith('http')) {
    lienOffreCell.value = { text: lienOffreCell.value, hyperlink: lienOffreCell.value };
    lienOffreCell.font = { color: { argb: 'FF0563C1' }, underline: true };
  }

  const lienEntrepCell = row.getCell(6);
  if (lienEntrepCell.value && typeof lienEntrepCell.value === 'string' && lienEntrepCell.value.startsWith('http')) {
    lienEntrepCell.value = { text: lienEntrepCell.value, hyperlink: lienEntrepCell.value };
    lienEntrepCell.font = { color: { argb: 'FF0563C1' }, underline: true };
  }

  await workbook.xlsx.writeFile(filePath);

  const followUpDate = calculateFollowUpDate(now, 7);

  log.info({
    entreprise: data.entreprise,
    poste: data.poste,
    dateEnvoi,
    relance: formatDateFR(followUpDate)
  }, 'Candidature enregistree');

  return {
    filePath,
    appended: true,
    dateEnvoi,
    relanceDate: formatDateFR(followUpDate)
  };
}

async function getStats(filePath) {
  filePath = filePath || getDefaultFilePath();

  if (!fs.existsSync(filePath)) {
    return { total: 0, thisWeek: 0, followUpsDue: 0, entries: [] };
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return { total: 0, thisWeek: 0, followUpsDue: 0, entries: [] };
  }

  const entries = [];
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    entries.push({
      entreprise: String(row.getCell(1).value || ''),
      poste: String(row.getCell(2).value || ''),
      lien_offre: String(row.getCell(3).value || ''),
      recruteur_email: String(row.getCell(4).value || ''),
      date_envoi: String(row.getCell(5).value || ''),
      lien_entreprise: String(row.getCell(6).value || ''),
      notes: String(row.getCell(7).value || '')
    });
  });

  const total = entries.length;

  const thisWeek = entries.filter(e => {
    const parts = e.date_envoi.split('/');
    if (parts.length !== 3) return false;
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    return d >= oneWeekAgo;
  }).length;

  const followUpsDue = entries.filter(e => {
    const parts = e.date_envoi.split('/');
    if (parts.length !== 3) return false;
    const sendDate = new Date(parts[2], parts[1] - 1, parts[0]);
    const followUp = calculateFollowUpDate(sendDate, 7);
    return followUp <= now;
  }).length;

  return { total, thisWeek, followUpsDue, entries };
}

export { appendRow, getStats, ensureFile, calculateFollowUpDate, formatDateFR, getDefaultFilePath, TRACKING_COLUMNS };
