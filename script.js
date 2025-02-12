import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

document.addEventListener("DOMContentLoaded", () => {
  // --- Tab Bar Switching Logic ---
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove("active"));
      this.classList.add("active");

      // Hide all panels, then show the selected one
      document.querySelectorAll(".panel").forEach(panel => panel.style.display = "none");
      const selected = this.getAttribute("data-tab");
      document.getElementById(`panel-${selected}`).style.display = "block";
    });
  });

  // --- Fetch Data and Populate Panels ---
  fetch("data.json")
    .then(response => response.json())
    .then(data => {
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
      const defaultCenter = [40.5000, -74.4500];
      const map = L.map('map').setView(defaultCenter, 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      data.forEach(item => {
        L.marker([item.gps.lat, item.gps.long])
          .addTo(map)
          .bindPopup(`<strong>${item.predicted_class}</strong><br>Health: ${(item.plantHealth * 100).toFixed(1)}%<br>Moisture: ${(item.moisture * 100).toFixed(1)}%<br>Height: ${item.plantHeight} cm`);
      });

      // --- Build D3.js Bar Chart (Species Distribution) ---
      const chartData = Object.entries(classCounts).map(([cls, count]) => ({ class: cls, count }));
      
      const margin = { top: 40, right: 20, bottom: 60, left: 60 },
            width = 800 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

      const svgBar = d3.select("#bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .domain(chartData.map(d => d.class))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.count)])
        .nice()
        .range([height, 0]);

      svgBar.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      svgBar.append("g")
        .call(d3.axisLeft(y));

      // Axis Labels
      svgBar.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Plant Species");

      svgBar.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Count");

      svgBar.selectAll(".bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.class))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#4CAF50");

      // Data labels on bars
      svgBar.selectAll(".label")
        .data(chartData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.class) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d.count);

      // --- Build D3.js Pie Chart (Species Distribution) ---
      const pieWidth = 400, pieHeight = 400;
      const radius = Math.min(pieWidth, pieHeight) / 2;

      const svgPie = d3.select("#pie-chart")
        .append("svg")
        .attr("width", pieWidth)
        .attr("height", pieHeight)
        .append("g")
        .attr("transform", `translate(${pieWidth / 2},${pieHeight / 2})`);

      const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      const color = d3.scaleOrdinal()
        .domain(chartData.map(d => d.class))
        .range(d3.schemeCategory10);

      const pieData = pie(chartData);

      const arcs = svgPie.selectAll("arc")
        .data(pieData)
        .enter()
        .append("g")
        .attr("class", "arc");

      arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.class))
        .attr("stroke", "#fff")
        .attr("stroke-width", "2px");

      arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#fff")
        .text(d => d.data.class);

      // --- Build D3.js Scatter Plot (Plant Height vs. Moisture) ---
      const scatterMargin = { top: 40, right: 20, bottom: 60, left: 60 },
            scatterWidth = 500 - scatterMargin.left - scatterMargin.right,
            scatterHeight = 400 - scatterMargin.top - scatterMargin.bottom;

      const svgScatter = d3.select("#scatter-chart")
        .append("svg")
        .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
        .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
        .append("g")
        .attr("transform", `translate(${scatterMargin.left},${scatterMargin.top})`);

      // X axis: Plant Height
      const xScatter = d3.scaleLinear()
        .domain([d3.min(data, d => d.plantHeight) - 5, d3.max(data, d => d.plantHeight) + 5])
        .range([0, scatterWidth]);

      // Y axis: Moisture (0 to 1)
      const yScatter = d3.scaleLinear()
        .domain([0, 1])
        .range([scatterHeight, 0]);

      svgScatter.append("g")
        .attr("transform", `translate(0, ${scatterHeight})`)
        .call(d3.axisBottom(xScatter));
      
      svgScatter.append("g")
        .call(d3.axisLeft(yScatter).tickFormat(d3.format(".0%")));

      // Axis Labels
      svgScatter.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + scatterMargin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Plant Height (cm)");

      svgScatter.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -scatterHeight / 2)
        .attr("y", -scatterMargin.left + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Moisture Level");

      // Color scale for species in scatter plot
      const scatterColor = d3.scaleOrdinal()
        .domain([...new Set(data.map(d => d.predicted_class))])
        .range(d3.schemeTableau10);

      // Plot data points
      svgScatter.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScatter(d.plantHeight))
        .attr("cy", d => yScatter(d.moisture))
        .attr("r", 5)
        .attr("fill", d => scatterColor(d.predicted_class))
        .attr("opacity", 0.8)
        .append("title")
        .text(d => `${d.predicted_class}\nHeight: ${d.plantHeight} cm\nMoisture: ${(d.moisture * 100).toFixed(1)}%`);

    })
    .catch(error => console.error("Error loading JSON:", error));
});
