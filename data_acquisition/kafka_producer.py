"""
Kafka Producer for CTG Real-Time Stream
Publishes CTG events to Kafka topic: ctg-raw-stream
"""
import json
import asyncio
import logging
from functools import partial
try:
    from confluent_kafka import Producer
    from confluent_kafka.admin import AdminClient, NewTopic
except ImportError:
    Producer = None
    AdminClient = None
    NewTopic = None

logger = logging.getLogger(__name__)

TOPICS_TO_CREATE = [
    "ctg-raw-stream",
    "ctg-processed-stream",
    "ctg-predictions",
    "ctg-alerts",
]


def ensure_topics(bootstrap_servers: str):
    """Create Kafka topics if they don't already exist."""
    if AdminClient is None:
        logger.warning("confluent_kafka not installed -- skipping Kafka topic creation")
        return
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
        if Producer is None:
            self.producer = None
            logger.warning("confluent_kafka not installed -- producer running in fallback mode")
            return
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
        if self.producer is None:
            logger.info(f"Fallback mode: Event recorded for topic {self.topic}")
            return
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
                callback=self._delivery_report,
            ),
        )
        self.producer.poll(0)

    def _delivery_report(self, err, msg):
        if err is not None:
            logger.error(f"❌ Kafka delivery failed: {err}")
        else:
            logger.debug(f"✅ Event delivered to {msg.topic()} [{msg.partition()}]")

    def flush(self, timeout: float = 5.0):
        if self.producer is not None:
            self.producer.flush(timeout=timeout)
        logger.info("✅ Kafka producer flushed.")
