from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import manager

router = APIRouter()

@router.websocket("/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            # We wait for messages from the client to keep the connection open
            # Typically clients might send 'ping' or specific subscription requests.
            data = await websocket.receive_text()
            # For demonstration, we echo back a received confirmation
            await manager.send_personal_message(f"Server received: {data}", client_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
        # We could broadcast that a user left, but usually we just clean up.
        # await manager.broadcast(f"Client #{client_id} left the chat")
