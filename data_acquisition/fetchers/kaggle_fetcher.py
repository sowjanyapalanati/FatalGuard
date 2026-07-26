"""
Kaggle Dataset Fetcher
Downloads fetal health classification dataset via Kaggle API.
Dataset: andrewmvd/fetal-health-classification
"""
import logging
import os
import subprocess
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

KAGGLE_DATASET = "andrewmvd/fetal-health-classification"
EXPECTED_FILE = "fetal_health.csv"


def _write_kaggle_credentials():
    """Write kaggle.json from environment variables if not already present."""
    kaggle_dir = Path.home() / ".kaggle"
    kaggle_json = kaggle_dir / "kaggle.json"
    if not kaggle_json.exists():
        username = os.getenv("KAGGLE_USERNAME", "")
        key = os.getenv("KAGGLE_KEY", "")
        if username and key:
            kaggle_dir.mkdir(parents=True, exist_ok=True)
            kaggle_json.write_text(f'{{"username":"{username}","key":"{key}"}}')
            kaggle_json.chmod(0o600)
            logger.info("✅ Kaggle credentials written from env vars.")
        else:
            raise EnvironmentError(
                "KAGGLE_USERNAME and KAGGLE_KEY must be set, "
                "or ~/.kaggle/kaggle.json must exist."
            )


def download_kaggle_ctg(save_path: str = "data/raw/kaggle_ctg.csv") -> pd.DataFrame:
    """
    Download the Kaggle fetal health dataset using the Kaggle CLI.
    Requires KAGGLE_USERNAME + KAGGLE_KEY env vars OR ~/.kaggle/kaggle.json.
    """
    save_path = Path(save_path)
    save_path.parent.mkdir(parents=True, exist_ok=True)

    _write_kaggle_credentials()

    logger.info(f"⬇️  Fetching Kaggle dataset: {KAGGLE_DATASET} …")
    result = subprocess.run(
        [
            "kaggle",
            "datasets",
            "download",
            "-d",
            KAGGLE_DATASET,
            "-p",
            str(save_path.parent),
            "--unzip",
            "--force",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Kaggle download failed:\n{result.stderr}")

    downloaded = save_path.parent / EXPECTED_FILE
    if not downloaded.exists():
        raise FileNotFoundError(f"Expected file not found after download: {downloaded}")

    df = pd.read_csv(str(downloaded))
    df["fetal_health"] = df["fetal_health"].astype(int)
    df["data_source"] = "kaggle"
    df.to_csv(str(save_path), index=False)

    logger.info(f"✅ Kaggle CTG dataset saved → {save_path}  ({len(df):,} records)")
    return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    download_kaggle_ctg()
