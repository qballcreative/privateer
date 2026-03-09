import { create } from 'zustand';
import Peer, { DataConnection } from 'peerjs';
import { generateSecureShortCode, sanitizePlayerName } from '@/lib/security';
import { debugLog } from '@/lib/debugLog';
import { useRemoteConfigStore } from './remoteConfigStore';

export type MultiplayerState = 'idle' | 'hosting' | 'joining' | 'connected' | 'disconnected' | 'error';

export interface GameMessage {
  type: 'game-state' | 'action' | 'chat' | 'ready' | 'start' | 'next-round' | 'ping' | 'pong' | 'rejoin-sync';
  payload: unknown;
}

interface MultiplayerStore {
  state: MultiplayerState;
  peer: Peer | null;
  connection: DataConnection | null;
  peerId: string | null;
  hostId: string | null;
  isHost: boolean;
  opponentName: string | null;
  localPlayerName: string | null; // Store local player's name for this session
  error: string | null;
  latency: number | null;
  lastPingTime: number | null;
  heartbeatInterval: ReturnType<typeof setInterval> | null;
  missedPings: number;
  
  // Actions
  hostGame: (playerName: string) => Promise<string>;
  joinGame: (hostId: string, playerName: string) => Promise<void>;
  reconnect: (gameCode: string, playerName: string) => Promise<void>;
  sendMessage: (message: GameMessage) => void;
  sendPing: () => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  disconnect: () => void;
  setOpponentName: (name: string) => void;
  setLocalPlayerName: (name: string) => void;
  onMessage: (callback: (message: GameMessage) => void) => () => void;
  reset: () => void;
}

const messageCallbacks: Set<(message: GameMessage) => void> = new Set();

const notifyListeners = (message: GameMessage) => {
  messageCallbacks.forEach((callback) => callback(message));
};

const HEARTBEAT_INTERVAL = 3000; // Send ping every 3 seconds
const MAX_MISSED_PINGS = 3; // Disconnect after 3 missed pings (9 seconds)

// Use cryptographically secure code generation
const generateShortCode = generateSecureShortCode;

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  state: 'idle',
  peer: null,
  connection: null,
  peerId: null,
  hostId: null,
  isHost: false,
  opponentName: null,
  localPlayerName: null,
  error: null,
  latency: null,
  lastPingTime: null,
  heartbeatInterval: null,
  missedPings: 0,

  hostGame: async (playerName: string) => {
    return new Promise((resolve, reject) => {
      const shortCode = generateShortCode();
      // Configure with public STUN/TURN servers for better NAT traversal
      const peer = new Peer(shortCode, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ]
        },
        debug: 1, // Log errors only
      });
      
      peer.on('open', (id) => {
        set({ 
          peer, 
          peerId: id, 
          state: 'hosting', 
          isHost: true,
          localPlayerName: playerName,
          error: null 
        });
        
        // Setup connection handler that can handle reconnections
        const setupConnectionHandlers = (conn: DataConnection) => {
          conn.on('open', () => {
            // Close any existing connection before accepting new one (handles reconnection)
            const { connection: existingConn, stopHeartbeat } = get();
            if (existingConn && existingConn !== conn) {
              stopHeartbeat();
              existingConn.close();
            }
            
            set({ connection: conn, state: 'connected', missedPings: 0 });
            // Send host name to guest
            conn.send({ type: 'chat', payload: { name: playerName } });
            // Start heartbeat
            get().startHeartbeat();
          });
          
          conn.on('data', (data) => {
            const message = data as GameMessage;
            
            // Handle ping/pong for latency
            if (message.type === 'ping') {
              conn.send({ type: 'pong', payload: message.payload });
              return;
            }
            if (message.type === 'pong') {
              const sentTime = message.payload as number;
              const latency = Date.now() - sentTime;
              set({ latency, missedPings: 0 });
              return;
            }
            
            if (message.type === 'chat' && (message.payload as { name?: string }).name) {
              // Sanitize opponent name to prevent XSS
              const rawName = (message.payload as { name: string }).name;
              set({ opponentName: sanitizePlayerName(rawName) });
            }
            notifyListeners(message);
          });
          
          conn.on('close', () => {
            get().stopHeartbeat();
            set({ state: 'disconnected', connection: null, latency: null });
          });
          
          conn.on('error', (err) => {
            get().stopHeartbeat();
            set({ error: err.message, state: 'error' });
          });
        };
        
        peer.on('connection', setupConnectionHandlers);
        
        resolve(id);
      });
      
      peer.on('error', (err) => {
        get().stopHeartbeat();
        // If the short code is already in use, try again with a new one
        if (err.type === 'unavailable-id') {
          get().hostGame(playerName).then(resolve).catch(reject);
          return;
        }
        set({ error: err.message, state: 'error' });
        reject(err);
      });
      
      peer.on('disconnected', () => {
        get().stopHeartbeat();
        set({ state: 'disconnected' });
      });
    });
  },

  joinGame: async (hostId: string, playerName: string) => {
    return new Promise((resolve, reject) => {
      // Configure with public STUN/TURN servers for better NAT traversal
      const peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ]
        },
        debug: 1, // Log errors only
      });
      
      peer.on('open', (id) => {
        set({ 
          peer, 
          peerId: id, 
          hostId, 
          state: 'joining', 
          isHost: false,
          localPlayerName: playerName,
          error: null 
        });
        
        const conn = peer.connect(hostId, { reliable: true });
        
        conn.on('open', () => {
          set({ connection: conn, state: 'connected', missedPings: 0 });
          // Send guest name to host
          conn.send({ type: 'chat', payload: { name: playerName } });
          // Start heartbeat
          get().startHeartbeat();
          resolve();
        });
        
        conn.on('data', (data) => {
          const message = data as GameMessage;
          
          // Handle ping/pong for latency
          if (message.type === 'ping') {
            conn.send({ type: 'pong', payload: message.payload });
            return;
          }
          if (message.type === 'pong') {
            const sentTime = message.payload as number;
            const latency = Date.now() - sentTime;
            set({ latency, missedPings: 0 });
            return;
          }
          
          if (message.type === 'chat' && (message.payload as { name?: string }).name) {
            // Sanitize opponent name to prevent XSS
            const rawName = (message.payload as { name: string }).name;
            set({ opponentName: sanitizePlayerName(rawName) });
          }
          notifyListeners(message);
        });
        
        conn.on('close', () => {
          get().stopHeartbeat();
          set({ state: 'disconnected', connection: null, latency: null });
        });
        
        conn.on('error', (err) => {
          get().stopHeartbeat();
          set({ error: err.message, state: 'error' });
          reject(err);
        });
      });
      
      peer.on('error', (err) => {
        get().stopHeartbeat();
        set({ error: err.message, state: 'error' });
        reject(err);
      });
      
      peer.on('disconnected', () => {
        get().stopHeartbeat();
        set({ state: 'disconnected' });
      });
    });
  },

  reconnect: async (gameCode: string, playerName: string): Promise<void> => {
    const { peer, connection, isHost, stopHeartbeat } = get();
    
    // Clean up existing connection
    stopHeartbeat();
    connection?.close();
    peer?.destroy();
    
    // Reset state
    set({ latency: null, missedPings: 0 });
    
    // If host, re-host with same ID isn't possible with PeerJS, so just rejoin as guest
    // If guest, attempt to rejoin the host
    if (isHost) {
      // Host needs to create a new session - the guest will need to rejoin
      await get().hostGame(playerName);
      return;
    } else {
      return get().joinGame(gameCode, playerName);
    }
  },

  sendMessage: (message: GameMessage) => {
    const { connection } = get();
    if (connection) {
      connection.send(message);
    }
  },

  sendPing: () => {
    const { connection, missedPings } = get();
    if (connection && connection.open) {
      set({ lastPingTime: Date.now(), missedPings: missedPings + 1 });
      connection.send({ type: 'ping', payload: Date.now() });
      
      // Check if we've missed too many pings
      if (missedPings + 1 >= MAX_MISSED_PINGS) {
        debugLog('engine', 'Heartbeat', 'Too many missed pings, marking as disconnected');
        get().stopHeartbeat();
        set({ state: 'disconnected', latency: null });
      }
    }
  },

  startHeartbeat: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    // Send initial ping
    get().sendPing();
    
    const interval = setInterval(() => {
      get().sendPing();
    }, HEARTBEAT_INTERVAL);
    
    set({ heartbeatInterval: interval });
  },

  stopHeartbeat: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      set({ heartbeatInterval: null });
    }
  },

  disconnect: () => {
    const { peer, connection, stopHeartbeat } = get();
    stopHeartbeat();
    connection?.close();
    peer?.destroy();
    set({
      state: 'idle',
      peer: null,
      connection: null,
      peerId: null,
      hostId: null,
      isHost: false,
      opponentName: null,
      localPlayerName: null,
      error: null,
      latency: null,
      missedPings: 0,
    });
  },

  setOpponentName: (name: string) => {
    set({ opponentName: name });
  },

  setLocalPlayerName: (name: string) => {
    set({ localPlayerName: name });
  },

  onMessage: (callback: (message: GameMessage) => void) => {
    messageCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      messageCallbacks.delete(callback);
    };
  },

  reset: () => {
    const { disconnect } = get();
    disconnect();
    messageCallbacks.clear();
  },
}));
