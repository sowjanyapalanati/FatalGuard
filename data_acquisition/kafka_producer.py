"""
Kafka Producer for CTG Real-Time Stream
Publishes CTG events to Kafka topic: ctg-raw-stream
"""
import json
import asyncio
import logging
from functools import partial
from confluent_kafka import Producer
from confluent_kafka.admin import AdminClient, NewTopic

logger = logging.getLogger(__name__)

TOPICS_TO_CREATE = [
    "ctg-raw-stream",
    "ctg-processed-stream",
    "ctg-predictions",
    "ctg-alerts",
]


def ensure_topics(bootstrap_servers: str):
    """Create Kafka topics if they don't already exist."""
    admin = AdminClient({"bootstrap.servers": bootstrap_servers})
    existing = admin.list_topics(timeout=10).topics.keys()
    new_topics = [
        NewTopic(t, num_partitions=4, replication_factor=1)
        for t in TOPICS_TO_CREATE
        if t not in existing
    ]
    if new_topics:
        futures = admin.create_topics(new_topics)
        for topic, future in futures.items():
            try:
                future.result()
                logger.info(f"✅ Created Kafka topic: {topic}")
            except Exception as e:
                logger.warning(f"Topic {topic} may already exist: {e}")


class CTGKafkaProducer:
    def __init__(
        self,
        topic: str = "ctg-raw-stream",
        bootstrap_servers: str = "localhost:9092",
    ):
        self.topic = topic
        self.producer = Producer(
            {
                "bootstrap.servers": bootstrap_servers,
                "acks": "all",
                "retries": 5,
                "enable.idempotence": True,
                "compression.type": "lz4",
                "linger.ms": 10,
                "batch.size": 32768,
            }
        )
        logger.info(f"✅ Kafka producer ready → topic: {topic}")

    async def publish(self, event: dict):
        """Async publish a CTG event to Kafka."""
        key = event.get("patient_id", "unknown").encode("utf-8")
        value = json.dumps(event, default=str).encode("utf-8")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            partial(
                self.producer.produce,
                self.topic,
                key=key,
                value=value,
                on_delivery=self._delivery_callback,
            ),
        )
        self.producer.poll(0)

    def _delivery_callback(self, err, msg):
        if err:
            logger.error(f"❌ Kafka delivery failed: {err}")

    def flush(self):
        self.producer.flush(timeout=5)
        logger.info("✅ Kafka producer flushed.")
