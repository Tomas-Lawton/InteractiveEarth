// ENABLE SCROLL AFTER ENTERED.

const scrollToWorld = () => {
    //show landing text
    const overlayContainer = document.getElementsByClassName('container-title')[0];
    overlayContainer.style.display = "grid";
    document.getElementsByClassName('hero-spacer')[0].visibility = "visible";

    console.log('page is fully loaded');
    const loader = document.getElementById('loader');
    loader.scrollTop = loader.scrollHeight;
    loader.style.display = 'none';

    const mainButton = document.getElementById("handleLanding");
    mainButton.addEventListener("click", () => {
        const worldElem = document.getElementById("globeViz");

        overlayContainer.style.display = "none";
        worldElem.style.transition = "all 1s";
        worldElem.style.filter = "none";
        // Remove
        setTimeout(function() {
            worldElem.style.filter = "none";
            worldElem.classList.remove('globeBlur');
        }, 2000);
    })
}

const CASES_API = "https://raw.githubusercontent.com/wobsoriano/covid3d/master/data.json";
const GEOJSON_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const GLOBE_IMAGE_URL = "//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg";
const colorScale = d3.scaleSequential(d3.interpolateBuPu)
const altitude = 0.0063;

let dates;
let countries;
let featureCollection;

///HEAT MAPPER
const getVal = (feat) => {
    return Math.pow(feat.covidData.active / feat.properties.POP_EST, 1 / 4);
};

async function request(url) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data;
    } catch (e) {
        throw e;
    }
}

async function getCoordinates() {
    try {
        const { latitude, longitude } = await request(
            "https://geolocation-db.com/json/"
        );
        return {
            latitude,
            longitude,
        };
    } catch (e) {
        throw e;
    }
}

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getPolygonLabel(flagName, d, c) {
    return `
            <div class="card">
                 <h3>${d.NAME}</h3>
                 <p>Cases: ${numberWithCommas(c.confirmed)}</p>
                 <p>Deaths: ${numberWithCommas(c.deaths)}</p>
            </div>
          `;
}

const extruder = (feat) => {
    // return (altitude + getVal(feat) * 1.001) * 0.6;
    return altitude + (Math.sqrt(getVal(feat)) * 0.22);
}

const initGlobe = async finishLoading => {
    const globeContainer = document.getElementById("globeViz");

    world = await Globe()(globeContainer)
        // .onZoom((object) => enableZoom(false))
        .globeImageUrl(GLOBE_IMAGE_URL)
        .showGraticules(false)
        // .polygonAltitude(altitude)
        .polygonAltitude(feat => extruder(feat))
        .backgroundColor("rgba(100, 100, 100, 0.0)")
        .showAtmosphere(true)
        .polygonCapColor((feat) => colorScale(getVal(feat)))
        .polygonSideColor((feat) => colorScale(getVal(feat)))
        .polygonStrokeColor(() => "rgba(255, 255, 255, 0.4)")
        .polygonLabel(({ properties: d, covidData: c }) => {
            const flagName = getFlagName(d);
            return getPolygonLabel(flagName, d, c);
        })
        .onPolygonHover((hoverD) =>
            world
            .polygonAltitude((d) => (d === hoverD ? extruder(d) + 0.05 : extruder(d)))
            .polygonCapColor((d) =>
                d === hoverD ? "rgb(21, 0, 37) 100.2%" : colorScale(getVal(d))
            )
        )
        .polygonsTransitionDuration(300);

    // Auto-rotate
    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.6;
    world.controls().enableZoom = false;

    await getCases();
    await window.addEventListener("resize", (event) => {
        world.width(window.innerWidth);
        world.height(window.innerHeight);
    });

    function getFlagName(d) {
        switch (d.ADMIN) {
            case "France":
                return "fr";
            case "Norway":
                return "no";
            default:
                return d.ISO_A2.toLowerCase();
        }
    }
    finishLoading();
}

async function getCases() {
    countries = await request(CASES_API);
    featureCollection = (await request(GEOJSON_URL)).features;
    dates = Object.keys(countries.India);
    await updatePolygonsData();
    await updatePointOfView();
}

function updatePolygonsData() {
    const date = dates.length - 1;
    for (let x = 0; x < featureCollection.length; x++) {
        const country = featureCollection[x].properties.NAME;
        if (countries[country]) {
            featureCollection[x].covidData = {
                confirmed: countries[country][dates[date]].confirmed,
                deaths: countries[country][dates[date]].deaths,
                recoveries: countries[country][dates[date]].recoveries,
                active: countries[country][dates[date]].confirmed -
                    countries[country][dates[date]].deaths -
                    countries[country][dates[date]].recoveries,
            };
        } else {
            featureCollection[x].covidData = {
                confirmed: 0,
                deaths: 0,
                recoveries: 0,
                active: 0,
            };
        }
    }
    const maxVal = Math.max(...featureCollection.map(getVal));
    colorScale.domain([0, maxVal]);
    world.polygonsData(featureCollection);
}

async function updatePointOfView() {
    try {
        const { latitude, longitude } = await getCoordinates();

        world.pointOfView({
                lat: latitude,
                lng: longitude,
            },
            1000
        );
    } catch (e) {
        console.log("Unable to set point of view.");
    }
}

initGlobe(scrollToWorld);