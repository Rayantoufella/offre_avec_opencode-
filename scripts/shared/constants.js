const LOCATION_VARIANTS = {
  'Casablanca': ['Casablanca', 'Casablanca-Settat', 'Casa', 'Grand Casablanca'],
  'Rabat': ['Rabat', 'Rabat-Sale-Kenitra', 'Sale', 'Temara'],
  'Marrakech': ['Marrakech', 'Marrakech-Safi', 'Marrakesh'],
  'Agadir': ['Agadir', 'Souss-Massa', 'Inezgane'],
  'Tanger': ['Tanger', 'Tanger-Tetouan-Al Hoceima', 'Tangier', 'Tangiers'],
  'Fes': ['Fes', 'Fes-Meknes', 'Fez'],
  'Maroc': ['Maroc', 'Morocco', 'MA', 'All Morocco'],
  'Remote': ['Remote', 'Teletravail', 'Distanciel', 'Work from home', 'WFH', 'Anywhere']
};

const CONTRACT_KEYWORDS = {
  'CDI': ['CDI', 'Full-Time', 'Permanent', 'Temps plein', 'full-time', 'permanent'],
  'CDD': ['CDD', 'Contract', 'Temporary', 'Temporaire', 'temporary', 'contract'],
  'Stage': ['Stage', 'Intern', 'Internship', 'Stagiare', 'PFE', 'PFM', 'intern', 'internship'],
  'Alternance': ['Alternance', 'Apprentissage', 'Apprentice', 'Work-Study', 'apprentice'],
  'Freelance': ['Freelance', 'Independent', 'Consultant', 'Contractor', 'independent', 'consultant']
};

const SENIORITY_KEYWORDS = {
  'Junior': ['Junior', 'Entry Level', 'Junior Developer', 'Junior Engineer', 'Debutant', 'entry level'],
  'Mid': ['Mid-Level', 'Intermediate', 'Experienced', 'Confirme', 'intermediate'],
  'Senior': ['Senior', 'Expert', 'Lead', 'Principal', 'Staff', 'expert'],
  'Lead': ['Lead', 'Tech Lead', 'Team Lead', 'Manager', 'Responsable', 'tech lead']
};

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

const RECRUITER_ROLES = [
  'Talent Acquisition',
  'IT Recruiter',
  'Hiring Manager',
  'Recruteur IT',
  'Responsable RH',
  'HR Manager',
  'IT Talent Acquisition'
];

function getLocationsForCity(city) {
  return LOCATION_VARIANTS[city] || [city];
}

function getContractKeywords(contractType) {
  const type = (contractType || '').toLowerCase();
  for (const [key, keywords] of Object.entries(CONTRACT_KEYWORDS)) {
    if (keywords.some(kw => type.includes(kw.toLowerCase()))) {
      return keywords;
    }
  }
  return CONTRACT_KEYWORDS['CDI'];
}

function getSeniorityKeywords(level) {
  const lvl = (level || '').toLowerCase();
  for (const [key, keywords] of Object.entries(SENIORITY_KEYWORDS)) {
    if (keywords.some(kw => kw.toLowerCase().includes(lvl))) {
      return keywords;
    }
  }
  return [];
}

export {
  LOCATION_VARIANTS, CONTRACT_KEYWORDS, SENIORITY_KEYWORDS,
  FEED_KEYWORDS, RECRUITER_ROLES,
  getLocationsForCity, getContractKeywords, getSeniorityKeywords
};
