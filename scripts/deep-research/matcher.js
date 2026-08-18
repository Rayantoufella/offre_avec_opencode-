import pino from 'pino';
import { normalize, similarity } from './utils.js';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const MATCH_WEIGHTS = {
  skills: 0.35,
  technologies: 0.30,
  experience: 0.15,
  location: 0.10,
  contract: 0.05,
  workMode: 0.05
};

const SCORE_LABELS = [
  { min: 90, max: 100, label: 'Excellent', emoji: '★★★' },
  { min: 80, max: 89, label: 'Tres bon', emoji: '★★☆' },
  { min: 65, max: 79, label: 'Bon', emoji: '★★☆' },
  { min: 50, max: 64, label: 'Moyen', emoji: '★☆☆' },
  { min: 0, max: 49, label: 'Faible', emoji: '☆☆☆' }
];

function matchJobs(jobs, profile, preferences = {}) {
  log.info({ count: jobs.length, profile: profile?.prenom }, 'Matching des offres');

  const matched = jobs.map(job => {
    const result = matchSingleJob(job, profile, preferences);
    return result;
  });

  matched.sort((a, b) => b.matchScore - a.matchScore);

  log.info({ matched: matched.length, topScore: matched[0]?.matchScore }, 'Matching termine');
  return matched;
}

function matchSingleJob(job, profile, preferences = {}) {
  const scores = {
    skills: scoreSkills(job, profile),
    technologies: scoreTechnologies(job, profile),
    experience: scoreExperience(job, profile, preferences),
    location: scoreLocation(job, profile, preferences),
    contract: scoreContract(job, preferences),
    workMode: scoreWorkMode(job, preferences)
  };

  let totalScore = 0;
  for (const [key, weight] of Object.entries(MATCH_WEIGHTS)) {
    totalScore += (scores[key] || 0) * weight;
  }

  totalScore = Math.round(Math.min(100, Math.max(0, totalScore)));

  const label = SCORE_LABELS.find(l => totalScore >= l.min && totalScore <= l.max);
  const reasons = generateMatchReasons(job, profile, scores);

  return {
    ...job,
    matchScore: totalScore,
    matchLabel: label?.label || 'Inconnu',
    matchEmoji: label?.emoji || '',
    matchReasons: reasons,
    matchDetails: scores
  };
}

function scoreSkills(job, profile) {
  if (!profile?.competences || profile.competences.length === 0) return 50;

  const jobText = normalize(`${job.title || ''} ${job.description || ''} ${job.requirements || ''}`);
  let matches = 0;

  for (const skill of profile.competences) {
    const regex = new RegExp(normalize(skill), 'gi');
    if (regex.test(jobText)) {
      matches++;
    }
  }

  const ratio = matches / Math.min(profile.competences.length, 10);
  return Math.round(ratio * 100);
}

function scoreTechnologies(job, profile) {
  if (!job.technologies || job.technologies.length === 0) return 50;
  if (!profile?.technologies || profile.technologies.length === 0) return 50;

  let matches = 0;
  for (const tech of job.technologies) {
    for (const profileTech of profile.technologies) {
      if (similarity(tech, profileTech) > 0.6) {
        matches++;
        break;
      }
    }
  }

  const ratio = matches / job.technologies.length;
  return Math.round(ratio * 100);
}

function scoreExperience(job, profile, preferences) {
  const jobExp = (job.experience || '').toLowerCase();
  const profileSeniority = (profile?.experience || '').toLowerCase();
  const prefSeniority = (preferences.seniority || '').toLowerCase();

  if (!jobExp && !profileSeniority && !prefSeniority) return 70;

  const seniorityOrder = { 'junior': 1, 'mid': 2, 'senior': 3, 'lead': 4 };

  const jobLevel = Object.entries(seniorityOrder).find(([k]) => jobExp.includes(k));
  const profileLevel = Object.entries(seniorityOrder).find(([k]) => profileSeniority.includes(k));
  const prefLevel = Object.entries(seniorityOrder).find(([k]) => prefSeniority.includes(k));

  const targetLevel = prefLevel?.[1] || profileLevel?.[1];

  if (!jobLevel && !targetLevel) return 70;
  if (!jobLevel) return 80;
  if (!targetLevel) return 70;

  const diff = Math.abs(jobLevel[1] - targetLevel);
  if (diff === 0) return 100;
  if (diff === 1) return 70;
  return 40;
}

function scoreLocation(job, profile, preferences) {
  const jobLoc = normalize(job.location || '');
  const profileLoc = normalize(profile?.localisation || '');
  const prefLoc = normalize(preferences.location || '');

  if (!jobLoc) return 60;
  if (jobLoc.includes('remote') || jobLoc.includes('teletravail')) return 90;

  const targetLoc = prefLoc || profileLoc;
  if (!targetLoc) return 70;

  if (jobLoc.includes(targetLoc) || targetLoc.includes(jobLoc)) return 100;

  const sim = similarity(jobLoc, targetLoc);
  if (sim > 0.7) return 80;
  if (sim > 0.4) return 60;

  return 30;
}

function scoreContract(job, preferences) {
  const jobContract = (job.contractType || '').toLowerCase();
  const prefContract = (preferences.contract || '').toLowerCase();

  if (!jobContract || !prefContract) return 70;

  for (const type of ['cdi', 'cdd', 'stage', 'alternance', 'freelance']) {
    if (jobContract.includes(type) && prefContract.includes(type)) {
      return 100;
    }
  }

  return 40;
}

function scoreWorkMode(job, preferences) {
  const jobMode = (job.workMode || '').toLowerCase();
  const prefMode = (preferences.workMode || '').toLowerCase();

  if (!jobMode || !prefMode) return 70;

  if (prefMode === 'remote' && (jobMode.includes('remote') || jobMode.includes('teletravail'))) return 100;
  if (prefMode === 'hybride' && jobMode.includes('hybride')) return 100;
  if (prefMode === 'presentiel' && (jobMode.includes('presentiel') || jobMode.includes('bureau'))) return 100;

  if (jobMode.includes('remote') && prefMode !== 'presentiel') return 80;

  return 50;
}

function generateMatchReasons(job, profile, scores) {
  const reasons = [];

  if (scores.skills >= 80) {
    reasons.push('Competences correspondantes');
  } else if (scores.skills >= 50) {
    reasons.push('Certaines competences correspondantes');
  } else {
    reasons.push('Peu de competences correspondantes');
  }

  if (scores.technologies >= 80) {
    reasons.push('Stack technique tres compatible');
  } else if (scores.technologies >= 50) {
    reasons.push('Stack technique partiellement compatible');
  }

  if (scores.location >= 80) {
    reasons.push('Localisation ideale');
  } else if (scores.location >= 50) {
    reasons.push('Localisation acceptable');
  } else {
    reasons.push('Localisation eloignee');
  }

  if (job.technologies && job.technologies.length > 0) {
    const matchingTechs = job.technologies.filter(t =>
      profile?.competences?.some(c => similarity(t, c) > 0.6)
    );
    if (matchingTechs.length > 0) {
      reasons.push(`Technologies matching: ${matchingTechs.slice(0, 3).join(', ')}`);
    }
  }

  return reasons;
}

function getMatchSummary(matched) {
  const excellent = matched.filter(m => m.matchScore >= 90);
  const veryGood = matched.filter(m => m.matchScore >= 80 && m.matchScore < 90);
  const good = matched.filter(m => m.matchScore >= 65 && m.matchScore < 80);
  const medium = matched.filter(m => m.matchScore >= 50 && m.matchScore < 65);
  const low = matched.filter(m => m.matchScore < 50);

  return {
    total: matched.length,
    excellent: excellent.length,
    veryGood: veryGood.length,
    good: good.length,
    medium: medium.length,
    low: low.length,
    topMatches: matched.slice(0, 10).map(m => ({
      company: m.company,
      title: m.title,
      score: m.matchScore,
      label: m.matchLabel,
      reasons: m.matchReasons
    }))
  };
}

export { matchJobs, matchSingleJob, getMatchSummary, SCORE_LABELS, MATCH_WEIGHTS };
