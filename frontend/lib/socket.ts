/**
 * Native WebSocket client for real-time communication with the AI inference service.
 */
import { EventEmitter } from "events";

let rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_AI_URL || process.env.NEXT_PUBLIC_API_URL || "ws://127.0.0.1:8003";

if (rawWsUrl.startsWith("http://")) {
  rawWsUrl = rawWsUrl.replace("http://", "ws://");
} else if (rawWsUrl.startsWith("https://")) {
  rawWsUrl = rawWsUrl.replace("https://", "wss://");
}

if (!rawWsUrl.endsWith("/ws/stream")) {
  rawWsUrl = `${rawWsUrl.replace(/\/$/, "")}/ws/stream`;
}

const WS_URL = rawWsUrl;

class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    super();
    this.connect();
  }

  connect() {
    // Don't attempt connection if no URL is configured
    if (!WS_URL) {
      console.warn("⚠️ WebSocket URL not configured (NEXT_PUBLIC_WS_URL). Real-time updates disabled.");
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }
    
    try {
      this.ws = new WebSocket(WS_URL);
    } catch (e) {
      console.warn("⚠️ WebSocket connection failed — URL may be invalid:", WS_URL);
      this.scheduleReconnect();
      return;
    }
    
    this.ws.onopen = () => {
      console.log("✅ WebSocket connected");
      this.emit("connect");
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.prediction) {
          this.emit("prediction_update", data);
        }
      } catch (e) {
        // silently ignore unparseable messages
      }
    };
    
    this.ws.onclose = () => {
      this.emit("disconnect");
      this.scheduleReconnect();
    };
    
    this.ws.onerror = () => {
      // Use warn instead of error to avoid Next.js dev overlay
      console.warn("⚠️ WebSocket connection error — server may be offline");
    };
  }

  scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 5000); // 5 seconds between reconnect attempts
    }
  }

  emit(event: string, ...args: any[]) {
    return super.emit(event, ...args);
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

let socketInstance: WebSocketClient | null = null;

export function getSocket(): WebSocketClient {
  if (!socketInstance) {
    socketInstance = new WebSocketClient();
  }
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function streamPatientData(patientId: string, features: any): void {
  const socket = getSocket();
  socket.send({
    patient_id: patientId,
    timestamp: new Date().toISOString(),
    features: features
  });
}
