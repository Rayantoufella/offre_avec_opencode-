import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

export function validateOffer(offer) {
  const errors = [];
  const warnings = [];

  if (!offer.email || !String(offer.email).trim()) {
    errors.push('Email manquant');
  } else if (!isValidEmail(String(offer.email).trim())) {
    errors.push('Email invalide');
  }

  if (!offer.entreprise || !String(offer.entreprise).trim()) {
    warnings.push('Entreprise manquante');
  }

  if (!offer.poste || !String(offer.poste).trim()) {
    warnings.push('Poste manquant');
  }

  if (offer.url && !isValidUrl(String(offer.url))) {
    warnings.push('URL invalide');
  }

  const status = determineStatus(errors, warnings);

  const result = {
    status,
    errors,
    warnings,
    offer: {
      email: offer.email ? String(offer.email).trim() : '',
      entreprise: offer.entreprise ? String(offer.entreprise).trim() : '',
      poste: offer.poste ? String(offer.poste).trim() : '',
      url: offer.url ? String(offer.url).trim() : '',
      description: offer.description ? String(offer.description).trim() : '',
      type: offer.type ? String(offer.type).trim() : '',
      objet: offer.objet ? String(offer.objet).trim() : ''
    }
  };

  log.debug({ status, errors, warnings }, 'Validation offre');
  return result;
}

function determineStatus(errors, warnings) {
  if (errors.length > 0) return 'SKIP';
  if (warnings.length > 0) return 'INCOMPLETE';
  return 'VALID';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function filterValidOffers(analysisResults) {
  return analysisResults.filter(r => r.status === 'VALID');
}

export function getOfferSummary(results) {
  const summary = {
    total: results.length,
    valid: 0,
    incomplete: 0,
    skip: 0,
    issues: []
  };

  for (const r of results) {
    switch (r.status) {
      case 'VALID':
        summary.valid++;
        break;
      case 'INCOMPLETE':
        summary.incomplete++;
        summary.issues.push({ row: r.row, issue: r.reason });
        break;
      case 'SKIP':
        summary.skip++;
        summary.issues.push({ row: r.row, issue: r.reason });
        break;
    }
  }

  return summary;
}
