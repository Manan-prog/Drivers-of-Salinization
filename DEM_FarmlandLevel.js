// This script processes agricultural land boundaries to calculate average elevation
// within each parcel using USGS 3DEP 1m DEM data.
// The results are then exported as a CSV file.

// --- 1. Import Feature Collections and Image Collections --- 
// Define the input feature collections representing salt-impacted farmland boundaries
// These collections are organized by simply grouped shapefiles that altogether cover the state of Delaware.
var farmlandBoundaries_10_12 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_10_12");
var farmlandBoundaries_13_15 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_13_15");
var farmlandBoundaries_7_9 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_7_9");
var farmlandBoundaries_4_6 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_4_6");
var farmlandBoundaries_1_3 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_1_3");

// Import the USGS 3DEP 1m Digital Elevation Model (DEM) image collection.
// This data provides high-resolution elevation information.
var demCollection = ee.ImageCollection("USGS/3DEP/1m");

// The NLCD image collection is imported but not used in the current script.
// It's good practice to keep it if there's a potential future use.
var nlcdCollection = ee.ImageCollection("USGS/NLCD_RELEASES/2021_REL/NLCD");

// --- 2. Combine and Visualize All Farmland Segments ---
// Combine all individual farmland boundary feature collections into a single collection.
// .flatten() is used to merge them into a single FeatureCollection.
var allFarmlandSegments = ee.FeatureCollection([
  farmlandBoundaries_10_12,
  farmlandBoundaries_13_15,
  farmlandBoundaries_7_9,
  farmlandBoundaries_4_6,
  farmlandBoundaries_1_3
]).flatten();

// Add the combined farmland segments to the Earth Engine map for visualization.
// The second argument `{}` is for visualization parameters (empty here for default styling).
// The third argument is the layer name displayed in the map legend.
Map.addLayer(allFarmlandSegments, {}, 'All Farmland Segments Combined');

// --- 3. Clip and Process DEM Data ---
// Clip the entire DEM image collection to the extent of the combined farmland segments.
// This reduces the processing area and focuses on the regions of interest.
var clippedDemCollection = demCollection.map(function(image) {
  return image.clip(allFarmlandSegments);
});

// Display the clipped DEM collection on the map. This can be useful for debugging.
Map.addLayer(clippedDemCollection, {}, 'Clipped DEM Collection');

// Compute the mean (average) elevation from the clipped DEM collection.
// This creates a single image representing the average elevation across the entire DEM.
var meanDEM = clippedDemCollection.mean();

// Add the mean DEM layer to the map for visualization.
Map.addLayer(meanDEM, {}, 'Mean DEM');

// --- 4. Calculate Average Elevation for Each Farmland Parcel ---
// Define a function to calculate the average elevation within each individual farmland polygon.
var addAverageElevationToFeature = function(feature) {
  // Use `reduceRegion` to compute the mean elevation within the geometry of the current feature.
  var meanElevation = meanDEM.reduceRegion({
    reducer: ee.Reducer.mean(), // Specify the reducer to calculate the mean.
    geometry: feature.geometry(), // Use the geometry of the current feature.
    scale: 1, // Set the processing scale to 1 meter (original resolution of the DEM).
    bestEffort: true // Allows for approximation if precise calculation is too resource-intensive.
  }).get('elevation'); // Get the result associated with the 'elevation' band of the DEM.

  // Set the calculated average elevation as a new property named 'average_elevation' for the feature.
  return feature.set('average_elevation', meanElevation);
};

// Map the `addAverageElevationToFeature` function over all farmland segments.
// This applies the elevation calculation to each polygon in the collection.
var farmlandWithElevation = allFarmlandSegments.map(addAverageElevationToFeature);

// Print the first feature of the updated collection to the console
// to verify that the 'average_elevation' property has been added correctly.
print('First Farmland Segment with Average Elevation:', farmlandWithElevation.first());

// --- 5. Export Results ---
// Export the final feature collection (farmland parcels with added average elevation)
// as a CSV file to your Google Drive.
Export.table.toDrive({
  collection: farmlandWithElevation, // The feature collection to export.
  description: 'Average_DEM_AllSegments', // A descriptive name for the exported file.
  fileFormat: 'CSV' // Specify the output file format as CSV.
});

// --- End of Script ---
