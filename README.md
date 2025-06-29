# Drivers-of-Salinization

This repository hosts a suite of Python (developed in Google Colab) and JavaScript (for Google Earth Engine) scripts designed for the comprehensive analysis of environmental factors driving farmland salinization in Delaware.

The project addresses two primary objectives:

Data Extraction & Preparation: Sourcing and processing diverse environmental and topographical variables from various geospatial datasets.
Machine Learning Modeling: Developing and interpreting a Random Forest Regressor model to quantify the influence of these extracted variables on Normalized Difference Vegetation Index (NDVI) fluctuations within salinized farmlands.

Below is a detailed description for each code file found within this repository, outlining its specific contribution to the project:


1) 5-Day_Composites.py - This Python script processes environmental data from various CSV files (storm events, wave amplitude, rainfall, evapotranspiration) by computing 5-day composites (mean, sum, or maximum values) and exporting the results to new CSV files.

2) DEM_FarmlandLevel.js - This Google Earth Engine (GEE) script calculates the average elevation within agricultural land parcels in Delaware. It utilizes USGS 3DEP 1m Digital Elevation Model (DEM) data, processes the provided farmland boundary shapefiles, and then exports the calculated average elevation for each parcel as a CSV file to Google Drive.

3) Farmland_Distance_To_Water.js - This Google Earth Engine (GEE) script calculates the Euclidean distance from the centroid of each agricultural land parcel to the nearest water body. It leverages the ESRI 2022 Land Cover data to identify water features and exports the results, including the calculated distance in meters, for each farmland parcel as a CSV file to Google Drive. 

4) Farmland_Elevation_Distribution.py - This Python script visualizes the distribution of average elevation data for salinized farmlands in 2023 using a histogram. It loads spatial property data, calculates the mean elevation, defines custom histogram bins, and then generates and saves a histogram plot with the mean elevation marked, providing insights into the topographical characteristics of affected farmlands.

5) NDVI_TimeSeries.js - This Google Earth Engine (GEE) script performs a two-part analysis on salinized farmlands in Delaware.
The first part calculates the median Normalized Difference Vegetation Index (NDVI) for specific farmland areas using Sentinel-2 satellite imagery from June to August 2023, applying robust cloud masking, and then exports the resulting median NDVI image as a GEE asset.
The second part (which uses outputs from the first part) extracts mean NDVI values over 5-day intervals for the same farmland polygons from a series of pre-processed annual/biannual NDVI rasters. It consolidates these temporal NDVI values into a single feature collection and exports them as a CSV file to Google Drive, enabling time-series analysis of vegetation health on these farmlands.

6) NDVI_TimeSeries_Interpolation.py - This Python script, designed for use in Google Colab, interpolates missing values in an NDVI (Normalized Difference Vegetation Index) time series dataset using linear interpolation. It loads an input CSV file containing NDVI data along with latitude and longitude, processes the time series in repetitions, fills in any gaps, and then saves the complete, interpolated dataset to a new CSV file. A progress bar is included to monitor the interpolation process.

7) RandomForestRegressor.py - This Python script builds, trains, and evaluates a Random Forest Regressor model to predict NDVI (Normalized Difference Vegetation Index) using various environmental and soil properties as predictor variables. It loads a combined dataset, splits it into training and testing sets, trains the model with optimized hyperparameters, and then evaluates its performance using metrics like MSE, MAE, RMSE, and R-squared. Additionally, the script performs feature importance analysis and SHAP (SHapley Additive exPlanations) analysis to interpret the model's predictions and understand the influence of each variable, saving the trained model and generating plots for visualization.

8) SalinizedFarmland_BoundaryExtraction_Yearly.js - This Google Earth Engine (GEE) script identifies and filters agricultural land parcels in Delaware that are impacted by salinization. It achieves this by combining various farmland boundary datasets and then using a binary salt patch raster image (from 2023) to create a mask of salt-impacted areas. The script converts this mask into vector polygons and calculates the number of salt-impacted polygons intersecting each farmland parcel. Finally, it exports a CSV file containing only those farmland polygons that meet a specified "filtration criteria" (i.e., intersect with more than one salt-impacted pixel), providing a refined dataset for further salinization research.

9) Segmentation_SAMGeo.py - This Python script utilizes the SAMGeo library to perform geospatial segmentation on satellite imagery within a specified bounding box, specifically for the state of Delaware. It divides the region into smaller segments, downloads satellite imagery for each, applies the Segment Anything Model (SAM) to generate segmentation masks, and then converts these masks into both GeoPackage (.gpkg) and ESRI Shapefile (.shp) vector formats for further GIS analysis. The script is designed to process large areas efficiently by breaking them down into manageable chunks.

10) SoilProperties_FarmlandLevel.js - This Google Earth Engine (GEE) script extracts mean values for various soil properties (e.g., bulk density, clay, sand, silt, organic matter, pH, hydraulic conductivity, water content parameters) from the Polaris Open Datasets. It processes predefined salt-impacted farmland boundaries, calculates the average of each soil property within each parcel, adds these as new attributes to the farmland features, and then exports the complete dataset as a CSV file to Google Drive for further analysis.

11) StormSurge_TidalAmplitude_AssignemntToFarmlands.py - This Python script processes storm surge data (low tide and high tide) and assigns it to specific farmland locations in Delaware based on their geographical proximity. It then calculates two key metrics: the amplitude of tidal amplitude (High Tide minus Low Tide) and the magnitude of storm events (tidal overwash), which is determined by subtracting high tide values from farmland elevations. The script outputs the results into new CSV files, enabling the analysis of storm impact on farmlands.

12) Z-Score_standardization.py - This Python script performs Z-score standardization on various datasets related to farmland salinization drivers, including storm events, tidal intensity (amplitude), precipitation, reference evapotranspiration, and NDVI time series. It includes two distinct Z-score functions: one for yearly chunks of time series data and another for column-wise standardization of spatial properties. The script processes CSV files for the year 2019, standardizes the data, and saves the results to new CSV files, preparing the data for further analysis.
