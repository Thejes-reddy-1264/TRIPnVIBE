import sys
import os
import asyncio
import websockets
from fastapi import FastAPI
import uvicorn
from contextlib import asynccontextmanager

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.api.endpoints.websockets import router as ws_router
from app.services.websocket_manager import manager

# Setup a dummy FastAPI app just for testing the WS route
app = FastAPI()
app.include_router(ws_router, prefix="/ws")

@asynccontextmanager
async def run_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=8001, log_level="error")
    server = uvicorn.Server(config)
    
    # Run the server in a separate task
    task = asyncio.create_task(server.serve())
    await asyncio.sleep(1) # give it a second to start
    try:
        yield
    finally:
        server.should_exit = True
        await task

async def test_websocket_client():
    from app.services.websocket_manager import manager
    
    client_id = "test_user_001"
    uri = f"ws://127.0.0.1:8001/ws/{client_id}"
    
    print(f"\n--- Testing WebSocket Connection for {client_id} ---")
    try:
        async with websockets.connect(uri) as websocket:
            print("1. Connected successfully to the WebSocket server.")
            
            # Test sending a message to the server
            test_msg = "Hello from test client!"
            await websocket.send(test_msg)
            print(f"2. Sent message to server: '{test_msg}'")
            
            # Wait for the echo back from the server logic
            response = await websocket.recv()
            print(f"3. Received response from server: '{response}'")

            # Let's test a broadcast triggered from "backend" side
            print("\n--- Testing Server Broadcast ---")
            await manager.broadcast("SYSTEM: Scheduled maintenance in 5 minutes.")
            
            broadcast_msg = await websocket.recv()
            print(f"4. Received broadcast: '{broadcast_msg}'")
            
            print("\nWebSocket verification successful.")
    except Exception as e:
        print(f"WebSocket test failed: {e}")

async def main():
    async with run_server():
        await test_websocket_client()

if __name__ == "__main__":
    asyncio.run(main())
