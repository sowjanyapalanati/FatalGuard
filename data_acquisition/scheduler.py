"""
APScheduler-based data refresh scheduler.
Periodically re-downloads public CTG datasets to keep data fresh.
"""
import asyncio
import logging
import os

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from fetchers.uci_ctg_fetcher import download_uci_ctg
from fetchers.kaggle_fetcher import download_kaggle_ctg
from replay_engine import CTGReplayEngine, main as start_replay

logger = logging.getLogger(__name__)


async def refresh_datasets():
    """Re-download all public datasets (runs weekly)."""
    logger.info("🔄 Scheduled dataset refresh starting …")
    try:
        await download_uci_ctg("data/raw/uci_ctg.csv")
    except Exception as e:
        logger.error(f"UCI download failed: {e}")
    try:
        download_kaggle_ctg("data/raw/kaggle_ctg.csv")
    except Exception as e:
        logger.error(f"Kaggle download failed: {e}")
    logger.info("✅ Dataset refresh complete.")


async def main():
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    scheduler = AsyncIOScheduler()
    # Refresh datasets every Sunday at 02:00 UTC
    scheduler.add_job(
        refresh_datasets,
        CronTrigger(day_of_week="sun", hour=2, minute=0),
        id="weekly_refresh",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("⏰ Scheduler started (weekly dataset refresh @ Sun 02:00 UTC)")

    # Start the real-time replay immediately
    await start_replay()


if __name__ == "__main__":
    asyncio.run(main())
