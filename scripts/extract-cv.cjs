const fs = require('fs');
const pdfParse = require('pdf-parse');

const buf = fs.readFileSync('C:\\Users\\Deadpool\\Documents\\offre\\data\\cv\\Cv_Toufella_Rayan.pdf');
pdfParse(buf).then(data => {
  console.log(data.text);
}).catch(err => {
  console.error(err);
});
