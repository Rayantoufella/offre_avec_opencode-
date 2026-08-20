import { browseLinkedIn, browseLinkedInGroups } from './browser-research.js';
import { generateResearchExcel, formatJobsForExcel } from './excel-generator.js';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

async function runResearch(options = {}) {
  const {
    page,
    keywords = 'Développeur Backend',
    location = 'Maroc',
    sites = ['linkedin'],
    maxResults = 50,
    searchGroups = false,
    outputPath = null
  } = options;

  if (!page) {
    throw new Error('Un objet page (Puppeteer/Playwright) est requis. Fournissez options.page.');
  }

  console.log('========================================');
  console.log('  RECHERCHE D\'OFFRES D\'EMPLOI');
  console.log(`  Mots-clés: ${keywords}`);
  console.log(`  Lieu: ${location}`);
  console.log(`  Sites: ${sites.join(', ')}`);
  console.log('========================================\n');

  const allJobs = [];

  if (sites.includes('linkedin')) {
    console.log('1. Recherche sur LinkedIn...');
    try {
      const linkedinJobs = await browseLinkedIn(page, keywords, location);
      allJobs.push(...linkedinJobs);
      console.log(`   ${linkedinJobs.length} offres trouvées\n`);
    } catch (err) {
      console.error(`   Erreur LinkedIn: ${err.message}\n`);
    }

    if (searchGroups) {
      console.log('2. Recherche dans les groupes LinkedIn...');
      try {
        const groups = await browseLinkedInGroups(page, keywords);
        console.log(`   ${groups.length} groupes trouvés\n`);
      } catch (err) {
        console.error(`   Erreur groupes: ${err.message}\n`);
      }
    }
  }

  console.log('3. Formatage des résultats...');
  const formattedJobs = formatJobsForExcel(allJobs);
  console.log(`   ${formattedJobs.length} offres formatées\n`);

  console.log('4. Génération du fichier Excel...');
  const excelPath = await generateResearchExcel(formattedJobs, outputPath);
  console.log(`   Fichier créé: ${excelPath}\n`);

  const report = {
    total: allJobs.length,
    sites: sites,
    keywords,
    location,
    excelFile: excelPath,
    timestamp: new Date().toISOString()
  };

  console.log('5. Rapport final...');
  console.log(JSON.stringify(report, null, 2));

  console.log('\n========================================');
  console.log('  RECHERCHE TERMINEE');
  console.log('========================================');

  return { success: true, report, jobs: allJobs, excelPath };
}

function saveResearchResults(jobs, filename = 'research-results.json') {
  const projectRoot = path.join(__dirname, '..', '..');
  const dataDir = path.join(projectRoot, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(jobs, null, 2), 'utf-8');
  log.info({ filePath, count: jobs.length }, 'Résultats sauvegardés');
  return filePath;
}

export { runResearch, saveResearchResults };
