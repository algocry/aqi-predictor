document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("btn").addEventListener("click", () => get_sdata());
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  document.getElementById("date").value = currentDate;
  document.getElementsByClassName("material-symbols-outlined");
});

async function get_sdata() {
  try {
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
    if (jsonData.status === 101) {
      data = JSON.parse(jsonData.data);
      Object.keys(data).forEach((attrib) => {
        plot_df(JSON.parse(data[attrib]), attrib, pi);
      });
    } else {
      alert(jsonData.data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function getRandomColor() {
  // Generate a random pastel color
  const randomColorComponent = () => Math.floor(Math.random() * 200) + 100;
  return `rgb(${randomColorComponent()}, ${randomColorComponent()}, ${randomColorComponent()})`;
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
  //data = data.slice(-pi);
  // Extract x and y values
  const xValues = data.map((entry) => new Date(entry.ds));
  const yValues = data.map((entry) => entry.yhat);

  // Create a trace with a random pastel color
  const trace = {
    x: xValues,
    y: yValues,
    mode: "lines+markers", // Show both lines and markers
    type: "scatter",
    line: {
      color: getRandomColor(),
      width: 2,
    },
    marker: {
      color: getRandomColor(),
      size: 8,
    },
    fill: "tonexty", // Fill the area below the line
    fillcolor: getRandomColor(), // Random color for the filled area
  };

  // Create a layout
  const layout = {
    title: `${name} prediction for next ${pi} days`,
    xaxis: {
      title: "Date",
    },
    yaxis: {
      title: `${name} Value`,
    },
    autosize: true,
  };

  // Plot the chart
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
  Plotly.newPlot(name, [trace], layout);
}
