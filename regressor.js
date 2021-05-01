const dataByYear = {};

const baseLayout = {
    title: 'Mortality Regression',
    paper_bgcolor: "rgba( 144, 19, 254, 0)", //invisable backgrounds
    plot_bgcolor: "rgba( 144, 19, 254, 0)",
    showlegend: false
};

const setupYearDataDict = () => {
    for (let i = 1950; i <= 2050; i += 5) {
        if (!dataByYear[i]) {
            dataByYear[i] = [];
        }
    }
    console.log("Years object: ", dataByYear);
}


const countryTraces = (csv_data) => {
    //Set up traces array for plotly.
    let dataTraces = [];
    setupYearDataDict();
    // Loaded array of unique countries names
    Plotly.d3.csv("datacountries.csv", (data) => {
        // console.log(data);
        // let count = 0;
        data.forEach((country) => {
            // if (count === 3) { return };
            // console.log(country.Name);
            let country_data = csv_data.filter(d => d.country == country.Name);
            const { past, future } = addTrace(country_data)
            dataTraces.push(past);
            dataTraces.push(future);
            // count++;
        });
    });

    console.log('All traces: ', dataTraces);
    Plotly.newPlot('myDiv', dataTraces);
    // Plotly.newPlot('myDiv', tracedata);


    // Plotly.newPlot('myDiv', [{
    //     x: [1, 2, 3, 4, 5],
    //     y: [1, 2, 4, 8, 16]
    // }], {
    //     margin: { t: 0 }
    // });

}

const addTrace = (country_data) => {

    //To normalise our data, we need to know the minimum and maximum values
    //Math.min doesn't work with strings so we need to convert
    let mortality_data = country_data.map(d => Number(d.mortality))
    let min_mortality = Math.min(...mortality_data)
    let max_mortality = Math.max(...mortality_data)

    //normalise
    let regression_data = country_data.map(d => [stretch(d.year, 1950, 2017, 0, 1),
        stretch(d.mortality, min_mortality, max_mortality, 0, 1)
    ])

    // normalised - current year and result.
    // console.log(regression_data);
    //Here is where we train our regressor, experiment with the order value
    let regression_result = regression.polynomial(regression_data, { order: 3 });
    //Now we have a trained predictor, lets actually use it!
    let extension_x = [];
    let extension_y = [];
    for (let year = 2017; year < 2050; year++) {
        //We've still got to work in the normalised scale
        let prediction = regression_result.predict(stretch(year, 1950, 2017, 0, 1))[1]
        extension_x.push(year);
        //Make sure to un-normalise for displaying on the plot
        extension_y.push(stretch(prediction, 0, 1, min_mortality, max_mortality));
    }

    const past = { //before
        x: country_data.map(d => d.year),
        y: country_data.map(d => d.mortality),
        mode: 'lines'
    }

    const future = { //prediction
        x: extension_x,
        y: extension_y,
        mode: 'lines'
    };

    return { past, future };

}

Plotly.d3.csv("mortality.csv", countryTraces);

//This stretch function is actually just the map function from p5.js
function stretch(n, start1, stop1, start2, stop2) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};