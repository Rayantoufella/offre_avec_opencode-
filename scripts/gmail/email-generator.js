import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const TEMPLATES = {
  stage: {
    prefix: 'Candidature au poste de',
    formulaire: (cv) => `Madame, Monsieur,

${cv ? `${cv.prenom || 'Candidat'}, ` : ''}Je me permets de vous adresser ma candidature pour le poste de {poste} au sein de votre entreprise {entreprise}.
${cv && cv.competences.length > 0 ? `\nMes competences principales — ${cv.competences.slice(0, 4).join(', ')} — me permettront de contribuer rapidement a votre equipe.\n` : ''}
Vivement interesse par cette opportunite, je souhaite mettre mes competences et ma motivation au service de votre equipe.

Je vous prie de trouver ci-joint mon curriculum vitae pour votre consideration.

Dans l'attente de votre retour, je vous prie d'agreer, Madame, Monsieur, l'expression de mes salutations distinguees.`
  },
  alternance: {
    prefix: 'Candidature en alternance pour',
    formulaire: (cv) => `Madame, Monsieur,

${cv ? `${cv.prenom || 'Candidat'}, ` : ''}Actuellement en formation, je suis a la recherche d'un contrat en alternance pour le poste de {poste} chez {entreprise}.
${cv && cv.formation ? `\nMa formation actuelle : ${cv.formation}\n` : ''}
Cette opportunite correspond parfaitement a mon projet professionnel et je suis convaincu de pouvoir contribuer activement a votre structure.

Vous trouverez ci-joint mon curriculum vitae detailant mon parcours.

Je reste a votre entiere disposition pour un entretien.

Veuillez recevoir, Madame, Monsieur, mes salutations les meilleures.`
  },
  cdi: {
    prefix: 'Candidature pour le poste de',
    formulaire: (cv) => `Madame, Monsieur,

${cv ? `${cv.prenom || 'Candidat'}, ` : ''}Fort de mon experience dans le domaine, je souhaite vous proposer ma candidature pour le poste de {poste} au sein de {entreprise}.
${cv && cv.competences.length > 0 ? `\nJe possede des competences solides en ${cv.competences.slice(0, 5).join(', ')}.\n` : ''}
Mon profil correspond aux exigences decrites dans votre offre et je suis persuade de pouvoir apporter une reelle valeur ajoutee a votre equipe.

Je vous prie de trouver ci-joint mon curriculum vitae.

Je me tiens a votre disposition pour un entretien a votre convenance.

En vous remerciant de l'attention que vous porterez a ma candidature, je vous prie d'agreer, Madame, Monsieur, l'expression de mes sentiments distingues.`
  },
  cdd: {
    prefix: 'Candidature pour le poste de',
    formulaire: (cv) => `Madame, Monsieur,

${cv ? `${cv.prenom || 'Candidat'}, ` : ''}Je me permets de vous adresser ma candidature pour le poste de {poste} propose par {entreprise}.

Ce contrat correspond a mes attentes et je suis pret a m'investir pleinement durant cette mission.

Vous trouverez mon curriculum vitae en piece jointe.

Dans l'attente de votre reponse, je vous prie d'agreer, Madame, Monsieur, mes salutations distinguees.`
  },
  freelance: {
    prefix: 'Proposition de collaboration pour',
    formulaire: (cv) => `Madame, Monsieur,

${cv ? `${cv.prenom || 'Candidat'}, ` : ''}En tant que freelance, je vous propose mes services pour le poste de {poste} au sein de {entreprise}.
${cv && cv.competences.length > 0 ? `\nMes competences : ${cv.competences.slice(0, 6).join(', ')}\n` : ''}
Je suis capable d'intervenir rapidement et de fournir des resultats de qualite dans les delais convenus.

Mon portfolio et mon curriculum vitae sont joints a ce message.

Je serais ravi d'echanger avec vous sur cette opportunite.

Cordialement.`
  },
  default: {
    prefix: 'Candidature pour',
    formulaire: (cv) => `Madame, Monsieur,

${cv ? `${cv.prenom || 'Candidat'}, ` : ''}Je vous soumets ma candidature pour le poste de {poste} chez {entreprise}.
${cv && cv.competences.length > 0 ? `\nMes competences en ${cv.competences.slice(0, 4).join(', ')} seraient un atout pour votre equipe.\n` : ''}
Motive et enthousiaste, je souhaite integrer votre equipe et contribuer a vos projets.

Veuillez trouver ci-joint mon curriculum vitae.

Dans l'attente de votre retour, je vous prie d'agreer, Madame, Monsieur, mes salutations respectueuses.`
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

export function generateEmail(offer, cvData = null) {
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

  const bodyFn = template.formulaire;
  let body = bodyFn(cvData)
    .replace(/{entreprise}/g, entreprise)
    .replace(/{poste}/g, poste);

  const result = {
    to: n.email,
    subject,
    body,
    type,
    entreprise,
    poste,
    cvNom: cvData?.nom || null
  };

  log.debug({ to: result.to, subject: result.subject, type, cvNom: result.cvNom }, 'Email genere');
  return result;
}

export function generateBatchEmails(offers, cvData = null) {
  return offers.map(offer => ({
    ...offer,
    email: generateEmail(offer, cvData)
  }));
}

export { TEMPLATES };
