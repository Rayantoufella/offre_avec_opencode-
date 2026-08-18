import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';
import { parseCV } from '../validation/cv-parser.js';
import { analyzeProfile, profileToSearchTerms } from './profile-analyzer.js';
import { createResearchPlan, formatPlanForDisplay } from './research-planner.js';
import { generateSearchQueries, generateLinkedInQueries } from './query-generator.js';
import { processRawJobs } from './data-processor.js';
import { deduplicateJobs } from './deduplicator.js';
import { matchJobs, getMatchSummary } from './matcher.js';
import { exportResearchExcel } from './excel-exporter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'research');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveJSON(data, filename) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

function loadJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function analyzeUserProfile(cvPath, userRequest = '') {
  console.log('[1/10] Profil analyse');

  let cvData = null;
  if (cvPath) {
    const result = await parseCV(cvPath);
    if (result.success) {
      cvData = result.data;
    } else {
      console.log('   Attention: impossible de lire le CV:', result.error);
    }
  }

  const profile = analyzeProfile(cvData, userRequest);
  saveJSON(profile, 'profile.json');

  console.log('   Nom: ' + profile.prenom + ' ' + profile.nom);
  console.log('   Competences: ' + profile.competences.slice(0, 5).join(', ') + '...');
  console.log('   Categories: ' + profile.categories.join(', '));
  console.log('   Seniority: ' + (profile.experience || 'Non determinee'));
  console.log('');

  return profile;
}

function createPlan(profile, userRequest, options = {}) {
  console.log('[2/10] Strategie de recherche creee');

  const plan = createResearchPlan(profile, userRequest, options);
  saveJSON(plan, 'research_plan.json');

  console.log(formatPlanForDisplay(plan));
  console.log('');

  return plan;
}

function generateQueries(plan) {
  console.log('[3/10] Requetes generees');

  const queries = generateSearchQueries(plan);
  saveJSON(queries, 'search_queries.json');

  console.log('   ' + queries.length + ' requetes generees');
  queries.slice(0, 5).forEach(q => console.log('   - ' + q.query));
  if (queries.length > 5) console.log('   ... et ' + (queries.length - 5) + ' autres');
  console.log('');

  return queries;
}

function getLinkedInQueries(plan) {
  return generateLinkedInQueries(plan);
}

function processCollectedJobs(rawJobs) {
  console.log('[4/10] Offres collectees traitees');

  const { processed, rejected, stats } = processRawJobs(rawJobs);
  saveJSON({ processed, rejected, stats }, 'processed_jobs.json');

  console.log('   Valides: ' + stats.valid + '/' + stats.total);
  console.log('   Rejetees: ' + stats.invalid);
  console.log('');

  return { processed, rejected, stats };
}

function removeDuplicates(jobs) {
  console.log('[5/10] Doublons supprimes');

  const { unique, duplicates, stats } = deduplicateJobs(jobs);
  saveJSON({ unique, duplicates, stats }, 'deduplicated_jobs.json');

  console.log('   Uniques: ' + stats.unique + '/' + stats.total);
  console.log('   Doublons: ' + stats.duplicates);
  console.log('');

  return { unique, duplicates, stats };
}

function matchAndRank(jobs, profile, preferences = {}) {
  console.log('[6/10] Matching et classement');

  const matched = matchJobs(jobs, profile, preferences);
  const summary = getMatchSummary(matched);
  saveJSON({ matched, summary }, 'matched_jobs.json');

  console.log('   Total: ' + summary.total);
  console.log('   Excellent: ' + summary.excellent);
  console.log('   Tres bon: ' + summary.veryGood);
  console.log('   Bon: ' + summary.good);
  console.log('   Moyen: ' + summary.medium);
  console.log('   Faible: ' + summary.low);
  console.log('');

  return { matched, summary };
}

async function generateExcel(matched, rejected = [], options = {}) {
  console.log('[7/10] Excel genere');

  const filePath = await exportResearchExcel(matched, null, {
    includeRejected: true,
    rejected,
    ...options
  });

  console.log('   Fichier: ' + filePath);
  console.log('');

  return filePath;
}

function printSummary(summary, sources = []) {
  console.log('[8/10] Resume de recherche');
  console.log('');
  console.log('=== RECHERCHE TERMINEE ===');
  console.log('');
  console.log('Sources recherchees: ' + sources.length);
  console.log('Offres decouvertes: ' + summary.total);
  console.log('Excellent match: ' + summary.excellent);
  console.log('Tres bon match: ' + summary.veryGood);
  console.log('Bon match: ' + summary.good);
  console.log('');

  if (summary.topMatches.length > 0) {
    console.log('Top matches:');
    summary.topMatches.slice(0, 5).forEach((m, i) => {
      console.log('  ' + (i + 1) + '. ' + m.company + ' - ' + m.title + ' - ' + m.score + '/100 (' + m.label + ')');
      if (m.reasons.length > 0) {
        console.log('     Raison: ' + m.reasons[0]);
      }
    });
  }

  console.log('');
}

async function runDeepResearch(options = {}) {
  const {
    cvPath = process.env.CV_PATH,
    userRequest = '',
    existingExcelPath = null,
    preferences = {},
    maxResults = 50
  } = options;

  console.log('========================================');
  console.log('  DEEP RECHERCHE D\'OFFRES D\'EMPLOI');
  console.log('========================================');
  console.log('');

  ensureDataDir();

  try {
    const profile = await analyzeUserProfile(cvPath, userRequest);
    const plan = createPlan(profile, userRequest, { maxResults });
    const queries = generateQueries(plan);

    const report = {
      profile: { nom: profile.nom, prenom: profile.prenom, competences: profile.competences.slice(0, 5) },
      plan: { keywords: plan.keywords, locations: plan.locations, sources: plan.sources.map(s => s.name) },
      queriesCount: queries.length,
      timestamp: new Date().toISOString()
    };

    saveJSON(report, 'research_report.json');

    console.log('[9/10] Donnees sauvegardees');
    console.log('');
    console.log('Prochaines etapes:');
    console.log('  1. OpenCode utilise Browser MCP pour rechercher chaque source');
    console.log('  2. Les resultats sont sauvegardes dans data/research/raw_jobs.json');
    console.log('  3. Relancez le traitement avec: node scripts/deep-research/research-orchestrator.js --process');
    console.log('');

    return { success: true, profile, plan, queries, report };

  } catch (err) {
    console.error('Erreur:', err.message);
    return { success: false, error: err.message };
  }
}

async function processCollectedData() {
  console.log('========================================');
  console.log('  TRAITEMENT DES DONNEES COLLECTEES');
  console.log('========================================');
  console.log('');

  const rawJobs = loadJSON('raw_jobs.json');
  if (!rawJobs || !Array.isArray(rawJobs) || rawJobs.length === 0) {
    console.error('Aucune donnee brute trouvee dans data/research/raw_jobs.json');
    console.error('Utilisez d\'abord Browser MCP pour collecter des offres.');
    return { success: false, error: 'No raw data' };
  }

  const profile = loadJSON('profile.json') || {};
  const preferences = loadJSON('preferences.json') || {};

  const { processed, rejected, stats: processStats } = processCollectedJobs(rawJobs);
  const { unique, duplicates, stats: dedupStats } = removeDuplicates(processed);
  const { matched, summary } = matchAndRank(unique, profile, preferences);
  const excelPath = await generateExcel(matched, rejected);
  printSummary(summary, profile.sources || []);

  return { success: true, excelPath, summary };
}

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf('--' + name);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

if (args.includes('--process')) {
  processCollectedData().catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
} else if (args.includes('--help')) {
  console.log('Usage:');
  console.log('  node research-orchestrator.js                    Lancer la recherche');
  console.log('  node research-orchestrator.js --process          Traiter les donnees collectees');
  console.log('');
  console.log('Options:');
  console.log('  --cv <path>           Chemin vers le CV');
  console.log('  --request <text>      Demande de recherche');
  console.log('  --max <number>        Nombre max de resultats');
} else {
  const cvPath = getArg('cv') || process.env.CV_PATH;
  const request = getArg('request') || '';
  const max = parseInt(getArg('max') || '50');

  runDeepResearch({ cvPath, userRequest: request, maxResults: max }).catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
}

export { runDeepResearch, processCollectedData, analyzeUserProfile, createPlan, generateQueries, processCollectedJobs, removeDuplicates, matchAndRank, generateExcel, saveJSON, loadJSON };