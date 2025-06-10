import os
import leafmap
from samgeo import SamGeo, tms_to_geotiff, get_basemaps
import numpy as np

# --- Initialize the Leafmap ---
# Create a Leafmap instance, initially centered near the specified coordinates with a high zoom level.
# This map is primarily for interactive visualization and setting up the general area,
# especially if you intend to use the user_roi_bounds feature.
m = leafmap.Map(center=[39.84, -75.05], zoom=19)

# Add the default SATELLITE basemap to the map.
m.add_basemap("SATELLITE")

# Get the last added layer (which should be the basemap) and print its object details.
# This can be handy for debugging or inspecting layer properties.
basemap_layer = m.layers[-1]
print(basemap_layer)

# --- Define Bounding Box (Region of Interest) ---
# Determine the bounding box for the area of interest.
# If a user has drawn a region of interest (ROI) on the map, use those coordinates.
# Otherwise, default to a predefined bounding box for the state of Delaware.
if m.user_roi_bounds() is not None:
    bbox = m.user_roi_bounds()
else:
    # Default bounding box for Delaware: [southwest_lon, southwest_lat, northeast_lon, northeast_lat]
    bbox = [-75.79, 38.45, -75.05, 39.84]

# --- Helper Function to Divide Bounding Box ---
def divide_bbox(bbox, n):
  """
  Divides a given bounding box into an n x n grid of smaller, equally sized boxes.

  Args:
      bbox: A list containing the coordinates of the bounding box in the format:
            [southwest_lon, southwest_lat, northeast_lon, northeast_lat].
      n: The number of divisions along each dimension (e.g., if n=4, it creates 4x4 = 16 smaller boxes).

  Returns:
      A list of lists, where each inner list contains the coordinates of a
      smaller bounding box in the format [southwest_lon, southwest_lat, northeast_lon, northeast_lat].
  """

  # Extract the coordinates from the input bounding box.
  southwest_lon, southwest_lat, northeast_lon, northeast_lat = bbox

  # Calculate the width and height for each of the smaller boxes.
  width = (northeast_lon - southwest_lon) / n
  height = (northeast_lat - southwest_lat) / n

  # Initialize a list to store the coordinates of all the smaller boxes.
  small_boxes = []

  # Loop through rows and columns to generate each smaller box's coordinates.
  for row in range(n):
    for col in range(n):
      # Calculate the coordinates for the current small box.
      current_lon = southwest_lon + col * width
      current_lat = southwest_lat + row * height
      small_box = [
          current_lon,
          current_lat,
          current_lon + width,
          current_lat + height,
      ]
      small_boxes.append(small_box)

  return small_boxes

# --- Prepare Bounding Boxes for Processing ---
# Use the predefined Delaware bounding box (converted to a NumPy array for consistency,
# though the function accepts a list).
bbox_delaware = np.array([-75.79, 38.45, -75.05, 39.84])
n_divisions = 4 # Define 'n' to divide the bounding box into 4x4 = 16 smaller boxes.

# Divide the main bounding box into the specified smaller segments.
small_boxes = divide_bbox(bbox_delaware, n_divisions)

# Print the coordinates of each generated small box for verification.
for i in range(n_divisions * n_divisions): # Loop through all 16 small boxes
  print(f"Small box {i+1}: {small_boxes[i]}")

# --- Initialize Leafmap for Visualization of Bounding Box Grid ---
# Create a new Leafmap instance, centered on the overall bounding box for Delaware,
# and with a zoom level that allows viewing the entire area along with its divisions.
m = leafmap.Map(center=[(bbox_delaware[1] + bbox_delaware[3]) / 2, (bbox_delaware[0] + bbox_delaware[2]) / 2 ], zoom=10)
m.add_basemap("SATELLITE")

# --- Initialize SAMGeo Model ---
# Initialize the Segment Anything Model (SAM) for geospatial applications.
# 'model_type': Specifies the SAM model architecture (e.g., 'vit_h' for Vision Transformer Huge).
# 'checkpoint': Path to the pre-trained model weights (.pth file).
# 'sam_kwargs': Optional keyword arguments to pass to the SAM model.
sam = SamGeo(
    model_type="vit_h",
    checkpoint="sam_vit_h_4b8939.pth",
    sam_kwargs=None,
)

# --- Process Each Small Bounding Box for Segmentation ---
# Iterate through each of the smaller bounding boxes to download satellite imagery,
# perform segmentation, and save the results.
for i in range(len(small_boxes)):
  # Construct unique filenames for the input image, segmentation mask, and vector outputs.
  image_filename = f"bbox_{i+1}.tif"
  mask_filename = f"segment_{i+1}.tif"
  vector_gpkg_filename = f"segment_{i+1}.gpkg"
  shapefile_filename = f"segment_{i+1}.shp"

  # 1. Download Satellite Image for the Current Small Box
  # Downloads a satellite image for the current bounding box at zoom level 13 (~20m resolution).
  # 'overwrite=True' ensures that previous files with the same name are replaced.
  tms_to_geotiff(output=image_filename, bbox=small_boxes[i], zoom=13, source="Satellite", overwrite=True)
  print(f"Downloaded image for small box {i+1}: {image_filename}")

  # 2. Generate Segmentation Mask using SAM
  # Performs segmentation on the downloaded image to create a mask.
  # 'batch=True': Enables batch processing (though processing one image at a time here).
  # 'foreground=True': Instructs SAM to prioritize foreground objects (useful for features like farmland).
  # 'erosion_kernel=(3, 3)': Applies a 3x3 erosion filter to refine the mask, helping to remove small artifacts.
  # 'mask_multiplier=255': Scales the mask values (typically to 0 or 255 for binary masks).
  sam.generate(
      image_filename, mask_filename, batch=True, foreground=True, erosion_kernel=(3, 3), mask_multiplier=255
  )
  print(f"Generated segmentation mask for small box {i+1}: {mask_filename}")

  # 3. Convert Segmentation Mask to GeoPackage (GPKG)
  # Converts the TIFF mask into a GeoPackage file, a modern and open geospatial vector format.
  # 'simplify_tolerance=None': No simplification is applied, preserving original geometry detail.
  sam.tiff_to_gpkg(mask_filename, vector_gpkg_filename, simplify_tolerance=None)
  print(f"Converted mask to GeoPackage for small box {i+1}: {vector_gpkg_filename}")

  # 4. Convert Segmentation Mask to ESRI Shapefile
  # Converts the TIFF mask into an ESRI Shapefile, a widely used geospatial vector format.
  sam.tiff_to_vector(mask_filename, shapefile_filename)
  print(f"Converted mask to Shapefile for small box {i+1}: {shapefile_filename}\n")

print("All small boxes processed and segmentation results saved.")
