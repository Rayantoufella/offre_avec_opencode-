import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const SITE_CONFIG = {
  name: 'Rekrute',
  baseUrl: 'https://www.rekrute.com',
  jobSearchUrl: 'https://www.rekrute.com/offres-emploi',
  requiresAuth: false,
  supportsAutoFill: true,
  features: ['search', 'filter', 'auto_fill_form'],
  country: 'Morocco'
};

async function searchJobs(page, query, location, options = {}) {
  const { limit = 25 } = options;
  const jobs = [];

  log.info({ query, location, limit }, 'Recherche Rekrute demarrée');

  const searchUrl = new URL(SITE_CONFIG.jobSearchUrl);
  if (query) searchUrl.searchParams.set('mots', query);
  if (location) searchUrl.searchParams.set('lieu', location);

  await page.goto(searchUrl.toString(), { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.jobList, .offre-list, .results', { timeout: 10000 }).catch(() => null);

  const jobCards = await page.$$('.jobListItem, .offre-item, .result-item');

  for (let i = 0; i < Math.min(jobCards.length, limit); i++) {
    try {
      const card = jobCards[i];
      const job = await extractJobFromCard(card);
      if (job && job.title) {
        jobs.push(job);
      }
    } catch (err) {
      log.debug({ error: err.message }, 'Erreur extraction carte Rekrute');
    }
  }

  return jobs;
}

async function extractJobFromCard(card) {
  const title = await card.$eval('h2 a, .job-title a, .offre-title a', el => el.textContent?.trim()).catch(() => '');
  const company = await card.$eval('.company, .societe, .company-name', el => el.textContent?.trim()).catch(() => '');
  const location = await card.$eval('.location, .lieu, .job-location', el => el.textContent?.trim()).catch(() => '');
  const link = await card.$eval('h2 a, .job-title a, .offre-title a', el => el.href).catch(() => '');
  const date = await card.$eval('.date, .date-posted, .offre-date', el => el.textContent?.trim()).catch(() => '');

  return {
    title,
    company,
    location,
    link,
    date,
    source: 'Rekrute'
  };
}

async function extractJobDetails(page) {
  try {
    await page.waitForSelector('.jobDetail, .offre-detail, .job-content', { timeout: 10000 });

    const title = await page.$eval('h1, .job-title, .offre-title', el => el.textContent?.trim()).catch(() => '');
    const company = await page.$eval('.company-name, .societe', el => el.textContent?.trim()).catch(() => '');
    const location = await page.$eval('.location, .lieu', el => el.textContent?.trim()).catch(() => '');
    const description = await page.$eval('.job-description, .offre-description', el => el.textContent?.trim()).catch(() => '');

    return {
      title,
      company,
      location,
      description,
      source: 'Rekrute'
    };
  } catch (err) {
    return null;
  }
}

async function autoFillForm(page, cvData) {
  try {
    const nameInput = await page.$('input[name="name"], input[name="nom"], input[name="prenom"]');
    if (nameInput && cvData?.prenom) {
      await nameInput.type(cvData.prenom);
    }

    const emailInput = await page.$('input[name="email"], input[type="email"]');
    if (emailInput && cvData?.email) {
      await emailInput.type(cvData.email);
    }

    const phoneInput = await page.$('input[name="phone"], input[name="telephone"], input[type="tel"]');
    if (phoneInput && cvData?.telephone) {
      await phoneInput.type(cvData.telephone);
    }

    log.info('Formulaire pré-rempli');
    return true;
  } catch (err) {
    log.debug({ error: err.message }, 'Erreur pré-remplissage formulaire');
    return false;
  }
}

export { SITE_CONFIG, searchJobs, extractJobDetails, autoFillForm, extractJobFromCard };
