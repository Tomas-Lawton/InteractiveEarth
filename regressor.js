console.log('regress test');

const baseLayout = {
    title: 'Mortality Regression',
    paper_bgcolor: "rgba( 144, 19, 254, 0)", //invisable backgrounds
    plot_bgcolor: "rgba( 144, 19, 254, 0)",
    showlegend: false
};


const countryTraces = (csv_data) => {
    //Set up traces array for plotly.
    let dataTraces = [];

    // Create a unique list of names.
    const countryTable = {}

    // for (const countryCollection in nameTable) {
    let country_data = csv_data.filter(d => d.country == "Afghanistan");
    dataTraces.push(addTrace(row));
    // }

    Plotly.newPlot('myDiv', dataTraces, baseLayout);
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
    console.log(regression_data);
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

    return { //before
        x: country_data.map(d => d.year),
        y: country_data.map(d => d.mortality),
        mode: 'lines'
    }, { //prediction
        x: extension_x,
        y: extension_y,
        mode: 'lines'
    };

}


Plotly.d3.csv("mortality.csv", countryTraces);

//This stretch function is actually just the map function from p5.js
function stretch(n, start1, stop1, start2, stop2) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};