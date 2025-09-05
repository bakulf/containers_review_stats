class Stats {
  #intl;
  #data;
  #stopwords;
  #allReviewsWithBody;
  #reviewsWithBody;
  #selectedScores;
  #reviewPage = 1;
  #reviewsPerPage = 20;
  #timeChart;

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
    this.#allReviewsWithBody = data.filter(a => a.body);
    this.#reviewsWithBody = this.#allReviewsWithBody;
    this.#selectedScores = new Set(this.#allReviewsWithBody.map(r => r.score));
    const csvBtn = document.getElementById("downloadCsv");
    if (csvBtn) csvBtn.addEventListener("click", () => this.#downloadCSV());

    document.getElementById("totalReviews").innerText = this.#intl.format(this.#data.length);
    document.getElementById("totalMsgs").innerText = this.#intl.format(this.#reviewsWithBody.length);
    document.getElementById("avgRate").innerText = this.#intl.format(this.#data.map(a => a.score).reduce((partialSum, a) => partialSum + a, 0) / this.#data.length);

    this.#reviewByRate(data);
    this.#tagCloud(data);
    this.#reviewByLanguage(data);
    this.#reviewBodies();
    this.#reviewsByTime(data, 'month');

    document.querySelectorAll('input[name="timeScale"]').forEach(el => {
      el.addEventListener('change', e => this.#reviewsByTime(this.#data, e.target.value));
    });
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

 #reviewsByTime(data, unit = 'day') {
    if (this.#timeChart) this.#timeChart.destroy();
    const dataset = {};
    const labelsSet = new Set();
    for (const r of data) {
  const key = unit === 'year' ? r.created.substring(0, 4)
                 : unit === 'month' ? r.created.substring(0, 7)
                 : r.created.substring(0, 10);
      labelsSet.add(key);
      if (!dataset['total']) dataset['total'] = {};
      if (!dataset[r.score]) dataset[r.score] = {};
      if (!dataset['total'][key]) dataset['total'][key] = 0;
      if (!dataset[r.score][key]) dataset[r.score][key] = 0;
      dataset['total'][key]++;
      dataset[r.score][key]++;
    }

    const labels = Array.from(labelsSet).sort();
    const datasets = Object.keys(dataset).sort().map(score => ({
      label: score,
      data: labels.map(key => dataset[score][key] || 0)
    }));

   const ctx = document.getElementById('reviewsByTime');
    this.#timeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        scales: {
          x: {
            type: 'time',
            time: {
              unit: unit
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

  #reviewByLanguage(data) {
    const stopwords = {
      en: ["the", "and", "is", "to", "of", "in"],
      es: ["el", "la", "y", "en", "es", "que"],
      it: ["il", "la", "e", "che", "di", "un"],
      fr: ["le", "la", "et", "les", "de", "un"],
      de: ["der", "die", "und", "ist", "zu", "das"],
    };

    const counts = {};
    for (const r of data) {
      if (!r.body) continue;
      const tokens = r.body.toLowerCase().split(/\W+/);
      let max = 0;
      let lang = "other";
      for (const [code, words] of Object.entries(stopwords)) {
        let count = 0;
        for (const w of words) {
          if (tokens.includes(w)) count++;
        }
        if (count > max) {
          max = count;
          lang = code;
        }
      }
      counts[lang] = (counts[lang] || 0) + 1;
    }

    const display = new Intl.DisplayNames(["en"], { type: "language" });
    const labels = Object.keys(counts).map(k => k === "other" ? "Other" : display.of(k));
    const dataset = Object.values(counts);

    const ctx = document.getElementById("reviewByLang");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{ data: dataset }],
      },
      options: {
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  #reviewBodies() {

    this.#setupScoreFilters();
    this.#filterReviewsByScore();
  }

  #setupScoreFilters() {
    const container = document.getElementById("scoreFilters");
    if (!container) return;
    container.innerHTML = "";
    const scores = Array.from(new Set(this.#allReviewsWithBody.map(r => r.score))).sort();
    for (const score of scores) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("form-check", "form-check-inline");

      const input = document.createElement("input");
      input.classList.add("form-check-input");
      input.type = "checkbox";
      input.id = `scoreFilter${score}`;
      input.value = score;
      input.checked = true;
      input.addEventListener("change", () => this.#filterReviewsByScore());

      const label = document.createElement("label");
      label.classList.add("form-check-label");
      label.htmlFor = input.id;
      label.innerText = score;

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    }
  }

  #filterReviewsByScore() {
    const checkboxes = document.querySelectorAll('#scoreFilters input[type="checkbox"]');
    const active = new Set(Array.from(checkboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value)));
    this.#selectedScores = active;
    this.#reviewsWithBody = this.#allReviewsWithBody.filter(r => active.has(r.score));
    this.#reviewPage = 1;
    this.#renderReviewPage();
  }

  #renderReviewPage() {
    const start = (this.#reviewPage - 1) * this.#reviewsPerPage;
    const slice = this.#reviewsWithBody.slice(start, start + this.#reviewsPerPage);
    const list = document.getElementById("reviewList");
    list.innerHTML = "";
    for (const r of slice) {
      const li = document.createElement("li");
      li.classList.add("list-group-item");
      const badge = document.createElement("span");
      badge.classList.add("badge", "bg-secondary", "me-2");
      badge.innerText = r.score;
      li.appendChild(badge);
      li.appendChild(document.createTextNode(r.body));
      list.appendChild(li);
    }
    // Update range counter: "Showing X–Y of Z"
    const bodyTotalEl = document.getElementById("bodyTotal");
    if (bodyTotalEl) {
      const total = this.#reviewsWithBody.length;
      if (total === 0) {
        bodyTotalEl.innerText = "Showing 0 of 0";
      } else {
        const from = start + 1;
        const to = start + slice.length;
        bodyTotalEl.innerText = `Showing ${this.#intl.format(from)}–${this.#intl.format(to)} of ${this.#intl.format(total)}`;
      }
    }
    this.#renderReviewPagination();
  }

  #renderReviewPagination() {
    const pagination = document.getElementById("reviewPagination");
    pagination.innerHTML = "";
    const pages = Math.ceil(this.#reviewsWithBody.length / this.#reviewsPerPage);

    if (pages === 0) return;

    const createItem = (label, page, disabled) => {
      const li = document.createElement("li");
      li.classList.add("page-item");
      if (disabled) li.classList.add("disabled");
      const a = document.createElement("a");
      a.classList.add("page-link");
      a.href = "#";
      a.innerText = label;
      a.addEventListener("click", e => {
        e.preventDefault();
        if (disabled) return;
        this.#reviewPage = page;
        this.#renderReviewPage();
      });
      li.appendChild(a);
      pagination.appendChild(li);
    };

    createItem("First", 1, this.#reviewPage === 1);
    createItem("Prev", this.#reviewPage - 1, this.#reviewPage === 1);

    const start = Math.max(1, this.#reviewPage - 2);
    const end = Math.min(pages, this.#reviewPage + 2);
    for (let i = start; i <= end; i++) {
      if (i === 1 || i === pages) continue;
      const li = document.createElement("li");
      li.classList.add("page-item");
      if (i === this.#reviewPage) li.classList.add("active");
      const a = document.createElement("a");
      a.classList.add("page-link");
      a.href = "#";
      a.innerText = i;
      a.addEventListener("click", e => {
        e.preventDefault();
        this.#reviewPage = i;
        this.#renderReviewPage();
      });
      li.appendChild(a);
      pagination.appendChild(li);
    }

    createItem("Next", this.#reviewPage + 1, this.#reviewPage === pages);
    createItem("Last", pages, this.#reviewPage === pages);
  }

  #downloadCSV() {
    if (!this.#data) return;
    const header = ["body", "created", "score"];
    const rows = this.#data.filter(r => r.body).map(r => [
      (r.body || "").replace(/"/g, '""'),
      r.created,
      r.score
    ]);
    const csvContent = [header.join(","), ...rows.map(row => row.map(f => `"${f}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
}

const stats = new Stats();
