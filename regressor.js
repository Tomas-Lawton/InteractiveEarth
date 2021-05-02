const dataByYear = {};
let dataTraces = [];
let GLOBAL_CSV_DATA;

const baseLayout = {
    title: 'Child Mortality Regression',
    paper_bgcolor: "rgba( 144, 19, 254, 0)", //invisable backgrounds
    plot_bgcolor: "rgba( 144, 19, 254, 0)",
    showlegend: true
};

const setupYearDataDict = () => {
    for (let i = 1950; i <= 2050; i += 5) {
        if (!dataByYear[i]) {
            dataByYear[i] = {};
        }
    }
    // console.log("Years object: ", dataByYear);
}

const handleNames = (namesList) => {
    namesList.forEach(string => {
        let country_data = GLOBAL_CSV_DATA.filter(d => d.country == string.Name);
        dataTraces.push(...addTrace(country_data, string.Name));
    });
    Plotly.newPlot('myDiv', dataTraces, baseLayout);
    console.log("DONE: ", dataByYear);
    // var customNameTrace = [];
    // const customNameList = ["France", "Spain", "New Zealand", "Afghanistan", "Sudan", "Brazil", "Uganda"];
    // customNameList.forEach(string => {
    //     let country_data = GLOBAL_CSV_DATA.filter(d => d.country == string);
    //     customNameTrace.push(...addTrace(country_data, string));
    // });

    // Plotly.newPlot('myDiv2', customNameTrace, baseLayout);

}
const countryTraces = (csv_data) => {
    GLOBAL_CSV_DATA = csv_data;
    //Init trace array for plotly
    setupYearDataDict();
    // Read unique countries names
    Plotly.d3.csv("datacountries.csv", handleNames);
}

const setToZero = (input) => {
    if (input < 0) {
        input = 0;
    }
    return input;
}

const calculateMetaData = (year, dataValue, countryName) => {
    // Calculates:
    // max and min for given year
    // global mean and median


}

const addTrace = (country_data, countryName) => {
    let mortality_data = country_data.map(d => Number(d.mortality));
    let min_mortality = Math.min(...mortality_data);
    let max_mortality = Math.max(...mortality_data);

    // normalise
    let regression_data = country_data.map(d => [stretch(d.year, 1950, 2017, 0, 1),
        stretch(d.mortality, min_mortality, max_mortality, 0, 1)
    ])

    // Predict all future values
    let regression_result = regression.linear(regression_data, { order: 3, precision: 2, });
    let extension_x = [];
    let extension_y = [];
    for (let year = 2017; year <= 2050; year++) { //33 predictions
        let prediction = regression_result.predict(stretch(year, 1950, 2017, 0, 1))[1]
        extension_x.push(year);
        //Make sure to un-normalise for displaying on the plot
        const mortalityPrediction = stretch(prediction, 0, 1, min_mortality, max_mortality);
        extension_y.push(mortalityPrediction);

        if (year in dataByYear) {
            dataByYear[year][countryName] = {
                mortalityValue: setToZero(mortalityPrediction)
            }
            calculateMetaData(year, mortalityPrediction, countryName);
        }
    }
    // Add in 5 year past incriments 1950-2010.
    const matchedDataPoints = country_data.filter(d => d.year in dataByYear);
    matchedDataPoints.forEach((pastDataPoint) => {
        calculateMetaData(pastDataPoint.year, pastDataPoint.mortality, countryName);
        dataByYear[pastDataPoint.year][countryName] = {
            mortalityValue: setToZero(pastDataPoint.mortality)
        }
    })

    // Add in 2015 data using regressor to fill the gap.
    const missingDataNormalised = regression_result.predict(stretch(2015, 1950, 2017, 0, 1))[1];
    const missingDataNormal = stretch(missingDataNormalised, 0, 1, min_mortality, max_mortality);
    dataByYear[2015][countryName] = {
        mortalityValue: setToZero(missingDataNormal)
    }
    calculateMetaData(2015, missingDataNormal, countryName);

    // Return traces for chart
    const past = { //before
        x: country_data.map(d => d.year),
        y: country_data.map(d => d.mortality),
        name: countryName,
        mode: 'lines'
    }

    const future = { //prediction
        x: extension_x,
        y: extension_y,
        name: countryName,
        mode: 'lines'
    };

    return [past, future];

}

Plotly.d3.csv("mortality.csv", countryTraces);

//This stretch function is actually just the map function from p5.js
function stretch(n, start1, stop1, start2, stop2) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};