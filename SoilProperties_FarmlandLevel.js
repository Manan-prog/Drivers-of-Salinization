// This script extracts various soil property values (e.g., bulk density, clay content)
// from Polaris Open Datasets for given salt-impacted farmland boundaries.
// The extracted mean values for each property are added as attributes to the farmland features,
// and the final dataset is exported as a CSV.
 
// --- 1. Import Feature Collections and Image Collections ---
// Load farmland boundary feature collections.
var farmlandBoundaries_1_3 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_1_3");
var farmlandBoundaries_4_6 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_4_6");
var farmlandBoundaries_7_9 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_7_9");
var farmlandBoundaries_10_12 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_10_12");
var farmlandBoundaries_13_15 = ee.FeatureCollection("users/manan_sarupria/SaltImpactedFarmland_Boundaries_13_15");

// Import Polaris soil property image collections.
var bd_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/bd_mean'); // Bulk Density
var clay_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/clay_mean'); // Clay Content
var ksat_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/ksat_mean'); // Saturated Hydraulic Conductivity
var n_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/n_mean');     // Van Genuchten 'n' parameter
var om_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/om_mean');     // Organic Matter Content
var ph_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/ph_mean');     // pH
var sand_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/sand_mean'); // Sand Content
var silt_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/silt_mean'); // Silt Content
var theta_r_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/theta_r_mean'); // Residual Water Content
var theta_s_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/theta_s_mean'); // Saturated Water Content
var lambda_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/lambda_mean'); // Pore-size Distribution Index
var hb_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/hb_mean');     // Air Entry Pressure (Bubbling Pressure)
var alpha_mean = ee.ImageCollection('projects/sat-io/open-datasets/polaris/alpha_mean'); // Van Genuchten 'alpha' parameter

// Import visualization palettes (not used for this script's output, but kept if needed for map display).
var palettes = require('users/gena/packages:palettes');

// --- 2. Prepare Farmland Boundaries ---
// Merge all farmland boundary collections into a single FeatureCollection.
// Filter features where 'intersecti' property is greater than 1.
var combinedFarmlandBoundaries = farmlandBoundaries_1_3
  .merge(farmlandBoundaries_4_6)
  .merge(farmlandBoundaries_7_9)
  .merge(farmlandBoundaries_10_12)
  .merge(farmlandBoundaries_13_15)
  .filter(ee.Filter.gt('intersecti', 1));

// --- 3. Prepare Soil Property Images ---
// Calculate the mean image for each Polaris ImageCollection.
// This reduces each collection to a single image representing the average value.
var bd_image = bd_mean.mean();
var clay_image = clay_mean.mean();
var ksat_image = ksat_mean.mean();
var n_image = n_mean.mean();
var om_image = om_mean.mean();
var ph_image = ph_mean.mean();
var sand_image = sand_mean.mean();
var silt_image = silt_mean.mean();
var theta_r_image = theta_r_mean.mean();
var theta_s_image = theta_s_mean.mean();
var alpha_image = alpha_mean.mean();
var hb_image = hb_mean.mean();
var lambda_image = lambda_mean.mean();

// --- 4. Define Value Extraction Function ---
// Function to extract mean values of all soil properties for a single feature.
var extractAllSoilProperties = function(feature) {
  // Extract mean 'bd_mean' value and set as property.
  var bd_value = bd_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('bd_mean', bd_value);

  // Extract mean 'clay_mean' value and set as property.
  var clay_value = clay_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('clay_mean', clay_value);
  
  // Extract mean 'ksat_mean' value and set as property.
  var ksat_value = ksat_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('ksat_mean', ksat_value);
  
  // Extract mean 'n_mean' value and set as property.
  var n_value = n_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('n_mean', n_value);
  
  // Extract mean 'om_mean' value and set as property.
  var om_value = om_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('om_mean', om_value);
  
  // Extract mean 'ph_mean' value and set as property.
  var ph_value = ph_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('ph_mean', ph_value);
  
  // Extract mean 'sand_mean' value and set as property.
  var sand_value = sand_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('sand_mean', sand_value);
  
  // Extract mean 'silt_mean' value and set as property.
  var silt_value = silt_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('silt_mean', silt_value);
  
  // Extract mean 'theta_r_mean' value and set as property.
  var theta_r_value = theta_r_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('theta_r_mean', theta_r_value);
  
  // Extract mean 'theta_s_mean' value and set as property.
  var theta_s_value = theta_s_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('theta_s_mean', theta_s_value);
  
  // Extract mean 'alpha_mean' value and set as property.
  var alpha_value = alpha_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('alpha_mean', alpha_value);
  
  // Extract mean 'hb_mean' value and set as property.
  var hb_value = hb_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('hb_mean', hb_value);
  
  // Extract mean 'lambda_mean' value and set as property.
  var lambda_value = lambda_image.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30).get('b1');
  feature = feature.set('lambda_mean', lambda_value);
  
  return feature;
};

// --- 5. Apply Extraction and Export ---
// Map the extraction function over the combined farmland boundaries.
var farmlandWithSoilProperties = combinedFarmlandBoundaries.map(extractAllSoilProperties);

// Print the first feature to inspect the added properties.
print("Farmland Features with Soil Properties:", farmlandWithSoilProperties.first());

// Export the resulting feature collection to Google Drive as a CSV.
Export.table.toDrive({
  collection: farmlandWithSoilProperties,
  description: 'farmland_soil_properties', // Output file name in Google Drive.
  fileFormat: 'CSV'
});

// --- End of Script ---
