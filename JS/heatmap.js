    document.addEventListener('DOMContentLoaded', () => {
        const map = L.map('map').setView([52.6376, -1.135171], 12); // Initial map view

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
        "GoogleStreet": GoogleStreet,
        "Dark": Dark,
        "Topographic": Topo,
        "SmoothDark": SmoothDark,
    
    };

    //Controller for changing the map varients
    L.control.layers(baseMaps).addTo(map);
    
        // Array to store the clicked coordinates
        let clickedCoordinates = [];
    
        // Variable to store the current heatmap layer
        let currentHeatmapLayer = null;
    
        // Variable to store the current marker layer group
        let currentMarkerGroup = L.layerGroup().addTo(map);
    
        // Function to remove markers
        function removeMarkers() {
            currentMarkerGroup.clearLayers();
        }
    
        // Event handler for map click
    map.on('click', function (e) {
        // Remove previous markers
        removeMarkers();

        crimeCounts = {}; // Clear crime counts
        displayCrimeCounts(crimeCounts); // Clear displayed counts

        // Add the clicked coordinates to the array
        clickedCoordinates.push({
            lat: e.latlng.lat,
            lng: e.latlng.lng
        });
    
        // Display markers on the map for clicked coordinates
        for (const coord of clickedCoordinates) {
            L.marker([coord.lat, coord.lng]).addTo(currentMarkerGroup);
        }
    
        // If three points have been clicked, fetch data and update heatmap
        if (clickedCoordinates.length === 3) {
            // Fetch and display crime data for new marker position with selected date and selected crime
            const selectedDate = dateSelect.value;
            const selectedCrime = crimeSelect.value;
            // Construct the API URL with clicked coordinates, this is the same API as the pin but a different link
            const apiUrl = `https://data.police.uk/api/crimes-street/${selectedCrime}?poly=${clickedCoordinates[0].lat},${clickedCoordinates[0].lng}:${clickedCoordinates[1].lat},${clickedCoordinates[1].lng}:${clickedCoordinates[2].lat},${clickedCoordinates[2].lng}&date=${selectedDate}`;
            // Fetch data and update heatmap
            fetch(apiUrl)
                .then(resp => {
                    if (resp.status === 503) {
                        // Handle 503 error, the 503 error is if the fetch request pulls more than 10,000 arrays
                        alert("Area is too large, please select a smaller area."); // Sends alert to user
                        // Reset state and clear previous heatmap layer
                        clickedCoordinates = [];
                        if (currentHeatmapLayer) {
                            map.removeLayer(currentHeatmapLayer);
                        } // error handling 
                        throw new Error("Area is too large");
                    }
                    if (!resp.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return resp.json(); // return json format
                })
                .then(data => {
                    // Checking if there is no data, if so displays a alert telling the user
                    if (data.length === 0) {
                        // no data alert
                        alert("No data found in-between these locations, make sure you are within the UK");
                        // clearing the markers so the user can input new markers. If this isnt cleared here it breaks the code and the page has to be reloaded to function again.
                        clickedCoordinates = [];
                        removeMarkers();
                        return;
                    }
                    Object.keys(crimeCounts).forEach(category => {
                        crimeCounts[category] = 0;
                    });

                    const heatData = data.slice(0, 9999).map(item => { // slicing the data to try and not pull more than 9999 arrays
                        console.log(item.category);
                        crimeCounts[item.category] = (crimeCounts[item.category] || 0) + 1;
                        return {
                            lat: item.location.latitude,
                            lng: item.location.longitude,
                            count: 1
                        };
                    });

                    displayCrimeCounts(crimeCounts); // Display counts on screen

                    // setting up the config for the heatmap, this allows me to change things like opacity and radius
                    var cfg = {
                        "radius": 20,
                        "maxOpacity": 0.8,
                        "useLocalExtrema": false,
                        latField: 'lat',
                        lngField: 'lng',
                        valueField: 'count'
                    };
    
                    // Clear existing heatmap layer if it exists
                    if (currentHeatmapLayer) {
                        map.removeLayer(currentHeatmapLayer);
                    }
    
                    // Create and add the new heatmap layer
                    currentHeatmapLayer = new HeatmapOverlay(cfg);
                    currentHeatmapLayer.setData({ max: 5, data: heatData });
                    map.addLayer(currentHeatmapLayer);
    
                    // Clear the clicked coordinates for the next input
                    clickedCoordinates = [];
                })
                .catch(error => { // errors
                    console.error('Error:', error);
                }); 
        }
        });

        const locationSearchInput = document.getElementById('locationSearching');
        const searchButton = document.getElementById('searchingButton');
        const nominatimEndpoint = 'https://nominatim.openstreetmap.org/search';
        
        // Function to handle the search
        function performSearch() {
            const locationName = locationSearchInput.value;
        
            // Perform a geocoding request through another API
            fetch(`${nominatimEndpoint}?q=${encodeURIComponent(locationName)}&format=json`) //This is API (2/2), this nominatim API helps me geolocate the town or city the user inputs in the search box
                .then(response => response.json())
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

        // Function to display the information on screen
        function displayCrimeCounts(counts) {
            const countsContainer = document.getElementById('crimeCounts');
            countsContainer.innerHTML = ''; // Clear previous counts
    
            // Go through the crime counts and add them to the container
            for (const category in counts) {
                if (counts.hasOwnProperty(category)) {
                    const count = counts[category];
                    const countElement = document.createElement('tr'); // Creating tr element
                    countElement.textContent = ` ${category}: ${count} `; // Adding category and its count
                    countsContainer.appendChild(countElement);
                }
            }
        }

        var crimeCountsElement = document.getElementById('crimeCounts');

        // Function to change the border colour, this hides the border when no information is being displayed on screen
        function setBorderColor(color) {
        crimeCountsElement.style.borderColor = color;
        }

        // Added a MutationObserver to watch for changes in the content
        var observer = new MutationObserver(function(mutations) {
        // Checking if any text is added or removed
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
            // If the text is added it changes to border colour to be visible
            if (crimeCountsElement.textContent.trim() !== '') {
                setBorderColor('#c1c1c1'); // Sets colour
            } else {
                // Setting it back to transprent if the text is removed
                setBorderColor('transparent');
            }
            }
        });
        });

        // this watches for changes in the child elements
        var config = { childList: true, subtree: true };

        // observes the element for any changes
        observer.observe(crimeCountsElement, config);

    });

    