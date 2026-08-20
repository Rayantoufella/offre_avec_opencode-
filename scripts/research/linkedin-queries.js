import pino from 'pino';

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

const RECRUITER_SEARCHES = [
  'Talent Acquisition',
  'IT Recruiter',
  'Hiring Manager',
  'Recruteur IT',
  'Responsable RH',
  'HR Manager',
  'IT Talent Acquisition'
];

const FEED_KEYWORDS = [
  'on recrute',
  'nous recrutons',
  'rejoignez-nous',
  'poste a pourvoir',
  'offre d\'emploi',
  'we are hiring',
  'job opening',
  'rejoindre notre equipe',
  'nous cherchons',
  'a pourvoir immediatement'
];

const LOCATION_VARIANTS = {
  'Casablanca': ['Casablanca', 'Casablanca-Settat'],
  'Rabat': ['Rabat', 'Rabat-Sale-Kenitra'],
  'Marrakech': ['Marrakech', 'Marrakech-Safi'],
  'Agadir': ['Agadir', 'Souss-Massa'],
  'Tanger': ['Tanger', 'Tanger-Tetouan-Al Hoceima'],
  'Fes': ['Fes', 'Fes-Meknes'],
  'Maroc': ['Maroc', 'Morocco', 'All Morocco'],
  'Remote': ['Remote', 'Teletravail', 'Distanciel', 'Anywhere']
};

const CONTRACT_KEYWORDS = {
  'CDI': ['cdi', 'permanent', 'full-time', 'temps plein'],
  'CDD': ['cdd', 'temporary', 'temporaire', 'contract'],
  'Stage': ['stage', 'intern', 'internship', 'stagiare', 'pfe', 'pfm'],
  'Alternance': ['alternance', 'apprentissage', 'apprentice', 'work-study'],
  'Freelance': ['freelance', 'independant', 'consultant', 'auto-entrepreneur']
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
  return RECRUITER_SEARCHES.map(role => `${role} ${company}`);
}

function getFeedKeywords() {
  return FEED_KEYWORDS;
}

function getContractKeywords(contractType) {
  const type = (contractType || '').toLowerCase();
  for (const [key, keywords] of Object.entries(CONTRACT_KEYWORDS)) {
    if (keywords.some(kw => type.includes(kw))) {
      return keywords;
    }
  }
  return CONTRACT_KEYWORDS['CDI'];
}

export {
  QUERIES, RECRUITER_SEARCHES, FEED_KEYWORDS,
  LOCATION_VARIANTS, CONTRACT_KEYWORDS,
  getQueriesForProfile, getRecruiterSearches, getFeedKeywords, getContractKeywords
};
