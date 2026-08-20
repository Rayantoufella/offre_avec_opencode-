import pino from 'pino';
import { normalize, similarity } from './utils.js';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const SIMILARITY_THRESHOLD = 0.75;

function deduplicateJobs(jobs) {
  log.info({ count: jobs.length }, 'Detection des doublons');

  const groups = groupSimilarJobs(jobs);
  const unique = [];
  const duplicates = [];

  for (const group of groups) {
    const canonical = selectCanonical(group);
    unique.push(canonical);

    if (group.length > 1) {
      for (const job of group) {
        if (job !== canonical) {
          duplicates.push({
            duplicate: job,
            canonical: canonical,
            similarity: calculateGroupSimilarity(job, canonical)
          });
        }
      }
    }
  }

  log.info({ unique: unique.length, duplicates: duplicates.length }, 'Deduplication terminee');
  return { unique, duplicates, stats: { total: jobs.length, unique: unique.length, duplicates: duplicates.length } };
}

function groupSimilarJobs(jobs) {
  const groups = [];
  const assigned = new Set();

  for (let i = 0; i < jobs.length; i++) {
    if (assigned.has(i)) continue;

    const group = [jobs[i]];
    assigned.add(i);

    for (let j = i + 1; j < jobs.length; j++) {
      if (assigned.has(j)) continue;

      if (areSimilar(jobs[i], jobs[j])) {
        group.push(jobs[j]);
        assigned.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}

function areSimilar(jobA, jobB) {
  if (jobA.sourceUrl && jobB.sourceUrl && jobA.sourceUrl === jobB.sourceUrl) {
    return true;
  }

  const companySim = similarity(jobA.company || '', jobB.company || '');
  const titleSim = similarity(jobA.title || '', jobB.title || '');
  const locationSim = similarity(jobA.location || '', jobB.location || '');

  const avgSim = (companySim + titleSim + locationSim) / 3;

  if (avgSim >= SIMILARITY_THRESHOLD) {
    return true;
  }

  if (companySim >= 0.9 && titleSim >= 0.7) {
    return true;
  }

  if (titleSim >= 0.85 && locationSim >= 0.8) {
    return true;
  }

  return false;
}

function calculateGroupSimilarity(jobA, jobB) {
  const companySim = similarity(jobA.company || '', jobB.company || '');
  const titleSim = similarity(jobA.title || '', jobB.title || '');
  return (companySim + titleSim) / 2;
}

function selectCanonical(group) {
  if (group.length === 1) return group[0];

  const scored = group.map(job => ({
    job,
    score: calculateCanonicalScore(job)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0].job;
}

function calculateCanonicalScore(job) {
  let score = 0;

  if (job.description && job.description.length > 100) score += 3;
  else if (job.description && job.description.length > 50) score += 2;
  else if (job.description) score += 1;

  if (job.applicationEmail) score += 2;
  if (job.applicationUrl) score += 2;
  if (job.technologies && job.technologies.length > 0) score += 1;
  if (job.salary) score += 1;
  if (job.postedTime) score += 1;

  const sourcePriority = {
    'LinkedIn': 3,
    'Indeed': 2,
    'Company Career': 3,
    'Welcome to the Jungle': 2,
    'Rekrute': 2,
    'Unknown': 1
  };
  score += sourcePriority[job.source] || 1;

  return score;
}

export { deduplicateJobs, areSimilar, groupSimilarJobs };
