import pino from 'pino';
import { LOCATION_VARIANTS, CONTRACT_KEYWORDS, SENIORITY_KEYWORDS } from '../shared/constants.js';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const SENIORITY_VARIATIONS = SENIORITY_KEYWORDS;

const CONTRACT_VARIATIONS = CONTRACT_KEYWORDS;

const LOCATION_SYNONYMS = LOCATION_VARIANTS;

function generateSearchQueries(plan) {
  const queries = [];
  const { keywords, locations, queries: planQueries } = plan;

  for (const q of planQueries) {
    queries.push({
      query: q,
      source: 'all',
      priority: 1
    });
  }

  for (const tech of keywords.slice(0, 5)) {
    for (const loc of locations.slice(0, 2)) {
      queries.push({
        query: `${tech} ${loc}`,
        source: 'all',
        priority: 2
      });

      for (const synonym of (LOCATION_SYNONYMS[loc] || []).slice(0, 2)) {
        if (synonym !== loc) {
          queries.push({
            query: `${tech} ${synonym}`,
            source: 'all',
            priority: 3
          });
        }
      }
    }
  }

  const seniority = plan.strategy === 'tech_focused' ? 'Junior' : null;
  if (seniority) {
    for (const variation of (SENIORITY_VARIATIONS[seniority] || []).slice(0, 2)) {
      for (const tech of keywords.slice(0, 3)) {
        queries.push({
          query: `${variation} ${tech} Developer`,
          source: 'linkedin',
          priority: 2
        });
      }
    }
  }

  const seen = new Set();
  return queries.filter(q => {
    const key = q.query.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateLinkedInQueries(plan) {
  const queries = [];
  const { keywords, locations } = plan;

  for (const tech of keywords.slice(0, 5)) {
    for (const loc of locations.slice(0, 2)) {
      queries.push(`${tech} Developer ${loc}`);
      queries.push(`${tech} ${loc}`);
    }
  }

  for (const role of keywords.filter(k => k.includes('Developer') || k.includes('Engineer')).slice(0, 3)) {
    for (const loc of locations.slice(0, 2)) {
      queries.push(`${role} ${loc}`);
    }
  }

  return [...new Set(queries)];
}

function generateIndeedQueries(plan) {
  const queries = [];
  const { keywords, locations } = plan;

  for (const tech of keywords.slice(0, 4)) {
    for (const loc of locations.slice(0, 2)) {
      queries.push({ q: tech, l: loc });
    }
  }

  return queries;
}

function generateCompanySearchQueries(profile, companies = []) {
  const queries = [];

  for (const company of companies) {
    queries.push(`${company} careers`);
    queries.push(`${company} jobs`);
    queries.push(`${company} hiring`);
  }

  if (profile?.categories) {
    for (const cat of profile.categories.slice(0, 2)) {
      queries.push(`${cat} company Morocco careers`);
    }
  }

  return queries;
}

export {
  generateSearchQueries, generateLinkedInQueries, generateIndeedQueries, generateCompanySearchQueries,
  SENIORITY_VARIATIONS, CONTRACT_VARIATIONS, LOCATION_SYNONYMS
};
