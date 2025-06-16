// --- Farmland NDVI Calculation and Export ---
// This script processes Sentinel-2 satellite imagery to calculate the Normalized Difference Vegetation Index (NDVI)
// for specific farmland areas, applies cloud masking, and exports the median NDVI image for a defined period.
 
// --- Data Loading ---

// Load pre-existing FeatureCollections representing salt-impacted farmland boundaries.
// These collections are merged and then filtered to include only farmlands that
// previously met a 'Filtration_criteria' (e.g., 'intersecti' > 1) from an earlier analysis.
var table = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_7_9");
var table2 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_4_6");
var table3 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_1_3");
var table4 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_13_15");
var table5 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_10_12");

// Merge all farmland boundary collections and apply the initial filter.
var featureCollection = table.merge(table2).merge(table3).merge(table4).merge(table5).filter(ee.Filter.gt('intersecti', 1));

// Load Sentinel-2 Surface Reflectance (SR) and Cloud Probability (S2_CLOUD_PROBABILITY) image collections.
// SR images are atmospherically corrected, and cloud probability is crucial for masking.
var s2Sr = ee.ImageCollection('COPERNICUS/S2_SR');
var s2Clouds = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');

// Load the administrative boundary for Delaware. This is used for clipping exports.
var table6 = ee.FeatureCollection("users/manan_sarupria/DE_Outline");


// --- Configuration Parameters ---

// Define the start and end dates for the image acquisition period.
// The end date is exclusive, meaning images up to but not including this date are used.
var START_DATE = ee.Date('2023-06-01');
var END_DATE = ee.Date('2023-08-31');

// Set the maximum acceptable cloud probability. Pixels exceeding this threshold will be masked out.
var MAX_CLOUD_PROBABILITY = 15; // Represents 15% cloud probability.

// Define the region of interest for all subsequent image operations (filtering and clipping).
// This ensures processing is confined to the pre-filtered farmland polygons.
var region = featureCollection;


// --- Helper Functions ---

/**
 * `maskClouds(img)`: Masks out cloudy pixels from a Sentinel-2 image.
 * This function expects images to have a 'cloud_mask' property with a 'probability' band,
 * which is added via a join operation later.
 * @param {ee.Image} img - The input Sentinel-2 Surface Reflectance image.
 * @returns {ee.Image} The image with cloudy pixels masked (set to invisible).
 */
function maskClouds(img) {
  // Extract the cloud probability band from the 'cloud_mask' property.
  var clouds = ee.Image(img.get('cloud_mask')).select('probability');
  // Create a boolean mask: true where cloud probability is less than MAX_CLOUD_PROBABILITY.
  var isNotCloud = clouds.lt(MAX_CLOUD_PROBABILITY);
  // Apply the mask to the image, making cloudy pixels transparent.
  return img.updateMask(isNotCloud);
}

/**
 * `calculateNDVI(img)`: Computes the Normalized Difference Vegetation Index (NDVI).
 * NDVI = (NIR - Red) / (NIR + Red). Uses Sentinel-2 bands B8 (NIR) and B4 (Red).
 * The resulting NDVI image is clipped to the defined `region`.
 * @param {ee.Image} img - The input Sentinel-2 Surface Reflectance image.
 * @returns {ee.Image} A single-band image named 'NDVI'.
 */
function calculateNDVI(img) {
  // Calculate NDVI using the normalizedDifference method.
  var ndvi = img.normalizedDifference(['B8', 'B4']);
  // Rename the band to 'NDVI' for clarity and clip to the `region` of interest.
  return ee.Image(ndvi).rename('NDVI').clip(region);
}


// --- Image Collection Filtering and Joining ---

// Create date and bounds filters for the desired acquisition period and spatial extent.
var dateFilter = ee.Filter.date(START_DATE, END_DATE);
var boundsFilter = ee.Filter.bounds(region);

// Apply filters to both Sentinel-2 SR and Cloud Probability collections.
var s2SrFiltered = s2Sr.filter(dateFilter).filter(boundsFilter);
var s2CloudsFiltered = s2Clouds.filter(dateFilter).filter(boundsFilter);

// Join the Sentinel-2 SR images with their corresponding cloud probability masks.
// This is a "saveFirst" join, attaching the cloud mask image to each SR image based on 'system:index'.
var s2SrWithCloudMask = ee.Join.saveFirst('cloud_mask').apply({
  primary: s2SrFiltered,
  secondary: s2CloudsFiltered,
  condition: ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})
});


// --- Apply Cloud Masking and Calculate Median NDVI ---

// Convert the joined collection back to an ImageCollection and apply the `maskClouds` function to each image.
var s2CloudMasked = ee.ImageCollection(s2SrWithCloudMask).map(maskClouds);

// Calculate NDVI for each image in the cloud-masked collection.
// Then, compute the pixel-wise median NDVI across all images in the collection.
// The median helps to reduce noise and provide a robust representation of vegetation health over the period.
var s2SrNDVI = s2CloudMasked.map(calculateNDVI).select('NDVI').median();


// --- Visualization and Export ---

// Add the final median NDVI image to the Earth Engine map for visual inspection.
Map.addLayer(s2SrNDVI, {}, 'Median NDVI (Jun-Aug 2023)');

// Export the median NDVI image as a new Earth Engine asset.
// This allows for persistent storage and future use of the processed image.
Export.image.toAsset({
  image: s2SrNDVI.toFloat(),             // Cast to float to ensure proper data type for export.
  description: 's2SrFiltered_2023_',     // A clear identifier for the export task.
  // assetId: 'users/your_username/path_to_asset', // IMPORTANT: Uncomment and update with your desired asset ID path.
                                                 // Example: 'users/your_username/Farmland_NDVI/Median_NDVI_2023'
  region: table6.geometry(),             // Define the export region using the Delaware outline.
  scale: 10,                             // Set the output resolution to 10 meters per pixel.
  maxPixels: 1e13,                       // Allow a large number of pixels for potentially large export areas.
});



// The following is a separate code in GEE that uses exported rasters from the above code as input. 

// --- Farmland NDVI Time Series Extraction and Export ---
// This script extracts mean NDVI values from a series of pre-processed annual/biannual
// NDVI raster images (generated by above GEE script) for specific farmland polygons.
// It then consolidates these values into a single FeatureCollection with temporal properties
// and exports the result as a CSV file to Google Drive for further analysis.

// --- Data Loading ---

// Load multiple FeatureCollections representing salt-impacted farmland boundaries.
// These collections are merged into a single FeatureCollection and then filtered
// to include only polygons that meet a pre-defined 'intersecti' criteria (e.g., > 1).
// This indicates farmlands that have already passed initial relevance checks.
var table = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_7_9");
var table2 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_4_6");
var table3 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_1_3");
var table4 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_13_15");
var table5 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_10_12");

// Combine all individual farmland boundary FeatureCollections into one.
// Apply the filter to ensure only relevant farmlands are processed.
var featureCollection = table.merge(table2).merge(table3).merge(table4).merge(table5).filter(ee.Filter.gt('intersecti', 1));

// Load individual pre-processed NDVI raster images for different time periods in 2023.
var table = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_1_3"),
    table2 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_4_6"),
    table3 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_7_9"),
    table4 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_10_12"),
    table5 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_13_15"),
    image = ee.Image("users/manan_sarupria/s2SrFiltered_2023_1"),
    image2 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_2"),
    image3 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_3"),
    image4 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_4"),
    image5 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_5"),
    image6 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_6"),
    image7 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_7"),
    image8 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_8"),
    image9 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_9"),
    image10 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_10"),
    image11 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_11"),
    image12 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_12"),
    image13 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_13"),
    image14 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_14"),
    image15 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_15"),
    image16 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_16"),
    image17 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_17"),
    image18 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_18"),
    image19 = ee.Image("users/manan_sarupria/s2SrFiltered_2023_19");

// --- Data Extraction Function ---

/**
 * `extractValues(feature)`: Extracts mean NDVI values from a series of pre-loaded
 * NDVI raster images for a single input feature's geometry.
 * Each extracted value is added as a new property to the feature.
 *
 * @param {ee.Feature} feature - An individual farmland polygon feature.
 * @returns {ee.Feature} The input feature with added NDVI properties for each time period.
 */
var extractValues = function(feature) {
  // Extract mean NDVI from 'image' (corresponding to '1-5 June 2023') for the feature's geometry at 10m scale.
  var value = image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  // Set the extracted NDVI value as a new property named '1-5 June 2023' on the feature.
  var featureWithNDVI = feature.set('1-5 June 2023', value.get('NDVI'));

  // Repeat the process for each subsequent NDVI image (e.g., image2 for '5-10 June 2023', etc.).
  // The 'featureWithNDVI' variable is continuously updated with new properties.
  var value1 = image2.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('5-10 June 2023', value1.get('NDVI'));

  var value2 = image3.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('10-15 June 2023', value2.get('NDVI'));

  var value3 = image4.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('15-20 June 2023', value3.get('NDVI'));

  var value4 = image5.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('20-25 June 2023', value4.get('NDVI'));

  var value5 = image6.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('25-30 June 2023', value5.get('NDVI'));

  var value6 = image7.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('1-5 July 2023', value6.get('NDVI'));

  var value7 = image8.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('5-10 July 2023', value7.get('NDVI'));

  var value8 = image9.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('10-15 July 2023', value8.get('NDVI'));

  var value9 = image10.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('15-20 July 2023', value9.get('NDVI'));

  var value10 = image11.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('20-25 July 2023', value10.get('NDVI'));

  var value11 = image12.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('25-30 July 2023', value11.get('NDVI'));

  var value12 = image13.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('31 July - 4 August 2023', value12.get('NDVI'));

  var value13 = image14.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('4-9 August 2023', value13.get('NDVI'));

  var value14 = image15.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('9-14 August 2023', value14.get('NDVI'));

  var value15 = image16.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('14-19 August 2023', value15.get('NDVI'));

  var value16 = image17.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('19-24 August 2023', value16.get('NDVI'));

  var value17 = image18.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('24-29 August 2023', value17.get('NDVI'));

  var value18 = image19.reduceRegion(ee.Reducer.mean(), feature.geometry(), 10);
  featureWithNDVI = featureWithNDVI.set('29 August - 3 Sept 2023', value18.get('NDVI'));

  // Return the feature with all the added NDVI time-series properties.
  return featureWithNDVI;
};

// --- Execution and Export ---

// Apply the `extractValues` function to each feature in the `featureCollection`.
// This maps the function over the collection, processing each farmland polygon.
var extractedValues = featureCollection.map(extractValues);

// Print the resulting FeatureCollection to the GEE console.
// This allows you to inspect the data structure and extracted values before export.
print("Extracted NDVI Time Series Values:", extractedValues);

// Export the final FeatureCollection to Google Drive as a CSV file.
// This CSV will contain each farmland polygon as a row, with columns for its original properties
// and the newly added NDVI values for each specified time interval.
Export.table.toDrive({
  collection: extractedValues,           // The FeatureCollection to export.
  folder: 'NDVI_Time_Series',            // The target folder in your Google Drive.
  description: '2023_NDVI_TimeSeries',   // A descriptive name for the export task in GEE.
  fileFormat: 'CSV'                      // Specify the output file format as CSV.
});
