// import leaflet library
import '../Leaflet/leaflet.js';
import buildCharts from './chart.js';

export default function processData(data) {

    const tableBody = document.querySelector("#data-table tbody");
    const gallery = document.querySelector("#gallery");

    let sumLat = 0, sumLng = 0;
    const classCounts = {};

    data.forEach(item => {
        // Accumulate coordinates for average (if desired)
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

        // Create gallery item with extra details
        const imageContainer = document.createElement("div");
        imageContainer.classList.add("image-container");
        imageContainer.innerHTML = `
            <img src="${item.image_path}" alt="${item.predicted_class}">
            <p><strong>${item.predicted_class}</strong></p>
            <p>Health: ${(item.plantHealth * 100).toFixed(1)}%, Moisture: ${(item.moisture * 100).toFixed(1)}%, Height: ${item.plantHeight} cm</p>
            <p>Leaf: ${item.leafColor}</p>
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

    data.forEach(item => {
        L.marker([item.gps.lat, item.gps.long])
            .addTo(map)
            .bindPopup(`<strong>${item.predicted_class}</strong><br>Health: ${(item.plantHealth * 100).toFixed(1)}%<br>Moisture: ${(item.moisture * 100).toFixed(1)}%<br>Height: ${item.plantHeight} cm`);
    });

    buildCharts(classCounts);
}