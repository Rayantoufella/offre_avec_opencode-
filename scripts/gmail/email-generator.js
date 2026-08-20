import pino from 'pino';
import { generateDraft, generateBatchDrafts, CANDIDAT, detectDomain, detectContractType } from './email-drafter.js';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

function normalizeKeys(offer) {
  const out = {};
  for (const [key, value] of Object.entries(offer)) {
    out[key.toLowerCase()] = value;
  }
  return out;
}

export function generateEmail(offer, cvData = null) {
  const draft = generateDraft(offer, cvData);

  log.debug({ to: draft.to, subject: draft.subject, domain: draft.metadata.domain }, 'Email généré via drafter');

  return {
    to: draft.to,
    subject: draft.subject,
    body: draft.body,
    type: draft.metadata.contract,
    domain: draft.metadata.domain,
    entreprise: normalizeKeys(offer).entreprise || normalizeKeys(offer).societe || '',
    poste: normalizeKeys(offer).poste || normalizeKeys(offer).titre || '',
    draft: draft
  };
}

export function generateBatchEmails(offers, cvData = null) {
  return offers.map(offer => ({
    ...offer,
    email: generateEmail(offer, cvData)
  }));
}

export { CANDIDAT, detectDomain, detectContractType };
