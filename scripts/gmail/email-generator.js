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
    'MySQL', 'API REST', 'Docker', 'Git', 'IA / LLM'
  ],
  projets: [
    'Allo Delivery — plateforme de livraison (Vue 3, Laravel, Sanctum, MySQL, Docker)',
    'TalentMatch — présélection de candidats par IA (Laravel, API LLM, MySQL)',
    'Aji L3bo Café Manager — système de gestion (PHP MVC, Composer, MySQL)'
  ],
  formation: 'Formation Développeur Backend — PHP / Laravel augmenté par l\'IA (Simplon Maghreb × JobInTech, 2026)',
  experience: 'Projets concrets d\'intégration d\'API LLM en production (sorties structurées, garde-fous, tests)'
};

const TEMPLATES = {
  cdi: {
    prefix: 'Candidature —',
    formulaire: (poste, entreprise) => {
      const projets = CANDIDAT.projets.slice(0, 2).map(p => `  • ${p}`).join('\n');
      return `Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de ${poste} au sein de ${entreprise}.

Développeur Backend formé au PHP / Laravel et à l'intégration d'IA en production, je maîtrise la conception d'API REST sécurisées, la modélisation de bases de données (MySQL, MCD/MLD) ainsi que le déploiement conteneurisé (Docker, GitHub Actions). Mes projets récents m'ont permis de développer une expertise concrète sur des applications web complexes :

${projets}

Ce parcours technique, allié à ma rigueur et à ma capacité d'autonomie, me permet d'apporter une contribution efficace dès les premières semaines.

Vous trouverez ci-joint mon curriculum vitae détaillant mon profil complet.

Je reste à votre entière disposition pour un entretien afin d'échanger sur la valeur que je pourrais apporter à votre équipe.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`;
    }
  },

  stage: {
    prefix: 'Candidature stage —',
    formulaire: (poste, entreprise) => {
      const projets = CANDIDAT.projets.slice(0, 2).map(p => `  • ${p}`).join('\n');
      return `Madame, Monsieur,

Actuellement titulaire d'une formation en Développeur Backend — PHP / Laravel augmenté par l'IA (Simplon Maghreb × JobInTech), je suis à la recherche d'un stage pour mettre en pratique mes compétences au sein de ${entreprise}, pour le poste de ${poste}.

Au cours de ma formation, j'ai réalisé des projets concrets m'amenant à concevoir des API REST, gérer des bases de données relationnelles et intégrer des modèles d'IA :

${projets}

Motivé et curieux, je souhaite contribuer activement à vos projets tout en enrichissant mon expérience professionnelle.

Vous trouverez ci-joint mon curriculum vitae pour votre examen.

Je me tiens à votre disposition pour un entretien à votre convenance.

En vous remerciant de l'attention que vous porterez à ma candidature, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`;
    }
  },

  alternance: {
    prefix: 'Candidature alternance —',
    formulaire: (poste, entreprise) => `Madame, Monsieur,

En formation en Développeur Backend — PHP / Laravel augmenté par l'IA (Simplon Maghreb × JobInTech), je recherche un contrat en alternance pour le poste de ${poste} au sein de ${entreprise}.

Mes compétences en PHP, Laravel, JavaScript et bases de données, acquises à travers des projets professionnels (API REST, Docker, intégration IA), me permettront de m'intégrer rapidement dans votre équipe technique.

Cette alternance correspond parfaitement à mon projet professionnel et je suis engagé à apporter une contribution durable à votre structure.

Vous trouverez ci-joint mon curriculum vitae.

Je reste disponible pour un entretien à votre convenance.

Veuillez recevoir, Madame, Monsieur, mes salutations distinguées.`,

  },

  cdd: {
    prefix: 'Candidature —',
    formulaire: (poste, entreprise) => `Madame, Monsieur,

Développeur Backend spécialisé en PHP / Laravel et en intégration d'IA, je vous propose ma candidature pour le poste de ${poste} proposé par ${entreprise}.

Maîtrisant la conception d'API REST sécurisées, le développement frontend (Vue.js 3, React) et le déploiement Docker, je suis en mesure de contribuer efficacement à cette mission technique.

Vous trouverez ci-joint mon curriculum vitae pour votre considération.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,

  },

  freelance: {
    prefix: 'Proposition —',
    formulaire: (poste, entreprise) => `Madame, Monsieur,

En tant que développeur backend freelance, je vous propose mes services pour le poste de ${poste} au sein de ${entreprise}.

Spécialisé en PHP / Laravel et en intégration d'API LLM, je suis capable d'intervenir rapidement sur des missions techniques complexes — conception d'API, conteneurisation Docker, ou développement full-stack.

Mon portfolio et mon curriculum vitae sont joints à ce message.

Je serais ravi d'échanger avec vous sur cette opportunité.

Cordialement.`,

  },

  default: {
    prefix: 'Candidature —',
    formulaire: (poste, entreprise) => `Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de ${poste} au sein de ${entreprise}.

Développeur Backend formé au PHP / Laravel et à l'intégration d'IA, je maîtrise la conception d'API REST, les bases de données MySQL et le déploiement Docker. Mes projets récents témoignent de ma capacité à livrer des applications web robustes et maintenables.

Vous trouverez ci-joint mon curriculum vitae.

Je reste à votre disposition pour un entretien à votre convenance.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,

  }
};

function normalizeKeys(offer) {
  const out = {};
  for (const [key, value] of Object.entries(offer)) {
    out[key.toLowerCase()] = value;
  }
  return out;
}

function detectType(offer) {
  const n = normalizeKeys(offer);
  const type = (n.type_offre || n.type || '').toLowerCase();
  const poste = (n.poste || '').toLowerCase();
  const description = (n.description || '').toLowerCase();
  const combined = `${type} ${poste} ${description}`;

  if (/stage/.test(combined)) return 'stage';
  if (/alternance|apprentissage/.test(combined)) return 'alternance';
  if (/cdi|permanent/.test(combined)) return 'cdi';
  if (/cdd|contractuel|temporaire/.test(combined)) return 'cdd';
  if (/freelance|independant|liberal/.test(combined)) return 'freelance';
  return 'default';
}

function generateSubject(type, poste) {
  const prefix = TEMPLATES[type]?.prefix || 'Candidature —';
  return `${prefix} ${poste}`;
}

export function generateEmail(offer, cvData = null) {
  const n = normalizeKeys(offer);
  const type = detectType(offer);
  const entreprise = n.entreprise || 'votre entreprise';
  const poste = n.poste || 'ce poste';

  const subject = n.objet || generateSubject(type, poste);
  const template = TEMPLATES[type];
  const body = template.formulaire(poste, entreprise);

  const result = {
    to: n.email,
    subject,
    body,
    type,
    entreprise,
    poste
  };

  log.debug({ to: result.to, subject: result.subject, type }, 'Email généré');
  return result;
}

export function generateBatchEmails(offers, cvData = null) {
  return offers.map(offer => ({
    ...offer,
    email: generateEmail(offer, cvData)
  }));
}

export { TEMPLATES, CANDIDAT };
