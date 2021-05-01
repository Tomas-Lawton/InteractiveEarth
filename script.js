//Container size set by object props.
const earthWidth = window.innerWidth / 5 * 3;
const earthHeight = window.innerHeight;

// ENABLE SCROLL AFTER ENTERED.
const scrollToWorld = (updateWorldSize) => {
    // disable scrolling in current view
    document.querySelector('body').classList.add('stop-scrolling');
    //show landing text
    const overlayContainer = document.getElementsByClassName('container-title')[0];
    overlayContainer.style.display = "grid";
    document.getElementsByClassName('hero-spacer')[0].visibility = "visible";
    document.getElementsByClassName('hero-spacer')[0].style.opacity = 1;

    const loader = document.getElementById('loader');
    loader.scrollTop = loader.scrollHeight;
    loader.style.display = 'none';

    const mainButton = document.getElementById("handleLanding");

    mainButton.addEventListener("click", () => {
        updateWorldSize();

        const worldElem = document.getElementById("globeViz");
        // document.getElementById('globeViz').style.width = window.innerWidth;
        worldElem.style.width = earthWidth;
        overlayContainer.style.display = "none";
        worldElem.style.transition = "all 1s";
        worldElem.style.filter = "none";
        // Show interface
        // document.getElementById("interface-left").classList.add('interface-styles-left');
        loadEdit();
        // Remove
        setTimeout(function() {
            worldElem.style.filter = "none";
            worldElem.classList.remove('globeBlur');
            document.getElementsByClassName('contain-scroll-button')[0].style.opacity = 0.8;
            // document.getElementById('contain-items-right').style.opacity = 1;
        }, 2000);
    })
    scrollButton();
}

const scrollButton = () => {
    $(function() {
        $('.scroll-down').click(function() {
            var elem = document.querySelector('input[type="range"]');
            var rangeValue = function() {
                var newValue = elem.value;
                var target = document.querySelector('.value');
                target.innerHTML = newValue;
            }
            elem.addEventListener("input", rangeValue);
            document.querySelector('body').classList.remove('stop-scrolling');
            $('html, body').animate({ scrollTop: $('section.ok').offset().top }, 'slow');
            document.getElementsByClassName('contain-scroll-button')[0].style.transition = "all 500ms";
            document.getElementsByClassName('contain-scroll-button')[0].style.opacity = 0;
            return false;
        });
    });
}

async function loadEdit() {
    await updatePointOfView();
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
                <h3 class="card-title">${d.NAME}</h3>
                <tr>
                    <td class="data-entry">Cases: ${numberWithCommas(c.confirmed)}</td>
                </tr>
                <tr>
                    <td class="data-entry">Deaths: ${numberWithCommas(c.deaths)}</td>
                </tr>
            </div>
          `;
}

const extruder = (feat) => {
    return altitude + (Math.sqrt(getVal(feat)) * 0.22);
}

const initGlobe = async scrollToWorld => {
    //  set earth contaier as hero
    const globeContainer = document.getElementById("globeViz");
    globeContainer.style.width = window.innerWidth;
    // create the earth with data and custon props.
    world = await Globe()(globeContainer)
        .globeImageUrl(GLOBE_IMAGE_URL)
        .showGraticules(false)
        .polygonAltitude(feat => extruder(feat))
        .backgroundColor("rgba(100, 100, 100, 0.0)")
        // .width(earthWidth)
        // .height(earthHeight)
        .width(window.innerWidth)
        .height(window.innerHeight)
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
        .polygonsTransitionDuration(300)

    // Auto-rotate
    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.6;
    world.controls().enableZoom = false;
    // Unfuk the scene container
    world.renderer().setSize(window.innerWidth, window.innerHeight);
    // world.renderer().setSize(earthWidth, earthHeight);
    // Default
    world.pointOfView({
            lat: null,
            lng: null,
            altitude: 1.1
        },
        0
    );
    const updateWorldSize = () => {
        world.width(earthWidth);
        world.height(earthHeight);
    };


    await getCases();
    await window.addEventListener("resize", (event) => {
        world.width(earthWidth);
        world.height(earthHeight);
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
    scrollToWorld(updateWorldSize);
}

async function getCases() {
    countries = await request(CASES_API);
    featureCollection = (await request(GEOJSON_URL)).features;
    dates = Object.keys(countries.India);
    await updatePolygonsData();
}

function updatePolygonsData() {
    console.log("CONTRIES: ", countries)
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
                altitude: 1.99
            },
            3000
        );
    } catch (e) {
        console.log("Unable to set point of view.");
    }
}

initGlobe(scrollToWorld);
// initGlobe();