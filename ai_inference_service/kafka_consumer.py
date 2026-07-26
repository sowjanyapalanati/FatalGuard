import json
import logging
import os
import asyncio
from confluent_kafka import Consumer, KafkaError

from main import run_inference

logger = logging.getLogger(__name__)

class CTGKafkaConsumer:
    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        group_id: str = "ai-inference-group",
        topic: str = "ctg-raw-stream"
    ):
        self.topic = topic
        self.consumer = Consumer({
            'bootstrap.servers': bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': 'latest',
            'enable.auto.commit': True
        })
        self.is_running = False

    async def start(self):
        self.consumer.subscribe([self.topic])
        self.is_running = True
        logger.info(f"✅ Kafka consumer started → topic: {self.topic}")

        while self.is_running:
            # Poll with a short timeout so we can yield to asyncio
            msg = self.consumer.poll(0.1)
            
            if msg is None:
                await asyncio.sleep(0.01)
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    logger.error(f"Kafka error: {msg.error()}")
                    continue

            # Parse message
            try:
                val = msg.value().decode('utf-8')
                event = json.loads(val)
                features = event.get("ctg_features", {})
                
                # Run AI inference
                result = run_inference(features)
                
                logger.info(f"🧠 Inference for patient {event.get('patient_id')}: {result['prediction']} ({result['confidence']:.2f})")
                
                # In a full system, you might publish this back to 'ctg-predictions' Kafka topic
                # For now we just log it as a proof of concept backend consumer
                
            except Exception as e:
                logger.error(f"Error processing Kafka message: {e}")

    def stop(self):
        self.is_running = False
        self.consumer.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    
    consumer = CTGKafkaConsumer(
        bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    )
    
    try:
        asyncio.run(consumer.start())
    except KeyboardInterrupt:
        consumer.stop()
