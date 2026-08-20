import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const COLUMNS = [
  { header: 'N°', key: 'numero', width: 6 },
  { header: 'Entreprise', key: 'entreprise', width: 25 },
  { header: 'Poste', key: 'poste', width: 35 },
  { header: 'Lieu', key: 'lieu', width: 20 },
  { header: 'Contrat', key: 'contrat', width: 15 },
  { header: 'Date publication', key: 'date_publication', width: 18 },
  { header: 'Email Candidature', key: 'email', width: 30 },
  { header: 'Technologies', key: 'technologies', width: 30 },
  { header: 'STATUT', key: 'statut', width: 15 },
  { header: 'Date Candidature', key: 'date_candidature', width: 18 },
  { header: 'Relance', key: 'relance', width: 15 },
  { header: 'Retour', key: 'retour', width: 15 },
  { header: 'Observation', key: 'observation', width: 30 },
  { header: 'Source', key: 'source', width: 15 },
  { header: 'Lien', key: 'lien', width: 40 }
];

async function generateResearchExcel(jobs, outputPath, options = {}) {
  const { filename = 'offres_recherche.xlsx' } = options;

  const projectRoot = path.join(__dirname, '..', '..');
  const dataDir = path.join(projectRoot, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = outputPath || path.join(dataDir, filename);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OpenCode Job Research';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Offres Backend Maroc 2026');
  sheet.columns = COLUMNS;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  jobs.forEach((job, index) => {
    sheet.addRow({
      numero: index + 1,
      entreprise: job.company || job.entreprise || '',
      poste: job.title || job.poste || '',
      lieu: job.location || job.lieu || '',
      contrat: job.type || job.contrat || '',
      date_publication: job.date || job.postedTime || '',
      email: job.email || '',
      technologies: job.technologies || '',
      statut: 'A ENVOYER',
      date_candidature: '',
      relance: '',
      retour: '',
      observation: `Source: ${job.source || 'Inconnu'}`,
      source: job.source || '',
      lien: job.link || ''
    });
  });

  sheet.autoFilter = {
    from: 'A1',
    to: 'O1'
  };

  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  await workbook.xlsx.writeFile(filePath);
  log.info({ filePath, count: jobs.length }, 'Excel de recherche généré');

  return filePath;
}

function formatJobsForExcel(rawJobs) {
  return rawJobs.map(job => ({
    company: job.company || '',
    title: job.title || '',
    location: job.location || '',
    type: job.type || '',
    date: job.date || job.postedTime || '',
    email: job.email || '',
    technologies: job.technologies || '',
    source: job.source || '',
    link: job.link || ''
  }));
}

export { generateResearchExcel, formatJobsForExcel, COLUMNS };
