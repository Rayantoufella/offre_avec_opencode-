import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const TECH_CATEGORIES = {
  'Backend': ['PHP', 'Laravel', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Spring Boot', 'Ruby on Rails', 'Rails', 'ASP.NET', '.NET', 'Go', 'Rust', 'Java', 'Python'],
  'Frontend': ['JavaScript', 'TypeScript', 'React', 'React.js', 'Vue.js', 'Vue', 'Angular', 'Next.js', 'Nextjs', 'Nuxt.js', 'Nuxt', 'Svelte', 'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap'],
  'Mobile': ['React Native', 'Flutter', 'Dart', 'Swift', 'Kotlin', 'Android', 'iOS'],
  'Database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'SQL', 'Elasticsearch'],
  'DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Linux', 'Nginx'],
  'AI/ML': ['TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'NLP', 'LLM', 'AI', 'Data Science'],
  'Tools': ['Git', 'GitHub', 'GitLab', 'Jira', 'Postman', 'Figma', 'VS Code'],
  'Methodologies': ['Agile', 'Scrum', 'Kanban', 'REST', 'GraphQL', 'API', 'Microservices', 'POO', 'OOP', 'MVC']
};

const SENIORITY_KEYWORDS = {
  'Junior': ['junior', 'debutant', 'entry level', 'starter', '0-2 ans', '0-1 an', 'graduate', 'young talent'],
  'Mid': ['mid-level', 'intermediaire', '2-5 ans', '3-5 ans', 'confirme', 'experienced'],
  'Senior': ['senior', 'expert', 'lead', '5+ ans', '7+ ans', 'architect', 'principal', 'staff'],
  'Lead': ['lead', 'tech lead', 'team lead', 'responsable', 'directeur', 'head of']
};

const CONTRACT_KEYWORDS = {
  'CDI': ['cdi', 'permanent', 'full-time', 'temps plein', 'indefini'],
  'CDD': ['cdd', 'contract', 'temporary', 'temporaire', 'contractuel'],
  'Stage': ['stage', 'intern', 'internship', 'stagiare'],
  'Alternance': ['alternance', 'apprentissage', 'apprentice', 'work-study'],
  'Freelance': ['freelance', 'independant', 'consultant', 'liberal', 'auto-entrepreneur', 'independent']
};

const WORK_MODE_KEYWORDS = {
  'Remote': ['remote', 'teletravail', 'distanciel', 'from home', 'a distance'],
  'Hybride': ['hybride', 'hybrid', '2-3 jours bureau', 'partiel'],
  'Presentiel': ['presentiel', 'on-site', 'bureau', 'office', 'sur site']
};

function analyzeProfile(cvData, userRequest = '') {
  log.info('Analyse du profil candidat');

  const profile = {
    nom: cvData?.nom || '',
    prenom: cvData?.prenom || '',
    email: cvData?.email || '',
    telephone: cvData?.telephone || '',
    competences: extractCompetences(cvData),
    technologies: extractTechnologies(cvData),
    categories: extractCategories(cvData),
    experience: extractSeniority(cvData),
    formation: cvData?.formation || null,
    langues: cvData?.Langues || [],
    localisation: extractLocation(cvData),
    preferences: extractPreferences(userRequest),
    targetRoles: extractTargetRoles(cvData, userRequest),
    rawText: cvData?.text || ''
  };

  log.info({ competences: profile.competences.length, technologies: profile.technologies.length }, 'Profil analyse');
  return profile;
}

function extractCompetences(cvData) {
  const competences = [];
  const text = (cvData?.text || '').toLowerCase();
  const allTechs = Object.values(TECH_CATEGORIES).flat();

  for (const tech of allTechs) {
    const regex = new RegExp(tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(text)) {
      competences.push(tech);
    }
  }

  if (cvData?.competences && Array.isArray(cvData.competences)) {
    for (const c of cvData.competences) {
      if (!competences.includes(c)) {
        competences.push(c);
      }
    }
  }

  return [...new Set(competences)];
}

function extractTechnologies(cvData) {
  const techs = [];
  const text = cvData?.text || '';

  const patterns = [
    /(?:Stack|Technologies|Outils|Langages)\s*:\s*([^\n]+)/gi,
    /(?:using|avec|sur)\s+([A-Z][\w\s,\/]+)/gi
  ];

  for (const p of patterns) {
    let match;
    while ((match = p.exec(text)) !== null) {
      const items = match[1].split(/[,\/\s]+/).filter(Boolean);
      techs.push(...items.map(t => t.trim()));
    }
  }

  return [...new Set(techs)];
}

function extractCategories(cvData) {
  const categories = [];
  const competences = extractCompetences(cvData);

  for (const [cat, techs] of Object.entries(TECH_CATEGORIES)) {
    const hasTech = competences.some(c => techs.includes(c));
    if (hasTech) {
      categories.push(cat);
    }
  }

  return categories;
}

function extractSeniority(cvData) {
  const text = (cvData?.text || '').toLowerCase();

  for (const [level, keywords] of Object.entries(SENIORITY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        return level;
      }
    }
  }

  const expMatch = text.match(/(\d+)\s*ans?\s*(?:d['']?)?experience/i);
  if (expMatch) {
    const years = parseInt(expMatch[1]);
    if (years <= 2) return 'Junior';
    if (years <= 5) return 'Mid';
    return 'Senior';
  }

  return null;
}

function extractLocation(cvData) {
  const text = cvData?.text || '';
  const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Tanger', 'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Nador', 'Safi', 'Mohammedia', 'Khouribga', 'Beni Mellal', 'Errachidia', 'Ouarzazate', 'Essaouira', 'Chefchaouen'];

  for (const city of cities) {
    if (text.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }

  if (text.includes('Maroc') || text.includes('Morocco')) return 'Maroc';
  if (text.includes('Remote') || text.includes('teletravail')) return 'Remote';

  return null;
}

function extractPreferences(userRequest) {
  const prefs = {};
  const lower = (userRequest || '').toLowerCase();

  if (/remote|teletravail|distanciel/.test(lower)) prefs.workMode = 'Remote';
  if (/hybride|hybrid/.test(lower)) prefs.workMode = 'Hybride';
  if (/presentiel|bureau|on-site/.test(lower)) prefs.workMode = 'Presentiel';

  if (/cdi|permanent/.test(lower)) prefs.contract = 'CDI';
  if (/cdd|temporary/.test(lower)) prefs.contract = 'CDD';
  if (/stage|intern/.test(lower)) prefs.contract = 'Stage';
  if (/alternance|apprentissage/.test(lower)) prefs.contract = 'Alternance';
  if (/freelance|independant/.test(lower)) prefs.contract = 'Freelance';

  if (/junior|debutant/.test(lower)) prefs.seniority = 'Junior';
  if (/senior|expert|lead/.test(lower)) prefs.seniority = 'Senior';

  const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Agadir', 'Tangier', 'Tanger', 'Fes', 'Maroc'];
  for (const city of cities) {
    if (lower.includes(city.toLowerCase())) {
      prefs.location = city;
      break;
    }
  }

  return prefs;
}

function extractTargetRoles(cvData, userRequest) {
  const roles = [];
  const text = (cvData?.text || '').toLowerCase() + ' ' + (userRequest || '').toLowerCase();

  const rolePatterns = [
    /develpeur\s+(?:backend|frontend|full\s*stack|web|mobile)/gi,
    /engineer/gi,
    /ing[eé]nieur/gi,
    /architect/gi,
    /devops/gi,
    /data\s+(?:engineer|scientist|analyst)/gi,
    /lead/gi,
    /manager/gi
  ];

  for (const p of rolePatterns) {
    let match;
    while ((match = p.exec(text)) !== null) {
      roles.push(match[0].trim());
    }
  }

  return [...new Set(roles)];
}

function profileToSearchTerms(profile) {
  const terms = [];

  for (const tech of profile.competences.slice(0, 5)) {
    terms.push(tech);
  }

  for (const role of profile.targetRoles.slice(0, 3)) {
    terms.push(role);
  }

  if (profile.experience) {
    terms.push(profile.experience);
  }

  return [...new Set(terms)];
}

export { analyzeProfile, profileToSearchTerms, TECH_CATEGORIES, SENIORITY_KEYWORDS, CONTRACT_KEYWORDS, WORK_MODE_KEYWORDS };
