from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import time
import os

app = Flask(__name__)
CORS(app)

print("Loading model...")
model  = pickle.load(open("../models/xgb_model.pkl", "rb"))
scaler = pickle.load(open("../models/scaler.pkl", "rb"))
print("Model loaded successfully!")

DATA_DIR = "../data"
REMOVE_SENSORS = ['sensor_1','sensor_5','sensor_6','sensor_10','sensor_16','sensor_18','sensor_19']

def preprocess_test():
    test = pd.read_csv(os.path.join(DATA_DIR, "test_FD001.txt"), sep=" ", header=None).dropna(axis=1)
    test.columns = ['unit','cycle','op_setting_1','op_setting_2','op_setting_3'] + \
                   ['sensor_'+str(i) for i in range(1, 22)]
    for c in test.columns:
        if 'sensor' in c:
            test[c+'_mean'] = test.groupby('unit')[c].rolling(5).mean().reset_index(0, drop=True)
            test[c+'_std']  = test.groupby('unit')[c].rolling(5).std().reset_index(0, drop=True)
    return test.fillna(0)

# Pre-compute at startup
_test_df  = preprocess_test()
_raw_test = pd.read_csv(os.path.join(DATA_DIR, "test_FD001.txt"), sep=" ", header=None).dropna(axis=1)
_raw_test.columns = ['unit','cycle','op_setting_1','op_setting_2','op_setting_3'] + \
                    ['sensor_'+str(i) for i in range(1, 22)]
_rul_true = pd.read_csv(os.path.join(DATA_DIR, "RUL_FD001.txt"), sep=" ", header=None).dropna(axis=1)[0].values
_last     = _test_df.groupby('unit').last().reset_index()
_X_last   = _last.drop(columns=['unit','cycle'] + REMOVE_SENSORS)
_preds    = model.predict(scaler.transform(_X_last))


@app.route("/")
def home():
    return "API Running Successfully"


@app.route("/predict", methods=["POST"])
def predict():
    try:
        start_time = time.time()
        data = np.array(request.json["data"]).reshape(1, -1)
        prediction = model.predict(scaler.transform(data))
        return jsonify({"rul": float(prediction[0]), "time_taken": round(time.time() - start_time, 4)})
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/stats", methods=["GET"])
def stats():
    try:
        preds    = _preds
        n        = len(preds)
        failures = int((preds <= 50).sum())
        warning  = int(((preds > 50) & (preds <= 100)).sum())
        healthy  = int((preds > 100).sum())
        avg_rul  = round(float(preds.mean()), 1)
        health_status = "Critical" if failures/n > 0.3 else "Warning" if failures/n > 0.1 else "Good"

        engines = [{"engine": i+1, "predicted": round(float(preds[i]),1),
                    "actual": int(_rul_true[i]),
                    "status": "Critical" if preds[i]<=50 else "Warning" if preds[i]<=100 else "Healthy"}
                   for i in range(n)]

        eng1    = _test_df[_test_df['unit'] == 1].copy()
        X_eng1  = eng1.drop(columns=['unit','cycle'] + REMOVE_SENSORS).tail(30)
        rul_trend = model.predict(scaler.transform(X_eng1))
        cycles    = eng1['cycle'].tail(30).tolist()
        trend = [{"cycle": int(c), "rul": round(float(r), 1)} for c, r in zip(cycles, rul_trend)]

        return jsonify({
            "total_engines": n, "avg_rul": avg_rul,
            "failure_count": failures, "warning_count": warning, "healthy_count": healthy,
            "health_status": health_status, "engines": engines, "rul_trend": trend,
        })
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/sensor-data/<int:engine_id>", methods=["GET"])
def sensor_data(engine_id):
    try:
        eng = _raw_test[_raw_test['unit'] == engine_id].copy()
        if eng.empty:
            return jsonify({"error": "Engine not found"}), 404

        # Return last 40 cycles of key sensors
        eng = eng.tail(40)
        result = []
        for _, row in eng.iterrows():
            result.append({
                "cycle":       int(row['cycle']),
                "temperature": round(float(row['sensor_4']), 2),   # HPC outlet temp
                "pressure":    round(float(row['sensor_9']), 2),   # bypass ratio (pressure proxy)
                "speed":       round(float(row['sensor_12']), 2),  # required fan speed
                "vibration":   round(float(row['sensor_11']), 2),  # bleed enthalpy (vibration proxy)
            })
        return jsonify({"engine": engine_id, "data": result})
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/alerts", methods=["GET"])
def alerts():
    try:
        alerts_list = []
        for i, pred in enumerate(_preds):
            eng_id = i + 1
            actual = int(_rul_true[i])
            if pred <= 20:
                alerts_list.append({
                    "id": eng_id, "engine": f"Engine #{eng_id}",
                    "severity": "Critical",
                    "message": f"Imminent failure — RUL {round(float(pred),1)} cycles. Schedule maintenance NOW.",
                    "rul": round(float(pred), 1), "actual": actual
                })
            elif pred <= 50:
                alerts_list.append({
                    "id": eng_id, "engine": f"Engine #{eng_id}",
                    "severity": "High",
                    "message": f"Failure expected soon — RUL {round(float(pred),1)} cycles. Plan maintenance.",
                    "rul": round(float(pred), 1), "actual": actual
                })
            elif pred <= 80:
                alerts_list.append({
                    "id": eng_id, "engine": f"Engine #{eng_id}",
                    "severity": "Warning",
                    "message": f"Sensor anomaly detected — RUL {round(float(pred),1)} cycles. Monitor closely.",
                    "rul": round(float(pred), 1), "actual": actual
                })

        alerts_list.sort(key=lambda x: x['rul'])
        return jsonify({"alerts": alerts_list, "total": len(alerts_list)})
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/model-performance", methods=["GET"])
def model_performance():
    try:
        actual = _rul_true.astype(float)
        predicted = _preds.astype(float)
        mae  = float(np.mean(np.abs(actual - predicted)))
        rmse = float(np.sqrt(np.mean((actual - predicted)**2)))
        ss_res = np.sum((actual - predicted)**2)
        ss_tot = np.sum((actual - np.mean(actual))**2)
        r2   = float(1 - ss_res/ss_tot)
        within_10  = int(np.sum(np.abs(actual - predicted) <= 10))
        within_20  = int(np.sum(np.abs(actual - predicted) <= 20))

        # Per-engine error for chart
        errors = [{"engine": i+1, "error": round(float(abs(actual[i]-predicted[i])),1),
                   "actual": int(actual[i]), "predicted": round(float(predicted[i]),1)}
                  for i in range(len(actual))]

        return jsonify({
            "mae": round(mae, 2), "rmse": round(rmse, 2), "r2": round(r2, 4),
            "within_10": within_10, "within_20": within_20,
            "total": len(actual), "errors": errors
        })
    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == "__main__":
    app.run(debug=False)
