// This script calculates the distance from farmland parcel centroids to the nearest water body using the ESRI 2022 Land Cover data.
 
// --- 1. Load Data ---
// Load ESRI 2022 Land Cover image.
var esri2022LandCover = ee.Image("users/manan_sarupria/ESRI_2022_AllLandCovers");

// Load farmland boundary feature collections (split by year ranges).
var farmlandBoundaries_1_3 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_1_3");
var farmlandBoundaries_4_6 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_4_6");
var farmlandBoundaries_7_9 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_7_9");
var farmlandBoundaries_10_12 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_10_12");
var farmlandBoundaries_13_15 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_13_15");

// Visualization parameters for the ESRI 2022 image (currently unused).
var imageVisParam = {"opacity":1,"bands":["b1"],"gamma":1};

// --- 2. Prepare Water Mask ---
// Mask the ESRI 2022 image to isolate water pixels (where band 'b1' equals 1).
var waterMask = esri2022LandCover.updateMask(esri2022LandCover.select('b1').eq(1));

// Add the masked water layer to the map.
Map.addLayer(waterMask, {palette: ['0000FF']}, 'ESRI 2022 Water');

// --- 3. Process Farmland Boundaries ---
// Merge all farmland boundary collections and filter for polygons with 'intersecti' > 1.
var filteredFarmland = farmlandBoundaries_1_3
  .merge(farmlandBoundaries_4_6)
  .merge(farmlandBoundaries_7_9)
  .merge(farmlandBoundaries_10_12)
  .merge(farmlandBoundaries_13_15)
  .filter(ee.Filter.gt('intersecti', 1));

// Add the filtered farmland boundaries to the map.
Map.addLayer(filteredFarmland, {}, 'Filtered Farmland Boundaries');

// --- 4. Calculate Centroids ---
// Function to calculate the centroid of each feature.
var calculateCentroid = function(feature) {
  return ee.Feature(feature.geometry().centroid(), feature.toDictionary());
};

// Apply the centroid calculation to all filtered farmland features.
var farmlandCentroids = filteredFarmland.map(calculateCentroid);

// Add the centroids to the map.
Map.addLayer(farmlandCentroids, {color: 'red'}, 'Farmland Centroids');

// --- 5. Calculate Distance to Water ---
// Calculate the distance from each pixel to the nearest unmasked (water) pixel.
// The result is in pixels, multiplied by 10 for meters (since scale is 10m).
var distanceToWater = waterMask.unmask(0).fastDistanceTransform().sqrt().multiply(10);

// Add the distance raster to the map.
Map.addLayer(distanceToWater, {min: 0, max: 5000, palette: ['white', 'blue']}, 'Distance to Water (m)');

// Function to calculate the distance from each feature's centroid to the nearest water pixel.
var addDistanceProperty = function(feature) {
  var centroid = feature.geometry().centroid();
  // Sample the distance raster at the centroid.
  var distance = distanceToWater.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: centroid,
    scale: 10, // Match the scale of the distance raster.
    bestEffort: true
  }).getNumber('distance'); // 'distance' is the default band name for fastDistanceTransform.

  return feature.set('distance_to_water_m', distance);
};

// Apply the distance calculation to all farmland features.
var farmlandWithDistance = filteredFarmland.map(addDistanceProperty);

// Print the first feature to verify the added property.
print("First Farmland Feature with Distance:", farmlandWithDistance.first());

// Add the farmland with distance attribute to the map (for inspection, properties not visible directly).
Map.addLayer(farmlandWithDistance, {}, 'Farmland with Distance Data');

// --- 6. Export Results ---
// Export the feature collection with calculated distances to Google Drive as CSV.
Export.table.toDrive({
  collection: farmlandWithDistance,
  description: 'Farmland_Distance_To_Water',
  folder: 'Minimum_Distance_ToWater', // Specify your desired Google Drive folder.
  fileFormat: 'CSV'
});

