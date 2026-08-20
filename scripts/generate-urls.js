import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const jsonPath = path.join(projectRoot, 'data', 'emails', 'emails-prepared.json');
const offers = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const cvPath = 'C:\\Users\\Deadpool\\Documents\\offre\\data\\cv\\Cv_Toufella_Rayan.pdf';

offers.forEach((offer, i) => {
  const to = offer.email;
  const su = offer.subject;
  const body = offer.body;

  const encodedTo = encodeURIComponent(to);
  const encodedSu = encodeURIComponent(su);
  const encodedBody = encodeURIComponent(body);

  const url = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodedTo}&su=${encodedSu}&body=${encodedBody}`;

  console.log(`--- Offre ${i + 1}/16 : ${offer.entreprise} ---`);
  console.log(`Email: ${to}`);
  console.log(`URL: ${url}`);
  console.log('');
});
