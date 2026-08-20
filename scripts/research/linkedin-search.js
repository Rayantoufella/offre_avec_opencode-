import pino from 'pino';
import { QUERIES, getQueriesForProfile, getRecruiterSearches } from './linkedin-queries.js';
import { FEED_KEYWORDS } from '../shared/constants.js';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const SITE_CONFIG = {
  name: 'LinkedIn',
  baseUrl: 'https://www.linkedin.com',
  features: ['search', 'scroll', 'groups', 'company_pages', 'feed', 'people', 'messages']
};

async function searchJobs(page, query, location, options = {}) {
  const { limit = 25, remote = false } = options;
  const jobs = [];

  log.info({ query, location, limit }, 'Recherche LinkedIn jobs');

  const url = new URL('https://www.linkedin.com/jobs/search/');
  url.searchParams.set('keywords', query);
  if (location) url.searchParams.set('location', location);
  if (remote) url.searchParams.set('f_WT', '2');

  await page.goto(url.toString(), { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.jobs-search__results-list, .scaffold-layout__list', { timeout: 10000 }).catch(() => null);

  const cards = await page.$$('.jobs-search-results__list-item, .scaffold-layout__list-item');
  log.info({ found: cards.length }, 'Cartes jobs trouvées');

  for (let i = 0; i < Math.min(cards.length, limit); i++) {
    try {
      const job = await extractJobFromCard(cards[i]);
      if (job && job.title) jobs.push(job);
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

  return { title, company, location, link, postedTime, source: 'LinkedIn' };
}

async function extractJobDetails(page) {
  try {
    await page.waitForSelector('.jobs-search__job-details, .jobs-unified-top-card', { timeout: 10000 });

    const title = await page.$eval('.jobs-unified-top-card__job-title, h1', el => el.textContent?.trim()).catch(() => '');
    const company = await page.$eval('.jobs-unified-top-card__company-name, .jobs-unified-top-card__company-link', el => el.textContent?.trim()).catch(() => '');
    const location = await page.$eval('.jobs-unified-top-card__bullet, .jobs-unified-top-card__workplace-type', el => el.textContent?.trim()).catch(() => '');
    const description = await page.$eval('.jobs-description, .jobs-box__html-content', el => el.textContent?.trim()).catch(() => '');
    const salary = await page.$eval('.jobs-unified-top-card__job-insight span', el => el.textContent?.trim()).catch(() => '');

    return { title, company, location, description, salary, source: 'LinkedIn' };
  } catch (err) {
    log.debug({ error: err.message }, 'Erreur extraction détails');
    return null;
  }
}

async function scrollAndLoad(page, maxScrolls = 5) {
  let count = 0;
  while (count < maxScrolls) {
    const btn = await page.$('button.jobs-search-results__pagination-link-button, button[aria-label="Voir plus des offres"]');
    if (btn) {
      await btn.click();
      await page.waitForTimeout(2000);
      count++;
    } else {
      break;
    }
  }
  log.info({ scrolls: count }, 'Scroll jobs terminé');
}

async function searchPeople(page, query, location) {
  log.info({ query }, 'Recherche personnes LinkedIn');

  const url = new URL('https://www.linkedin.com/search/results/people/');
  url.searchParams.set('keywords', query);
  if (location) url.searchParams.set('geoUrn', location);

  await page.goto(url.toString(), { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.reusable-search__result-container, .entity-result', { timeout: 10000 }).catch(() => null);

  const results = [];
  const cards = await page.$$('.reusable-search__result-container .entity-result, .entity-result');
  log.info({ found: cards.length }, 'Personnes trouvées');

  for (const card of cards.slice(0, 10)) {
    try {
      const name = await card.$eval('.entity-result__title-text a span[aria-hidden="true"]', el => el.textContent?.trim()).catch(() => '');
      const role = await card.$eval('.entity-result__primary-subtitle', el => el.textContent?.trim()).catch(() => '');
      const locationPerson = await card.$eval('.entity-result__secondary-subtitle', el => el.textContent?.trim()).catch(() => '');
      const link = await card.$eval('.entity-result__title-text a', el => el.href).catch(() => '');

      if (name) {
        results.push({ name, role, location: locationPerson, link, source: 'LinkedIn' });
      }
    } catch (err) {
      log.debug({ error: err.message }, 'Erreur extraction personne');
    }
  }

  return results;
}

async function scrollFeed(page, keywords = FEED_KEYWORDS, maxScrolls = 10) {
  log.info({ keywords: keywords.length, maxScrolls }, 'Scroll feed LinkedIn');

  await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.feed-shared-update-v2, .scaffold-finite-scroll__content', { timeout: 10000 }).catch(() => null);

  const posts = [];
  let scrollCount = 0;

  while (scrollCount < maxScrolls) {
    const feedItems = await page.$$('.feed-shared-update-v2');
    log.debug({ scrollCount, items: feedItems.length }, 'Élément feed');

    for (const item of feedItems) {
      try {
        const post = await extractPostFromFeed(item);
        if (!post) continue;

        const textLower = (post.text || '').toLowerCase();
        const matchesKeyword = keywords.some(kw => textLower.includes(kw.toLowerCase()));

        if (matchesKeyword) {
          posts.push(post);
          log.debug({ text: post.text?.substring(0, 100) }, 'Post d\'embauche trouvé');
        }
      } catch (err) {
        log.debug({ error: err.message }, 'Erreur extraction post');
      }
    }

    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(2000);
    scrollCount++;

    const noMore = await page.$('.feed-shared-finite-scroll__no-more-posts');
    if (noMore) break;
  }

  log.info({ total: posts.length, scrolls: scrollCount }, 'Scroll feed terminé');
  return posts;
}

async function extractPostFromFeed(item) {
  const author = await item.$eval('.feed-shared-actor__name, .feed-shared-actor__title', el => el.textContent?.trim()).catch(() => '');
  const authorLink = await item.$eval('.feed-shared-actor__name a, .feed-shared-actor__title a', el => el.href).catch(() => '');
  const text = await item.$eval('.feed-shared-text, .feed-shared-update-v2__description', el => el.textContent?.trim()).catch(() => '');
  const link = await item.$eval('.feed-shared-control-menu__permalink, .feed-shared-full-content-link', el => el.href).catch(() => '');

  const hasJobKeywords = /recrute|hiring|emploi|poste|rejoindre|offre|job|equipe/i.test(text || '');
  if (!hasJobKeywords) return null;

  return {
    author,
    authorLink,
    text,
    link,
    postedTime: '',
    source: 'LinkedIn Feed',
    type: 'feed_post'
  };
}

async function scrollGroupMessages(page, groupUrl, maxScrolls = 5) {
  log.info({ groupUrl, maxScrolls }, 'Scroll messages groupe LinkedIn');

  await page.goto(groupUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.feed-shared-update-v2, .group-see-more-posts', { timeout: 10000 }).catch(() => null);

  const posts = [];
  let scrollCount = 0;

  while (scrollCount < maxScrolls) {
    const items = await page.$$('.feed-shared-update-v2');

    for (const item of items) {
      try {
        const post = await extractPostFromFeed(item);
        if (post) posts.push(post);
      } catch (err) {
        log.debug({ error: err.message }, 'Erreur extraction post groupe');
      }
    }

    const seeMore = await page.$('.group-see-more-posts');
    if (seeMore) {
      await seeMore.click();
      await page.waitForTimeout(2000);
      scrollCount++;
    } else {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(2000);
      scrollCount++;
    }
  }

  log.info({ total: posts.length, scrolls: scrollCount }, 'Scroll groupe terminé');
  return posts;
}

async function extractEmailFromProfile(page) {
  const email = await page.$eval('a[href^="mailto:"], .pv-contact-info__contact-link', el => {
    return el.href ? el.href.replace('mailto:', '').trim() : el.textContent?.trim();
  }).catch(() => '');

  if (email && email.includes('@')) {
    log.debug({ email }, 'Email trouvé sur profil');
    return email;
  }

  const contactInfoBtn = await page.$('#contact-info, .pv-profile-section__section-action-button');
  if (contactInfoBtn) {
    await contactInfoBtn.click();
    await page.waitForTimeout(2000);

    const modalEmail = await page.$eval('a[href^="mailto:"], .pv-contact-info__contact-link', el => {
      return el.href ? el.href.replace('mailto:', '').trim() : el.textContent?.trim();
    }).catch(() => '');

    const closeBtn = await page.$('button[aria-label="Fermer"], button.artdeco-modal__dismiss');
    if (closeBtn) await closeBtn.click().catch(() => null);

    if (modalEmail && modalEmail.includes('@')) {
      log.debug({ email: modalEmail }, 'Email trouvé via modal');
      return modalEmail;
    }
  }

  return '';
}

async function findRecruiterEmail(page, company, role) {
  log.info({ company, role }, 'Recherche email recruteur');

  const searchQuery = `${role || 'Talent Acquisition'} ${company}`;
  await searchPeople(page, searchQuery);

  const profileLinks = await page.$$eval('.entity-result__title-text a', links =>
    links.slice(0, 3).map(a => a.href)
  ).catch(() => []);

  for (const profileUrl of profileLinks) {
    try {
      await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.waitForTimeout(1000);

      const email = await extractEmailFromProfile(page);
      if (email) {
        log.info({ email, company }, 'Email recruteur trouvé');
        return email;
      }
    } catch (err) {
      log.debug({ error: err.message }, 'Erreur recherche email');
    }
  }

  return '';
}

async function searchAll(page, queries, location, options = {}) {
  const { limitPerQuery = 10, maxQueries = 5, scrollFeed = true } = options;

  const allJobs = [];
  const queriesToUse = queries.slice(0, maxQueries);

  log.info({ queries: queriesToUse.length, location }, 'Recherche LinkedIn complète');

  for (const query of queriesToUse) {
    try {
      const jobs = await searchJobs(page, query, location, { limit: limitPerQuery });
      allJobs.push(...jobs);
      log.info({ query, found: jobs.length }, 'Requête terminée');
      await page.waitForTimeout(2000 + Math.random() * 3000);
    } catch (err) {
      log.debug({ query, error: err.message }, 'Erreur requête');
    }
  }

  if (scrollFeed) {
    try {
      const feedPosts = await scrollFeed(page, FEED_KEYWORDS, 5);
      const feedJobs = feedPosts.map(post => ({
        title: extractJobTitleFromPost(post.text),
        company: post.author,
        location: '',
        link: post.link || post.authorLink,
        postedTime: post.postedTime,
        description: post.text,
        source: 'LinkedIn Feed',
        type: 'feed_post'
      }));
      allJobs.push(...feedJobs);
      log.info({ feedJobs: feedJobs.length }, 'Jobs du feed ajoutés');
    } catch (err) {
      log.debug({ error: err.message }, 'Erreur scroll feed');
    }
  }

  return allJobs;
}

function extractJobTitleFromPost(text) {
  if (!text) return '';
  const lines = text.split('\n').filter(l => l.trim());
  return lines[0]?.substring(0, 100) || '';
}

export {
  SITE_CONFIG,
  searchJobs, extractJobFromCard, extractJobDetails, scrollAndLoad,
  searchPeople, scrollFeed, scrollGroupMessages,
  extractEmailFromProfile, findRecruiterEmail,
  searchAll, extractJobTitleFromPost
};
