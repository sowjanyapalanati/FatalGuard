"""
Export PyTorch FetalHealthClassifier model to ONNX format.
Enables high-performance low-latency inference.
"""
import os
import sys
import io
import torch

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

base_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(base_dir, "..", "ml_pipeline", "models")
if not os.path.exists(models_dir):
    models_dir = os.path.join(base_dir, "models")

sys.path.append(base_dir)
sys.path.append(os.path.join(base_dir, "..", "ml_pipeline"))

from models.classifier import FetalHealthClassifier

def export():
    pt_path = os.path.join(models_dir, "fetal_health_lstm.pt")
    onnx_path = os.path.join(models_dir, "fetal_health.onnx")
    
    print(f"📦 Loading PyTorch model from {pt_path}...")
    model = FetalHealthClassifier(input_dim=21, hidden_dim=64, num_classes=3)
    
    if os.path.exists(pt_path):
        model.load_state_dict(torch.load(pt_path, map_location="cpu", weights_only=True), strict=False)
    else:
        print("⚠️ Warning: PyTorch model file not found, exporting initialized weights.")
        
    model.eval()

    # Dummy input representing (batch_size=1, input_dim=21)
    dummy_input = torch.randn(1, 21, dtype=torch.float32)

    print(f"⚡ Exporting model to ONNX: {onnx_path}...")
    try:
        torch.onnx.export(
            model,
            dummy_input,
            onnx_path,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=["ctg_features"],
            output_names=["logits"],
            dynamic_axes={
                "ctg_features": {0: "batch_size"},
                "logits": {0: "batch_size"}
            },
            dynamo=False
        )
    except TypeError:
        torch.onnx.export(
            model,
            dummy_input,
            onnx_path,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=["ctg_features"],
            output_names=["logits"],
            dynamic_axes={
                "ctg_features": {0: "batch_size"},
                "logits": {0: "batch_size"}
            }
        )
    print(f"✅ Model successfully exported to ONNX format: {onnx_path}")

if __name__ == "__main__":
    export()
