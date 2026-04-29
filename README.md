AI Predictive Maintenance Dashboard

An end-to-end AI-powered predictive maintenance system that forecasts Remaining Useful Life (RUL) of jet engines using NASA C-MAPSS FD001 sensor data.
The platform combines Machine Learning, Flask APIs, and a React dashboard to predict engine failure, monitor fleet health, generate maintenance alerts, and support proactive maintenance scheduling.

Project Overview

Traditional maintenance strategies are either:

Reactive Maintenance – fix equipment only after failure (costly and risky)
Scheduled Maintenance – service equipment at fixed intervals (wasteful and inefficient)

This project implements Predictive Maintenance, where machine learning uses live sensor data to estimate how many operational cycles remain before failure.

This prediction is called Remaining Useful Life (RUL).

By predicting RUL in advance, the system helps organizations:

Prevent unexpected machine failures
Reduce maintenance costs
Improve operational safety
Optimize maintenance schedules
Extend machine lifespan
Problem Statement

Industrial assets such as jet engines, turbines, and heavy machinery degrade over time.
Unexpected failures can cause:

Expensive downtime
Safety risks
Production loss
Unplanned maintenance costs

This project solves that problem by predicting when an engine is likely to fail using historical sensor patterns.

Dataset Used
NASA C-MAPSS FD001 Dataset

This project uses the NASA C-MAPSS FD001 dataset, a benchmark dataset for predictive maintenance research.

C-MAPSS stands for Commercial Modular Aero-Propulsion System Simulation.

It contains simulated turbofan jet engine degradation data captured over time until failure.

Files Used
train_FD001.txt – full run-to-failure training data
test_FD001.txt – partial engine histories for testing
RUL_FD001.txt – true Remaining Useful Life values for test engines
Dataset Structure

Each row represents:

One engine
At one operational cycle
With sensor readings and operating conditions
Columns
unit → Engine ID
cycle → Current operational cycle
op1, op2, op3 → Operating conditions
sensor_1 to sensor_21 → Engine sensor readings
Key Features
Predict Remaining Useful Life (RUL) of jet engines
Real-time engine health prediction
Fleet-wide health monitoring dashboard
Engine-specific sensor trend analysis
Automated maintenance alerts
Maintenance scheduling recommendations
Model performance tracking
CSV export for reports and logs
Interactive charts and visual analytics
Tech Stack
Frontend
React.js
Axios
Recharts
CSS / Custom UI Components
Backend
Flask
Flask-CORS
REST API
Machine Learning
Python
Pandas
NumPy
Scikit-learn
XGBoost
Model Storage
Pickle
Machine Learning Pipeline
1. Data Loading

Raw NASA C-MAPSS text files are loaded using Pandas.

2. Preprocessing
Remove null columns
Rename columns
Compute RUL
Clip RUL at 125 cycles
Remove low-information sensors
Normalize features using StandardScaler
3. Feature Engineering

Rolling window features are created for each useful sensor:

Rolling Mean (5-cycle window)
Rolling Standard Deviation (5-cycle window)

These features help capture:

Sensor trends
Instability
Degradation behavior
4. Model Training

Three regression models are trained and compared:

Decision Tree Regressor
Random Forest Regressor
XGBoost Regressor
5. Model Evaluation

Models are evaluated using:

RMSE
MAE
R² Score

The best-performing model is selected automatically.

6. Deployment

The trained model and scaler are saved using Pickle and deployed through Flask APIs.

Why XGBoost?

XGBoost was selected as the final model because it delivered the best performance on RUL prediction.

Advantages:

Handles non-linear sensor relationships
Captures complex degradation patterns
High predictive accuracy
Built-in regularization
Strong performance on tabular industrial data
API Endpoints
POST /predict

Predicts Remaining Useful Life from user-entered sensor values.

GET /stats

Returns fleet-wide engine health statistics and RUL summaries.

GET /sensor-data/<engine_id>

Returns recent sensor trends for a selected engine.

GET /alerts

Returns prioritized maintenance alerts based on predicted RUL.

GET /model-performance

Returns evaluation metrics such as RMSE, MAE, and R².

Dashboard Modules
Dashboard
Fleet health overview
KPI cards
Health score ring
Engine drill-down
RUL trend chart
Actual vs Predicted chart
Feature importance chart
Predict
Manual sensor input
Real-time RUL prediction
Health gauge visualization
Sensors
Sensor trend monitoring
Multi-sensor comparison
Engine-level diagnostics
Alerts
Critical engine warnings
Severity-based alert filtering
Maintenance prioritization
Maintenance
Suggested maintenance scheduling
Priority planning
Manual override and notes
Reports & Logs
Maintenance history
Alert history
Engine performance reports
CSV export
Model Performance
RMSE / MAE / R² metrics
Error distribution
Prediction accuracy analysis
Project Workflow

NASA C-MAPSS Dataset
→ Data Preprocessing
→ RUL Computation
→ Feature Engineering
→ Model Training
→ Model Evaluation
→ Best Model Selection
→ Flask API Deployment
→ React Dashboard Visualization
→ Real-Time Prediction & Alerts

Business Value

This system enables organizations to move from reactive maintenance to predictive maintenance.

Benefits
Reduces unplanned failures
Lowers maintenance costs
Improves safety
Increases equipment reliability
Enables data-driven maintenance planning

In real-world industrial settings, predictive maintenance systems like this can reduce maintenance costs by 25–30%.
