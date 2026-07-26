import os
import pandas as pd
import torch
from torch.utils.data import DataLoader, TensorDataset, random_split
import pytorch_lightning as pl
from pytorch_lightning.callbacks import ModelCheckpoint
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib

# Import the classifier
from models.classifier import FetalHealthClassifier

def main():
    print("Loading dataset...")
    data_path = os.path.join("..", "data", "fetal_health.csv")
    df = pd.read_csv(data_path)
    
    # Separate features and target
    X = df.drop(columns=["fetal_health"]).values
    # fetal_health is 1.0, 2.0, 3.0 -> map to 0, 1, 2
    y = df["fetal_health"].values - 1.0
    
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Save scaler
    os.makedirs("models", exist_ok=True)
    joblib.dump(scaler, "models/scaler.pkl")
    print("Saved scaler to models/scaler.pkl")
    
    # Convert to tensors
    X_tensor = torch.tensor(X_scaled, dtype=torch.float32)
    y_tensor = torch.tensor(y, dtype=torch.long)
    
    # Dataset
    dataset = TensorDataset(X_tensor, y_tensor)
    
    # Train/Val split
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32)
    
    print("Initializing Hybrid CNN-LSTM model...")
    # The input_dim is the number of features (19)
    model = FetalHealthClassifier(input_dim=X.shape[1], hidden_dim=64, num_layers=2, num_classes=3, lr=1e-3)
    
    checkpoint_callback = ModelCheckpoint(
        monitor='val/loss',
        dirpath='models',
        filename='best_model',
        save_top_k=1,
        mode='min'
    )
    
    trainer = pl.Trainer(
        max_epochs=10, # Keep it short for immediate feedback
        callbacks=[checkpoint_callback],
        logger=False,
        enable_progress_bar=True
    )
    
    print("Starting training...")
    trainer.fit(model, train_loader, val_loader)
    
    print("Saving final weights to fetal_health_lstm.pt...")
    # Save in standard PyTorch format for the inference server
    torch.save(model.state_dict(), "models/fetal_health_lstm.pt")
    print("Training complete! CNN-LSTM weights are ready.")

if __name__ == "__main__":
    main()
