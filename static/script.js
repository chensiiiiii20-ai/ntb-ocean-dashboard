let map = L.map("map").setView([-8.6, 117.2], 8);
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);

let chart;
let currentStation = null;
const REFRESH_MS = 60000;

// Pastikan dashboard awalnya 1 kolom (FULL MAP)
document.getElementById("dashboard").style.gridTemplateColumns = "1fr";

// UTC CLOCK
function updateUTCClock() {
  let now = new Date();
  let utc = now.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  document.getElementById("utcClock").innerText = utc;
}
setInterval(updateUTCClock, 1000);
updateUTCClock();

// FORMAT UTC
function formatUTC(date) {
  return date.toISOString().replace("T", " ").substring(0, 19) + " UTC";
}

// LOAD CURRENT DATA
async function loadCurrent() {

  if (!currentStation) return;

  const data = await fetch("/data").then(r => r.json());

  data.forEach(point => {
    if (point.station === currentStation) {

      document.getElementById("windValue").innerText = point.wind;
      document.getElementById("airTempValue").innerText = point.temp_air;
      document.getElementById("humidityValue").innerText = point.humidity;
      document.getElementById("pressureValue").innerText = point.pressure;
      document.getElementById("phValue").innerText = point.ph;
      document.getElementById("salinityValue").innerText = point.salinity;
      document.getElementById("seaTempValue").innerText = point.temp_sea;
      document.getElementById("waveValue").innerText = point.wave_height;
      document.getElementById("lastUpdate").innerText = formatUTC(new Date());

      let status = "NORMAL";
      let color = "#4cff9a";

      if (point.ph < 7.8 || point.wave_height > 1.8) {
        status = "WASPADA";
        color = "orange";
      }

      if (point.ph < 7.6 || point.wave_height > 2.5) {
        status = "BAHAYA";
        color = "red";
      }

      let statusBox = document.getElementById("seaStatus");
      statusBox.innerText = status;
      statusBox.style.background = color;
      statusBox.style.color = "white";
    }
  });
}

// LOAD HISTORY CHART
async function loadHistory() {

  if (!currentStation) return;

  const history = await fetch("/history").then(r => r.json());
  let stationData = history.filter(h => h.station === currentStation);

  let labels = stationData.map(h => new Date(h.time).toUTCString());
  let ph = stationData.map(h => h.ph);
  let sal = stationData.map(h => h.salinity);

  let ctx = document.getElementById("timelineChart");

  if (!chart) {
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "pH Laut", data: ph, borderWidth: 2, tension: 0.4, yAxisID: "yPH" },
          { label: "Salinitas", data: sal, borderWidth: 2, tension: 0.4, yAxisID: "ySAL" }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "white" } },
          title: { display: true, text: "Timeline pH & Salinitas", color: "white" }
        },
        scales: {
          yPH: { type: "linear", position: "left", ticks: { color: "white" } },
          ySAL: { type: "linear", position: "right", ticks: { color: "white" }, grid: { drawOnChartArea: false } },
          x: { ticks: { color: "white" } }
        }
      }
    });
  } else {
    chart.data.labels = labels;
    chart.data.datasets[0].data = ph;
    chart.data.datasets[1].data = sal;
    chart.update();
  }
}

// MAP MARKERS
fetch("/data")
  .then(r => r.json())
  .then(data => {

    data.forEach(point => {

      let marker = L.marker([point.lat, point.lon]).addTo(map);

      marker.bindPopup(`<b>${point.station}</b>`);

      marker.on("click", function () {

        this.openPopup();

        currentStation = point.station;
        document.getElementById("stationTitle").innerText = point.station;

        // Tampilkan panel
        document.getElementById("sidePanel").style.display = "flex";

        // Ubah layout jadi 2 kolom
        document.getElementById("dashboard").style.gridTemplateColumns = "2.2fr 1fr";

        loadCurrent();
        loadHistory();
      });

    });

  });

// BUTTONS
document.querySelectorAll(".station-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    currentStation = btn.dataset.station;
    document.getElementById("stationTitle").innerText = currentStation;

    document.getElementById("sidePanel").style.display = "flex";
    document.getElementById("dashboard").style.gridTemplateColumns = "2.2fr 1fr";

    loadCurrent();
    loadHistory();
  });
});
