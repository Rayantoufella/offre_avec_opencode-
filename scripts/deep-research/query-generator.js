import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const SENIORITY_VARIATIONS = {
  'Junior': ['Junior', 'Entry Level', 'Junior Developer', 'Junior Engineer', 'Debutant'],
  'Mid': ['Mid-Level', 'Intermediate', 'Experienced', 'Confirme'],
  'Senior': ['Senior', 'Expert', 'Lead', 'Principal', 'Staff'],
  'Lead': ['Lead', 'Tech Lead', 'Team Lead', 'Manager', 'Responsable']
};

const CONTRACT_VARIATIONS = {
  'CDI': ['CDI', 'Full-Time', 'Permanent', 'Temps plein'],
  'CDD': ['CDD', 'Contract', 'Temporary', 'Temporaire'],
  'Stage': ['Stage', 'Intern', 'Internship', 'Stagiare'],
  'Alternance': ['Alternance', 'Apprentissage', 'Apprentice', 'Work-Study'],
  'Freelance': ['Freelance', 'Independent', 'Consultant', 'Contractor']
};

const LOCATION_SYNONYMS = {
  'Casablanca': ['Casa', 'Casablanca', 'Grand Casablanca'],
  'Rabat': ['Rabat', 'Sale', 'Temara'],
  'Marrakech': ['Marrakech', 'Marrakesh'],
  'Agadir': ['Agadir', 'Inezgane'],
  'Tangier': ['Tanger', 'Tangier', 'Tangiers'],
  'Fes': ['Fes', 'Fez'],
  'Maroc': ['Morocco', 'Maroc', 'MA'],
  'Remote': ['Remote', 'Teletravail', 'Distanciel', 'Work from home', 'WFH', 'Anywhere']
};

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

export { generateSearchQueries, generateLinkedInQueries, generateIndeedQueries, generateCompanySearchQueries, SENIORITY_VARIATIONS, CONTRACT_VARIATIONS, LOCATION_SYNONYMS };
