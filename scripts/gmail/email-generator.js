import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const TEMPLATES = {
  stage: {
    prefix: 'Candidature au poste de',
    formulaire: 'Madame, Monsieur,\n\nJe me permets de vous adresser ma candidature pour le poste de {poste} au sein de votre entreprise {entreprise}.\n\nVivement interesse(e) par cette opportunite, je souhaite mettre mes competences et ma motivation au service de votre equipe.\n\nJe vous prie de trouver ci-joint mon curriculum vitae pour votre consideration.\n\nDans l\'attente de votre retour, je vous prie d\'agreer, Madame, Monsieur, l\'expression de mes salutations distinguees.'
  },
  alternance: {
    prefix: 'Candidature en alternance pour',
    formulaire: 'Madame, Monsieur,\n\nActuellement en formation, je suis a la recherche d\'un contrat en alternance pour le poste de {poste} chez {entreprise}.\n\nCette opportunite correspond parfaitement a mon projet professionnel et je suis convaincu(e) de pouvoir contribuer activement a votre structure.\n\nVous trouverez ci-joint mon curriculum vitae detailant mon parcours.\n\nJe reste a votre entiere disposition pour un entretien.\n\nVeuillez recevoir, Madame, Monsieur, mes salutations les meilleures.'
  },
  cdi: {
    prefix: 'Candidature pour le poste de',
    formulaire: 'Madame, Monsieur,\n\nFort(e) de mon experience dans le domaine, je souhaite vous proposer ma candidature pour le poste de {poste} au sein de {entreprise}.\n\nMon profil correspond aux exigences decrites dans votre offre et je suis persuade(e) de pouvoir apporter une reelle valeur ajoutee a votre equipe.\n\nJe vous prie de trouver ci-joint mon curriculum vitae.\n\nJe me tiens a votre disposition pour un entretien a votre convenance.\n\nEn vous remerciant de l\'attention que vous porterez a ma candidature, je vous prie d\'agreer, Madame, Monsieur, l\'expression de mes sentiments distingues.'
  },
  cdd: {
    prefix: 'Candidature pour le poste de',
    formulaire: 'Madame, Monsieur,\n\nJe me permets de vous adresser ma candidature pour le poste de {poste} propose par {entreprise}.\n\nCe contrat correspond a mes attentes et je suis pret(e) a m\'investir pleinement durant cette mission.\n\nVous trouverez mon curriculum vitae en piece jointe.\n\nDans l\'attente de votre reponse, je vous prie d\'agreer, Madame, Monsieur, mes salutations distinguees.'
  },
  freelance: {
    prefix: 'Proposition de collaboration pour',
    formulaire: 'Madame, Monsieur,\n\nEn tant que freelance, je vous propose mes services pour le poste de {poste} au sein de {entreprise}.\n\nJe suis capable d\'intervenir rapidement et de fournir des resultats de qualite dans les delais convenus.\n\nMon portfolio et mon curriculum vitae sont joints a ce message.\n\nJe serais ravi(e) d\'echanger avec vous sur cette opportunite.\n\nCordialement.'
  },
  default: {
    prefix: 'Candidature pour',
    formulaire: 'Madame, Monsieur,\n\nJe vous soumets ma candidature pour le poste de {poste} chez {entreprise}.\n\nMotive(e) et enthousiaste, je souhaite integrer votre equipe et contribuer a vos projets.\n\nVeuillez trouver ci-joint mon curriculum vitae.\n\nDans l\'attente de votre retour, je vous prie d\'agreer, Madame, Monsieur, mes salutations respectueuses.'
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
  if (/cdi|permanent|permanent/.test(combined)) return 'cdi';
  if (/cdd|contractuel|temporaire/.test(combined)) return 'cdd';
  if (/freelance|independant|liberal/.test(combined)) return 'freelance';
  return 'default';
}

export function generateEmail(offer) {
  const n = normalizeKeys(offer);
  const type = detectType(offer);
  const template = TEMPLATES[type];
  const entreprise = n.entreprise || 'votre entreprise';
  const poste = n.poste || 'ce poste';

  let subject = '';
  if (n.objet) {
    subject = n.objet;
  } else {
    subject = `${template.prefix} ${poste}`;
  }

  let body = template.formulaire
    .replace(/{entreprise}/g, entreprise)
    .replace(/{poste}/g, poste);

  const result = {
    to: n.email,
    subject,
    body,
    type,
    entreprise,
    poste
  };

  log.debug({ to: result.to, subject: result.subject, type }, 'Email genere');
  return result;
}

export function generateBatchEmails(offers) {
  return offers.map(offer => ({
    ...offer,
    email: generateEmail(offer)
  }));
}

export { TEMPLATES };
