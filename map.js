document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([52.6376, -1.135171], 12); // Initial map view

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    let marker = L.marker([52.6376, -1.135171], { icon: redIcon, draggable: false }).addTo(map);
    const popupContentBox = document.getElementById('content');

    map.on('click', event => {
        const latitude = event.latlng.lat;
        const longitude = event.latlng.lng;

        // Update marker position
        marker.setLatLng([latitude, longitude]);

        // Fetch and display crime data for new marker position and selected date
        const selectedDate = dateSelect.value;
        fetch(`https://data.police.uk/api/crimes-at-location?date=${selectedDate}&lat=${latitude}&lng=${longitude}`)
            .then(res => res.json())
            .then(data => {
                // Clear previous markers
                map.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });

                // Create a new red marker at the updated position
                marker = L.marker([latitude, longitude], { icon: redIcon, draggable: false }).addTo(map);

                const combinedMarkers = {};

                data.slice(0, 255).forEach(item => { // This makes it so there is no more than 255 crimes shown on the screen at the same time. Reducing overload of information.
                    const lat = item.location.latitude;
                    const lng = item.location.longitude;
                    const category = item.category;
                    const outcome = item.outcome_status ? item.outcome_status.category : 'Outcome not available';
                    const street = item.location.street.name || 'Unknown Street';
                    const outcomeDate = item.outcome_status ? item.outcome_status.date : 'Resolution Date Unknown';
                    console.log(item);

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
                
               // Define a color mapping for each category
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
            let popupContent = `Street: ${street}<hr>`;
            let Content = `Street: ${street}<hr>`;

            // Loop through each category and outcome and add them to the popup with dividers
            for (let i = 0; i < category.length; i++) {
                const categoryText = category[i] || 'Unknown Category';
                const outcomeText = outcome[i] || 'Outcome not available';
                const outcomeDateText = outcomeDate[i] || 'Resolution Date Unknown';

                // Get the color based on the category
                const categoryColor = categoryColors[categoryText] || 'gray'; // Default to gray if no matching color

                // Create a colored dot using a <span> element with inline CSS
                const coloredDot = `<span style="display: inline-block; width: 6px; height: 6px; background-color: ${categoryColor}; border-radius: 50%; margin-right: 5px;"></span>`;

                popupContent += `${coloredDot}Category: ${categoryText}<br>Outcome: ${outcomeText}<br>Outcome Date: ${outcomeDateText}<hr>`;
                Content += `Category: ${categoryText}<br>Outcome: ${outcomeText}<br>Outcome Date: ${outcomeDateText}<hr>`;
            }
            popupContentBox.innerHTML = Content;
                    
                    L.marker([lat, lng])
                        .addTo(map)
                        .bindPopup(popupContent)
                        .openPopup();
                });
            });
    });

    
});