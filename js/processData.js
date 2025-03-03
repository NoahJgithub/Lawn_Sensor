// import leaflet library
import '../Leaflet/leaflet.js';
import buildCharts from './chart.js';

export default function processData(data) {

    const tableBody = document.querySelector("#data-table tbody");
    const gallery = document.querySelector("#gallery");

    let sumLat = 0, sumLng = 0;
    const classCounts = {};
    const markers = []; // Array to store marker references

    data.forEach((item, index) => {
        // Accumulate coordinates for average
        sumLat += item.gps.lat;
        sumLng += item.gps.long;

        // Tally counts for chart (plant species distribution)
        classCounts[item.predicted_class] = (classCounts[item.predicted_class] || 0) + 1;

        // Create table row with extended plant properties
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${item.image_path}" class="table-img" alt="${item.image_name}"></td>
            <td>${item.image_name}</td>
            <td>${item.predicted_class}</td>
            <td>${(item.plantHealth * 100).toFixed(1)}%</td>
            <td>${(item.moisture * 100).toFixed(1)}%</td>
            <td>${item.plantHeight} cm</td>
            <td>${item.leafColor}</td>
            <td>${item.gps.lat}</td>
            <td>${item.gps.long}</td>
          `;
        tableBody.appendChild(row);

        // Create gallery item with image and button
        const imageContainer = document.createElement("div");
        imageContainer.classList.add("image-container");
        imageContainer.dataset.index = index; // Store the index for reference
        imageContainer.innerHTML = `
            <img src="${item.image_path}" alt="${item.predicted_class}">
            <p><strong>${item.predicted_class}</strong></p>
            <button class="show-on-map-btn">Show on Map</button>
          `;
        gallery.appendChild(imageContainer);
    });

    // --- Initialize Leaflet Map ---
    const avgLat = sumLat / data.length;
    const avgLng = sumLng / data.length;
    const map = L.map('map').setView([avgLat, avgLng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add markers to the map
    data.forEach((item, index) => {
        // Create popup content
        const popupContent = `
            <div class="custom-popup">
                <h3>${item.predicted_class}</h3>
                <div class="popup-content">
                    <div class="popup-info">
                        <p><strong>Health:</strong> ${(item.plantHealth * 100).toFixed(1)}%</p>
                        <p><strong>Moisture:</strong> ${(item.moisture * 100).toFixed(1)}%</p>
                        <p><strong>Height:</strong> ${item.plantHeight} cm</p>
                        <p><strong>Leaf Color:</strong> ${item.leafColor}</p>
                    </div>
                    <div class="popup-image-container">
                        <img src="${item.image_path}" alt="${item.predicted_class}">
                    </div>
                </div>
            </div>
        `;

        // Create marker
        const marker = L.marker([item.gps.lat, item.gps.long])
            .addTo(map)
            .bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup-container'
            });

        // Store marker reference in array
        markers.push(marker);
    });

    // Add click event listeners to the Show on Map buttons in gallery
    document.querySelectorAll('.show-on-map-btn').forEach(button => {
        button.addEventListener('click', function () {
            const containerElement = this.closest('.image-container');
            const index = parseInt(containerElement.dataset.index);

            if (markers[index]) {
                // Open the popup for the corresponding marker
                map.setView([data[index].gps.lat, data[index].gps.long], 18);
                markers[index].openPopup();
            }
        });
    });

    buildCharts(classCounts);
}