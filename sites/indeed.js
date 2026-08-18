import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const SITE_CONFIG = {
  name: 'Indeed',
  baseUrl: 'https://www.indeed.com',
  jobSearchUrl: 'https://www.indeed.com/jobs',
  requiresAuth: false,
  supportsAutoFill: false,
  features: ['search', 'filter', 'company_pages']
};

async function searchJobs(page, query, location, options = {}) {
  const { limit = 25 } = options;
  const jobs = [];

  log.info({ query, location, limit }, 'Recherche Indeed demarrée');

  const searchUrl = new URL(SITE_CONFIG.jobSearchUrl);
  searchUrl.searchParams.set('q', query);
  if (location) searchUrl.searchParams.set('l', location);

  await page.goto(searchUrl.toString(), { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.jobsearch-ResultsList, .mosaic-provider-jobcards', { timeout: 10000 }).catch(() => null);

  const jobCards = await page.$$('.job_seen_beacon, .resultContent, .jobsearch-ResultsList .result');

  for (let i = 0; i < Math.min(jobCards.length, limit); i++) {
    try {
      const card = jobCards[i];
      const job = await extractJobFromCard(card);
      if (job && job.title) {
        jobs.push(job);
      }
    } catch (err) {
      log.debug({ error: err.message }, 'Erreur extraction carte Indeed');
    }
  }

  return jobs;
}

async function extractJobFromCard(card) {
  const title = await card.$eval('.jobTitle a, h2.jobTitle a', el => el.textContent?.trim()).catch(() => '');
  const company = await card.$eval('.companyName, .companyNameLink', el => el.textContent?.trim()).catch(() => '');
  const location = await card.$eval('.companyLocation, .dataAttributeLabel', el => el.textContent?.trim()).catch(() => '');
  const link = await card.$eval('.jobTitle a', el => el.href).catch(() => '');
  const salary = await card.$eval('.salary-snippet-container, .metadata .attribute_snippet', el => el.textContent?.trim()).catch(() => '');

  return {
    title,
    company,
    location,
    link,
    salary,
    source: 'Indeed'
  };
}

async function extractJobDetails(page) {
  try {
    await page.waitForSelector('.jobsearch-JobComponent, #jobsearch-ViewjobPane', { timeout: 10000 });

    const title = await page.$eval('.jobsearch-JobInfoHeader-title, h1', el => el.textContent?.trim()).catch(() => '');
    const company = await page.$eval('.jobsearch-InlineHeader-companyInfo a, .companyName', el => el.textContent?.trim()).catch(() => '');
    const location = await page.$eval('.jobsearch-InlineHeader-companyInfo div', el => el.textContent?.trim()).catch(() => '');
    const description = await page.$eval('#jobDescriptionText, .jobsearch-JobComponent-description', el => el.textContent?.trim()).catch(() => '');

    return {
      title,
      company,
      location,
      description,
      source: 'Indeed'
    };
  } catch (err) {
    return null;
  }
}

export { SITE_CONFIG, searchJobs, extractJobDetails, extractJobFromCard };
