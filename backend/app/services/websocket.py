import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("network_emergency.ws")


class ConnectionManager:
    """
    Manages active WebSocket connections for live network telemetry and event streaming.
    Provides bounded reconnect tolerance and broadcast capabilities.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_event(self, event_data: Dict[str, Any]):
        """Broadcasts a structured event payload to all connected clients."""
        if not self.active_connections:
            return

        payload = json.dumps(event_data, default=str)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


# Global WebSocket Manager Instance
ws_manager = ConnectionManager()
