import fs from 'fs';
import * as pdfParse from 'pdf-parse';

const buf = fs.readFileSync('C:\\Users\\Deadpool\\Documents\\offre\\data\\cv\\Cv_Toufella_Rayan.pdf');
const data = await pdfParse.default(buf);
console.log(data.text);
