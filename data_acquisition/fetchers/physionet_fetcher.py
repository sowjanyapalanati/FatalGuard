"""
PhysioNet WFDB Signal Fetcher
Downloads and extracts features from CTU-UHB Intrapartum CTG Database.
URL: https://physionet.org/content/ctu-uhb-ctgdb/1.0.0/
Requires free PhysioNet registration.
"""
import logging
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

PHYSIONET_DB = "ctu-uhb-ctgdb"
PHYSIONET_VERSION = "1.0.0"

# Representative record IDs from the CTU-UHB database
SAMPLE_RECORD_IDS = [
    "1001", "1002", "1003", "1004", "1005",
    "1006", "1007", "1008", "1009", "1010",
]


def _count_accelerations(
    fhr: np.ndarray, threshold: float = 15.0, min_samples: int = 8
) -> float:
    """Count FHR accelerations (>15 bpm above baseline for ≥2 s at 4 Hz)."""
    valid = fhr[~np.isnan(fhr)]
    if len(valid) == 0:
        return 0.0
    baseline = np.median(valid)
    above = fhr > (baseline + threshold)
    count, in_acc, duration = 0, False, 0
    for v in above:
        if v:
            duration += 1
            in_acc = True
        else:
            if in_acc and duration >= min_samples:
                count += 1
            in_acc, duration = False, 0
    return float(count)


def _count_decelerations(
    fhr: np.ndarray,
    threshold: float = 15.0,
    severe_threshold: float = 60.0,
    min_samples: int = 8,
) -> tuple[float, float, float]:
    """Return (light_decel, severe_decel, prolongued_decel) counts."""
    valid = fhr[~np.isnan(fhr)]
    if len(valid) == 0:
        return 0.0, 0.0, 0.0
    baseline = np.median(valid)
    below = baseline - fhr

    light = severe = prolongued = 0
    in_dec, duration, depth = False, 0, 0.0
    for d in below:
        if d > threshold:
            duration += 1
            depth = max(depth, d)
            in_dec = True
        else:
            if in_dec:
                if duration >= 120:  # >30 s  = prolongued
                    prolongued += 1
                elif depth >= severe_threshold:
                    severe += 1
                else:
                    light += 1
            in_dec, duration, depth = False, 0, 0.0
    return float(light), float(severe), float(prolongued)


def extract_features_from_record(record_id: str, save_dir: str = "data/raw/physionet") -> pd.DataFrame:
    """
    Fetch a PhysioNet WFDB record and extract CTG features via sliding windows.
    Returns a DataFrame of feature-windows with 19 standard columns.
    """
    try:
        import wfdb  # type: ignore
    except ImportError:
        raise ImportError("Install wfdb: pip install wfdb")

    Path(save_dir).mkdir(parents=True, exist_ok=True)
    logger.info(f"⬇️  Fetching PhysioNet record {record_id} from {PHYSIONET_DB} …")

    try:
        record = wfdb.rdrecord(
            record_name=record_id,
            pn_dir=f"{PHYSIONET_DB}/{PHYSIONET_VERSION}",
        )
    except Exception as e:
        logger.warning(f"   Could not fetch record {record_id}: {e}")
        return pd.DataFrame()

    fs = record.fs  # Sampling frequency (usually 4 Hz)
    fhr = record.p_signal[:, 0].astype(float)
    uc = record.p_signal[:, 1].astype(float) if record.p_signal.shape[1] > 1 else np.zeros_like(fhr)

    window_size = int(60 * fs)   # 1-minute windows
    step_size   = int(30 * fs)   # 50 % overlap
    rows = []

    for start in range(0, len(fhr) - window_size, step_size):
        w_fhr = fhr[start : start + window_size]
        w_uc  = uc [start : start + window_size]

        nan_frac = np.isnan(w_fhr).mean()
        if nan_frac > 0.20:       # skip windows with > 20 % missing
            continue

        valid_fhr = w_fhr[~np.isnan(w_fhr)]
        light_dec, severe_dec, prol_dec = _count_decelerations(w_fhr)
        hist, edges = np.histogram(valid_fhr, bins=20, range=(50, 200))

        rows.append({
            "record_id":            record_id,
            "window_start_sec":     start / fs,
            "baseline_value":       float(np.median(valid_fhr)),
            "accelerations":        _count_accelerations(w_fhr),
            "fetal_movement":       0.0,   # Not available in raw WFDB signal
            "uterine_contractions": float(np.nanmean(w_uc)),
            "light_decelerations":  light_dec,
            "severe_decelerations": severe_dec,
            "prolongued_decelerations": prol_dec,
            "abnormal_short_term_variability": float(np.nanstd(np.diff(valid_fhr)) > 2),
            "mean_value_of_short_term_variability": float(np.nanmean(np.abs(np.diff(valid_fhr)))),
            "percentage_of_time_with_abnormal_long_term_variability": float(nan_frac * 100),
            "mean_value_of_long_term_variability": float(np.nanstd(valid_fhr)),
            "histogram_width":  float(np.nanmax(valid_fhr) - np.nanmin(valid_fhr)),
            "histogram_min":    float(np.nanmin(valid_fhr)),
            "histogram_max":    float(np.nanmax(valid_fhr)),
            "histogram_mode":   float(edges[hist.argmax()]),
            "histogram_mean":   float(np.nanmean(valid_fhr)),
            "histogram_median": float(np.nanmedian(valid_fhr)),
            "histogram_variance": float(np.nanvar(valid_fhr)),
            "histogram_tendency": float(np.sign(np.nanmean(np.diff(valid_fhr)))),
            "data_source": "physionet",
        })

    df = pd.DataFrame(rows)
    out = Path(save_dir) / f"record_{record_id}.csv"
    df.to_csv(out, index=False)
    logger.info(f"✅ PhysioNet {record_id}: {len(df)} windows → {out}")
    return df


def fetch_all_physionet(save_dir: str = "data/raw/physionet",
                         combined_path: str = "data/raw/physionet_ctg.csv") -> pd.DataFrame:
    """Download and combine all sample PhysioNet records."""
    frames = []
    for rid in SAMPLE_RECORD_IDS:
        df = extract_features_from_record(rid, save_dir)
        if not df.empty:
            frames.append(df)

    if not frames:
        logger.warning("⚠️  No PhysioNet records could be downloaded.")
        return pd.DataFrame()

    combined = pd.concat(frames, ignore_index=True)
    combined.to_csv(combined_path, index=False)
    logger.info(f"✅ Combined PhysioNet dataset: {len(combined):,} rows → {combined_path}")
    return combined


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    fetch_all_physionet()
