const roundToFive = x => Math.round(x / 5) * 5

const upDateYearData = (offset) => {
    const newYear = roundToFive(stretch(offset, startY, startY + lineHeight, 2050, 1950));
    document.getElementById('current-year').innerHTML = newYear;
}

//Create custom slider using p5.
const startY = 40;
const radius = 40
const startX = radius / 2;

const lineHeight = 235;
let ellipseY = startY
let ellipseX = startX;
let overBox = false;
let locked = false;
let yOffset = 0.0;

function setup() {
    let canvas = createCanvas(300, 300);
    canvas.parent('sketch-container');
}

function draw() {
    // background(255, 255, 255, 0);
    stroke(240)
    strokeWeight(5)
    line(startX, startY, startX, startY + lineHeight)
    noStroke();
    fill(255, 255, 255);
    ellipse(startX, startY, 10);
    ellipse(startX, startY + lineHeight, 10);
    fill(112, 21, 109);
    if (
        mouseX > ellipseX - radius &&
        mouseX < ellipseX + radius &&
        mouseY > ellipseY - radius &&
        mouseY < ellipseY + radius
    ) {
        overBox = true;
        if (!locked) {
            // hover
            fill(169, 44, 165);
        }
    } else {
        fill(112, 21, 109);
        overBox = false;
    }
    ellipse(ellipseX, ellipseY, radius);
    upDateYearData(ellipseY); //kind of bad but then again so is p5
}

function mousePressed() {
    if (overBox) {
        locked = true;
    } else {
        locked = false;
    }
    yOffset = mouseY - ellipseY;
}

function mouseDragged() {
    if (locked) {
        ellipseY = mouseY - yOffset;
    }
    if (ellipseY > startY + lineHeight) {
        ellipseY = startY + lineHeight;
    }
    if (ellipseY < startY) {
        ellipseY = startY;
    }
    clear(); //bassically draw a transparent canvas
}

const initMusicPlayer = () => {
    // start playing
    let buttonToggle = true;
    player = document.getElementById('play-sound');
    console.log('playing music');
    player.addEventListener('click', () => {
        console.log('toggle');
        if (buttonToggle) {
            player.src = "assets/sound-off.svg";
        } else {
            player.src = "assets/sound-on.svg";
        }
        buttonToggle = !buttonToggle;
    });
}

// ENABLE SCROLL AFTER ENTERED.
const scrollToWorld = () => {
    // disable scrolling in current view
    document.querySelector('body').classList.add('stop-scrolling');
    //show landing text
    const overlayContainer = document.getElementsByClassName('container-title')[0];
    overlayContainer.style.display = "grid";
    document.getElementsByClassName('hero-spacer')[0].visibility = "visible";
    document.getElementsByClassName('hero-spacer')[0].style.opacity = 1;

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

        initMusicPlayer();
        loadEdit();
        // Remove
        setTimeout(function() {
            worldElem.style.filter = "none";
            worldElem.classList.remove('globeBlur');
            document.getElementsByClassName('contain-scroll-button')[0].style.opacity = 0.8;
            document.getElementById('globeInfoOverlay').style.opacity = 1;
            document.getElementById('sketch-container').style.opacity = 1;
        }, 2500);
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
        .polygonsTransitionDuration(300)

    // Auto-rotate
    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.6;
    world.controls().enableZoom = false;
    // Default
    world.pointOfView({
            lat: null,
            lng: null,
            altitude: 1.1
        },
        0
    );

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