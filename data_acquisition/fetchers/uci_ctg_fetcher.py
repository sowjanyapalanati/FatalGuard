"""
UCI CTG Dataset Fetcher
Downloads the Cardiotocography (CTG) dataset from UCI ML Repository.
URL: https://archive.ics.uci.edu/ml/datasets/cardiotocography
"""
import asyncio
import logging
from pathlib import Path

import httpx
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

UCI_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00193/CTG.xls"

FEATURE_RENAME_MAP = {
    "LB": "baseline_value",
    "AC": "accelerations",
    "FM": "fetal_movement",
    "UC": "uterine_contractions",
    "DL": "light_decelerations",
    "DS": "severe_decelerations",
    "DP": "prolongued_decelerations",
    "ASTV": "abnormal_short_term_variability",
    "MSTV": "mean_value_of_short_term_variability",
    "ALTV": "percentage_of_time_with_abnormal_long_term_variability",
    "MLTV": "mean_value_of_long_term_variability",
    "Width": "histogram_width",
    "Min": "histogram_min",
    "Max": "histogram_max",
    "Mode": "histogram_mode",
    "Mean": "histogram_mean",
    "Median": "histogram_median",
    "Variance": "histogram_variance",
    "Tendency": "histogram_tendency",
    "CLASS": "fetal_health",
}


async def download_uci_ctg(save_path: str = "data/raw/uci_ctg.csv") -> pd.DataFrame:
    """
    Download and parse the UCI CTG dataset.
    Returns a cleaned DataFrame with standardised column names.
    """
    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
    raw_xls = Path(save_path).parent / "uci_ctg_raw.xls"

    logger.info("⬇️  Fetching UCI CTG dataset from archive.ics.uci.edu …")
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
        response = await client.get(UCI_URL)
        response.raise_for_status()

    raw_xls.write_bytes(response.content)
    logger.info(f"   Downloaded {len(response.content) / 1024:.1f} KB")

    # The UCI XLS has two sheets; the data is on "Data", header row index 1
    df = pd.read_excel(str(raw_xls), sheet_name="Data", header=1)

    # Keep only rows where the target CLASS is valid (1, 2, or 3)
    df = df[df["CLASS"].isin([1, 2, 3])].copy()

    # Rename columns to standard schema
    df = df.rename(columns=FEATURE_RENAME_MAP)

    # Select only standardised columns
    keep_cols = list(FEATURE_RENAME_MAP.values())
    available = [c for c in keep_cols if c in df.columns]
    df = df[available].reset_index(drop=True)

    df["fetal_health"] = df["fetal_health"].astype(int)
    df["data_source"] = "uci"

    df.to_csv(save_path, index=False)
    logger.info(f"✅ UCI CTG dataset saved → {save_path}  ({len(df):,} records)")
    return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(download_uci_ctg())
