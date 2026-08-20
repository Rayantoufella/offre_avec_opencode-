import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const SITE_CONFIG = {
  name: 'LinkedIn',
  baseUrl: 'https://www.linkedin.com',
  jobSearchUrl: 'https://www.linkedin.com/jobs/search/',
  requiresAuth: true,
  supportsAutoFill: false,
  features: ['search', 'scroll', 'groups', 'company_pages']
};

async function searchJobs(page, query, location, options = {}) {
  const { limit = 25, remote = false } = options;
  const jobs = [];

  log.info({ query, location, limit }, 'Recherche LinkedIn demarrée');

  const searchUrl = new URL(SITE_CONFIG.jobSearchUrl);
  searchUrl.searchParams.set('keywords', query);
  if (location) searchUrl.searchParams.set('location', location);
  if (remote) searchUrl.searchParams.set('f_WT', '2');

  await page.goto(searchUrl.toString(), { waitUntil: 'networkidle2', timeout: 30000 });

  await page.waitForSelector('.jobs-search__results-list, .scaffold-layout__list', { timeout: 10000 }).catch(() => null);

  const jobCards = await page.$$('.jobs-search-results__list-item, .scaffold-layout__list-item');
  log.info({ found: jobCards.length }, 'Cartes d\'offres trouvées');

  for (let i = 0; i < Math.min(jobCards.length, limit); i++) {
    try {
      const card = jobCards[i];
      const job = await extractJobFromCard(card);
      if (job && job.title) {
        jobs.push(job);
        log.debug({ title: job.title, company: job.company }, 'Offre extraite');
      }
    } catch (err) {
      log.debug({ error: err.message }, 'Erreur extraction carte');
    }
  }

  return jobs;
}

async function extractJobFromCard(card) {
  const title = await card.$eval('.job-card-list__title--link, .artdeco-entity-lockup__title a', el => el.textContent?.trim()).catch(() => '');
  const company = await card.$eval('.artdeco-entity-lockup__subtitle, .job-card-container__primary-description', el => el.textContent?.trim()).catch(() => '');
  const location = await card.$eval('.artdeco-entity-lockup__caption, .job-card-container__metadata-item', el => el.textContent?.trim()).catch(() => '');
  const link = await card.$eval('.job-card-list__title--link, .artdeco-entity-lockup__title a', el => el.href).catch(() => '');
  const postedTime = await card.$eval('.job-card-container__list-date, .artdeco-entity-lockup__caption--small', el => el.textContent?.trim()).catch(() => '');

  return {
    title,
    company,
    location,
    link,
    postedTime,
    source: 'LinkedIn'
  };
}

async function extractJobDetails(page) {
  try {
    await page.waitForSelector('.jobs-search__job-details, .jobs-unified-top-card', { timeout: 10000 });

    const title = await page.$eval('.jobs-unified-top-card__job-title, h1', el => el.textContent?.trim()).catch(() => '');
    const company = await page.$eval('.jobs-unified-top-card__company-name, . jobs-unified-top-card__company-link', el => el.textContent?.trim()).catch(() => '');
    const location = await page.$eval('.jobs-unified-top-card__bullet, .jobs-unified-top-card__workplace-type', el => el.textContent?.trim()).catch(() => '');
    const description = await page.$eval('.jobs-description, .jobs-box__html-content', el => el.textContent?.trim()).catch(() => '');
    const salary = await page.$eval('.jobs-unified-top-card__job-insight span', el => el.textContent?.trim()).catch(() => '');

    return {
      title,
      company,
      location,
      description,
      salary,
      source: 'LinkedIn'
    };
  } catch (err) {
    log.debug({ error: err.message }, 'Erreur extraction détails');
    return null;
  }
}

async function scrollAndLoad(page, maxScrolls = 5) {
  let scrollCount = 0;

  while (scrollCount < maxScrolls) {
    const showMoreButton = await page.$('button.jobs-search-results__pagination-link-button, button[aria-label="Voir plus des offres"]');
    if (showMoreButton) {
      await showMoreButton.click();
      await page.waitForTimeout(2000);
      scrollCount++;
    } else {
      break;
    }
  }

  log.info({ scrolls: scrollCount }, 'Scroll terminé');
}

async function searchGroups(page, query) {
  const groupsUrl = `https://www.linkedin.com/search/results/groups/?keywords=${encodeURIComponent(query)}`;
  await page.goto(groupsUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  const groups = [];
  const groupCards = await page.$$('.reusable-search__result-container, .entity-result');

  for (const card of groupCards.slice(0, 10)) {
    try {
      const name = await card.$eval('.entity-result__title-text a, .app-aware-link span', el => el.textContent?.trim()).catch(() => '');
      const members = await card.$eval('.entity-result__primary-subtitle, .reusable-search__result-container span', el => el.textContent?.trim()).catch(() => '');
      const link = await card.$eval('.entity-result__title-text a, .app-aware-link', el => el.href).catch(() => '');

      if (name) {
        groups.push({ name, members, link, source: 'LinkedIn' });
      }
    } catch (err) {
      log.debug({ error: err.message }, 'Erreur extraction groupe');
    }
  }

  return groups;
}

export { SITE_CONFIG, searchJobs, extractJobDetails, scrollAndLoad, searchGroups, extractJobFromCard };
