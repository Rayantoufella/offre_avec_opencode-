import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const COLUMN_MAPPINGS = {
  ENTREPRISE: ['entreprise', 'company', 'employeur', 'societe', 'société', 'organisme', 'organisation', 'firm', 'employer', 'business'],
  EMAIL: ['email', 'mail', 'courriel', 'contact', 'e-mail', 'adresse mail', 'adresse email', 'mail contact'],
  POSTE: ['poste', 'job', 'position', 'role', 'title', 'intitule', 'intitulé', 'offre', 'poste propose', 'fonction'],
  URL_OFFRE: ['url offre', 'source url', 'lien offre', 'url', 'link', 'lien', 'page'],
  URL_CANDIDATURE: ['url candidature', 'application url', 'lien candidature', 'url candidature'],
  DESCRIPTION: ['description', 'details', 'détails', 'info', 'information', 'descriptif', 'presentation', 'présentation', 'contenu'],
  STATUT_OFFRE: ['statut offre', 'statut', 'status', 'état', 'etat', 'resultat', 'résultat', 'avancement'],
  STATUT_CANDIDATURE: ['statut candidature', 'status candidature', 'candidature statut'],
  DATE: ['date', 'date offre', 'date publication', 'date limite', 'posted', 'published'],
  DATE_COLLECTE: ['date collecte', 'date found', 'date collectee'],
  PLATEFORME: ['plateforme', 'platform', 'source', 'origine', 'site', 'site web', 'plateforme source'],
  OBJET: ['objet', 'subject', 'obj', 'objet mail', 'objet email', 'titre'],
  TYPE_OFFRE: ['type', 'type offre', 'type contrat', 'contrat', 'category', 'catégorie', 'nature'],
  TYPE_CANDIDATURE: ['type candidature', 'application type', 'candidature type'],
  TECHNOLOGIES: ['technologies', 'tech', 'stack', 'competences techniques', 'skills', 'technologies requises'],
  LOCALISATION: ['localisation', 'location', 'ville', 'region', 'lieu', 'adresse', 'city'],
  MODE_TRAVAIL: ['mode travail', 'work mode', 'teletravail', 'remote', 'hybride', 'presentiel', 'travail'],
  EXPERIENCE_DEMANDEE: ['experience demandee', 'experience', 'niveau', 'seniority', 'niveau experience', 'annees experience'],
  MATCH_SCORE: ['match score', 'score', 'pertinence', 'niveau pertinence', 'score pertinence', 'relevance'],
  RAISONS_MATCH: ['raisons du match', 'raisons match', 'reasons', 'raisons', 'match reasons'],
  MISSING_SKILLS: ['competences manquantes', 'missing skills', 'manquant', 'skills manquants', 'gaps']
};

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  const wordsA = na.split(/\s+/);
  const wordsB = nb.split(/\s+/);
  let matches = 0;
  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wa === wb || wa.includes(wb) || wb.includes(wa)) {
        matches++;
        break;
      }
    }
  }
  return matches / Math.max(wordsA.length, wordsB.length);
}

export function detectColumns(headers) {
  const mapping = {};
  const unmapped = [];

  for (const header of headers) {
    if (!header || typeof header !== 'string') {
      unmapped.push({ header, mappedTo: null, confidence: 0 });
      continue;
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
      for (const alias of aliases) {
        const score = similarity(header, alias);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = field;
        }
      }
    }

    if (bestScore >= 0.5) {
      if (!mapping[bestMatch] || bestScore > mapping[bestMatch].confidence) {
        mapping[bestMatch] = { index: headers.indexOf(header), originalName: header, confidence: bestScore };
      }
    } else {
      unmapped.push({ header, mappedTo: null, confidence: bestScore });
    }
  }

  log.info({ mapping, unmapped }, 'Colonnes detectees');
  return { mapping, unmapped };
}

export function getColumnIndex(mapping, fieldName) {
  const entry = mapping[fieldName];
  return entry ? entry.index : -1;
}

export { COLUMN_MAPPINGS, normalize, similarity };
