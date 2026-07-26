import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import pandas as pd
import os
import argparse

class Generator(nn.Module):
    def __init__(self, latent_dim: int, output_dim: int):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(latent_dim, 64),
            nn.BatchNorm1d(64),
            nn.LeakyReLU(0.2),
            nn.Linear(64, 128),
            nn.BatchNorm1d(128),
            nn.LeakyReLU(0.2),
            nn.Linear(128, output_dim),
            nn.Tanh() # Assuming inputs are normalized between -1 and 1
        )
        
    def forward(self, z):
        return self.model(z)

class Discriminator(nn.Module):
    def __init__(self, input_dim: int):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.3),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
        
    def forward(self, x):
        return self.model(x)

def train_gan(features_dim=19, latent_dim=32, epochs=5000, batch_size=64):
    print("Initializing Tabular GAN for Fetal Health Augmentation...")
    generator = Generator(latent_dim, features_dim)
    discriminator = Discriminator(features_dim)
    
    criterion = nn.BCELoss()
    opt_g = optim.Adam(generator.parameters(), lr=0.0002, betas=(0.5, 0.999))
    opt_d = optim.Adam(discriminator.parameters(), lr=0.0002, betas=(0.5, 0.999))
    
    # Generate some mock "Pathological" and "Suspect" class tabular data
    # In a real run, this would be loaded from the UCI/Kaggle dataset using pandas
    print("Loading minority class CTG samples (Suspect and Pathological)...")
    real_data = torch.randn((500, features_dim)) # Mock normalized data
    
    print(f"Starting training for {epochs} epochs...")
    for epoch in range(epochs):
        # 1. Train Discriminator
        opt_d.zero_grad()
        
        # Real
        idx = torch.randint(0, real_data.shape[0], (batch_size,))
        real_batch = real_data[idx]
        real_labels = torch.ones((batch_size, 1))
        pred_real = discriminator(real_batch)
        loss_d_real = criterion(pred_real, real_labels)
        
        # Fake
        z = torch.randn((batch_size, latent_dim))
        fake_batch = generator(z)
        fake_labels = torch.zeros((batch_size, 1))
        pred_fake = discriminator(fake_batch.detach())
        loss_d_fake = criterion(pred_fake, fake_labels)
        
        loss_d = loss_d_real + loss_d_fake
        loss_d.backward()
        opt_d.step()
        
        # 2. Train Generator
        opt_g.zero_grad()
        z = torch.randn((batch_size, latent_dim))
        fake_batch = generator(z)
        
        # Generator wants Discriminator to predict 1 (Real)
        pred_fake = discriminator(fake_batch)
        loss_g = criterion(pred_fake, real_labels)
        loss_g.backward()
        opt_g.step()
        
        if epoch % 500 == 0:
            print(f"Epoch [{epoch}/{epochs}] | Loss D: {loss_d.item():.4f} | Loss G: {loss_g.item():.4f}")
            
    # Save the generator for the Data Synthesis UI
    os.makedirs("models/checkpoints", exist_ok=True)
    torch.save(generator.state_dict(), "models/checkpoints/ctg_gan_generator.pt")
    print("Training complete! Generator saved to models/checkpoints/ctg_gan_generator.pt")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train GAN for CTG Tabular Data Augmentation")
    parser.add_argument("--epochs", type=int, default=3000, help="Number of training epochs")
    args = parser.parse_args()
    
    train_gan(epochs=args.epochs)
