import fs from 'fs';

const rr = [];
const data = JSON.parse(fs.readFileSync('output.json'));
for (const a of data) {
  rr.push({
    body: a.body,
    created: a.created,
    score: a.score,
  });
}

fs.writeFileSync('data.json', JSON.stringify(rr));
