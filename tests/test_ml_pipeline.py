"""
Unit Tests for Machine Learning Pipeline & Signal Processor
"""
import pytest
import torch
import numpy as np
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_pipeline")))

from ml_pipeline.models.classifier import FetalHealthClassifier
from ml_pipeline.train_gan import Generator, Discriminator
from data_acquisition.signal_processor import SignalProcessor


def test_classifier_forward_pass():
    model = FetalHealthClassifier(input_dim=21, hidden_dim=32, num_layers=2, num_classes=3)
    model.eval()

    # Test 2D input (batch, 21)
    x_2d = torch.randn(8, 21)
    out_2d = model(x_2d)
    assert out_2d.shape == (8, 3)

    # Test 3D sequence input (batch, seq_len, 21)
    x_3d = torch.randn(8, 10, 21)
    out_3d = model(x_3d)
    assert out_3d.shape == (8, 3)


def test_gan_generator_and_discriminator():
    latent_dim = 32
    features_dim = 21
    gen = Generator(latent_dim=latent_dim, output_dim=features_dim)
    disc = Discriminator(input_dim=features_dim)

    z = torch.randn(16, latent_dim)
    fake_samples = gen(z)
    assert fake_samples.shape == (16, features_dim)

    validity = disc(fake_samples)
    assert validity.shape == (16, 1)
    assert (validity >= 0.0).all() and (validity <= 1.0).all()


def test_signal_processor_feature_extraction():
    fhr = np.sin(np.linspace(0, 10, 120)) * 10 + 140.0
    uc = np.sin(np.linspace(0, 5, 120)) * 15 + 20.0

    sp = SignalProcessor(fhr_signal=fhr, uc_signal=uc)
    features = sp.extract_features()

    assert "baseline_value" in features
    assert 130.0 <= features["baseline_value"] <= 150.0
    assert "accelerations" in features
    assert "abnormal_short_term_variability" in features
    assert len(features) == 19
