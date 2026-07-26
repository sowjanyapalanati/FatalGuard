import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import pytorch_lightning as pl
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

from models.lstm_model import FetalHealthLSTM

# ── Feature Definitions ─────────────────────────────────────────
FEATURE_COLS = [
    "baseline_value", "accelerations", "fetal_movement",
    "uterine_contractions", "light_decelerations", "severe_decelerations",
    "prolongued_decelerations", "abnormal_short_term_variability",
    "mean_value_of_short_term_variability",
    "percentage_of_time_with_abnormal_long_term_variability",
    "mean_value_of_long_term_variability", "histogram_width",
    "histogram_min", "histogram_max", "histogram_mode",
    "histogram_mean", "histogram_median", "histogram_variance",
    "histogram_tendency",
]

def load_data(data_path):
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    df.rename(columns={'baseline value': 'baseline_value'}, inplace=True)
    # Target in Kaggle dataset is usually 1, 2, 3. Subtract 1 for zero-indexed labels.
    if df['fetal_health'].min() == 1:
        df['fetal_health'] = df['fetal_health'] - 1
        
    X = df[FEATURE_COLS].values
    y = df['fetal_health'].values.astype(int)
    
    return train_test_split(X, y, test_size=0.2, random_state=42)

def train_lstm(X_train, y_train, X_test, y_test, scaler_path, model_path):
    print("\n--- Training LSTM Model ---")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save the scaler
    joblib.dump(scaler, scaler_path)
    print(f"Saved scaler to {scaler_path}")
    
    train_dataset = TensorDataset(torch.tensor(X_train_scaled, dtype=torch.float32), torch.tensor(y_train, dtype=torch.long))
    val_dataset = TensorDataset(torch.tensor(X_test_scaled, dtype=torch.float32), torch.tensor(y_test, dtype=torch.long))
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32)
    
    model = FetalHealthLSTM(input_dim=len(FEATURE_COLS), num_classes=3)
    
    trainer = pl.Trainer(max_epochs=10, logger=False, enable_checkpointing=False, enable_progress_bar=True)
    trainer.fit(model, train_loader, val_loader)
    
    torch.save(model.state_dict(), model_path)
    print(f"Saved LSTM model weights to {model_path}")



if __name__ == "__main__":
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "fetal_health.csv")
    models_dir = os.path.join(os.path.dirname(__file__), "..", "ml_pipeline", "models")
    
    os.makedirs(models_dir, exist_ok=True)
    
    X_train, X_test, y_train, y_test = load_data(dataset_path)
    
    scaler_path = os.path.join(models_dir, "scaler.pkl")
    lstm_path = os.path.join(models_dir, "fetal_health_lstm.pt")
    train_lstm(X_train, y_train, X_test, y_test, scaler_path, lstm_path)
    
    print("\n✅ All models trained successfully!")
