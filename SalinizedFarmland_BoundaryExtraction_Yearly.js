// --- Import and Load Data Assets ---

// Load multiple FeatureCollections representing salt-impacted farmland boundaries.
// These are polygons outlining specific farmland areas categorized by SAMGEO in batches. They comparise the Delaware region
var table = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_7_9");
var table2 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_4_6");
var table3 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_1_3");
var table4 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_13_15");
var table5 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_10_12");
 
// Load various Earth Engine Image assets for salinized farmlands.
// These images are pre-processed spectrally unmixed salt patch raster layers for 5 years: 2019-2023
var image = ee.Image("path to asset");
var image2 = ee.Image("path to asset");
var image3 = ee.Image("path to asset");
var image4 = ee.Image("path to asset");
var image5 = ee.Image("path to asset"); // This image is used for the primary analysis.

// Load the administrative boundary for Delaware (for clipping operations).
var table6 = ee.FeatureCollection("users/manan_sarupria/DE_Outline");

// --- Combine Farmland Boundaries ---

// Merge all individual farmland FeatureCollections into a single, comprehensive FeatureCollection.
var all_farmlands = table.merge(table2).merge(table3).merge(table4).merge(table5);

// Print the combined farmland collection to the GEE console for inspection.
print(all_farmlands);

// --- Create a Binary Mask from the Salt Image ---

// Create a binary mask from the 'image5' (2023 salt mean image).
// Pixels with values greater than 0 (indicating salt patch presence) are set to 1, others to 0.
// The mask is then clipped to the outline of Delaware ('table6') to limit the analysis area.
var mask = image5.gt(0).clip(table6);

// Add the created binary mask to the map for visualization.
Map.addLayer(mask, {}, 'Salt Impacted Mask (2023)');

// --- Convert Raster Mask to Vector Polygons ---

// Convert the binary raster mask (representing salt-impacted areas) into vector polygons.
var rasterPolygons = mask.reduceToVectors({
  geometry: all_farmlands.geometry(), // Limit vectorization to the extent of all farmlands.
  scale: 10,                          // Set the nominal scale (resolution) for vectorization (meters per pixel).
  geometryType: 'polygon',            // Output polygons.
  eightConnected: false,              // Use 4-connectivity for pixel grouping (pixels sharing edges, not just corners).
  labelProperty: 'raster',            // Assign a property named 'raster' to store the pixel value (which will be 1).
});

// --- Define Function to Calculate Intersection Count ---

// Define a function that will be mapped over each feature in the 'all_farmlands' collection.
var calculateIntersection = function(feature) {
  // For each farmland feature, calculate how many polygons from 'rasterPolygons' (salt-impacted areas)
  // intersect with its geometry.
  var intersectionCount = rasterPolygons.filterBounds(feature.geometry()).size();
  // Add this count as a new property named 'Filtration_criteria' to the current farmland feature.
  return feature.set('Filtration_criteria', intersectionCount);
};

// --- Filter Farmlands Based on Intersection ---

// Apply the 'calculateIntersection' function to every feature in 'all_farmlands'.
// Then, filter the results to keep only those farmland features where the 'Filtration_criteria'
// (i.e., the count of intersecting salt-impacted polygons) is greater than 1.
// This effectively selects farmlands that have an overlap with more than one pixel of salt-impacted mask.
var featuresWithIntersection = all_farmlands.map(calculateIntersection).filter(ee.Filter.gt('Filtration_criteria', 1));

// Print the filtered FeatureCollection to the GEE console for inspection.
print(featuresWithIntersection, 'Filtered Farmlands Intersecting Salt Mask (2023)');

// --- Export Results to Google Drive ---

// Export the 'featuresWithIntersection' (farmlands meeting the filtration criteria) as a CSV file to Google Drive.
Export.table.toDrive({
  collection: featuresWithIntersection, // The FeatureCollection to export.
  description: '2023_Intersecting_farmlands_csv', // A descriptive name for the export task.
  folder: 'Chapter2',                 // The Google Drive folder where the CSV will be saved.
  fileFormat: 'CSV'                   // The desired output file format.
});
