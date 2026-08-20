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

function timer() {
  const start = Date.now();
  return () => ((Date.now() - start) / 1000).toFixed(1);
}

function validateProfile(profile) {
  const issues = [];
  if (!profile.nom && !profile.prenom) issues.push('Nom/prenom manquant');
  if (!profile.competences || profile.competences.length < 2) issues.push('Moins de 2 competences extraites');
  if (!profile.localisation) issues.push('Localisation manquante');
  return issues;
}

async function analyzeUserProfile(cvPath, userRequest = '') {
  const elapsed = timer();
  console.log('[1/3] Analyse du profil CV');

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
  const issues = validateProfile(profile);

  if (issues.length >= 2) {
    console.log('');
    console.log('   PROFIL INSUFFISANT');
    issues.forEach(i => console.log('     - ' + i));
    console.log('');
    console.log('   Le profil genere sera de mauvaise qualite.');
    console.log('   Solutions possibles:');
    console.log('     1. Verifiez que votre CV est dans data/cv/ (PDF valide)');
    console.log('     2. Precisez vos competences via --request "Backend Laravel PHP"');
    console.log('     3. Le systeme continue avec le profil partiel...');
    console.log('');
  }

  saveJSON(profile, 'profile.json');

  console.log('   Nom: ' + (profile.prenom || '(vide)') + ' ' + (profile.nom || '(vide)'));
  console.log('   Competences: ' + (profile.competences || []).slice(0, 5).join(', ') + ((profile.competences || []).length > 5 ? '...' : ''));
  console.log('   Categories: ' + (profile.categories || []).join(', '));
  console.log('   Seniority: ' + (profile.experience || 'Non determinee'));
  console.log('   Termine en ' + elapsed() + 's');
  console.log('');

  return profile;
}

function createPlan(profile, userRequest, options = {}) {
  const elapsed = timer();
  console.log('[2/3] Strategie de recherche');

  const plan = createResearchPlan(profile, userRequest, options);
  saveJSON(plan, 'research_plan.json');

  console.log('   Mots-cles: ' + plan.keywords.length);
  console.log('   Localisations: ' + plan.locations.join(', '));
  console.log('   Sources: ' + plan.sources.map(s => s.name).join(', '));
  console.log('   Termine en ' + elapsed() + 's');
  console.log('');

  return plan;
}

function generateQueries(plan) {
  const elapsed = timer();
  console.log('[3/3] Requetes generees');

  const queries = generateSearchQueries(plan);
  saveJSON(queries, 'search_queries.json');

  console.log('   ' + queries.length + ' requetes generees');
  queries.slice(0, 5).forEach(q => console.log('     - ' + q.query));
  if (queries.length > 5) console.log('     ... et ' + (queries.length - 5) + ' autres');
  console.log('   Termine en ' + elapsed() + 's');
  console.log('');

  return queries;
}

function getLinkedInQueries(plan) {
  return generateLinkedInQueries(plan);
}

function processCollectedJobs(rawJobs) {
  const elapsed = timer();
  console.log('[1/4] Traitement des donnees brutes');

  const { processed, rejected, stats } = processRawJobs(rawJobs);
  saveJSON({ processed, rejected, stats }, 'processed_jobs.json');

  console.log('   Valides: ' + stats.valid + '/' + stats.total);
  console.log('   Rejetees: ' + stats.invalid);
  console.log('   Termine en ' + elapsed() + 's');
  console.log('');

  return { processed, rejected, stats };
}

function removeDuplicates(jobs) {
  const elapsed = timer();
  console.log('[2/4] Deduplication');

  const { unique, duplicates, stats } = deduplicateJobs(jobs);
  saveJSON({ unique, duplicates, stats }, 'deduplicated_jobs.json');

  console.log('   Uniques: ' + stats.unique + '/' + stats.total);
  console.log('   Doublons supprimes: ' + stats.duplicates);
  console.log('   Termine en ' + elapsed() + 's');
  console.log('');

  return { unique, duplicates, stats };
}

function matchAndRank(jobs, profile, preferences = {}) {
  const elapsed = timer();
  console.log('[3/4] Matching et classement');

  const matched = matchJobs(jobs, profile, preferences);
  const summary = getMatchSummary(matched);
  saveJSON({ matched, summary }, 'matched_jobs.json');

  console.log('   Total: ' + summary.total);
  console.log('   Excellent (90-100): ' + summary.excellent);
  console.log('   Tres bon (80-89): ' + summary.veryGood);
  console.log('   Bon (65-79): ' + summary.good);
  console.log('   Moyen (50-64): ' + summary.medium);
  console.log('   Faible (<50): ' + summary.low);
  console.log('   Termine en ' + elapsed() + 's');
  console.log('');

  return { matched, summary };
}

async function generateExcel(matched, rejected = [], options = {}) {
  const elapsed = timer();
  console.log('[4/4] Export Excel');

  const filePath = await exportResearchExcel(matched, null, {
    includeRejected: true,
    rejected,
    ...options
  });

  console.log('   Fichier: ' + filePath);
  console.log('   Termine en ' + elapsed() + 's');
  console.log('');

  return filePath;
}

function printSummary(summary, sources = []) {
  console.log('========================================');
  console.log('  RECHERCHE TERMINEE');
  console.log('========================================');
  console.log('');
  console.log('Offres totales: ' + summary.total);
  console.log('Excellent match: ' + summary.excellent);
  console.log('Tres bon match: ' + summary.veryGood);
  console.log('Bon match: ' + summary.good);
  console.log('');

  if (summary.topMatches.length > 0) {
    console.log('TOP MATCHES:');
    summary.topMatches.slice(0, 5).forEach((m, i) => {
      console.log('  ' + (i + 1) + '. ' + m.company + ' — ' + m.title);
      console.log('     Score: ' + m.score + '/100 (' + m.label + ')');
      if (m.reasons.length > 0) {
        m.reasons.forEach(r => console.log('     + ' + r));
      }
      if (m.missingSkills && m.missingSkills.length > 0) {
        console.log('     - Manquant: ' + m.missingSkills.join(', '));
      }
      console.log('');
    });
  }

  console.log('Excel: data/research/deep_research_results.xlsx');
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
  const totalElapsed = timer();

  try {
    const profile = await analyzeUserProfile(cvPath, userRequest);
    const plan = createPlan(profile, userRequest, { maxResults });
    const queries = generateQueries(plan);

    const report = {
      profile: { nom: profile.nom, prenom: profile.prenom, competences: (profile.competences || []).slice(0, 5) },
      plan: { keywords: plan.keywords, locations: plan.locations, sources: plan.sources.map(s => s.name) },
      queriesCount: queries.length,
      timestamp: new Date().toISOString()
    };

    saveJSON(report, 'research_report.json');

    console.log('========================================');
    console.log('  PHASE AUTOMATIQUE TERMINEE');
    console.log('========================================');
    console.log('');
    console.log('Fichiers generes dans data/research/:');
    console.log('  - profile.json           (profil candidat)');
    console.log('  - research_plan.json     (strategie)');
    console.log('  - search_queries.json    (' + queries.length + ' requetes)');
    console.log('');
    console.log('PHASE SUIVANTE (Manuelle — OpenCode + Browser MCP):');
    console.log('');
    console.log('  1. Ouvrez LinkedIn/Indeed dans Chrome (connecte)');
    console.log('  2. Demandez a OpenCode de rechercher les offres');
    console.log('  3. Sauvegardez les resultats dans data/research/raw_jobs.json');
    console.log('  4. Lancez: npm run deep-research:process');
    console.log('');
    console.log('Total: ' + totalElapsed() + 's');

    return { success: true, profile, plan, queries, report };

  } catch (err) {
    console.error('Erreur:', err.message);
    return { success: false, error: err.message };
  }
}

async function processCollectedData(options = {}) {
  const totalElapsed = timer();

  console.log('========================================');
  console.log('  TRAITEMENT DES DONNEES COLLECTEES');
  console.log('========================================');
  console.log('');

  const rawJobs = loadJSON('raw_jobs.json');
  if (!rawJobs || !Array.isArray(rawJobs) || rawJobs.length === 0) {
    console.error('Fichier data/research/raw_jobs.json introuvable ou vide.');
    console.error('');
    console.error('Comment resoudre :');
    console.error('  1. Lancez: npm run deep-research -- --cv "data/cv/CV.pdf" --request "Backend Laravel"');
    console.error('  2. Ouvrez LinkedIn dans Chrome (connecte)');
    console.error('  3. Demandez a OpenCode de chercher les offres');
    console.error('  4. Sauvegardez les resultats dans data/research/raw_jobs.json');
    console.error('  5. Relancez: npm run deep-research:process');
    return { success: false, error: 'No raw data' };
  }

  console.log('Offres collectees: ' + rawJobs.length);
  console.log('');

  const profile = loadJSON('profile.json') || {};
  const savedPrefs = loadJSON('preferences.json') || {};
  const preferences = { ...savedPrefs, ...options };

  const { processed, rejected, stats: processStats } = processCollectedJobs(rawJobs);
  const { unique, duplicates, stats: dedupStats } = removeDuplicates(processed);
  const { matched, summary } = matchAndRank(unique, profile, preferences);
  const excelPath = await generateExcel(matched, rejected);
  printSummary(summary, profile.sources || []);

  console.log('Termine en ' + totalElapsed() + 's');

  return { success: true, excelPath, summary };
}

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf('--' + name);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

function getFlag(name) {
  return args.includes('--' + name);
}

if (args.includes('--process')) {
  const filterOptions = {};
  if (getArg('min-score')) filterOptions.minScore = parseInt(getArg('min-score'));
  if (getArg('location')) filterOptions.location = getArg('location');
  if (getArg('contract')) filterOptions.contract = getArg('contract');
  if (getArg('tech')) filterOptions.tech = getArg('tech').split(',');

  processCollectedData(filterOptions).catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
} else if (args.includes('--help')) {
  console.log('Usage:');
  console.log('  node research-orchestrator.js                    Lancer la recherche');
  console.log('  node research-orchestrator.js --process          Traiter les donnees collectees');
  console.log('');
  console.log('Options (recherche):');
  console.log('  --cv <path>           Chemin vers le CV');
  console.log('  --request <text>      Demande de recherche');
  console.log('  --max <number>        Nombre max de resultats');
  console.log('');
  console.log('Options (traitement):');
  console.log('  --min-score <n>       Score minimum (0-100)');
  console.log('  --location <city>     Filtrer par ville');
  console.log('  --contract <type>     Filtrer par contrat (CDI/CDD/Stage)');
  console.log('  --tech <list>         Filtrer par technologies (separees par virgule)');
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
