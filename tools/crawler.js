import { parse } from 'dom-parse';
import fs from 'fs';

const URL = "https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/reviews/";

const rr = [];

async function magic() {
  let page = 1;
  while (true) {
    console.log(`Page ${page} [${rr.length}]`);

    const url = URL + (page !== 1 ? `?page=${page}` : '');
    console.log(`  -> ${url}`);
    const dom = parse(await fetch(url).then(a => a.text()));
    const script = dom.querySelector("#redux-store-state");
    const data = JSON.parse(script.innerHTML);

    let stop = true;
    for (const id of Object.keys(data.reviews.byId)) {
      const review = data.reviews.byId[id];

      if (!rr.find(r => r.id === review.id)) {
        rr.push(review);
        stop = false;
      }
    }

    if (stop) break;

    fs.writeFileSync("/tmp/output.txt", JSON.stringify(rr));
    ++page;
  }
}

magic();
