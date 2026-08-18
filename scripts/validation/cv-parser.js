import fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function parseCV(cvPath) {
  try {
    const buffer = fs.readFileSync(cvPath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    const text = result.text || '';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const parsed = {
      text,
      lines,
      nom: extractName(lines),
      prenom: extractPrenom(lines),
      competences: extractCompetences(text),
      experience: extractExperience(text),
      formation: extractFormation(text),
      email: extractEmail(text),
      telephone: extractTelephone(text),
      Langues: extractLangues(text),
    };

    return { success: true, data: parsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function extractName(lines) {
  for (const line of lines.slice(0, 10)) {
    if (line.length > 3 && line.length < 60 && /^[A-ZÀ-Ü\s\-']+$/.test(line)) {
      return line;
    }
  }
  return lines[0] || 'Candidat';
}

function extractPrenom(lines) {
  const name = extractName(lines);
  const parts = name.split(/\s+/);
  return parts[parts.length - 1] || name;
}

function extractCompetences(text) {
  const skills = [];
  const keywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
    'Node\\.?js', 'React', 'Vue\\.?js', 'Angular', 'Next\\.?js', 'Nuxt',
    'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Heroku', 'Vercel',
    'Git', 'GitHub', 'GitLab', 'CI\\/CD', 'Jenkins',
    'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap',
    'REST', 'GraphQL', 'API', 'SOAP',
    'Linux', 'Windows', 'MacOS',
    'Agile', 'Scrum', 'Kanban',
    'Figma', 'Photoshop', 'Illustrator',
    'Excel', 'Word', 'PowerPoint',
    'TensorFlow', 'PyTorch', 'Machine Learning', 'IA', 'AI',
    'Symfony', 'Doctrine', 'Webpack', 'Vite',
    'Dart', 'Flutter', 'React Native',
    'Kotlin', 'Android', 'iOS',
  ];

  for (const kw of keywords) {
    const regex = new RegExp(kw, 'gi');
    if (regex.test(text)) {
      skills.push(kw.replace(/\\/g, '').replace(/\?/g, '.'));
    }
  }

  return [...new Set(skills)];
}

function extractExperience(text) {
  const patterns = [
    /(\d+)\s*ans?\s*(?:d['']?)?\s*expérience/i,
    /expérience\s*:\s*(\d+)\s*ans?/i,
    /(\d+)\s*years?\s*(?:of\s*)?experience/i,
  ];

  for (const p of patterns) {
    const match = text.match(p);
    if (match) return `${match[1]} ans`;
  }

  return null;
}

function extractFormation(text) {
  const patterns = [
    /(?:Master|MBA|Licence|Bachelor|Diplôme|Formation)\s*[:\s]*(.*?)(?:\n|$)/gi,
    /(?:ENSET|ENI|INPT|ENSIAS|EMI|Université)\s*(.*?)(?:\n|$)/gi,
  ];

  const formations = [];
  for (const p of patterns) {
    let match;
    while ((match = p.exec(text)) !== null) {
      formations.push(match[0].trim());
    }
  }

  return formations.length > 0 ? formations.join(', ') : null;
}

function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  return match ? match[0] : null;
}

function extractTelephone(text) {
  const match = text.match(/(?:\+212|00212|0)[\s.-]?\d{1}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/);
  return match ? match[0] : null;
}

function extractLangues(text) {
  const langues = [];
  const patterns = [
    /(?:Français|Anglais|Arabe|Espagnol|Allemand|Italien|Chinois|Japonais|Portugais|Russe)/gi,
  ];

  for (const p of patterns) {
    let match;
    while ((match = p.exec(text)) !== null) {
      langues.push(match[0]);
    }
  }

  return [...new Set(langues)];
}

export { parseCV };
