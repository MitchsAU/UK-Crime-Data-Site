    document.addEventListener('DOMContentLoaded', () => {
        const map = L.map('map').setView([52.6376, -1.135171], 12); // Initial map view
    
        var Regular = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
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
            // Fetch and display crime data for new marker position and selected date
            const selectedDate = dateSelect.value;
            // Construct the API URL with clicked coordinates
            const apiUrl = `https://data.police.uk/api/crimes-street/all-crime?poly=${clickedCoordinates[0].lat},${clickedCoordinates[0].lng}:${clickedCoordinates[1].lat},${clickedCoordinates[1].lng}:${clickedCoordinates[2].lat},${clickedCoordinates[2].lng}&date=${selectedDate}`;
    
            // Fetch data and update heatmap
            fetch(apiUrl)
                .then(resp => {
                    if (resp.status === 503) {
                        // Handle 503 error
                        alert("Area is too large, please select a smaller area.");
                        // Reset state and clear previous heatmap layer
                        clickedCoordinates = [];
                        if (currentHeatmapLayer) {
                            map.removeLayer(currentHeatmapLayer);
                        }
                        throw new Error("Area is too large");
                    }
                    if (!resp.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return resp.json();
                })
                .then(data => {
                    const heatData = data.slice(0, 9999).map(item => ({
                        lat: item.location.latitude,
                        lng: item.location.longitude,
                        count: 1
                        
                    }));
                    
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
                .catch(error => {
                    console.error('Error:', error);
                    // Handle other errors here if needed
                }); 
        }
        });
        const locationSearchInput = document.getElementById('locationSearch');
        const searchButton = document.getElementById('searchButton');
        const nominatimEndpoint = 'https://nominatim.openstreetmap.org/search';
        
        // Function to handle the search
        function performSearch() {
            const locationName = locationSearchInput.value;
        
            // Perform a geocoding request
            fetch(`${nominatimEndpoint}?q=${encodeURIComponent(locationName)}&format=json`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        // Get the first result's coordinates
                        const latitude = parseFloat(data[0].lat);
                        const longitude = parseFloat(data[0].lon);
        
                        // Center the map on the found location
                        map.setView([latitude, longitude], 12);
                    } else {
                        alert('Location not found.');
                    }
                })
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