import torch
import torch.nn as nn
import pytorch_lightning as pl

class FetalHealthLSTM(pl.LightningModule):
    def __init__(self, input_dim: int, hidden_dim: int = 64, num_layers: int = 2, num_classes: int = 3, lr: float = 1e-3):
        super().__init__()
        self.save_hyperparameters()
        
        # 1D CNN feature extractor
        self.cnn = nn.Sequential(
            nn.Conv1d(in_channels=input_dim, out_channels=32, kernel_size=1),
            nn.ReLU(),
            nn.BatchNorm1d(32),
            nn.Conv1d(in_channels=32, out_channels=64, kernel_size=1),
            nn.ReLU(),
            nn.BatchNorm1d(64)
        )
        
        # LSTM layer for time-series feature extraction
        self.lstm = nn.LSTM(
            input_size=64,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0
        )
        
        # Fully connected layers for classification
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, num_classes)
        )
        
        self.criterion = nn.CrossEntropyLoss()
        
    def forward(self, x):
        # x shape: (batch, seq_len, input_dim)
        # If input is 2D (batch, input_dim), add seq_len=1 dimension
        if x.dim() == 2:
            x = x.unsqueeze(1)
            
        # CNN expects (batch, channels, seq_len)
        x_cnn = x.transpose(1, 2)
        cnn_out = self.cnn(x_cnn)
        # Transpose back to (batch, seq_len, channels) for LSTM
        lstm_in = cnn_out.transpose(1, 2)
            
        lstm_out, (hn, cn) = self.lstm(lstm_in)
        # Take the output of the last time step
        out = lstm_out[:, -1, :] 
        return self.fc(out)
        
    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = self.criterion(logits, y)
        self.log('train_loss', loss)
        return loss
        
    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = self.criterion(logits, y)
        preds = torch.argmax(logits, dim=1)
        acc = (preds == y).float().mean()
        self.log('val_loss', loss, prog_bar=True)
        self.log('val_acc', acc, prog_bar=True)
        return loss

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=self.hparams.lr)
