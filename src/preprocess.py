import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

def load_and_preprocess():

    print("Loading dataset...")

    data = pd.read_csv("data/train_FD001.txt", sep=" ", header=None)
    data = data.dropna(axis=1)

    columns = ['unit','cycle',
               'op_setting_1','op_setting_2','op_setting_3'] + \
              [f'sensor_{i}' for i in range(1,22)]

    data.columns = columns

    print("Computing RUL...")

    max_cycle = data.groupby('unit')['cycle'].max().reset_index()
    max_cycle.columns = ['unit', 'max_cycle']

    data = data.merge(max_cycle, on='unit')
    data['RUL'] = data['max_cycle'] - data['cycle']

    # 🔥 STEP 1 — RUL clipping (IMPORTANT)
    data['RUL'] = data['RUL'].clip(upper=125)

    # 🔥 STEP 2 — Focus on failure region
    data = data[data['RUL'] <= 125]

    # 🔥 STEP 3 — ADD TEMPORAL (ROLLING) FEATURES
    window = 5

    for col in data.columns:
        if "sensor" in col:
            data[f"{col}_mean"] = data.groupby('unit')[col].rolling(window).mean().reset_index(0, drop=True)
            data[f"{col}_std"] = data.groupby('unit')[col].rolling(window).std().reset_index(0, drop=True)

    # Fill missing values from rolling
    data = data.fillna(0)

    # 🔥 STEP 4 — Remove useless sensors
    remove_sensors = [
        'sensor_1','sensor_5','sensor_6',
        'sensor_10','sensor_16','sensor_18','sensor_19'
    ]

    X = data.drop(columns=['unit','cycle','RUL','max_cycle'] + remove_sensors)
    y = data['RUL']

    print("Scaling features...")

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler