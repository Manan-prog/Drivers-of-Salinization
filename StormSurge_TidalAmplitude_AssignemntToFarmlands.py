
# --- 1. Setup Environment and Import Libraries ---

# Mount Google Drive to access files in the Colab environment.
# This command is specific to Google Colab.
from google.colab import drive
drive.mount('/content/drive')

import pandas as pd
from geopy.distance import geodesic # Used for calculating accurate distances between lat/lon points
from tqdm import tqdm               # Provides a progress bar for loops
import numpy as np                  # For numerical operations

# Change the current working directory.
# This makes it easier to reference input/output files without full paths.
# The '%' prefix indicates a "Jupyter magic command," specific to environments like Colab.
%cd /content/drive/MyDrive/Chapter2/Storm_Surge/Code_Data

# --- 2. Data Loading and Nearest Coordinate Assignment (Low Tide) ---

# Load the input CSV files into Pandas DataFrames.
# 'Farmland_LatLon.csv' contains the latitude and longitude for each farmland parcel.
df_farmland = pd.read_csv('Farmland_LatLon.csv')
# 'Interpolated_Lowtide.csv' contains interpolated low tide time series data
# for various geographical points.
df_lowtide_data = pd.read_csv('Interpolated_Lowtide.csv')

def find_nearest_coordinate(target_coord, source_df):
    """
    Finds the row in source_df whose (lat, lon) is geographically closest to target_coord.

    Args:
        target_coord (tuple): A tuple (latitude, longitude) representing the point
                              for which to find the nearest neighbor.
        source_df (pd.DataFrame): The DataFrame containing potential nearest neighbor
                                  coordinates and associated data. Assumes 'lat' and 'lon' columns exist.

    Returns:
        pd.Series: The row from source_df corresponding to the nearest coordinate,
                   or None if source_df is empty.

    NOTE: This function iterates through all rows of source_df for each target_coord.
    For very large datasets, this O(N*M) approach can be very slow. Consider using
    spatial indexing (e.g., scipy.spatial.KDTree) for improved performance if needed.
    """
    nearest_row = None
    min_distance = float('inf')

    # Iterate over each row in the source DataFrame.
    for _, row in source_df.iterrows():
        # Extract the coordinate of the current row from source_df.
        source_coord = (row['lat'], row['lon'])
        # Calculate the geodesic (great-circle) distance in kilometers.
        distance = geodesic(target_coord, source_coord).kilometers

        # Update if a closer coordinate is found.
        if distance < min_distance:
            min_distance = distance
            nearest_row = row
    return nearest_row

# Initialize a new column in the farmland DataFrame to store the assigned time series.
# It's initially set to None and will be populated with lists of values.
df_farmland['lowtide_time_series'] = None

# Iterate through each farmland parcel in df_farmland to find its nearest low tide data.
# tqdm provides a progress bar for this potentially long-running loop.
for index, row in tqdm(df_farmland.iterrows(), total=df_farmland.shape[0], desc="Assigning Low Tide Time Series"):
    # Get the latitude and longitude of the current farmland parcel.
    farmland_coord = (row['lat'], row['lon'])
    # Find the nearest low tide data point.
    nearest_lowtide_row = find_nearest_coordinate(farmland_coord, df_lowtide_data)

    # Assign the time series data from the nearest low tide row to the farmland.
    # We assume time series data starts from the 3rd column (index 2) onwards.
    # .tolist() converts the Pandas Series (row slice) into a standard Python list.
    if nearest_lowtide_row is not None:
        df_farmland.at[index, 'lowtide_time_series'] = nearest_lowtide_row.iloc[2:].tolist()
    else:
        # Handle cases where no nearest coordinate is found (e.g., empty source_df)
        df_farmland.at[index, 'lowtide_time_series'] = [] # Assign an empty list or np.nan as appropriate


# Save the farmland DataFrame with the assigned low tide time series to a new CSV file.
df_farmland.to_csv('InterpolatedLowtide_Assigned.csv', index=False)

# Display the first few rows of the result to verify the assignment.
print("\nFirst few rows of Farmland Data with Assigned Low Tide:")
print(df_farmland.head())

# --- 3. Calculate Amplitude (Intensity) of Tidal Waves ---

# Change the working directory to the results folder for output.
%cd /content/drive/MyDrive/Chapter2/Storm_Surge/Code_Data/Results

# Load the previously generated assigned low tide data and assume high tide data is also available.
# We'll need a similar 'InterpolatedHightide_Assigned.csv' file from a previous run or process.
# For this code to run successfully, 'InterpolatedHightide_Assigned.csv' must exist.
InterpolatedHightide_Assigned = pd.read_csv('InterpolatedHightide_Assigned.csv')
InterpolatedLowtide_Assigned = pd.read_csv('InterpolatedLowtide_Assigned.csv')

# Extract the latitude and longitude columns from the high tide assigned data.
# These will be re-attached to the result.
lat_lon_columns = InterpolatedHightide_Assigned.columns[:2]

# Extract only the time series data (excluding lat/lon) for high tide and low tide.
hightide_values = InterpolatedHightide_Assigned.iloc[:, 2:]
lowtide_values = InterpolatedLowtide_Assigned.iloc[:, 2:]

# Calculate the amplitude by element-wise subtraction: High Tide - Low Tide.
# Pandas automatically aligns by column names/indices.
amplitude_data = hightide_values.subtract(lowtide_values)

# Combine the latitude/longitude columns with the calculated amplitude time series.
df_amplitude_result = pd.concat([InterpolatedHightide_Assigned[lat_lon_columns], amplitude_data], axis=1)

# Save the resulting DataFrame containing tidal wave amplitude to a CSV file.
df_amplitude_result.to_csv('Amplitude_Wave_Assigned.csv', index=False)
print("\nAmplitude Wave Data saved to: Amplitude_Wave_Assigned.csv")
print("First few rows of Amplitude Data:")
print(df_amplitude_result.head())


# --- 4. Calculate Storm Event Magnitude (Overwash) ---

# Read the Digital Elevation Model (DEM) data, assuming it's structured with
# lat/lon in the first two columns and elevation in the third.
# 'DEM_Restructured.csv' is expected to contain farmland elevations.
df_dem = pd.read_csv('DEM_Restructured.csv')

# Extract only the elevation values for the farmlands.
# We assume the third column (index 2) contains the elevation.
farmland_elevations = df_dem.iloc[:, 2].values

# Get the high tide time series data again (excluding lat/lon).
# Ensure 'InterpolatedHightide_Assigned' is still loaded from step 3.
# If running independently, it might need to be loaded again:
# InterpolatedHightide_Assigned = pd.read_csv('InterpolatedHightide_Assigned.csv')
hightide_values_for_storm_event = InterpolatedHightide_Assigned.iloc[:, 2:].values

# Calculate the storm event (tidal overwash) by subtracting high tide from farmland elevation.
# A positive value indicates the farmland is above the high tide level,
# a negative value indicates it is submerged (overwashed).
# np.newaxis is used to make 'farmland_elevations' a 2D array for broadcast subtraction.
storm_event_array = farmland_elevations[:, np.newaxis] - hightide_values_for_storm_event

# Create a new DataFrame from the calculated storm event array.
# Use the original time series column names from 'InterpolatedHightide_Assigned'.
df_storm_event = pd.DataFrame(storm_event_array, columns=InterpolatedHightide_Assigned.columns[2:])

# Combine the latitude/longitude columns with the calculated storm event time series.
df_storm_event = pd.concat([InterpolatedHightide_Assigned[lat_lon_columns], df_storm_event], axis=1)

# Save the resulting DataFrame containing storm event magnitudes to a CSV file.
df_storm_event.to_csv('Storm_Event_Assigned.csv', index=False)
print("\nStorm Event Data saved to: Storm_Event_Assigned.csv")
print("First few rows of Storm Event Data:")
print(df_storm_event.head())
