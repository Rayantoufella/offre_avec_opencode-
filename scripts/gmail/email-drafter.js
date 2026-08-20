import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const CANDIDAT = {
  nom: 'Toufella',
  prenom: 'Rayan',
  titre: 'Développeur Backend — PHP / Laravel & IA',
  email: 'rayan.toufella.05@gmail.com',
  telephone: '+212 602 231 594',
  competences: [
    'PHP', 'Laravel', 'JavaScript', 'Vue.js 3', 'React',
    'MySQL', 'API REST', 'Docker', 'Git', 'IA / LLM',
    'Sanctum', 'GitHub Actions', 'PHPUnit', 'UML', 'MCD/MLD'
  ],
  projets: [
    {
      nom: 'Allo Delivery',
      description: 'plateforme de livraison',
      details: 'workflow de livraison à 6 statuts, assistant IA de préremplissage, rôles client/driver',
      stack: ['Vue 3', 'Laravel', 'Sanctum', 'MySQL', 'Docker'],
      tags: ['api', 'livraison', 'ia', 'vue', 'laravel', 'docker', 'sanctum']
    },
    {
      nom: 'TalentMatch',
      description: 'présélection de candidats par IA',
      details: 'analyse CV/offre par IA, score de correspondance, assistant conversationnel',
      stack: ['Laravel', 'API LLM', 'MySQL'],
      tags: ['ia', 'llm', 'laravel', 'recrutement', 'api']
    },
    {
      nom: 'Aji L3bo Café Manager',
      description: 'système de gestion',
      details: 'catalogue, réservations, sessions en temps réel, architecture MVC',
      stack: ['PHP MVC', 'Composer', 'MySQL'],
      tags: ['mvc', 'php', 'gestion', 'temps reel']
    }
  ],
  formation: 'Formation Développeur Backend — PHP / Laravel augmenté par l\'IA (Simplon Maghreb × JobInTech, 2026)',
  profil: 'Développeur backend junior formé au PHP / Laravel et au développement web augmenté par l\'IA'
};

const DOMAINS = {
  backend: {
    keywords: ['backend', 'back-end', 'php', 'laravel', 'api', 'rest', 'node', 'python', 'java', 'spring', 'database', 'mysql', 'sql', 'symfony'],
    intro: 'Développeur Backend formé au PHP / Laravel et à l\'intégration d\'IA en production, je maîtrise la conception d\'API REST sécurisées, la modélisation de bases de données (MySQL, MCD/MLD) ainsi que le déploiement conteneurisé (Docker, GitHub Actions).',
    skills: ['PHP', 'Laravel', 'API REST', 'MySQL', 'Docker']
  },
  frontend: {
    keywords: ['frontend', 'front-end', 'react', 'vue', 'angular', 'javascript', 'typescript', 'ui', 'ux', 'css', 'tailwind'],
    intro: 'Développeur Frontend maîtrisant React.js et Vue.js 3, je conçois des interfaces utilisateur performantes et accessibles. Mon expérience inclut la consommation d\'API REST, la gestion d\'état (Pinia, Vuex) et l\'intégration de composants réutilisables.',
    skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'UI/UX']
  },
  fullstack: {
    keywords: ['fullstack', 'full-stack', 'full stack', 'fullstack', 'react', 'vue', 'php', 'laravel', 'node'],
    intro: 'Développeur Full Stack formé au PHP / Laravel et au React / Vue.js, je maîtrise aussi bien la conception d\'API REST sécurisées que le développement d\'interfaces utilisateur riches et interactives.',
    skills: ['PHP', 'Laravel', 'React', 'Vue.js', 'MySQL', 'Docker']
  },
  devops: {
    keywords: ['devops', 'ci/cd', 'docker', 'kubernetes', 'aws', 'cloud', 'linux', 'jenkins', 'gitlab'],
    intro: 'Développeur avec solides compétences en DevOps, je maîtrise la conteneurisation Docker, les pipelines CI/CD (GitHub Actions) et le déploiement cloud (AWS). Je suis capable d\'automatiser les processus de livraison et d\'optimiser les environnements de production.',
    skills: ['Docker', 'GitHub Actions', 'AWS', 'Linux', 'CI/CD']
  }
};

const CONTRACT_INTROS = {
  cdi: {
    prefix: 'Candidature —',
    opening: (poste, entreprise) => `Je me permets de vous adresser ma candidature pour le poste de ${poste} au sein de ${entreprise}.`,
    closing: 'Ce parcours technique, allié à ma rigueur et à ma capacité d\'autonomie, me permet d\'apporter une contribution efficace dès les premières semaines.\n\nJe reste à votre entière disposition pour un entretien afin d\'échanger sur la valeur que je pourrais apporter à votre équipe.\n\nDans l\'attente de votre retour, je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.'
  },
  stage: {
    prefix: 'Candidature stage —',
    opening: (poste, entreprise) => `Actuellement titulaire d'une formation en Développeur Backend — PHP / Laravel augmenté par l'IA (Simplon Maghreb × JobInTech), je suis à la recherche d'un stage pour mettre en pratique mes compétences au sein de ${entreprise}, pour le poste de ${poste}.`,
    closing: 'Motivé et curieux, je souhaite contribuer activement à vos projets tout en enrichissant mon expérience professionnelle.\n\nJe me tiens à votre disposition pour un entretien à votre convenance.\n\nEn vous remerciant de l\'attention que vous porterez à ma candidature, je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.'
  },
  alternance: {
    prefix: 'Candidature alternance —',
    opening: (poste, entreprise) => `En formation en Développeur Backend — PHP / Laravel augmenté par l'IA (Simplon Maghreb × JobInTech), je recherche un contrat en alternance pour le poste de ${poste} au sein de ${entreprise}.`,
    closing: 'Cette alternance correspond parfaitement à mon projet professionnel et je suis engagé à apporter une contribution durable à votre structure.\n\nJe reste disponible pour un entretien à votre convenance.\n\nVeuillez recevoir, Madame, Monsieur, mes salutations distinguées.'
  },
  cdd: {
    prefix: 'Candidature —',
    opening: (poste, entreprise) => `Développeur Backend spécialisé en PHP / Laravel et en intégration d'IA, je vous propose ma candidature pour le poste de ${poste} proposé par ${entreprise}.`,
    closing: 'Maîtrisant la conception d\'API REST sécurisées et le développement frontend (Vue.js 3, React), je suis en mesure de contribuer efficacement à cette mission technique.\n\nVous trouverez ci-joint mon curriculum vitae pour votre considération.\n\nDans l\'attente de votre retour, je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.'
  },
  freelance: {
    prefix: 'Proposition —',
    opening: (poste, entreprise) => `En tant que développeur backend freelance, je vous propose mes services pour le poste de ${poste} au sein de ${entreprise}.`,
    closing: 'Spécialisé en PHP / Laravel et en intégration d\'API LLM, je suis capable d\'intervenir rapidement sur des missions techniques complexes.\n\nMon portfolio et mon curriculum vitae sont joints à ce message.\n\nJe serais ravi d\'échanger avec vous sur cette opportunité.\n\nCordialement.'
  }
};

function normalizeKeys(offer) {
  const out = {};
  for (const [key, value] of Object.entries(offer)) {
    out[key.toLowerCase()] = value;
  }
  return out;
}

function detectDomain(offer) {
  const n = normalizeKeys(offer);
  const text = `${n.poste || ''} ${n.description || ''} ${n.technologies || ''}`.toLowerCase();

  let bestDomain = 'backend';
  let bestScore = 0;

  for (const [domain, config] of Object.entries(DOMAINS)) {
    let score = 0;
    for (const kw of config.keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }

  return bestDomain;
}

function detectContractType(offer) {
  const n = normalizeKeys(offer);
  const text = `${n.type_offre || ''} ${n.type || ''} ${n.poste || ''} ${n.description || ''}`.toLowerCase();

  if (/stage/.test(text)) return 'stage';
  if (/alternance|apprentissage/.test(text)) return 'alternance';
  if (/cdi|permanent/.test(text)) return 'cdi';
  if (/cdd|contractuel|temporaire/.test(text)) return 'cdd';
  if (/freelance|independant|liberal/.test(text)) return 'freelance';
  return 'cdi';
}

function extractJobTechnologies(offer) {
  const n = normalizeKeys(offer);
  const text = `${n.poste || ''} ${n.description || ''} ${n.technologies || ''}`.toLowerCase();

  const allTechs = [
    'php', 'laravel', 'symfony', 'javascript', 'typescript', 'react', 'vue', 'vue.js', 'angular',
    'node', 'nodejs', 'python', 'java', 'spring', 'docker', 'kubernetes', 'aws', 'mysql', 'postgresql',
    'mongodb', 'redis', 'git', 'github actions', 'ci/cd', 'linux', 'api rest', 'rest', 'graphql',
    'sanctum', 'jwt', 'tailwind', 'bootstrap', 'sass', 'alpine.js', 'vite', 'pinia',
    'html', 'css', 'sql', 'oracle', 'mongodb', 'firebase', 'supabase'
  ];

  return allTechs.filter(tech => text.includes(tech));
}

function matchProjects(jobTechs) {
  const scored = CANDIDAT.projets.map(project => {
    let score = 0;
    for (const tech of jobTechs) {
      for (const tag of project.tags) {
        if (tag.includes(tech) || tech.includes(tag)) {
          score += 2;
          break;
        }
      }
      for (const projTech of project.stack) {
        if (projTech.toLowerCase().includes(tech) || tech.includes(projTech.toLowerCase())) {
          score += 3;
          break;
        }
      }
    }
    return { ...project, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function formatProjects(projects) {
  return projects.map(p => {
    const stackStr = p.stack.join(', ');
    return `  • ${p.nom} — ${p.description} (${stackStr})\n    ${p.details}`;
  }).join('\n');
}

function extractRelevantSkills(jobTechs, domainSkills) {
  const relevant = [];
  const allSkills = [...new Set([...domainSkills, ...CANDIDAT.competences])];

  for (const skill of allSkills) {
    for (const tech of jobTechs) {
      if (skill.toLowerCase().includes(tech) || tech.includes(skill.toLowerCase())) {
        relevant.push(skill);
        break;
      }
    }
  }

  return relevant.length > 0 ? relevant.slice(0, 5) : domainSkills.slice(0, 3);
}

function buildDraft({ domain, contract, company, title, projects, skills }) {
  const domainConfig = DOMAINS[domain] || DOMAINS.backend;
  const contractConfig = CONTRACT_INTROS[contract] || CONTRACT_INTROS.cdi;

  const opening = contractConfig.opening(title, company);
  const projectsStr = formatProjects(projects);
  const skillsStr = skills.join(', ');

  const body = `${opening}

${domainConfig.intro}

Mes projets récents m'ont permis de développer une expertise concrète :

${projectsStr}

${contractConfig.closing}`;

  return body;
}

function generateSubject(contract, title) {
  const prefix = CONTRACT_INTROS[contract]?.prefix || 'Candidature —';
  return `${prefix} ${title}`;
}

export function generateDraft(offer, cvData = null) {
  const n = normalizeKeys(offer);
  const entreprise = n.entreprise || n.societe || 'votre entreprise';
  const poste = n.poste || n.titre || 'ce poste';

  const domain = detectDomain(offer);
  const contractType = detectContractType(offer);
  const jobTechs = extractJobTechnologies(offer);
  const projects = matchProjects(jobTechs);
  const skills = extractRelevantSkills(jobTechs, DOMAINS[domain]?.skills || []);

  const body = buildDraft({ domain, contract: contractType, company: entreprise, title: poste, projects, skills });
  const subject = n.objet || generateSubject(contractType, poste);

  const draft = {
    to: n.email,
    subject,
    body,
    metadata: {
      domain,
      contract: contractType,
      jobTechs,
      matchedProjects: projects.map(p => p.nom),
      relevantSkills: skills
    },
    instructions: 'Ce brouillon doit être relu et personnalisé. Vérifie: ton professionnel, cohérence avec l\'offre, pas de répétitions.'
  };

  log.debug({ to: draft.to, domain, contract: contractType, projects: projects.map(p => p.nom) }, 'Brouillon généré');
  return draft;
}

export function generateBatchDrafts(offers, cvData = null) {
  return offers.map(offer => ({
    ...offer,
    draft: generateDraft(offer, cvData)
  }));
}

export { CANDIDAT, DOMAINS, CONTRACT_INTROS, detectDomain, detectContractType, matchProjects };
