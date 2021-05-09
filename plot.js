// duplicated from script.js
const maxVal = Math.pow(600, 1 / 4);
colorScale.domain([0, maxVal]);
// 

const lineColours = [
    '#444444',
    '#540851',
    '#85B5FB',
    '#8C81B9',
    '#AE122E',
    '#D0D0D0'
]

// I've #lostheplot
const mainPlotLayout = {
    margin: { 'l': 40, 'r': 20, 't': 20, 'b': 120 },
    legend: {
        x: 1,
        xanchor: 'right',
        y: 0.97
    },
    width: innerWidth - innerWidth * 0.7,
    paper_bgcolor: "rgba( 144, 19, 254, 0)", //invisable backgrounds
    plot_bgcolor: "rgba( 144, 19, 254, 0)",
    showlegend: true,
    barmode: 'group',
    font: {
        family: 'DM Sans, sans-serif',
        size: 15,
        color: '#ffffff'
    },
    // legend: { "orientation": "h" }
};
// Change this to compare
var mostChangeInNumDeaths = {
    x: ['Oman', 'Iran', 'Maldives'],
    y: [474.57, 469.96, 427.24],
    type: 'bar',
    name: '1950',
};

var mostChangeInNumDeathsNow = {
    x: ['Oman', 'Iran', 'Maldives'],
    y: [11.28, 15.91, 8.47],
    type: 'bar',
    name: '2017',
};

var leastChangeInNumDeaths = {
    x: ['Andorra',
        'Northern Mariana Islands',
        'Sweden'
    ],
    y: [25.4, 33.81, 28.54],
    type: 'bar',
    name: '1950',

};

var leastChangeInNumDeathsLatest = {
    x: ['Andorra',
        'Northern Mariana Islands',
        'Sweden'
    ],
    y: [2.11, 9.41, 3.03],
    type: 'bar',
    name: '2017',
};

var greatestPercent = {
    x: ['Singapore',
        'South Korea',
        'Slovenia',
    ],
    y: [98, 98, 98],
    type: 'bar',
    name: 'Max 3',
};

var LowestPercent = {
    x: [
        'Central African Republic',
        'Zimbabwe',
        'Lesotho'
    ],
    y: [45, 57, 57],
    type: 'bar',
    name: 'Min 3'
};


const groupTrace = [mostChangeInNumDeaths, mostChangeInNumDeathsNow];
// const groupTraceLeast = [leastChangeInNumDeaths, leastChangeInNumDeathsLatest];
const groupTracePercent = [greatestPercent, LowestPercent];

Plotly.newPlot('plot0', groupTrace, mainPlotLayout);
// Plotly.newPlot('plot1', groupTraceLeast, mainPlotLayout);
Plotly.newPlot('plot3', groupTracePercent, mainPlotLayout);



// Plotly.newPlot('plot1', changeInPercentDeaths, mainPlotLayout);


const handleChangeTimeSeries = (data) => {
    var tracesArray = [];
    // Data is pre-sorted.
    // Package array values by country key
    const countryNames = {}
    for (const row of data) {
        const key = row.Entity;
        if (!countryNames[key]) {
            countryNames[key] = [];
        }
        countryNames[key].push(row);
    }
    // Create trace for each key
    var traceTemplate = {
        type: "scatter",
        name: '',
        mode: 'lines+markers',
        line: {
            color: lineColours[lineCount],
            width: 2
        },
        marker: {
            color: 'rgb(255, 255, 255)',
            size: 8
        },
        x: [],
        y: [],
    }
    var lineCount = 0;
    for (const [key, countrySet] of Object.entries(countryNames)) {
        const thisTrace = {
            ...traceTemplate,
            name: key,
            line: {
                color: lineColours[lineCount],
                width: 2
            },
            x: [],
            y: [],
        };
        for (const elem of countrySet) {
            // console.log(elem);
            thisTrace.x.push(elem.Year);
            thisTrace.y.push(elem['Child mortality']);
        }
        // console.log('pushed ', thisTrace);
        tracesArray.push(thisTrace);
        lineCount++;
    }
    const innerChartSize = (innerWidth - innerWidth * 0.28)
        // const innerChartSize = (innerWidth / 15) * 4.5;

    var layoutExtension = {
        ...mainPlotLayout,
        margin: { 'l': 30, 'r': 10, 't': 20, 'b': 50 },
        width: innerChartSize,
        hight: innerChartSize * 0.85,
        title: null,
        legend: { "orientation": "h" },
        xaxis: {
            autorange: true,
            range: ['1950', '2017'],
            type: 'date',
            gridcolor: "rgba(255,255,255,0.1)",
        },
        yaxis: {
            autorange: false,
            range: ['0', '500'],
            type: 'linear',
            gridcolor: "rgba(255,255,255,0.1)",
        }
    };
    if (data[0].Entity !== "Oman") {
        Plotly.newPlot('plot2', tracesArray, layoutExtension);

    } else {
        Plotly.newPlot('plot4', tracesArray, layoutExtension);

    }

}

Plotly.d3.csv("changetimeseries.csv", handleChangeTimeSeries);
Plotly.d3.csv("recenthistory.csv", handleChangeTimeSeries);


const handleCombinedData = (data) => {
    var baseTrace = {
        x: [],
        y: [],
        text: [],
        mode: 'markers',
        marker: {
            color: [],
            size: []
        }
    };

    for (const row of data) {
        const nourishment = row['Prevalence of undernourishment (% of population)'];
        const disease = row['Disease Burden'];
        const mortality = row['Child mortality (IHME, 2018)'];
        if (nourishment > 0 &&
            nourishment !== '#N/A' &&
            disease > 0 &&
            disease !== '#N/A') {
            baseTrace.y.push(nourishment);
            baseTrace.x.push(disease);
            baseTrace.marker.size.push(mortality / 2);
            baseTrace.text.push(row.Country);
            baseTrace.marker.color.push(colorScale(Math.pow(mortality * 2, 1 / 4)));
        }
    }


    var layout = {
        ...mainPlotLayout,
        showlegend: false,
        width: innerWidth - innerWidth * 0.29,
        height: innerHeight * 0.85,
        legend: { "orientation": "h" },
        margin: { 'l': 60, 'r': 20, 't': 10, 'b': 50 },
        xaxis: {
            title: "DALYs per 100,000 people. ",
            autorange: true,
            gridcolor: "rgba(255,255,255,0.1)",
        },
        yaxis: {
            title: "Prevalence of undernourishment (% of population) by country.",
            autorange: true,
            gridcolor: "rgba(255,255,255,0.1)",
        }
    };
    Plotly.newPlot('BUBBLETROUBLE', [baseTrace], layout);
}


const reuseLayout = {
    ...mainPlotLayout,
    showlegend: false,
    width: innerWidth / 3.2,
    height: innerHeight * 0.4,
    legend: { "orientation": "h" },
    margin: { 'l': 40, 'r': 20, 't': 10, 'b': 30 },
    xaxis: {
        autorange: true,
        gridcolor: "rgba(255,255,255,0.1)",
    },
    yaxis: {
        autorange: true,
        gridcolor: "rgba(255,255,255,0.1)",
    }
};

const handleCombinedGEO = (data) => {
    var baseTrace = {
        x: [],
        y: [],
        text: [],
        mode: 'markers',
        marker: {
            color: [],
            size: []
        }
    };

    for (const row of data) {
        const nourishment = row['Longitude'];
        const disease = row['Latitude'];
        const mortality = row['Child mortality (IHME, 2018)'];
        if (
            nourishment !== '#N/A' && //allow negatives
            disease !== '#N/A') {
            baseTrace.y.push(nourishment);
            baseTrace.x.push(disease);
            baseTrace.marker.size.push(mortality / 3);
            baseTrace.text.push(row.Country);
            baseTrace.marker.color.push(colorScale(Math.pow(mortality * 2, 1 / 4)));
        }
    }


    Plotly.newPlot('country-info-0', [baseTrace], reuseLayout);
}


const handleCombinedSizeandPop = (data) => {
    var baseTrace = {
        x: [],
        y: [],
        text: [],
        mode: 'markers',
        marker: {
            color: [],
            size: []
        }
    };

    for (const row of data) {
        const nourishment = row['Landmass'];
        const disease = row['Total Population'];
        const mortality = row['Child mortality (IHME, 2018)'];
        if (nourishment > 0 && //no negatives
            nourishment !== '#N/A' &&
            disease > 0 &&
            disease !== '#N/A') {
            baseTrace.y.push(nourishment);
            baseTrace.x.push(disease);
            baseTrace.marker.size.push(mortality / 3);
            baseTrace.text.push(row.Country);
            baseTrace.marker.color.push(colorScale(Math.pow(mortality * 2, 1 / 4)));
        }
    }

    Plotly.newPlot('country-info-1', [baseTrace], reuseLayout);
}



Plotly.d3.csv("combined/2017combined.csv", handleCombinedData);

Plotly.d3.csv("combined/combinedcountryinfo.csv", handleCombinedGEO);
Plotly.d3.csv("combined/combinedcountryinfo.csv", handleCombinedSizeandPop);