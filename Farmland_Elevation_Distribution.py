import pandas as pd     # For loading and manipulating dataframes
import numpy as np      # For numerical operations, especially array creation
import matplotlib.pyplot as plt # For creating static, animated, and interactive visualizations

# --- 1. Data Loading ---

# Load the CSV file into a pandas DataFrame.
# This file contain various spatial properties for 2023.
df_spatial_properties_2023 = pd.read_csv('2023_SpatialProperties_extracted_data.csv')

# Extract the 'average_elevation' column into a separate pandas Series.
# This is the primary variable we will analyze and visualize.
elevation_data = df_spatial_properties_2023['average_elevation']

# --- 2. Data Analysis: Mean Calculation ---

# Calculate the mean (average) value of the elevation data.
# This will draw a vertical line on the histogram for reference.
mean_elevation = elevation_data.mean()

# --- 3. Histogram Bin Definition ---

# Define the edges for the histogram bins.
# np.arange(0, 40, 4) creates bins from 0 up to (but not including) 40, with a step of 4.
# [40, elevation_data.max() + 1] adds two more bins:
#   - One starting at 40 (to include values >= 40).
#   - A final bin that extends slightly beyond the maximum elevation to ensure all data points are captured.
bin_edges = np.append(np.arange(0, 40, 4), [40, elevation_data.max() + 1])

# --- 4. Plotting: Histogram Visualization ---

# Create a new figure and set its size (width=8 inches, height=5 inches).
plt.figure(figsize=(8, 5))

# Generate the histogram.
# 'elevation_data' is the data to be plotted.
# 'bins=bin_edges' specifies the custom bin boundaries.
# 'edgecolor='black'' adds black borders to the bars for better distinction.
# 'alpha=0.7' sets the transparency of the bars.
plt.hist(elevation_data, bins=bin_edges, edgecolor='black', alpha=0.7)

# Add a vertical dashed red line at the calculated mean elevation.
# 'axvline' draws a vertical line at a specified x-coordinate.
# 'color', 'linestyle', 'linewidth' control the line's appearance.
# 'label' provides text for the legend.
plt.axvline(mean_elevation, color='red', linestyle='dashed', linewidth=2, label=f'Mean: {mean_elevation:.2f} m')

# --- 5. Plot Customization ---

# Set the label for the x-axis.
plt.xlabel('Elevation (m)', fontsize=12)
# Set the label for the y-axis.
plt.ylabel('Frequency', fontsize=12)
# Set the title of the plot.
plt.title('Elevation Data Distribution of Salinized Farmlands - 2023', fontsize=14)

# Add a grid to the plot for better readability, only along the y-axis,
# with a dashed linestyle and slight transparency.
plt.grid(axis='y', linestyle='--', alpha=0.6)

# Display the legend, which includes the label for the mean line.
plt.legend(fontsize=10)

# Customize x-axis ticks and limits.
# Create labels for the x-ticks, including "40+" for the last bin.
xtick_labels = list(range(0, 40, 4)) + ["40+"]
# Set the actual tick positions to match the bin edges relevant for labels (0, 4, ..., 36, 40).
plt.xticks(ticks=np.append(np.arange(0, 40, 4), 40), labels=xtick_labels, fontsize=10)
# Set the x-axis display limits to range from 0 to slightly above 40 (e.g., 45)
# to ensure the "40+" bin and related data are clearly visible.
plt.xlim(0, 45)

# --- 6. Save and Display Plot ---

# Save the generated plot to a PNG file.
plt.savefig('Elevation_distribution_2023.png', dpi=300) # dpi=300 for higher resolution

# Display the plot.
# In interactive environments like Jupyter/Colab, this renders the plot.
plt.show()
