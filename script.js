// Tab Bar Switching Logic
import './js/tabSwitch.js';
// Data Processing Logic
import processData from './js/processData.js';

try {
  // Fetch JSON data
  const response = await fetch("data.json");
  const data = await response.json();
  // Populate table, gallery, map, and charts panels
  processData(data);

} catch (error) {
  // Handle errors
  console.error("Error loading JSON:", error)
}