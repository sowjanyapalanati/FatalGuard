"""
Real-Time CTG Replay Engine
Reads a CTG CSV dataset and streams rows to Kafka at a configurable rate,
simulating continuous patient monitoring from real clinical data.
"""
import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from kafka_producer import CTGKafkaProducer, ensure_topics

logger = logging.getLogger(__name__)

FEATURE_COLS = [
    "baseline_value",
    "accelerations",
    "fetal_movement",
    "uterine_contractions",
    "light_decelerations",
    "severe_decelerations",
    "prolongued_decelerations",
    "abnormal_short_term_variability",
    "mean_value_of_short_term_variability",
    "percentage_of_time_with_abnormal_long_term_variability",
    "mean_value_of_long_term_variability",
    "histogram_width",
    "histogram_min",
    "histogram_max",
    "histogram_mode",
    "histogram_mean",
    "histogram_median",
    "histogram_variance",
    "histogram_tendency",
]

# Demo patient IDs – one "patient" per segment of the dataset
DEMO_PATIENTS = ["MRN-001", "MRN-002", "MRN-003"]


class CTGReplayEngine:
    """
    Streams a CTG dataset row-by-row to Kafka, simulating real-time monitoring.

    Multiple patients are interleaved by round-robin assignment so the dashboard
    shows several patients updating simultaneously.
    """

    def __init__(
        self,
        dataset_path: str,
        bootstrap_servers: str = "localhost:9092",
        topic: str = "ctg-raw-stream",
        interval_seconds: float = 0.5,
        loop: bool = True,
    ):
        self.dataset_path = dataset_path
        self.interval = interval_seconds
        self.loop_mode = loop
        self.is_running = False
        self.producer = CTGKafkaProducer(topic=topic, bootstrap_servers=bootstrap_servers)

    def _load_dataset(self) -> pd.DataFrame:
        path = Path(self.dataset_path)
        if not path.exists():
            raise FileNotFoundError(
                f"Dataset not found at {path}. "
                "Run the fetchers first (uci_ctg_fetcher / kaggle_fetcher)."
            )
        df = pd.read_csv(str(path))
        available = [c for c in FEATURE_COLS if c in df.columns]
        logger.info(
            f"📂 Loaded {len(df):,} records from {path.name} "
            f"({len(available)}/{len(FEATURE_COLS)} feature columns found)"
        )
        return df

    async def start(self):
        """Begin streaming CTG rows to Kafka."""
        df = self._load_dataset()
        self.is_running = True
        idx = 0
        total = len(df)
        session_id = str(uuid.uuid4())

        logger.info(
            f"🚀 Replay engine started | {total:,} records | "
            f"{1 / self.interval:.1f} rows/sec | "
            f"loop={self.loop_mode}"
        )

        while self.is_running:
            row = df.iloc[idx % total]
            patient_id = DEMO_PATIENTS[idx % len(DEMO_PATIENTS)]

            # Build CTG feature dict (only columns that exist)
            ctg_features = {
                col: float(row[col]) if col in row.index and pd.notna(row[col]) else 0.0
                for col in FEATURE_COLS
            }

            event = {
                "event_id": str(uuid.uuid4()),
                "patient_id": patient_id,
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "record_index": int(idx % total),
                "ctg_features": ctg_features,
                "ground_truth": int(row["fetal_health"]) if "fetal_health" in row.index else None,
                "data_source": str(row.get("data_source", "replay")),
            }

            await self.producer.publish(event)

            idx += 1

            if idx % 200 == 0:
                logger.info(f"📡 Published {idx:,} events …")

            if not self.loop_mode and idx >= total:
                logger.info("✅ Dataset replay complete (loop=False).")
                break

            await asyncio.sleep(self.interval)

        self.producer.flush()
        logger.info("⏹️  Replay engine stopped.")

    def stop(self):
        self.is_running = False


async def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    bootstrap = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    dataset   = os.getenv("DATASET_PATH", "data/raw/kaggle_ctg.csv")
    interval  = float(os.getenv("REPLAY_INTERVAL_SECONDS", "0.5"))
    loop_mode = os.getenv("REPLAY_LOOP", "true").lower() == "true"

    # Ensure all required Kafka topics exist
    ensure_topics(bootstrap)

    engine = CTGReplayEngine(
        dataset_path=dataset,
        bootstrap_servers=bootstrap,
        interval_seconds=interval,
        loop=loop_mode,
    )
    await engine.start()


if __name__ == "__main__":
    asyncio.run(main())
