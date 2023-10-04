document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([52.6376, -1.135171], 12); // Initial map view at lat and lng
    
    //Importing a varierty of different map layers for users to choose from
    var SmoothDark = L.tileLayer('https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
        attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 0,
        maxZoom: 22,
        subdomains: 'abcd',
        accessToken: 'KgfFC5uxE6cz1H9hylERXAnkGXI5SBBYJzu3S0rrY9hyHZHY4XWUNNSJ2U6ILDtw'
    });

    var Regular = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map); //First map to be loaded 

    var GoogleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0','mt1','mt2','mt3']
    });

    var GoogleStreet = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0','mt1','mt2','mt3']
    });

    var Dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    var Topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

// Map Layer Selector
var baseMaps = {
    "Regular": Regular,
    "Google Satelite": GoogleSat,
    "Google Street": GoogleStreet,
    "Dark": Dark,
    "Topographic": Topo,
    "Smooth Dark": SmoothDark,

};

//Controller for changing the map varients
L.control.layers(baseMaps).addTo(map);

    // This is creating the red Icon that the user places on the map
    let redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Initally placing the red market so its visible to the user
    let marker = L.marker([52.6376, -1.135171], { icon: redIcon, draggable: false }).addTo(map);

    // Grabbing the lat and lng from wherever the user clicks on the map
    map.on('click', event => {
        const latitude = event.latlng.lat;
        const longitude = event.latlng.lng;

        // Update marker position
        marker.setLatLng([latitude, longitude]);

        // Fetch and display crime data for new marker position and selected date
        const selectedDate = dateSelect.value;
        fetch(`https://data.police.uk/api/crimes-at-location?date=${selectedDate}&lat=${latitude}&lng=${longitude}`) //API (1/2) This is the UK police API link
            .then(res => res.json()) //converting to json format
            .then(data => {
                // Clear previous markers
                map.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });

                // Create a new red marker at the updated position
                marker = L.marker([latitude, longitude], { icon: redIcon, draggable: false }).addTo(map);

                const combinedMarkers = {}; //const for data with same lat and lng, explained further down

                // Checking if there is no data, if so displays a message in the popup
                if (data.length === 0) {
                    const noDataMessage = "No data found at this location";
                    // no data message added to the popup
                    marker.bindPopup(noDataMessage).openPopup();
                    return;
                }

                data.slice(0, 50).forEach(item => { // This makes it so there is no more than 50 crimes shown on the screen at the same time. Reducing having an overload of information that is super long
                    const lat = item.location.latitude; // Getting the lat
                    const lng = item.location.longitude; // Getting the lng
                    const category = item.category; // Getting the category
                    const outcome = item.outcome_status ? item.outcome_status.category : 'Outcome not available'; // Getting the outcome and setting a alternative if its null
                    const street = item.location.street.name || 'Unknown Street'; // Getting the street name and setting an alternative if its null
                    const outcomeDate = item.outcome_status ? item.outcome_status.date : 'Resolution Date Unknown'; // Getting the outcome date and setting an alternative if its null
                    console.log(item); // Console logging if the data is appearing
        
                    // Combine marker information if lat and lng match
                    const combinedKey = `${lat},${lng}`;
                    if (combinedMarkers[combinedKey]) {
                        combinedMarkers[combinedKey].category.push(category);
                        combinedMarkers[combinedKey].outcome.push(outcome);
                        combinedMarkers[combinedKey].outcomeDate.push(outcomeDate);
                    } else {
                        combinedMarkers[combinedKey] = {
                            lat,
                            lng,
                            category: [category],
                            outcome: [outcome],
                            outcomeDate: [outcomeDate],
                            street
                        };
                    }
                });

                // Create markers for combined data
                Object.values(combinedMarkers).forEach(markerData => {
                    const { lat, lng, category, outcome, outcomeDate, street } = markerData;
                
               // Define a colour mapping for each category to be displayed next to the category name on the marker
               const categoryColors = {
                'violent-crime': 'red', 
                'criminal-damage-arson': 'red',  
                'possession-of-weapons': 'red',  
                'burglary': '#ffbf00',      
                'drugs': '#ffbf00',
                'other-theft': '#ffbf00', 
                'public-order': '#ffbf00',  
                'robbery': '#ffbf00',  
                'theft-from-the-person': '#ffbf00', 
                'vehicle-crime': '#ffbf00',
                'bicycle-theft': 'green',  
                'anti-social-behaviour': 'green',
                'shoplifting': 'green',             
                'other-crime': 'green',
            };

            // Create a formatted popup content with colored dots
            let popupContent = `<span class="tableHeader">Location: ${street}</span>`; // Setting the location part of the information
            popupContent += `<div class="table"><div class="popupDiv"><span>Category</span><span>Outcome</span><span>Outcome Date</span></div>`; // setting the table column titles

            // Loop through each category and outcome and add them to the popup with dividers
            for (let i = 0; i < category.length; i++) {
                const categoryText = category[i] || 'Unknown Category';
                const outcomeText = outcome[i] || 'Outcome not available';
                const outcomeDateText = outcomeDate[i] || 'Resolution Date Unknown';

                // Get the color based on the category
                const categoryColor = categoryColors[categoryText] || 'gray'; // Default to gray if no matching color

                // Create a colored dot using a <span> element with inline CSS because of the colour variable
                const coloredDot = `<span style="display: inline-block; width: 9px; height: 9px; background-color: ${categoryColor}; border-radius: 50%; margin-right: 5px;"></span>`;

                //Adding the rest of the information to the marker
                popupContent += `<div class="popupContentDiv"><span><span>${coloredDot}</span> ${categoryText}</span><span> ${outcomeText}</span><span> ${outcomeDateText}</span></div>`;
            }
                    //Setting a new blue marker at the lat and lng on the map
                    L.marker([lat, lng])
                        .addTo(map) //this is adding the marker to the map
                        .bindPopup(popupContent) // this is adding the content to the marker
                        .openPopup(); // this is opening the markers content once loaded the information
                });
            });
    });
    
    const locationSearchInput = document.getElementById('locationSearching');
    const searchButton = document.getElementById('searchingButton');
    const nominatimEndpoint = 'https://nominatim.openstreetmap.org/search'; //This is API (2/2), this nominatim API helps me geolocate the town or city the user inputs in the search box
    
    // Function to handle the search
    function performSearch() {
        const locationName = locationSearchInput.value;
    
        // Perform a geocoding request
        fetch(`${nominatimEndpoint}?q=${encodeURIComponent(locationName)}&format=json`) //The fetch request for API (2/2)
            .then(response => response.json()) //conveert to json format
            .then(data => {
                if (data.length > 0) {
                    // Get the first result's coordinates
                    const latitude = parseFloat(data[0].lat);
                    const longitude = parseFloat(data[0].lon);
    
                    // Center the map on the found location with a zoom of 12
                    map.setView([latitude, longitude], 12);
                } else {
                    alert('Location not found.'); //Alerts the user if the location doesnt exist
                }
            }) // If there is a different error it will alert the user to try again
            .catch(error => {
                console.error('Error fetching location data:', error);
                alert('Error fetching location data. Please try again later.');
            });
    }
    
    // Listen for the click event on the search button
    searchButton.addEventListener('click', performSearch);
    
    // Listen for the Enter key press event in the input field
    locationSearchInput.addEventListener('keyup', event => {
        if (event.key === 'Enter') {
            performSearch();
        }
    }); 
});
