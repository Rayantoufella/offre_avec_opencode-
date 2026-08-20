import pino from 'pino';
import { normalize } from './utils.js';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const REQUIRED_FIELDS = ['title', 'company'];

const VALID_SOURCES = ['LinkedIn', 'Indeed', 'Company Career', 'Welcome to the Jungle', 'Glassdoor', 'Rekrute', 'Honeypot', 'StackJobs', 'Web Search', 'Unknown'];

const APPLICATION_TYPES = {
  EMAIL: 'EMAIL',
  WEB_FORM: 'WEB_FORM',
  LINKEDIN: 'LINKEDIN',
  CAREER_PAGE: 'CAREER_PAGE',
  EXTERNAL_PLATFORM: 'EXTERNAL_PLATFORM',
  UNKNOWN: 'UNKNOWN'
};

function processRawJobs(rawJobs) {
  log.info({ count: rawJobs.length }, 'Traitement des offres brutes');

  const processed = [];
  const rejected = [];

  for (const job of rawJobs) {
    const result = processSingleJob(job);
    if (result.valid) {
      processed.push(result.job);
    } else {
      rejected.push({ job, reasons: result.reasons });
    }
  }

  log.info({ processed: processed.length, rejected: rejected.length }, 'Traitement termine');
  return { processed, rejected, stats: { total: rawJobs.length, valid: processed.length, invalid: rejected.length } };
}

function processSingleJob(raw) {
  const reasons = [];

  const job = {
    title: cleanText(raw.title || raw.job_title || raw.poste || ''),
    company: cleanText(raw.company || raw.entreprise || ''),
    location: cleanText(raw.location || raw.lieu || ''),
    contractType: cleanText(raw.contractType || raw.type || raw.contrat || ''),
    workMode: cleanText(raw.workMode || raw.mode || ''),
    technologies: extractTechnologies(raw),
    experience: cleanText(raw.experience || raw.required_experience || ''),
    description: cleanText(raw.description || raw.details || ''),
    requirements: cleanText(raw.requirements || ''),
    source: raw.source || 'Unknown',
    sourceUrl: raw.link || raw.url || raw.source_url || '',
    applicationUrl: raw.applicationUrl || raw.apply_url || '',
    applicationType: detectApplicationType(raw),
    applicationEmail: raw.email || raw.applicationEmail || '',
    dateFound: raw.dateFound || new Date().toISOString(),
    jobStatus: detectJobStatus(raw),
    salary: cleanText(raw.salary || ''),
    postedTime: cleanText(raw.postedTime || raw.date || ''),
    companyUrl: raw.companyUrl || '',
    rawData: raw
  };

  if (!job.title) {
    reasons.push('Missing title');
  }

  if (!job.company) {
    reasons.push('Missing company');
  }

  if (job.title && job.title.length < 3) {
    reasons.push('Title too short');
  }

  if (job.company && job.company.length < 2) {
    reasons.push('Company name too short');
  }

  if (job.sourceUrl && !isValidUrl(job.sourceUrl)) {
    reasons.push('Invalid source URL');
  }

  return {
    valid: reasons.length === 0,
    job,
    reasons
  };
}

function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 500);
}

function extractTechnologies(raw) {
  const techs = [];

  if (raw.technologies && Array.isArray(raw.technologies)) {
    techs.push(...raw.technologies);
  }

  if (typeof raw.technologies === 'string') {
    techs.push(...raw.technologies.split(/[,;\/]/).map(t => t.trim()));
  }

  const techFields = [raw.stack, raw.tech, raw.skills, raw.outils];
  for (const field of techFields) {
    if (typeof field === 'string') {
      techs.push(...field.split(/[,;\/]/).map(t => t.trim()));
    }
  }

  const text = (raw.description || '') + ' ' + (raw.title || '');
  const techPatterns = [
    /PHP/gi, /Laravel/gi, /Symfony/gi, /JavaScript/gi, /TypeScript/gi,
    /React/gi, /Vue\.?js/gi, /Angular/gi, /Node\.?js/gi, /Python/gi,
    /Java/gi, /C\+\+/gi, /C#/gi, /Ruby/gi, /Go/gi, /Rust/gi,
    /MySQL/gi, /PostgreSQL/gi, /MongoDB/gi, /Redis/gi,
    /Docker/gi, /Kubernetes/gi, /AWS/gi, /Azure/gi, /GCP/gi,
    /Git/gi, /CI\/CD/gi, /Jenkins/gi, /Linux/gi
  ];

  for (const p of techPatterns) {
    if (p.test(text)) {
      const match = text.match(p);
      if (match) techs.push(match[0]);
    }
  }

  return [...new Set(techs.filter(t => t && t.length > 1))];
}

function detectApplicationType(raw) {
  const email = raw.email || raw.applicationEmail;
  if (email && email.includes('@')) return APPLICATION_TYPES.EMAIL;

  const url = (raw.link || raw.url || raw.applicationUrl || '').toLowerCase();
  if (url.includes('linkedin.com/jobs')) return APPLICATION_TYPES.LINKEDIN;
  if (url.includes('apply') || url.includes('candidature')) return APPLICATION_TYPES.WEB_FORM;
  if (url.includes('career') || url.includes('carriere')) return APPLICATION_TYPES.CAREER_PAGE;

  if (raw.source === 'LinkedIn') return APPLICATION_TYPES.LINKEDIN;
  if (raw.source === 'Indeed') return APPLICATION_TYPES.EXTERNAL_PLATFORM;

  return APPLICATION_TYPES.UNKNOWN;
}

function detectJobStatus(raw) {
  const text = (raw.description || '' + raw.title || '' + raw.status || '').toLowerCase();

  if (/expired|ferme|cloture|pourvu|passed/.test(text)) return 'EXPIRED';
  if (/active|ouvert|open|hiring|recrute/.test(text)) return 'ACTIVE';

  return 'UNKNOWN';
}

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function mergeJobData(existing, newData) {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(newData)) {
    if (value && (!merged[key] || merged[key] === '')) {
      merged[key] = value;
    }
  }

  if (existing.technologies && newData.technologies) {
    merged.technologies = [...new Set([...existing.technologies, ...newData.technologies])];
  }

  return merged;
}

export { processRawJobs, processSingleJob, detectApplicationType, detectJobStatus, mergeJobData, cleanText, APPLICATION_TYPES };
