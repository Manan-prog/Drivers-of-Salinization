# Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')

import pandas as pd
import numpy as np

"""## **Z score function - taking yearly chunks at a time.**"""

def zscore_standardization(df, chunk_size=19):
    # Exclude the first two columns (latitude and longitude) from standardization
    data = df.iloc[:, 2:]

    # Initialize an empty DataFrame to store standardized data
    standardized_data = pd.DataFrame()

    # Iterate over columns in chunks of chunk_size
    for i in range(0, data.shape[1], chunk_size):
        # Select columns for this chunk
        chunk = data.iloc[:, i:i+chunk_size]

        # Stack the chunk vertically
        stacked_chunk = chunk.stack()

        # Calculate mean and standard deviation for the stacked chunk
        chunk_mean = stacked_chunk.mean()
        chunk_std = stacked_chunk.std(ddof=0)

        # Perform z-score standardization for the stacked chunk
        standardized_chunk = (stacked_chunk - chunk_mean) / chunk_std

        # Unstack the standardized chunk back into 19 columns
        unstacked_chunk = standardized_chunk.unstack()

        # Concatenate unstacked chunk to the result DataFrame
        standardized_data = pd.concat([standardized_data, unstacked_chunk], axis=1)

    # Concatenate latitude, longitude, and standardized data
    result = pd.concat([df.iloc[:, :2], standardized_data], axis=1)

    return result

"""## **Z Score Standardization - Column wise - for Spatial Properties**"""

import pandas as pd

def zscore_column_standardization(df):
    # Exclude the first two columns (latitude and longitude) from standardization
    data = df.iloc[:, 2:]

    # Calculate column-wise mean and standard deviation
    column_means = data.mean()
    column_stds = data.std(ddof=0)

    # Perform z-score standardization for each column
    standardized_data = (data - column_means) / column_stds

    # Concatenate latitude, longitude, and standardized data
    result = pd.concat([df.iloc[:, :2], standardized_data], axis=1)

    return result

"""# **Z-Score Standardization of Storm Events (DEM - HighTide)**"""

# Commented out IPython magic to ensure Python compatibility.
# Change the working directory
# %cd /content/drive/MyDrive/Chapter2/Analysis/2019

def main():
    # Read the CSV file
    file_path = "2019_StormEvent_extracted_data.csv"
    df = pd.read_csv(file_path)

    # Perform z-score standardization
    standardized_df = zscore_standardization(df)

    # Write the standardized data to a new CSV file
    standardized_file_path = "ZScore_2019_StormEvent_extracted_data.csv"
    standardized_df.to_csv(standardized_file_path, index=False)
    print("Standardized data saved to:", standardized_file_path)

if __name__ == "__main__":
    main()

"""# **Z-Score Standardization of Tidal Amplitude (HighTide - Low Tide)**"""

# Commented out IPython magic to ensure Python compatibility.
# Change the working directory
# %cd /content/drive/MyDrive/Chapter2/Analysis/2019

def main():
    # Read the CSV file
    file_path = "2019_AmplitudeWave_extracted_data.csv"
    df = pd.read_csv(file_path)

    # Perform z-score standardization
    standardized_df = zscore_standardization(df)

    # Write the standardized data to a new CSV file
    standardized_file_path = "ZScore_2019_AmplitudeWave_extracted_data.csv"
    standardized_df.to_csv(standardized_file_path, index=False)
    print("Standardized data saved to:", standardized_file_path)

if __name__ == "__main__":
    main()

"""# **Z-Score Standardization of Precipitation**

"""

# Commented out IPython magic to ensure Python compatibility.
# Change the working directory
# %cd /content/drive/MyDrive/Chapter2/Analysis/2019

def main():
    # Read the CSV file
    file_path = "2019_Rainfall_extracted_data.csv"
    df = pd.read_csv(file_path)

    # Perform z-score standardization
    standardized_df = zscore_standardization(df)

    # Write the standardized data to a new CSV file
    standardized_file_path = "ZScore_2019_Rainfall_extracted_data.csv"
    standardized_df.to_csv(standardized_file_path, index=False)
    print("Standardized data saved to:", standardized_file_path)

if __name__ == "__main__":
    main()

"""# **Z-Score Standardization of Reference Evapotranspiration**

"""

# Commented out IPython magic to ensure Python compatibility.
# Change the working directory
# %cd /content/drive/MyDrive/Chapter2/Analysis/2019

def main():
    # Read the CSV file
    file_path = "2019_RefEvap_extracted_data.csv"
    df = pd.read_csv(file_path)

    # Perform z-score standardization
    standardized_df = zscore_standardization(df)

    # Write the standardized data to a new CSV file
    standardized_file_path = "ZScore_2019_RefEvap_extracted_data.csv"
    standardized_df.to_csv(standardized_file_path, index=False)
    print("Standardized data saved to:", standardized_file_path)

if __name__ == "__main__":
    main()

"""# **Z-Score Standardization of NDVI time series**"""

# Commented out IPython magic to ensure Python compatibility.
# Change the working directory
# %cd /content/drive/MyDrive/Chapter2/Analysis/2019

def main():
    # Read the CSV file
    file_path = "2019_NDVI_TSA_extracted_data.csv"
    df = pd.read_csv(file_path)

    # Perform z-score standardization
    standardized_df = zscore_standardization(df)

    # Write the standardized data to a new CSV file
    standardized_file_path = "ZScore_2019_NDVI_TSA_extracted_data.csv"
    standardized_df.to_csv(standardized_file_path, index=False)
    print("Standardized data saved to:", standardized_file_path)

if __name__ == "__main__":
    main()

"""# **Z-Score Standardization of All Spatial Properties - Column Wise Standardization**

"""

# Commented out IPython magic to ensure Python compatibility.
# Change the working directory
# %cd /content/drive/MyDrive/Chapter2/Analysis/2019


def main():
    # Read the CSV file
    file_path = "2019_SpatialProperties_extracted_data.csv"
    df = pd.read_csv(file_path)

    # Perform z-score standardization 'COLUMN WISE'
    standardized_df = zscore_column_standardization(df)

    # Write the standardized data to a new CSV file
    standardized_file_path = "ZScore_2019_SpatialProperties_extracted_data.csv"
    standardized_df.to_csv(standardized_file_path, index=False)
    print("Standardized data saved to:", standardized_file_path)

if __name__ == "__main__":
    main()

