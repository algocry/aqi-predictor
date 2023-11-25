document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("btn").addEventListener('click', ()=> get_sdata());
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    document.getElementById('date').value = currentDate;
});

async function get_sdata(){
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        var date = document.getElementById("date").value;
        date = new Date(date).getTime();

        const td = document.getElementById("td").value;
        const pi = document.getElementById("pi").value;

        const coords = position.coords;
        const apiUrl = 'https://aqi-predictor.0x0is1.repl.co/stationForecast';
        
        const params = new URLSearchParams();

        params.append('ts', date);
        params.append('longitude', coords.longitude);
        params.append('latitude', coords.latitude);
        params.append('td', td);
        params.append('pi', pi);
        var data = await fetch(`${apiUrl}?${params.toString()}`);
        
        const jsonData = await data.json();
        if(jsonData.status===101){
            data = JSON.parse(jsonData.data)
            Object.keys(data).forEach(attrib=>{
                plot_df(JSON.parse(data[attrib]), attrib, pi);
            });
        }
        else{
            alert(jsonData.data);
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}

function plot_df(data, name, pi){

    // Extract x and y values
    const xValues = data.map(entry => new Date(entry.ds));
    const yValues = data.map(entry => entry.yhat);

    // Create a trace
    const trace = {
        x: xValues,
        y: yValues,
        mode: 'lines+markers',
        type: 'scatter'
    };

    // Create a layout
    const layout = {
        title: `${name} prediction for next ${pi} days`,
        xaxis: {
            title: 'Date'
        },
        yaxis: {
            title: `${name} Value`
        }
    };

    // Plot the chart
    const child = document.createElement("div");
    child.id = name;
    document.getElementById("plot").appendChild(child);
    Plotly.newPlot(name, [trace], layout);
}
