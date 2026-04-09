from preprocess import load_and_preprocess
import numpy as np
import pickle

from sklearn.metrics import mean_squared_error, r2_score
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

print("Loading and preprocessing data...")

# Load data from preprocess.py
X_scaled, y, scaler = load_and_preprocess()

# -------------------------------
# BETTER TRAIN-TEST SPLIT
# -------------------------------
# Engine-wise split
units = np.unique(np.arange(len(X_scaled)) // 100)  # approx grouping

split_idx = int(0.8 * len(X_scaled))

X_train, X_test = X_scaled[:split_idx], X_scaled[split_idx:]
y_train, y_test = y[:split_idx], y[split_idx:]

# -------------------------------
# MODELS (IMPROVED)
# -------------------------------

models = {
    "Decision Tree": DecisionTreeRegressor(max_depth=12),

    "Random Forest": RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    ),

    "XGBoost": XGBRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8
    )
}

best_model = None
best_score = -999
best_name = ""

print("\nTraining models...\n")

# -------------------------------
# TRAIN LOOP
# -------------------------------

for name, model in models.items():
    print(f"Training {name}...")

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"{name} RMSE: {rmse:.2f}")
    print(f"{name} R2 Score: {r2:.4f}\n")

    if r2 > best_score:
        best_score = r2
        best_model = model
        best_name = name

# -------------------------------
# SAVE BEST MODEL
# -------------------------------

print("Best Model:", best_name)

pickle.dump(best_model, open("models/xgb_model.pkl", "wb"))
pickle.dump(scaler, open("models/scaler.pkl", "wb"))

print("Model saved successfully!")