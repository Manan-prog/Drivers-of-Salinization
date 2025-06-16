# The following code was written in Google collab.
from google.colab import drive
drive.mount('/content/drive')

 

import numpy as np
import pandas as pd
from scipy.interpolate import interp1d
from tqdm import tqdm  # Import tqdm for the progress bar

# Load the input CSV file
input_file = "NDVI_Complete_TimeSeries.csv"  # Replace with your file path
data = pd.read_csv(input_file)

# Extract latitude and longitude columns
lat_lon = data.iloc[:, :2]

# Define the number of columns per repetition and the total number of repetitions
columns_per_repetition = 19
total_repetitions = 5

# Calculate the total number of rows and iterations
total_rows = len(data)
total_iterations = total_rows * total_repetitions

# Initialize tqdm progress bar
progress_bar = tqdm(total=total_iterations, desc='Interpolating Data', position=0)

# Interpolate missing values using seasonal decomposition
interpolated_data = data.copy()  # Create a copy of the original data to store interpolated values

for repetition in range(total_repetitions):
    start_column = repetition * columns_per_repetition + 2  # Skip the latitude and longitude columns

    for index, row in interpolated_data.iterrows():
        # Update progress bar description
        progress_bar.set_description(f'Interpolating Row {index+1}/{total_rows}, Repetition {repetition+1}/{total_repetitions}')

        # Extract time series data for the current repetition
        time_series = row.iloc[start_column:start_column + columns_per_repetition]

        # Check if there are missing values in the time series
        if time_series.isnull().any():
            # If there are missing values, perform interpolation

            # Find indices of known values
            known_indices = ~time_series.isnull()
            known_values = time_series[known_indices]
            missing_indices = ~known_indices

            # Create a numeric index ranging from 0 to the length of the time series
            numeric_index = np.arange(len(time_series))

            # Interpolate missing values using known values
            interpolator = interp1d(numeric_index[known_indices], known_values, kind='linear', fill_value='extrapolate')
            interpolated_values = interpolator(numeric_index[missing_indices])

            # Update the time series with interpolated values
            time_series[missing_indices] = interpolated_values

        # Update the corresponding row in the interpolated data
        interpolated_data.iloc[index, start_column:start_column + columns_per_repetition] = time_series

        # Update progress bar
        progress_bar.update(1)

# Close the progress bar
progress_bar.close()

# Concatenate latitude, longitude, and interpolated time series data
interpolated_data = pd.concat([lat_lon, interpolated_data.iloc[:, 2:]], axis=1)

# Save the updated DataFrame to a new CSV file
interpolated_data.to_csv("interpolated_data.csv", index=False)

