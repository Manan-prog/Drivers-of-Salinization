import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import shap

# --- 1. Load and Prepare Data ---

# Load the dataset from the specified CSV file.
data = pd.read_csv('AllYears_Analysis_DataFrame.csv')

# Separate the target variable (NDVI) from the predictor variables.
# 'area_sqm' is also dropped from predictors as specified.
X = data.drop(columns=['NDVI', 'area_sqm'])
y = data['NDVI']

# Define new, more descriptive names for the predictor variables.
renamed_variable_names = [
    "Precipitation",
    "Reference ET",
    "Relative storm event",
    "Tidal amplitude",
    "Clay %",
    "Sand %",
    "Silt %",
    "Saturated hydraulic conductivity",
    "Bulk density",
    "Organic matter",
    "pH",
    "Residual soil water content",
    "Saturated soil water content",
    "Distance to nearest water pixel",
    "Elevation"
]

# Rename the columns of the predictor DataFrame (X) for clarity in output.
X.columns = renamed_variable_names

# Split the dataset into training (80%) and testing (20%) sets.
# random_state ensures reproducibility of the split.
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- 2. Random Forest Model Training ---

# Initialize the Random Forest Regressor with predefined best parameters.
# These parameters were found through a previous hyperparameter tuning process (e.g., GridSearchCV, commented out below).
rf_regressor = RandomForestRegressor(
    bootstrap=True,           # Whether bootstrap samples are used when building trees.
    max_depth=30,             # Maximum depth of the tree.
    min_samples_leaf=1,       # Minimum number of samples required to be at a leaf node.
    min_samples_split=5,      # Minimum number of samples required to split an internal node.
    n_estimators=200,         # Number of trees in the forest.
    random_state=42           # Seed for reproducibility of results.
)

# Train the Random Forest model using the training data.
rf_regressor.fit(X_train, y_train)

# Save the trained Random Forest model to a file using joblib.
# This allows for later loading and reuse without retraining.
joblib.dump(rf_regressor, 'AllYears_best_rf_model.pkl')
print("Model saved as AllYears_best_rf_model.pkl")

# --- 3. Model Prediction and Evaluation ---

# Predict NDVI values for the test set using the trained model.
y_test_pred = rf_regressor.predict(X_test)

# Predict NDVI values for the training set (useful for checking for overfitting).
y_train_pred = rf_regressor.predict(X_train)

# Calculate and print various regression evaluation metrics for the test set.
mse = mean_squared_error(y_test, y_test_pred)
mae = mean_absolute_error(y_test, y_test_pred)
rmse = np.sqrt(mse) # RMSE is the square root of MSE.
r2 = r2_score(y_test, y_test_pred)

print(f"\nMean Squared Error (MSE): {mse:.4f}")
print(f"Mean Absolute Error (MAE): {mae:.4f}")
print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
print(f"R-squared (R²): {r2:.4f}")

# Calculate R-squared for the training set.
train_r2 = r2_score(y_train, y_train_pred)
print(f"Training R² Score: {train_r2:.4f}")

# Calculate Adjusted R-squared for the test set.
n = X_test.shape[0]  # Number of observations in the test set.
p = X_test.shape[1]  # Number of predictors in the test set.
adjusted_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)
print(f"Adjusted R-squared: {adjusted_r2:.4f}")

# --- 4. Visualization of Results ---

# Plot: Predicted vs. Observed values for training and testing data.
plt.figure(figsize=(12, 5))

# Training data scatter plot.
plt.subplot(1, 2, 1)
sns.scatterplot(x=y_train, y=y_train_pred, alpha=0.5, edgecolor=None)
plt.plot([min(y_train), max(y_train)], [min(y_train), max(y_train)], color='red', linestyle='--') # 1:1 line
plt.xlabel("Observed NDVI (Training)")
plt.ylabel("Predicted NDVI (Training)")
plt.title("Predicted vs. Observed (Training Data)")

# Testing data scatter plot.
plt.subplot(1, 2, 2)
sns.scatterplot(x=y_test, y=y_test_pred, alpha=0.5, edgecolor=None)
plt.plot([min(y_test), max(y_test)], [min(y_test), max(y_test)], color='red', linestyle='--') # 1:1 line
plt.xlabel("Observed NDVI (Testing)")
plt.ylabel("Predicted NDVI (Testing)")
plt.title("Predicted vs. Observed (Testing Data)")

plt.tight_layout() # Adjust layout to prevent labels from overlapping.
plt.show()

# Plot: Distribution of Target Variable (y) for training and testing data.
plt.figure(figsize=(8, 5))
sns.histplot(y_train, bins=30, kde=True, color="blue", label="Training Data")
sns.histplot(y_test, bins=30, kde=True, color="red", label="Testing Data", alpha=0.6)
plt.xlabel("Target Variable (NDVI)")
plt.ylabel("Frequency")
plt.title("Distribution of Target Variable (NDVI)")
plt.legend()
plt.show()

# --- 5. Feature Importance Analysis ---

# Calculate feature importance from the trained Random Forest model.
variable_importance = rf_regressor.feature_importances_

# Sort variables by importance in descending order.
sorted_idx = np.argsort(variable_importance)[::-1] # Get indices that would sort the array.
sorted_variable_names = np.array(renamed_variable_names)[sorted_idx]
sorted_variable_importance = variable_importance[sorted_idx]

# Print sorted variable importance.
print("\nVariable Importance (Sorted):")
for name, importance in zip(sorted_variable_names, sorted_variable_importance):
    print(f"{name}: {importance:.4f}")

# Plot: Variable Importance.
plt.figure(figsize=(12, 8))
plt.barh(sorted_variable_names, sorted_variable_importance, color='purple')
plt.xlabel('Variable Importance', fontsize=14)
plt.ylabel('Variables', fontsize=14)
plt.title('All Years - Variable Importance Plot', fontsize=16)
plt.xlim(0, 0.30) # Set x-axis limit.
plt.xticks(fontsize=12)
plt.yticks(fontsize=14)
plt.gca().invert_yaxis() # Invert y-axis to show most important at the top.
plt.tight_layout() # Adjust layout.
plt.savefig('AllYears_NoArea_Variable_Importance_Plot.tif', dpi=300) # Save plot.
plt.show()

# --- 6. SHAP (SHapley Additive exPlanations) Analysis ---

# Create a TreeExplainer for the Random Forest model.
explainer = shap.TreeExplainer(rf_regressor)

# Calculate SHAP values for a sample of the training data.
# Sampling is often done for large datasets to speed up computation.
shap_values = explainer.shap_values(X_train.sample(n=500, random_state=42))

# Plot: SHAP summary plot.
# This plot shows the impact of each feature on the model's output.
shap.summary_plot(shap_values, X_train.sample(n=500, random_state=42), show=False)
plt.xlim(-2, 1) # Set x-axis limit for better visualization.
plt.savefig('AllYears_noArea_shap_summary_plot.tif', dpi=300) # Save plot.
plt.show()

# --- Optional: Hyperparameter Tuning (commented out) ---
# This section demonstrates how you would typically perform Grid Search
# to find the best hyperparameters, which were then manually used above.

# # Define a parameter grid for Grid Search.
# param_grid = {
#     'n_estimators': [100, 200, 300],
#     'max_depth': [10, 20, 30, None],
#     'min_samples_split': [2, 5, 10],
#     'min_samples_leaf': [1, 2, 4],
#     'bootstrap': [True, False]
# }

# # Create the base Random Forest model.
# rf = RandomForestRegressor(random_state=42)

# # Initialize GridSearchCV with 5-fold cross-validation.
# # n_jobs=-1 uses all available CPU cores.
# grid_search = GridSearchCV(estimator=rf, param_grid=param_grid,
#                            cv=5, n_jobs=-1, verbose=2, scoring='neg_mean_squared_error')

# # Perform Grid Search and train the model (this can take a long time).
# grid_search.fit(X_train, y_train)

# # Print the best parameters found by Grid Search.
# print("Best parameters found by Grid Search:", grid_search.best_params_)
# # Access the best model found by Grid Search.
# best_rf_model = grid_search.best_estimator_
