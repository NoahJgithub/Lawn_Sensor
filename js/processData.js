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

    // Define custom icons based on plant type
    const createCustomIcon = (plantType) => {
        // Determine icon color based on plant type
        let iconColor;
        switch (plantType.toLowerCase()) {
            case 'grass':
                iconColor = 'green';
                break;
            case 'dandelion':
            case 'clover':
                iconColor = 'yellow';
                break;
            case 'crabgrass':
            case 'weed':
            case 'broadleaf':
            case 'plantain':
            case 'creeping charlie':
            case 'thistle':
                iconColor = 'red';
                break;
            case 'dead grass':
                iconColor = 'gray';
                break;
            default:
                iconColor = 'blue';
        }

        return L.divIcon({
            className: `custom-marker ${iconColor}-marker`,
            html: `<div class="marker-pin" style="background-color: ${iconColor}"></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });
    };

    data.forEach(item => {
        // Create custom icon based on plant type
        const icon = createCustomIcon(item.predicted_class);

        // Create custom popup content with toggle functionality
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
                <button class="toggle-view-btn">Toggle View</button>
            </div>
        `;

        // Create the marker with custom icon
        const marker = L.marker([item.gps.lat, item.gps.long], { icon: icon })
            .addTo(map)
            .bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup-container'
            });

        // Add event listener after popup opens
        marker.on('popupopen', function () {
            setTimeout(() => {
                const toggleBtn = document.querySelector('.toggle-view-btn');
                const popupInfo = document.querySelector('.popup-info');
                const popupImage = document.querySelector('.popup-image-container');

                if (toggleBtn) {
                    toggleBtn.addEventListener('click', function () {
                        popupInfo.style.display = popupInfo.style.display === 'none' ? 'block' : 'none';
                        popupImage.style.display = popupImage.style.display === 'none' ? 'block' : 'none';
                    });
                }
            }, 100);
        });
    });

    buildCharts(classCounts);
}