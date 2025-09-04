class Stats {
  #intl;
  #data;

  constructor() {
    this.#intl = new Intl.NumberFormat();

    fetch("./data.json").then(r => r.json()).then(data => this.#showData(data));
  }

  #showData(data) {
    this.#data = data;

    document.getElementById("totalReviews").innerText = this.#intl.format(this.#data.length);
    document.getElementById("totalMsgs").innerText = this.#intl.format(this.#data.filter(a => a.body).length);
    document.getElementById("avgRate").innerText = this.#intl.format(this.#data.map(a => a.score).reduce((partialSum, a) => partialSum + a, 0) / this.#data.length);

    this.#reviewByRate(data);
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
}

const stats = new Stats();
