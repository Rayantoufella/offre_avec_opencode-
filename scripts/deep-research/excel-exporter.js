import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const RESEARCH_COLUMNS = [
  { header: 'N°', key: 'numero', width: 6 },
  { header: 'Entreprise', key: 'entreprise', width: 25 },
  { header: 'Poste', key: 'poste', width: 35 },
  { header: 'Localisation', key: 'localisation', width: 20 },
  { header: 'Type contrat', key: 'type_contrat', width: 15 },
  { header: 'Mode travail', key: 'mode_travail', width: 15 },
  { header: 'Technologies', key: 'technologies', width: 35 },
  { header: 'Experience demandee', key: 'experience', width: 20 },
  { header: 'Email candidature', key: 'email', width: 30 },
  { header: 'URL offre', key: 'url_offre', width: 40 },
  { header: 'URL candidature', key: 'url_candidature', width: 40 },
  { header: 'Source', key: 'source', width: 15 },
  { header: 'Type candidature', key: 'type_candidature', width: 18 },
  { header: 'Date collecte', key: 'date_collecte', width: 15 },
  { header: 'Statut offre', key: 'statut_offre', width: 15 },
  { header: 'Match Score', key: 'match_score', width: 12 },
  { header: 'Niveau pertinence', key: 'niveau_pertinence', width: 18 },
  { header: 'Raisons du match', key: 'raisons_match', width: 45 },
  { header: 'Competences manquantes', key: 'missing_skills', width: 30 },
  { header: 'Commentaires', key: 'commentaires', width: 30 },
  { header: 'Statut candidature', key: 'statut_candidature', width: 18 }
];

const STATUS_OPTIONS = ['A ENVOYER', 'Envoyee', 'En attente', 'Refusee', 'Entretien', 'Retiree'];

async function exportResearchExcel(matchedJobs, outputPath, options = {}) {
  const { filename = 'deep_research_results.xlsx', includeRejected = false, rejected = [] } = options;

  const projectRoot = path.join(__dirname, '..', '..');
  const dataDir = path.join(projectRoot, 'data', 'research');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = outputPath || path.join(dataDir, filename);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OpenCode Deep Research';
  workbook.created = new Date();

  const mainSheet = workbook.addWorksheet('Offres Recommandees');
  mainSheet.columns = RESEARCH_COLUMNS;

  styleHeaderRow(mainSheet.getRow(1));

  matchedJobs.forEach((job, index) => {
    const reasons = (job.matchReasons || []).join('; ');
    const missing = (job.missingSkills || []).join(', ');
    const comment = job.matchScore >= 80
      ? 'Score ' + job.matchScore + '/100 — ' + (job.matchReasons || []).slice(0, 2).join(', ')
      : '';

    const row = mainSheet.addRow({
      numero: index + 1,
      entreprise: job.company || '',
      poste: job.title || '',
      localisation: job.location || '',
      type_contrat: job.contractType || '',
      mode_travail: job.workMode || '',
      technologies: (job.technologies || []).join(', '),
      experience: job.experience || '',
      email: job.applicationEmail || '',
      url_offre: job.sourceUrl || '',
      url_candidature: job.applicationUrl || '',
      source: job.source || '',
      type_candidature: job.applicationType || '',
      date_collecte: job.dateFound ? new Date(job.dateFound).toLocaleDateString('fr-FR') : '',
      statut_offre: job.jobStatus || '',
      match_score: job.matchScore || 0,
      niveau_pertinence: job.matchLabel || '',
      raisons_match: reasons,
      missing_skills: missing,
      commentaires: comment,
      statut_candidature: 'A ENVOYER'
    });

    colorMatchScore(row, job.matchScore);

    const urlOffreCell = row.getCell('url_offre');
    if (job.sourceUrl) {
      urlOffreCell.value = { text: job.sourceUrl, hyperlink: job.sourceUrl };
      urlOffreCell.font = { color: { argb: 'FF0563C1' }, underline: true };
    }

    const urlCandidatureCell = row.getCell('url_candidature');
    if (job.applicationUrl) {
      urlCandidatureCell.value = { text: job.applicationUrl, hyperlink: job.applicationUrl };
      urlCandidatureCell.font = { color: { argb: 'FF0563C1' }, underline: true };
    }
  });

  const statusColLetter = 'U';
  for (let r = 2; r <= matchedJobs.length + 1; r++) {
    mainSheet.getCell(statusColLetter + r).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"' + STATUS_OPTIONS.join(',') + '"']
    };
  }

  mainSheet.autoFilter = { from: 'A1', to: 'U1' };
  mainSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  if (includeRejected && rejected.length > 0) {
    const rejectedSheet = workbook.addWorksheet('Offres Rejetees');
    rejectedSheet.columns = [
      { header: 'N°', key: 'numero', width: 6 },
      { header: 'Entreprise', key: 'entreprise', width: 25 },
      { header: 'Poste', key: 'poste', width: 35 },
      { header: 'Technologies', key: 'technologies', width: 35 },
      { header: 'URL offre', key: 'url_offre', width: 40 },
      { header: 'Raison rejet', key: 'raison', width: 50 },
      { header: 'Source', key: 'source', width: 15 }
    ];

    styleHeaderRow(rejectedSheet.getRow(1));

    rejected.forEach((r, index) => {
      const rejRow = rejectedSheet.addRow({
        numero: index + 1,
        entreprise: r.job?.company || '',
        poste: r.job?.title || '',
        technologies: (r.job?.technologies || []).join(', '),
        url_offre: r.job?.sourceUrl || '',
        raison: (r.reasons || []).join('; '),
        source: r.job?.source || ''
      });

      const urlCell = rejRow.getCell('url_offre');
      if (r.job?.sourceUrl) {
        urlCell.value = { text: r.job.sourceUrl, hyperlink: r.job.sourceUrl };
        urlCell.font = { color: { argb: 'FF0563C1' }, underline: true };
      }
    });
  }

  const summarySheet = workbook.addWorksheet('Resume');
  summarySheet.columns = [
    { header: 'Metrique', key: 'metric', width: 30 },
    { header: 'Valeur', key: 'value', width: 20 }
  ];

  styleHeaderRow(summarySheet.getRow(1));

  const stats = calculateStats(matchedJobs);
  summarySheet.addRow({ metric: 'Total offres', value: stats.total });
  summarySheet.addRow({ metric: 'Excellent match (90-100)', value: stats.excellent });
  summarySheet.addRow({ metric: 'Tres bon match (80-89)', value: stats.veryGood });
  summarySheet.addRow({ metric: 'Bon match (65-79)', value: stats.good });
  summarySheet.addRow({ metric: 'Match moyen (50-64)', value: stats.medium });
  summarySheet.addRow({ metric: 'Match faible (<50)', value: stats.low });
  summarySheet.addRow({ metric: 'Avec email', value: stats.withEmail });
  summarySheet.addRow({ metric: 'Avec formulaire', value: stats.withForm });
  summarySheet.addRow({ metric: 'Date de recherche', value: new Date().toLocaleDateString('fr-FR') });

  await workbook.xlsx.writeFile(filePath);
  log.info({ filePath, count: matchedJobs.length }, 'Excel de recherche exporte');

  return filePath;
}

function styleHeaderRow(row) {
  row.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
  row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  row.height = 25;
}

function colorMatchScore(row, score) {
  const scoreCell = row.getCell('match_score');
  const labelCell = row.getCell('niveau_pertinence');

  if (score >= 90) {
    scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
  } else if (score >= 80) {
    scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B0F0' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B0F0' } };
  } else if (score >= 65) {
    scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  } else if (score >= 50) {
    scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
  } else {
    scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
  }
}

function calculateStats(matched) {
  return {
    total: matched.length,
    excellent: matched.filter(m => m.matchScore >= 90).length,
    veryGood: matched.filter(m => m.matchScore >= 80 && m.matchScore < 90).length,
    good: matched.filter(m => m.matchScore >= 65 && m.matchScore < 80).length,
    medium: matched.filter(m => m.matchScore >= 50 && m.matchScore < 65).length,
    low: matched.filter(m => m.matchScore < 50).length,
    withEmail: matched.filter(m => m.applicationEmail).length,
    withForm: matched.filter(m => m.applicationType === 'WEB_FORM' || m.applicationType === 'LINKEDIN').length
  };
}

export { exportResearchExcel, calculateStats, RESEARCH_COLUMNS, STATUS_OPTIONS };
