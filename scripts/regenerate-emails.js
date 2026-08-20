import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateEmail } from './gmail/email-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const jsonPath = path.join(projectRoot, 'data', 'emails', 'emails-prepared.json');
const offers = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const regenerated = offers.map(offer => {
  const email = generateEmail({ entreprise: offer.entreprise, poste: offer.poste, email: offer.email, type: offer.type });
  return {
    row: offer.row,
    entreprise: offer.entreprise,
    poste: offer.poste,
    email: email.to,
    subject: email.subject,
    body: email.body,
    type: email.type
  };
});

fs.writeFileSync(jsonPath, JSON.stringify(regenerated, null, 2), 'utf-8');
console.log(`${regenerated.length} emails régénérés avec succès !`);
console.log('\n--- Aperçu du premier email ---');
console.log(`À : ${regenerated[0].email}`);
console.log(`Objet : ${regenerated[0].subject}`);
console.log(`\n${regenerated[0].body}`);
