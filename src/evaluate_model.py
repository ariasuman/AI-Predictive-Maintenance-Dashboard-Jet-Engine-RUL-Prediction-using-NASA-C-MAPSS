import pandas as pd
import numpy as np
import pickle

from sklearn.metrics import mean_squared_error, r2_score

print("Loading model...")

model = pickle.load(open("models/xgb_model.pkl", "rb"))
scaler = pickle.load(open("models/scaler.pkl", "rb"))

print("Loading test data...")

columns = ['unit','cycle',
           'op_setting_1','op_setting_2','op_setting_3'] + \
          [f'sensor_{i}' for i in range(1,22)]

test = pd.read_csv("data/test_FD001.txt", sep=" ", header=None)
test = test.dropna(axis=1)
test.columns = columns

# -------------------------------
# ADD SAME PREPROCESSING AS TRAIN
# -------------------------------

# Rolling features
window = 5

for col in test.columns:
    if "sensor" in col:
        test[f"{col}_mean"] = test.groupby('unit')[col].rolling(window).mean().reset_index(0, drop=True)
        test[f"{col}_std"] = test.groupby('unit')[col].rolling(window).std().reset_index(0, drop=True)

test = test.fillna(0)

# Take last cycle per engine
test_last = test.groupby('unit').last().reset_index()

# Remove same sensors
remove_sensors = [
    'sensor_1','sensor_5','sensor_6',
    'sensor_10','sensor_16','sensor_18','sensor_19'
]

X_test = test_last.drop(columns=['unit','cycle'] + remove_sensors)

# Scale
X_test = scaler.transform(X_test)

# Predict
y_pred = model.predict(X_test)

# Load true RUL
y_true = pd.read_csv("data/RUL_FD001.txt", header=None)[0].values

# Evaluate
rmse = np.sqrt(mean_squared_error(y_true, y_pred))
r2 = r2_score(y_true, y_pred)

print("\n==== Evaluation ====")
print("RMSE:", rmse)
print("R2 Score:", r2)