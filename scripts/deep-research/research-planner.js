import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const SOURCE_TYPES = {
  LINKEDIN: { name: 'LinkedIn', requiresAuth: true, priority: 1 },
  INDEED: { name: 'Indeed', requiresAuth: false, priority: 2 },
  COMPANY_CAREER: { name: 'Company Career Pages', requiresAuth: false, priority: 3 },
  WELCOME_JUNGLE: { name: 'Welcome to the Jungle', requiresAuth: false, priority: 4 },
  GLASSDOOR: { name: 'Glassdoor', requiresAuth: false, priority: 5 },
  REKRUTE: { name: 'Rekrute', requiresAuth: false, priority: 6 },
  HONEYPOT: { name: 'Honeypot', requiresAuth: false, priority: 7 },
  STACKJOBS: { name: 'StackJobs', requiresAuth: false, priority: 8 }
};

function createResearchPlan(profile, userRequest = {}, options = {}) {
  log.info({ profile: profile?.prenom, request: userRequest }, 'Creation du plan de recherche');

  const keywords = generateKeywords(profile, userRequest);
  const locations = generateLocations(profile, userRequest);
  const sources = selectSources(profile, userRequest);
  const queries = generateQueries(profile, keywords, locations);
  const strategy = determineStrategy(profile, userRequest);

  const plan = {
    keywords,
    locations,
    sources,
    queries,
    strategy,
    maxResults: options.maxResults || 50,
    searchGroups: options.searchGroups ?? true,
    searchCompanyPages: options.searchCompanyPages ?? true,
    timestamp: new Date().toISOString()
  };

  log.info({ keywords: keywords.length, queries: queries.length, sources: sources.length }, 'Plan de recherche cree');
  return plan;
}

function generateKeywords(profile, userRequest) {
  const keywords = new Set();
  const requestLower = (userRequest || '').toLowerCase();

  if (profile?.competences) {
    for (const c of profile.competences.slice(0, 8)) {
      keywords.add(c);
    }
  }

  if (profile?.targetRoles) {
    for (const r of profile.targetRoles.slice(0, 3)) {
      keywords.add(r);
    }
  }

  if (profile?.categories) {
    for (const cat of profile.categories.slice(0, 3)) {
      keywords.add(cat + ' Developer');
    }
  }

  const requestKeywords = requestLower.match(/[a-z]{3,}/g) || [];
  const techWords = requestKeywords.filter(w =>
    !['pour', 'les', 'offres', 'emploi', 'job', 'cherche', 'recherche', 'find', 'the', 'and', 'with', 'best', 'meilleures', 'bonnes'].includes(w)
  );
  for (const w of techWords) {
    keywords.add(w);
  }

  return [...keywords].filter(k => k.length > 1);
}

function generateLocations(profile, userRequest) {
  const locations = new Set();
  const requestLower = (userRequest || '').toLowerCase();

  const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Agadir', 'Tangier', 'Tanger', 'Fes', 'Meknes', 'Oujda', 'Kenitra'];
  for (const city of cities) {
    if (requestLower.includes(city.toLowerCase())) {
      locations.add(city);
    }
  }

  if (profile?.localisation) {
    locations.add(profile.localisation);
  }

  if (requestLower.includes('maroc') || requestLower.includes('morocco')) {
    locations.add('Maroc');
  }

  if (requestLower.includes('remote') || requestLower.includes('teletravail')) {
    locations.add('Remote');
  }

  if (locations.size === 0) {
    locations.add('Maroc');
  }

  return [...locations];
}

function selectSources(profile, userRequest) {
  const sources = [];
  const requestLower = (userRequest || '').toLowerCase();

  sources.push({ ...SOURCE_TYPES.LINKEDIN, reason: 'Source principale d\'offres d\'emploi' });

  sources.push({ ...SOURCE_TYPES.INDEED, reason: 'Base de donnees large d\'offres' });

  if (requestLower.includes('startup') || requestLower.includes('tech')) {
    sources.push({ ...SOURCE_TYPES.WELCOME_JUNGLE, reason: 'Specialise entreprises tech/startups' });
  }

  if (requestLower.includes('avis') || requestLower.includes('glassdoor') || requestLower.includes('salaire')) {
    sources.push({ ...SOURCE_TYPES.GLASSDOOR, reason: 'Avis d\'entreprises et informations salariales' });
  }

  if (profile?.localisation === 'Maroc' || requestLower.includes('maroc')) {
    sources.push({ ...SOURCE_TYPES.REKRUTE, reason: 'Plateforme marocaine d\'offres' });
  }

  sources.push({ ...SOURCE_TYPES.COMPANY_CAREER, reason: 'Pages carriere des entreprises' });

  return sources.sort((a, b) => a.priority - b.priority);
}

function generateQueries(profile, keywords, locations) {
  const queries = [];
  const techKeywords = keywords.filter(k =>
    !['Backend', 'Frontend', 'Full Stack'].includes(k)
  );
  const roleKeywords = keywords.filter(k =>
    ['Backend', 'Frontend', 'Full Stack', 'Developer', 'Engineer'].some(r => k.includes(r))
  );

  for (const loc of locations.slice(0, 3)) {
    for (const tech of techKeywords.slice(0, 4)) {
      queries.push(`${tech} Developer ${loc}`);
      queries.push(`${tech} ${loc}`);
    }

    for (const role of roleKeywords.slice(0, 2)) {
      queries.push(`${role} ${loc}`);
    }
  }

  const seen = new Set();
  return queries.filter(q => {
    const normalized = q.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function determineStrategy(profile, userRequest) {
  const requestLower = (userRequest || '').toLowerCase();

  if (requestLower.includes('linkedin') && requestLower.includes('indeed')) {
    return 'multi_platform';
  }

  if (requestLower.includes('linkedin')) {
    return 'linkedin_focused';
  }

  if (requestLower.includes('company') || requestLower.includes('entreprise')) {
    return 'company_focused';
  }

  if (profile?.competences && profile.competences.length > 5) {
    return 'tech_focused';
  }

  return 'balanced';
}

function formatPlanForDisplay(plan) {
  const lines = [
    '=== PLAN DE RECHERCHE ===',
    '',
    `Mots-cles (${plan.keywords.length}):`,
    ...plan.keywords.map(k => `  - ${k}`),
    '',
    `Localisations (${plan.locations.length}):`,
    ...plan.locations.map(l => `  - ${l}`),
    '',
    `Sources (${plan.sources.length}):`,
    ...plan.sources.map(s => `  - ${s.name} (${s.reason})`),
    '',
    `Requetes (${plan.queries.length}):`,
    ...plan.queries.slice(0, 10).map(q => `  - ${q}`),
    plan.queries.length > 10 ? `  ... et ${plan.queries.length - 10} autres` : '',
    '',
    `Strategie: ${plan.strategy}`,
    `Max resultats: ${plan.maxResults}`
  ];

  return lines.join('\n');
}

export { createResearchPlan, formatPlanForDisplay, SOURCE_TYPES };
