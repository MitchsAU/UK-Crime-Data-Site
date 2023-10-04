# 11841 Project 2: Web App Development
## Mitchell Skelton

### Rationale
The web app I have created is a crime tracker, showing users real data on a map from an official UK police API endpoint. I originally wanted to display the data on the webpage and not on the map itself but as development progressed, I found it more user friendly to display the majority of the information on the map. Upon opening the web app, the user is greeted with my original map where you pin the location you want. Any data from around the pin is shown on the screen, outputting the category, outcome and outcome date, this data is displayed in a table format for readability. If there is no data, it lets the user know so they aren’t waiting for nothing to load. I also created a severity system so the user can differentiate the difference between minor, moderate and severe crimes. I also created an option for the users to enter full screen mode with the map specifically as it can be more user friendly and allows them to see a greater range without having to zoom.

The second API endpoint I used is nominatim, this is a geolocation API where the user can search a location and it retrieves the longitude and latitude which I pull through to leaflet changing the maps location. I used this API so users can quickly and easily find different locations around the UK. I created a second section for a heat map, where the user selects 3 points on the map and a heat map is displayed. The user can selected different crime categories and dates which will display statistics underneath all the buttons. I focused mainly on the heatmap section during development as I found it the most visually appealing, though this section provided to be quite challenging as many errors had to be overcome for the app to run properly. I encountered many errors along the way but the one big one was trying to get the pin map and heat map to be in the same endpoint URL/page. I essentially wanted to combine the two edited endpoints shown below.
```js
Original EndPoint - Heat Map
https://data.police.uk/api/crimes-street/all-crime?poly=52.268,0.543:52.794,0.238:52.130,0.478&date=2017-01

Edited Endpoint - Heat Map
https://data.police.uk/api/crimes-street/${selectedCrime}?poly=${clickedCoordinates[0].lat},${clickedCoordinates[0].lng}:${clickedCoordinates[1].lat},${clickedCoordinates[1].lng}:${clickedCoordinates[2].lat},${clickedCoordinates[2].lng}&date=${selectedDate}

Original EndPoint - Pin Map
https://data.police.uk/api/crimes-at-location?date=2017-02&lat=52.629729&lng=-1.131592

Edited Endpoint - Pin Map
https://data.police.uk/api/crimes-at-location?date=${selectedDate}&lat=${latitude}&lng=${longitude}
```

I wanted to be able to click a button to adjust the URL from one to the other without having to make a whole other page. Unfortunately, I couldn’t manage to figure this out as it proved to be too difficult and not worthwhile, leaving me to duplicate the map javascript file and transform it into the heatmap file. I definitely could’ve created some more functions like the full screen function to reduce the duplicated code but some proved to be harder than anticipated. The 
```performSearch()``` function
wouldn’t work in an external file being referenced in another with a script tag referencing it. If I could’ve improved further on this web app I would have added a feature where a chart is generated on the data provided as a modal popup for the user to click on as well as better optimising the code.