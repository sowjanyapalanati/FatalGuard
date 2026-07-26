import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://127.0.0.1:8003/ws/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WS!")
            msg = {
                "patient_id": "MRN-001",
                "timestamp": "2026-07-17T00:00:00Z",
                "features": {
                    "baseline_value": 140.0
                }
            }
            await websocket.send(json.dumps(msg))
            print("Sent data, waiting for response...")
            response = await websocket.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_ws())
