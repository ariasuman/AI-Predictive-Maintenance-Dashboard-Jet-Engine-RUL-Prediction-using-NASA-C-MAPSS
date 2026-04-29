from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import time
import os
import math

app = Flask(__name__)
CORS(app)

print("Loading model...")
model  = pickle.load(open("../models/xgb_model.pkl", "rb"))
scaler = pickle.load(open("../models/scaler.pkl", "rb"))
print("Model loaded successfully!")

DATA_DIR       = "../data"
REMOVE_SENSORS = ['sensor_1','sensor_5','sensor_6','sensor_10','sensor_16','sensor_18','sensor_19']

# ── helpers ──────────────────────────────────────────────────────────────────

def safe_float(v, fallback=0.0):
    try:
        f = float(v)
        return fallback if (math.isnan(f) or math.isinf(f)) else round(f, 2)
    except Exception:
        return fallback

def engine_status(rul):
    if rul <= 50:  return "Critical"
    if rul <= 100: return "Warning"
    return "Healthy"

# ── preprocess test data (once at startup) ───────────────────────────────────

def _load_test():
    raw = pd.read_csv(os.path.join(DATA_DIR, "test_FD001.txt"), sep=" ", header=None).dropna(axis=1)
    raw.columns = (['unit','cycle','op_setting_1','op_setting_2','op_setting_3'] +
                   [f'sensor_{i}' for i in range(1, 22)])
    return raw

def _add_rolling(df):
    df = df.copy()
    for c in df.columns:
        if 'sensor' in c:
            df[c+'_mean'] = df.groupby('unit')[c].rolling(5).mean().reset_index(0, drop=True)
            df[c+'_std']  = df.groupby('unit')[c].rolling(5).std().reset_index(0, drop=True)
    return df.fillna(0)

_raw_test  = _load_test()
_proc_test = _add_rolling(_raw_test)
_rul_true  = pd.read_csv(os.path.join(DATA_DIR, "RUL_FD001.txt"),
                         sep=" ", header=None).dropna(axis=1)[0].values

_last   = _proc_test.groupby('unit').last().reset_index()
_X_last = _last.drop(columns=['unit','cycle'] + REMOVE_SENSORS)
_X_last = _X_last.reindex(columns=scaler.feature_names_in_, fill_value=0)
_preds  = model.predict(scaler.transform(_X_last))          # shape (100,)

# ── routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return "API Running Successfully"


@app.route("/predict", methods=["POST"])
def predict():
    try:
        raw = request.json.get("data", [])
        if len(raw) != 14:
            return jsonify({"error": f"Expected 14 values, got {len(raw)}"}), 400

        # map the 14 frontend sensors to the correct sensor columns
        selected = [2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21]
        sensors  = {f"sensor_{i}": 0.0 for i in range(1, 22)}
        for idx, val in zip(selected, raw):
            sensors[f"sensor_{idx}"] = float(val)

        df = pd.DataFrame([sensors])
        for c in list(df.columns):
            df[c + "_mean"] = df[c]
            df[c + "_std"]  = 0.0

        df = df.drop(columns=REMOVE_SENSORS, errors='ignore')
        df = df.reindex(columns=scaler.feature_names_in_, fill_value=0)

        pred = model.predict(scaler.transform(df))
        rul  = safe_float(pred[0], fallback=0.0)

        return jsonify({"rul": rul, "time_taken": 0.0})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/stats")
def stats():
    try:
        n        = len(_preds)
        failures = int((np.array(_preds) <= 50).sum())
        warning  = int(((np.array(_preds) > 50) & (np.array(_preds) <= 100)).sum())
        healthy  = int((np.array(_preds) > 100).sum())
        avg_rul  = safe_float(float(np.mean(_preds)))

        if failures / n > 0.3:   health_status = "Critical"
        elif failures / n > 0.1: health_status = "Warning"
        else:                     health_status = "Good"

        engines = []
        for i in range(n):
            p = safe_float(_preds[i])
            a = int(_rul_true[i]) if i < len(_rul_true) else 0
            engines.append({
                "engine":    i + 1,
                "predicted": p,
                "actual":    a,
                "status":    engine_status(p),
            })

        # RUL trend: last 30 cycles of engine 1
        eng1      = _proc_test[_proc_test['unit'] == 1].copy()
        X_eng1    = eng1.drop(columns=['unit','cycle'] + REMOVE_SENSORS, errors='ignore')
        X_eng1    = X_eng1.reindex(columns=scaler.feature_names_in_, fill_value=0).tail(30)
        trend_raw = model.predict(scaler.transform(X_eng1))
        cycles    = eng1['cycle'].tail(30).tolist()
        rul_trend = [{"cycle": int(c), "rul": safe_float(r)}
                     for c, r in zip(cycles, trend_raw)]

        return jsonify({
            "total_engines": n,
            "avg_rul":       avg_rul,
            "failure_count": failures,
            "warning_count": warning,
            "healthy_count": healthy,
            "health_status": health_status,
            "engines":       engines,
            "rul_trend":     rul_trend,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/sensor-data/<int:engine_id>")
def sensor_data(engine_id):
    try:
        eng = _raw_test[_raw_test['unit'] == engine_id].tail(40)
        if eng.empty:
            return jsonify({"engine": engine_id, "data": []}), 404

        data = []
        for _, row in eng.iterrows():
            data.append({
                "cycle":       int(row['cycle']),
                "temperature": safe_float(row['sensor_4']),
                "pressure":    safe_float(row['sensor_9']),
                "speed":       safe_float(row['sensor_12']),
                "vibration":   safe_float(row['sensor_11']),
            })
        return jsonify({"engine": engine_id, "data": data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/alerts")
def alerts():
    try:
        alerts_list = []
        for i, pred in enumerate(_preds):
            p      = safe_float(pred)
            eng_id = i + 1
            actual = int(_rul_true[i]) if i < len(_rul_true) else 0

            if p <= 20:
                severity = "Critical"
                message  = f"Imminent failure — RUL {p} cycles. Schedule maintenance NOW."
            elif p <= 50:
                severity = "High"
                message  = f"Failure expected soon — RUL {p} cycles. Plan maintenance."
            elif p <= 80:
                severity = "Warning"
                message  = f"Sensor anomaly detected — RUL {p} cycles. Monitor closely."
            else:
                continue

            alerts_list.append({
                "id":       eng_id,
                "engine":   f"Engine #{eng_id}",
                "severity": severity,
                "message":  message,
                "rul":      p,
                "actual":   actual,
            })

        alerts_list.sort(key=lambda x: x['rul'])
        return jsonify({"alerts": alerts_list, "total": len(alerts_list)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/model-performance")
def model_performance():
    try:
        actual    = _rul_true.astype(float)
        predicted = np.array(_preds).astype(float)
        n         = len(actual)

        mae  = safe_float(float(np.mean(np.abs(actual - predicted))))
        rmse = safe_float(float(np.sqrt(np.mean((actual - predicted) ** 2))))
        ss_res = float(np.sum((actual - predicted) ** 2))
        ss_tot = float(np.sum((actual - np.mean(actual)) ** 2))
        r2   = safe_float(1 - ss_res / ss_tot if ss_tot != 0 else 0.0)

        within_10 = int(np.sum(np.abs(actual - predicted) <= 10))
        within_20 = int(np.sum(np.abs(actual - predicted) <= 20))

        errors = [{
            "engine":    i + 1,
            "error":     safe_float(abs(actual[i] - predicted[i])),
            "actual":    int(actual[i]),
            "predicted": safe_float(predicted[i]),
        } for i in range(n)]

        return jsonify({
            "mae":       mae,
            "rmse":      rmse,
            "r2":        r2,
            "within_10": within_10,
            "within_20": within_20,
            "total":     n,
            "errors":    errors,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=False)
