document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("btn").addEventListener("click", () => get_sdata());
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  document.getElementById("date").value = currentDate;
  document.getElementsByClassName("material-symbols-outlined");
});

function showLoading() {
  const loadingContainer = document.createElement("div");
  loadingContainer.classList.add("loading-container");

  const spinner = document.createElement("div");
  spinner.classList.add("loading-spinner");

  const message = document.createElement("div");
  message.classList.add("message");
  message.innerText = "Making request...";

  loadingContainer.appendChild(spinner);
  loadingContainer.appendChild(message);

  document.getElementById("plots").innerHTML = "";
  document.getElementById("plots").appendChild(loadingContainer);
  document.getElementById("btn").setAttribute("disabled", true);
}

async function get_sdata() {
  try {
    showLoading();

    let status = 0;
    while (status !== 101) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      var date = document.getElementById("date").value;
      date = new Date(date).getTime();

      const td = document.getElementById("td").value;
      const pi = document.getElementById("pi").value;

      const coords = position.coords;
      const apiUrl = "https://aqiapi.onrender.com/stationForecast";

      const params = new URLSearchParams();

      params.append("ts", date);
      params.append("longitude", coords.longitude);
      params.append("latitude", coords.latitude);
      params.append("td", td);
      params.append("pi", pi);
      var data = await fetch(`${apiUrl}?${params.toString()}`);

      const jsonData = await data.json();
      status = jsonData.status;

      if (status === 101) {
        data = JSON.parse(jsonData.data);
        document.getElementById("plots").innerHTML = "";
        Object.keys(data).forEach((attrib) => {
          plot_df(JSON.parse(data[attrib]), attrib, pi);
        });
      } else if (status === 103) {
        document.querySelector(".message").innerText = "Training your model";
      } else if (status === 102) {
        document.querySelector(".message").innerText =
          "Downloading data and training your model";
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    document.getElementById("btn").removeAttribute("disabled");
  }
}

window.collapse = (ev) => {
  ev.parentElement.nextElementSibling.classList.toggle("collapse");
  if (ev.innerText == "expand_more") {
    ev.innerText = "expand_less";
  } else {
    ev.innerText = "expand_more";
  }
};

function plot_df(data, name, pi) {
  const trainingData = data.slice(0, data.length - pi);
  const predictionData = data.slice(data.length - pi);

  const trainingTrace = {
    x: trainingData.map((entry) => new Date(entry.ds)),
    y: trainingData.map((entry) => entry.yhat),
    mode: "lines+markers",
    type: "scatter",
    line: {
      color: "blue",
      width: 2,
    },
    marker: {
      color: "blue",
      size: 8,
    },
    name: "Training Period",
  };

  const predictionTrace = {
    x: predictionData.map((entry) => new Date(entry.ds)),
    y: predictionData.map((entry) => entry.yhat),
    mode: "lines+markers",
    type: "scatter",
    line: {
      color: "green",
      width: 2,
    },
    marker: {
      color: "green",
      size: 8,
    },
    name: "Prediction Period",
  };

  const layout = {
    title: `${name} prediction for next ${pi} days`,
    xaxis: {
      title: "Date",
    },
    yaxis: {
      title: `${name} Value`,
    },
  };

  const child = document.createElement("div");
  child.id = name;
  const child_child = document.createElement("div");
  child_child.classList.add("plot");
  child_child.innerHTML = `<span>
    ${name} prediction
    <span class="material-symbols-outlined" onclick="window.collapse(this)">expand_more</span>
  </span>`;
  child_child.appendChild(child);
  document.getElementById("plots").appendChild(child_child);

  Plotly.newPlot(name, [trainingTrace, predictionTrace], layout);
}
