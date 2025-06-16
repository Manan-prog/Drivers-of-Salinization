
# Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')

import pandas as pd
import numpy as np

# 5 Day Composite - Mean - Storm Event

# Read the data from the CSV file
data = pd.read_csv('Storm_Event_Assigned.csv')

# Reshape the DataFrame to group columns into groups of 5
reshaped_data = data.iloc[:, 2:].values.reshape(len(data), -1, 5)

# Sum over the reshaped DataFrame
column_sums = pd.DataFrame(np.mean(reshaped_data, axis=2), columns=range(len(reshaped_data[0])))

# Add latitude and longitude columns to the final DataFrame
column_sums.insert(0, 'lat', data['lat'])
column_sums.insert(1, 'lon', data['lon'])

# Export the DataFrame to a new CSV file
column_sums.to_csv('5Day_Mean_Storm_Event_Assigned.csv', index=False)

## 5 Day Composite - Mean - Storm Intensity as Amplitude (HighTide - Low Tide)

# Read the data from the CSV file
data = pd.read_csv('Amplitude_Wave_Assigned.csv')

# Reshape the DataFrame to group columns into groups of 5
reshaped_data = data.iloc[:, 2:].values.reshape(len(data), -1, 5)

# Sum over the reshaped DataFrame
column_sums = pd.DataFrame(np.mean(reshaped_data, axis=2), columns=range(len(reshaped_data[0])))

# Add latitude and longitude columns to the final DataFrame
column_sums.insert(0, 'lat', data['lat'])
column_sums.insert(1, 'lon', data['lon'])

# Export the DataFrame to a new CSV file
column_sums.to_csv('5Day_Mean_Amplitude_Wave_Assigned.csv', index=False)

## 5 Day Composite - Sum -  Precipitation

# Read the data from the CSV file
data = pd.read_csv('CompleteRainfall.csv')

# Reshape the DataFrame to group columns into groups of 5
reshaped_data = data.iloc[:, 2:].values.reshape(len(data), -1, 5)

# Sum over the reshaped DataFrame
column_sums = pd.DataFrame(np.sum(reshaped_data, axis=2), columns=range(len(reshaped_data[0])))

# Add latitude and longitude columns to the final DataFrame
column_sums.insert(0, 'lat', data['lat'])
column_sums.insert(1, 'lon', data['lon'])

# Export the DataFrame to a new CSV file
column_sums.to_csv('5Day_Sum_CompleteRainfall.csv', index=False)

## 5 Day Composite - Max Evapotranspiration

# Read the data from the CSV file
data = pd.read_csv('CompleteRefEvap.csv')


# Reshape the DataFrame to group columns into groups of 5
reshaped_data = data.iloc[:, 2:].values.reshape(len(data), -1, 5)

# Sum over the reshaped DataFrame
column_sums = pd.DataFrame(np.max(reshaped_data, axis=2), columns=range(len(reshaped_data[0])))

# Add latitude and longitude columns to the final DataFrame
column_sums.insert(0, 'lat', data['lat'])
column_sums.insert(1, 'lon', data['lon'])

# Export the DataFrame to a new CSV file
column_sums.to_csv('5Day_Max_CompleteRefEvap.csv', index=False)

