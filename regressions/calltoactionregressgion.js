//For this plot I just copied the example assignment code and updated to fit my excel data. This was the fastest way.
// updated variables with find and replace and wrapped in a loop.

console.log(lineColours);

const lowestCountries = [
    "Angola", "Mali", "Chad"
];

let isFirst = true;

const thisLayout = {
    ...reuseLayout,
    showlegend: true,
    width: innerWidth / 3.2,
    height: innerHeight * 0.6,
    margin: { 'l': 30, 'r': 20, 't': 10, 'b': 30 },
    mode: 'lines+markers',
}

function make_regression(csv_data) {
    let traces = [];
    var counterColor = 0;
    for (const country of lowestCountries) {
        let country_data = csv_data.filter(d => d.country == country);
        let nourishment_data = country_data.map(d => Number(d[isFirst ? 'Population Nourishment %' : 'DALYs']))
        console.log(nourishment_data);
        let min_nourishment = Math.min(...nourishment_data)
        let max_nourishment = Math.max(...nourishment_data)
        let regression_data = country_data.map(d => [stretch(d.year, 2001, 2018, 0, 1),
            stretch(d[isFirst ? 'Population Nourishment %' : 'DALYs'], min_nourishment, max_nourishment, 0, 1)
        ])
        let regression_result = regression.linear(regression_data, { order: 3, precision: 2, });
        let extension_x = [];
        let extension_y = [];
        for (let year = 2017; year < 2050; year++) {
            let prediction = regression_result.predict(stretch(year, 2001, 2018, 0, 1))[1]
            extension_x.push(year);
            const result = stretch(prediction, 0, 1, min_nourishment, max_nourishment);
            extension_y.push(result > 0 ? result : null);
        }

        traces.push({
            line: {
                color: lineColours[counterColor],
                width: 2
            },
            marker: {
                color: 'rgb(255, 255, 255)',
                size: 8
            },
            name: `${country} Historical`,
            x: country_data.map(d => d.year),
            y: country_data.map(d => d[isFirst ? 'Population Nourishment %' : 'DALYs']),
            mode: 'lines'
        });
        counterColor++;
        console.log('test color: ', lineColours[counterColor])
        traces.push({
            line: {
                color: lineColours[counterColor],
                width: 2
            },
            marker: {
                color: 'rgb(255, 255, 255)',
                size: 8
            },
            name: `${country} Linear Regression`,
            x: extension_x,
            y: extension_y,
            mode: 'lines'
        });
        counterColor++;
    }

    if (isFirst) {
        Plotly.newPlot('nourishment-plot', traces, thisLayout);
    } else {
        console.log(traces)
        Plotly.newPlot('disease-plot', traces, thisLayout);
    }
    isFirst = false;
}

Plotly.d3.csv("regressions/populationnourishment.csv", make_regression);
Plotly.d3.csv("regressions/dalys.csv", make_regression);