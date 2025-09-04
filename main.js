class Stats {
  #intl;
  #data;
  #stopwords;

  constructor() {
    this.#intl = new Intl.NumberFormat();

    Promise.all([
      fetch("./data.json").then(r => r.json()),
      fetch("./stopwords_en.json").then(r => r.json())
    ]).then(([data, stopwords]) => {
      this.#stopwords = new Set(stopwords);
      this.#showData(data);
    });
  }

  #showData(data) {
    this.#data = data;

    document.getElementById("totalReviews").innerText = this.#intl.format(this.#data.length);
    document.getElementById("totalMsgs").innerText = this.#intl.format(this.#data.filter(a => a.body).length);
    document.getElementById("avgRate").innerText = this.#intl.format(this.#data.map(a => a.score).reduce((partialSum, a) => partialSum + a, 0) / this.#data.length);

    this.#reviewByRate(data);
    this.#reviewsByTime(data);
    this.#tagCloud(data);
  }

  #reviewByRate(data) {
    const dataset = {};
    for (const r of data) {
      if (!dataset[r.score]) dataset[r.score] = 0;
      dataset[r.score]++;
    }

    const labels = Object.keys(dataset).sort((a, b) => dataset[b] - dataset[a]);
    let datasets = Object.keys(dataset).map(key => dataset[key]).sort((a, b) => b - a);

    const ctx = document.getElementById("reviewByRate");
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: datasets
        }],
      },
      options: {
        plugins: {
          legend: {
            display: false
          },
        },
      }
    });
  }


  #reviewsByTime(data) {
    const dataset = {};
    const daysSet = new Set();
    for (const r of data) {
      const day = r.created.substring(0, 10);
      daysSet.add(day);
      if (!dataset["total"]) dataset["total"] = {};
      if (!dataset[r.score]) dataset[r.score] = {};
      if (!dataset["total"][day]) dataset["total"][day] = 0;
      if (!dataset[r.score][day]) dataset[r.score][day] = 0;
      dataset["total"][day]++;
      dataset[r.score][day]++;
    }

    const labels = Array.from(daysSet).sort();
    const datasets = Object.keys(dataset).sort().map(score => ({
      label: score,
      data: labels.map(day => dataset[score][day] || 0)
    }));

    const ctx = document.getElementById("reviewsByTime");
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets,
      },
      options: {
        scales: {
          x: {
            type: "time",
            time: {
              unit: "month"
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: true,
          },
        },
      }
    });
  }



  #tagCloud(data) {
    const words = {};
    for (const r of data) {
      if (!r.body) continue;
      const tokens = r.body.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/);
      for (const t of tokens) {
        if (!t || t.length < 3) continue;
        if (this.#stopwords && this.#stopwords.has(t)) continue;
        words[t] = (words[t] || 0) + 1;
      }
    }

    const sorted = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 200);
    const max = sorted.length > 0 ? sorted[0][1] : 0;
    const container = document.getElementById("tagCloud");
    container.innerHTML = "";
    for (const [word, count] of sorted) {
      const span = document.createElement("span");
      const size = 0.8 + (count / max) * 1.2;
      span.style.fontSize = size + "em";
      span.classList.add("me-2");
      span.innerText = word;
      container.appendChild(span);
    }
  }
}

const stats = new Stats();
