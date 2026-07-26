"""
PyTorch Lightning model for Fetal Health Classification.
Upgraded to a Hybrid LSTM architecture for sequential time-series modeling.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
import pytorch_lightning as pl
from torchmetrics import Accuracy, F1Score, AUROC, Precision, Recall


class FetalHealthClassifier(pl.LightningModule):
    def __init__(
        self,
        input_dim: int = 19,
        num_classes: int = 3,
        hidden_dim: int = 128,
        num_layers: int = 2,
        dropout: float = 0.3,
        lr: float = 1e-3,
        weight_decay: float = 1e-4,
        class_weights: list[float] | None = None,
    ):
        super().__init__()
        self.save_hyperparameters()

        # CNN Feature Extractor
        self.cnn = nn.Sequential(
            nn.Conv1d(in_channels=input_dim, out_channels=32, kernel_size=1),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Conv1d(in_channels=32, out_channels=64, kernel_size=1),
            nn.BatchNorm1d(64),
            nn.ReLU(),
        )

        # LSTM for sequence processing
        self.lstm = nn.LSTM(
            input_size=64,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
            bidirectional=True
        )

        # Fully connected classifier on top of the LSTM outputs
        lstm_out_dim = hidden_dim * 2  # Bidirectional

        self.classifier = nn.Sequential(
            nn.Linear(lstm_out_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_classes)
        )

        # Loss function
        weight_tensor = torch.tensor(class_weights) if class_weights else None
        self.criterion = nn.CrossEntropyLoss(weight=weight_tensor)

        # Metrics
        metrics = {
            "acc": Accuracy(task="multiclass", num_classes=num_classes),
            "f1": F1Score(task="multiclass", num_classes=num_classes, average="macro"),
            "auc": AUROC(task="multiclass", num_classes=num_classes),
            "precision": Precision(task="multiclass", num_classes=num_classes, average="macro"),
            "recall": Recall(task="multiclass", num_classes=num_classes, average="macro"),
        }
        self.train_metrics = nn.ModuleDict({k: v.clone() for k, v in metrics.items()})
        self.val_metrics = nn.ModuleDict({k: v.clone() for k, v in metrics.items()})
        self.test_metrics = nn.ModuleDict({k: v.clone() for k, v in metrics.items()})

    def forward(self, x):
        """
        x can be (batch_size, input_dim) or (batch_size, seq_len, input_dim)
        If 2D, we unsqueeze to make it a sequence of length 1 for compatibility.
        """
        if x.dim() == 2:
            x = x.unsqueeze(1)  # (batch, 1, input_dim)

        # CNN expects (batch, channels, seq_len)
        x_cnn = x.transpose(1, 2)
        cnn_out = self.cnn(x_cnn)
        
        # Transpose back to (batch, seq_len, channels) for LSTM
        lstm_in = cnn_out.transpose(1, 2)

        # LSTM output: out=(batch, seq, directions*hidden), (h, c)
        lstm_out, _ = self.lstm(lstm_in)
        
        # Take the output of the last time step
        last_step_out = lstm_out[:, -1, :]
        
        # Pass through dense classifier
        logits = self.classifier(last_step_out)
        return logits

    def _shared_step(self, batch, batch_idx, phase):
        x, y = batch
        logits = self(x)
        loss = self.criterion(logits, y)

        metrics = getattr(self, f"{phase}_metrics")
        
        self.log(f"{phase}/loss", loss, on_step=False, on_epoch=True, prog_bar=True)
        
        # Update metrics
        for name, metric in metrics.items():
            metric.update(logits, y)
            self.log(f"{phase}/{name}", metric, on_step=False, on_epoch=True)

        return loss

    def training_step(self, batch, batch_idx):
        return self._shared_step(batch, batch_idx, "train")

    def validation_step(self, batch, batch_idx):
        return self._shared_step(batch, batch_idx, "val")

    def test_step(self, batch, batch_idx):
        return self._shared_step(batch, batch_idx, "test")

    def configure_optimizers(self):
        optimizer = torch.optim.AdamW(
            self.parameters(), 
            lr=self.hparams.lr, 
            weight_decay=self.hparams.weight_decay
        )
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="max", factor=0.5, patience=5, min_lr=1e-6
        )
        return {
            "optimizer": optimizer,
            "lr_scheduler": {
                "scheduler": scheduler,
                "monitor": "val/auc",
                "frequency": 1
            }
        }
