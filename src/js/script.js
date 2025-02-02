/**
 * Set up event listeners to open and close the about popup.
 *
 * @param docObj: The `document` global
 */
const setUpAbout = (docObj) => {
  const aboutElement = docObj.querySelector(".about-text-popup");
  docObj.querySelector(".banner-about").addEventListener("click", () => {
    aboutElement.style.display =
      aboutElement.style.display !== "block" ? "block" : "none";
  });

  // Note that the close element will only render when the about text popup is rendered.
  // So, it only ever makes sense for a click to close.
  docObj.querySelector(".about-close").addEventListener("click", () => {
    aboutElement.style.display = "none";
  });
};

/**
 * @param leaflet: The `L` global
 */
const defineBaseLayers = (leaflet) => ({
  Light: leaflet.tileLayer(
    "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}",
    {
      attribution:
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: "abcd",
      minZoom: 0,
      maxZoom: 20,
      ext: "png",
    }
  ),
  "Google Maps": leaflet.tileLayer(
    "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    {
      attribution: "Google Maps",
      // Max value is 24 but I set it to 20 because the Stamen Toner style has value of 20 as max value.
      maxZoom: 20,
    }
  ),
});

/**
 * Create the initial map and pane objects.
 *
 * This sets up Google Maps vs. Light mode, attribution, and zoom.
 *
 * @param docObj: The `document` global
 * @param leaflet: The `L` global
 * @returns: The map and pane instances.
 */
const createMapAndPane = (docObj, leaflet) => {
  const baseLayers = defineBaseLayers(leaflet);
  const map = leaflet.map("map", {
    zoomControl: false,
    layers: [baseLayers.Light],
  });
  map.attributionControl.setPrefix(
    'created by <a style="padding: 0 3px 0 3px; color:#fafafa; background-color: #21ccb9;" target="_blank" href=http://www.geocadder.bg/en/>GEOCADDER</a>'
  );
  leaflet.control.layers(baseLayers).addTo(map);

  const pane = map.createPane("fixed", docObj.getElementById("map"));

  const zoomHome = leaflet.Control.zoomHome();
  zoomHome.setHomeCoordinates([39.440556, -98.697222]);
  zoomHome.setHomeZoom(4);
  zoomHome.addTo(map);
  return [map, pane];
};

const citiesPolygonsStyle = {
  fillColor: "##c84041",
  color: "#c84041",
  weight: 4,
  fillOpacity: 0,
};
const parkingLotsStyle = {
  fillColor: "#FF0000",
  color: "#FF0000",
  weight: 1,
  fillOpacity: 0.6,
};

/**
 * Extract the city ID from the URL's `#`, if present.
 *
 * @param string windowUrl: The `window.location.href` global
 * @return string: Returns e.g. `saint-louis-mo` if present, else the empty string
 */
const extractCityIdFromUrl = (windowUrl) =>
  windowUrl.indexOf("#parking-reform-map=") === -1
    ? ""
    : windowUrl.split("#")[1].split("=")[1].toLowerCase();

/**
 * Parse the geojson's `Name` property into the city ID.
 *
 * @param string jsonCityName: the `Name` property from JSON, e.g. `"My City, AZ"`
 * @return string: the city ID, e.g. `saint-louis-mo`.
 */
const parseCityIdFromJson = (jsonCityName) =>
  jsonCityName.toLowerCase().replace(/ /g, "-").replace(/,/g, "");

/**
 * Determine what URL to use to share the current city.
 *
 * @param string windowUrl: the current page's URL
 * @param string cityId: e.g. `saint-louis-mo`
 * @return string: the URL to share
 */
const determineShareUrl = (windowUrl, cityId) => {
  const [baseUrl] = windowUrl.split("#");
  return `${baseUrl}#parking-reform-map=${cityId}`;
};

/**
 * Copy `value` to the user's clipboard and show the copied link message.
 *
 * @param docObj: The `document` global
 * @param string value
 */
const copyToClipboard = (docObj, value) => {
  const dummy = docObj.createElement("textarea");
  docObj.body.appendChild(dummy);
  dummy.value = value;
  dummy.select();
  docObj.execCommand("copy");
  docObj.body.removeChild(dummy);

  const copiedLinkMessageElement = docObj.querySelector(".copied-link-message");
  copiedLinkMessageElement.style.display = "block";
  setTimeout(() => {
    copiedLinkMessageElement.style.display = "none";
  }, 1000);
};

/**
 * Add an event listener for the share button to copy the link to the clipboard.
 *
 * @param docObj: The `document` global
 * @param windowUrl: The `window.location.href` global
 * @param string cityId: e.g. `saint-louis-mo`
 */
const setUpShareUrlClickListener = (docObj, windowUrl, cityId) => {
  // We put the event listener on `map` because it is never erased, unlike the copy button
  // being recreated every time the score card changes. This is called "event delegation".
  docObj.querySelector("#map").addEventListener("click", (event) => {
    const targetElement = event.target.closest("div.url-copy-button > a");
    if (targetElement) {
      const shareUrl = determineShareUrl(windowUrl, cityId);
      copyToClipboard(docObj, shareUrl);
    }
  });
};

/**
 * Generate the HTML for the score card.
 *
 * @param cityProperties: The keys from the geoJSON files.
 * @returns string: The HTML represented as a string.
 */
const generateScorecard = (cityProperties) => {
  const {
    Name,
    Percentage,
    Population,
    "Metro Population": MetroPopulation,
    "Parking Score": ParkingScore,
    Reforms,
    "Website URL": WebsiteURL,
  } = cityProperties;
  let result = `
    <div class="title">${Name}</div>
    <div class="url-copy-button"><a href="#"><img src="assets/images/share-url-button.png"></a></div>
    <hr>
    <div><span class="details-title">Percent of Central City Devoted to Parking: </span><span class="details-value">${Percentage}</span></div>
    <div><span class="details-title">Population: </span><span class="details-value">${Population}</span></div>
    <div><span class="details-title">Metro Population: </span><span class="details-value">${MetroPopulation}</span></div>
    <div><span class="details-title">Parking Score: </span><span class="details-value">${ParkingScore}</span></div>
    <div><span class="details-title">Parking Mandate Reforms: </span><span class="details-value">${Reforms}</span></div>
  `;
  if (WebsiteURL) {
    result += `
    <hr>
    <div class="popup-button"><a target="_blank" href="${WebsiteURL}">View more</a></div>
  `;
  }
  return result;
};

/**
 * Move the map to the city boundaries and set its score card.
 *
 * @param docObj: The `document` global
 * @param windowUrl: The `window.location.href` global
 * @param leaflet: The `L` global
 * @param map: The Leaflet map instance.
 * @param string cityId: e.g. `saint-louis-mo`
 * @param cityProperties: An object with a `layout` key (Leaflet value) and keys
 *    representing the score card properties stored in the Geojson files.
 */
const setMapToCity = (
  docObj,
  windowUrl,
  leaflet,
  map,
  cityId,
  cityProperties
) => {
  const { layer } = cityProperties;
  map.fitBounds(layer.getBounds());
  const scorecard = generateScorecard(cityProperties);
  setUpShareUrlClickListener(docObj, windowUrl, cityId);
  const popup = leaflet
    .popup({
      pane: "fixed",
      className: "popup-fixed",
      autoPan: false,
    })
    .setContent(scorecard);
  layer.bindPopup(popup).openPopup();
};

/**
 * Load the cities from GeoJson and set up an event listener to change cities when the user
 * toggles the city selection.
 *
 * @param docObj: The `document` global
 * @param windowUrl: The `window.location.href` global
 * @param leaflet: The `L` global
 * @param map: The Leaflet map instance.
 * @param string initialCityId: e.g. `columbus-oh` or an empty string if none was set. Will
 *    default to `columbus-oh`.
 */
const setUpCitiesLayer = async (
  docObj,
  windowUrl,
  leaflet,
  map,
  initialCityId
) => {
  const response = await fetch("./data/cities-polygons.geojson");
  const data = await response.json();

  const cities = {};
  leaflet
    .geoJson(data, {
      style() {
        return citiesPolygonsStyle;
      },
      onEachFeature(feature, layer) {
        const key = parseCityIdFromJson(feature.properties.Name);
        cities[key] = { layer, ...feature.properties };
      },
    })
    .addTo(map);

  // Set map to update when city selection changes.
  const cityToggleElement = docObj.getElementById("city-choice");
  cityToggleElement.addEventListener("change", () => {
    const cityId = cityToggleElement.value;
    setMapToCity(docObj, windowUrl, leaflet, map, cityId, cities[cityId]);
  });

  // Add each city to the city selection toggle and set the initial city.
  const cityKeys = Object.keys(cities).sort();
  cityKeys.forEach((key) => {
    const option = docObj.createElement("option");
    option.value = key;
    option.textContent = cities[key].Name;
    cityToggleElement.appendChild(option);
  });

  // Set initial city.
  const validatedInitialCityId =
    initialCityId in cities ? initialCityId : "columbus-oh";
  cityToggleElement.value = validatedInitialCityId;
  setMapToCity(
    docObj,
    windowUrl,
    leaflet,
    map,
    validatedInitialCityId,
    cities[validatedInitialCityId]
  );
};

/**
 * Load the parking lot data into the map.
 *
 * @param leaflet: The `L` global
 * @param map: The Leaflet map instance.
 */
const setUpParkingLotsLayer = async (leaflet, map) => {
  const response = await fetch("./data/parking-lots.geojson");
  const data = await response.json();
  leaflet
    .geoJSON(data, {
      style() {
        return parkingLotsStyle;
      },
    })
    .addTo(map);
};

/** Update index.html with the map and interactivity.
 *
 * This is the only function that can directly access globals like `document`. It
 * then passes those to the relevant helper functions.
 */
const setUpSite = async () => {
  /* eslint-disable no-undef */
  const docObj = document;
  const windowUrl = window.location.href;
  const leaflet = L;
  /* eslint-enable no-undef */

  setUpAbout(docObj);
  const [map, paneResult] = createMapAndPane(docObj, leaflet);
  // We must set the global `pane` for Leaflet to work.
  pane = paneResult; // eslint-disable-line no-undef

  const initialCityId = extractCityIdFromUrl(windowUrl);
  await Promise.all([
    setUpCitiesLayer(docObj, windowUrl, leaflet, map, initialCityId),
    setUpParkingLotsLayer(leaflet, map),
  ]);
};

module.exports = {
  extractCityIdFromUrl,
  determineShareUrl,
  parseCityIdFromJson,
  setUpSite,
};
