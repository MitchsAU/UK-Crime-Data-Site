// Get a reference to the map element
const mapElement = document.getElementById("map");

// Get a reference to the full-screen button
const fullScreenButton = document.getElementById("fullScreenButton");

// Function to toggle full-screen mode
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        // If the map is not in full-screen mode, enter full-screen
        if (mapElement.requestFullscreen) {
            mapElement.requestFullscreen();
        }
    } else {
        // If the map is in full-screen mode, exit full-screen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Add a click event listener to the full-screen button
fullScreenButton.addEventListener("click", toggleFullScreen);