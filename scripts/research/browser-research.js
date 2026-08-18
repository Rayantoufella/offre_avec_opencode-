import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const SITES = {
  linkedin: {
    name: 'LinkedIn',
    baseUrl: 'https://www.linkedin.com',
    requiresAuth: true,
    features: ['search', 'groups', 'company_pages']
  },
  indeed: {
    name: 'Indeed',
    baseUrl: 'https://www.indeed.com',
    requiresAuth: false,
    features: ['search', 'filter']
  },
  rekrute: {
    name: 'Rekrute',
    baseUrl: 'https://www.rekrute.com',
    requiresAuth: false,
    features: ['search', 'auto_fill'],
    country: 'Morocco'
  }
};

async function browseLinkedIn(page, userKeywords, userLocation) {
  log.info({ keywords: userKeywords, location: userLocation }, 'Navigation LinkedIn');

  const jobs = [];
  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(userKeywords)}&location=${encodeURIComponent(userLocation || '')}`;

  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  await page.waitForSelector('.jobs-search__results-list', { timeout: 15000 }).catch(() => null);

  let scrollCount = 0;
  const maxScrolls = 5;

  while (scrollCount < maxScrolls) {
    const showMoreBtn = await page.$('button.jobs-search-results__pagination-link-button');
    if (showMoreBtn) {
      await showMoreBtn.click();
      await page.waitForTimeout(2000);
      scrollCount++;
    } else {
      break;
    }
  }

  const jobCards = await page.$$('.jobs-search-results__list-item, .scaffold-layout__list-item');

  for (const card of jobCards) {
    try {
      const title = await card.$eval('.job-card-list__title--link', el => el.textContent?.trim()).catch(() => '');
      const company = await card.$eval('.artdeco-entity-lockup__subtitle', el => el.textContent?.trim()).catch(() => '');
      const location = await card.$eval('.artdeco-entity-lockup__caption', el => el.textContent?.trim()).catch(() => '');
      const link = await card.$eval('.job-card-list__title--link', el => el.href).catch(() => '');

      if (title) {
        jobs.push({ title, company, location, link, source: 'LinkedIn' });
      }
    } catch (err) {
      log.debug({ error: err.message }, 'Erreur carte LinkedIn');
    }
  }

  log.info({ total: jobs.length }, 'Offres LinkedIn trouvées');
  return jobs;
}

async function browseLinkedInGroups(page, query) {
  log.info({ query }, 'Recherche groupes LinkedIn');

  const groupsUrl = `https://www.linkedin.com/search/results/groups/?keywords=${encodeURIComponent(query)}`;
  await page.goto(groupsUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  const groups = [];
  const groupCards = await page.$$('.entity-result');

  for (const card of groupCards.slice(0, 10)) {
    try {
      const name = await card.$eval('.entity-result__title-text a', el => el.textContent?.trim()).catch(() => '');
      const members = await card.$eval('.entity-result__primary-subtitle', el => el.textContent?.trim()).catch(() => '');
      const link = await card.$eval('.entity-result__title-text a', el => el.href).catch(() => '');

      if (name) {
        groups.push({ name, members, link, source: 'LinkedIn' });
      }
    } catch (err) {
      log.debug({ error: err.message }, 'Erreur groupe LinkedIn');
    }
  }

  return groups;
}

async function browseLinkedInCompany(page, companyUrl) {
  log.info({ url: companyUrl }, 'Navigation page entreprise LinkedIn');

  await page.goto(companyUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  const companyInfo = {};
  companyInfo.name = await page.$eval('.org-top-card-summary__title, h1', el => el.textContent?.trim()).catch(() => '');
  companyInfo.industry = await page.$eval('.org-top-card-summary__subtitle', el => el.textContent?.trim()).catch(() => '');
  companyInfo.followers = await page.$eval('.org-top-card-summary__followers-count', el => el.textContent?.trim()).catch(() => '');

  const jobSection = await page.$('a[href*="/jobs/"]');
  if (jobSection) {
    await jobSection.click();
    await page.waitForTimeout(3000);
  }

  return companyInfo;
}

export { SITES, browseLinkedIn, browseLinkedInGroups, browseLinkedInCompany };
