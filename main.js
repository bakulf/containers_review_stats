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
    this.#reviewsByTime(data);
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
    for (const r of data) {
      const day = r.created.substring(0, 10);
      if (!dataset[day]) dataset[day] = 0;
      dataset[day]++;
    }

    const labels = Object.keys(dataset).sort();
    const values = labels.map(day => dataset[day]);

    const ctx = document.getElementById("reviewsByTime");
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: values
        }],
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
            display: false,
          },
        },
      }
    });
  }
}

const stats = new Stats();
