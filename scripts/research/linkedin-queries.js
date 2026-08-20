import pino from 'pino';
import { LOCATION_VARIANTS, CONTRACT_KEYWORDS, FEED_KEYWORDS, RECRUITER_ROLES, getContractKeywords as getContractKeywordsFromConstants } from '../shared/constants.js';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const QUERIES = {
  general: [
    'stage PFE Maroc',
    'premier emploi Maroc',
    'recrutement Maroc',
    'offre junior Maroc',
    'hiring Morocco',
    'we are hiring Morocco',
    'remote Maroc',
    'freelance Maroc'
  ],
  backend: [
    'developpeur junior Maroc',
    'developpeur backend junior Maroc',
    'Laravel junior Maroc',
    'PHP junior Maroc',
    'stage developpeur web Maroc',
    'PFE developpement web Maroc',
    'Junior developer Morocco',
    'Entry level developer Morocco'
  ],
  frontend: [
    'developpeur frontend junior Maroc',
    'React junior Maroc',
    'JavaScript junior Maroc',
    'stage frontend Maroc'
  ],
  fullstack: [
    'developpeur full stack junior Maroc',
    'fullstack junior Maroc',
    'stage fullstack Maroc',
    'PFE fullstack Maroc'
  ],
  data: [
    'data analyst Maroc',
    'stage data analyst Maroc',
    'Power BI Maroc',
    'SQL junior Maroc',
    'Business Intelligence Maroc',
    'Data analyst Morocco'
  ],
  support: [
    'helpdesk Maroc',
    'support IT Maroc',
    'technicien support Maroc',
    'IT support junior Maroc',
    'service desk Maroc',
    'Helpdesk technician Morocco'
  ],
  ai: [
    'developpeur IA Maroc',
    'prompt engineering Maroc',
    'automation Maroc',
    'AI junior Maroc',
    'stage IA Maroc'
  ]
};

function getQueriesForProfile(profile) {
  const queries = [];

  const text = `${profile.competences?.join(' ') || ''} ${profile.targetRoles?.join(' ') || ''}`.toLowerCase();

  if (/php|laravel|backend|api|mysql/.test(text)) {
    queries.push(...QUERIES.backend);
  }
  if (/react|vue|angular|frontend|css|tailwind/.test(text)) {
    queries.push(...QUERIES.frontend);
  }
  if (/fullstack|full.stack|both/.test(text)) {
    queries.push(...QUERIES.fullstack);
  }
  if (/data|sql|power.bi|bi|analytics/.test(text)) {
    queries.push(...QUERIES.data);
  }
  if (/helpdesk|support|technicien/.test(text)) {
    queries.push(...QUERIES.support);
  }
  if (/ia|ai|llm|machine.learning|prompt/.test(text)) {
    queries.push(...QUERIES.ai);
  }

  if (queries.length === 0) {
    queries.push(...QUERIES.general);
  }

  const unique = [...new Set(queries)];
  log.info({ total: unique.length }, 'Requetes LinkedIn generees');
  return unique;
}

function getRecruiterSearches(company) {
  return RECRUITER_ROLES.map(role => `${role} ${company}`);
}

function getFeedKeywords() {
  return FEED_KEYWORDS;
}

function getContractKeywords(contractType) {
  return getContractKeywordsFromConstants(contractType);
}

function getLocationsForCity(city) {
  return LOCATION_VARIANTS[city] || [city];
}

export {
  QUERIES, FEED_KEYWORDS, LOCATION_VARIANTS, CONTRACT_KEYWORDS,
  getQueriesForProfile, getRecruiterSearches, getFeedKeywords, getContractKeywords, getLocationsForCity
};
