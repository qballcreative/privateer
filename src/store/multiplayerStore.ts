/**
 * Multiplayer Store — Peer-to-Peer Game Networking
 *
 * Manages WebRTC connections via PeerJS for real-time multiplayer games.
 * Handles hosting, joining, reconnection, heartbeat monitoring, and
 * message passing between players.
 *
 * Architecture:
 *  - Host creates a PeerJS peer with a short code as the peer ID
 *  - Guest connects to the host using that short code
 *  - Both sides exchange game state updates via the DataConnection
 *  - A heartbeat (ping/pong every 3s) detects disconnections
 *
 * This store is NOT persisted — multiplayer sessions are ephemeral.
 */

import { create } from 'zustand';
import Peer, { DataConnection } from 'peerjs';
import { generateSecureShortCode, sanitizePlayerName } from '@/lib/security';
import { debugLog } from '@/lib/debugLog';
import { useRemoteConfigStore } from './remoteConfigStore';

/** Connection lifecycle states. */
export type MultiplayerState = 'idle' | 'hosting' | 'joining' | 'connected' | 'disconnected' | 'error';

/** Message types exchanged between peers over the DataConnection. */
export interface GameMessage {
  type: 'game-state' | 'action' | 'chat' | 'ready' | 'start' | 'next-round' | 'ping' | 'pong' | 'rejoin-sync';
  payload: unknown;
}

interface MultiplayerStore {
  // ─── Connection State ───────────────────────────────────────────
  state: MultiplayerState;
  /** The local PeerJS peer instance. */
  peer: Peer | null;
  /** The active data connection to the remote player. */
  connection: DataConnection | null;
  /** This peer's ID (the short code for hosts). */
  peerId: string | null;
  /** The host's peer ID (used by guests to connect). */
  hostId: string | null;
  /** Whether this client is the game host. */
  isHost: boolean;
  /** Display name of the remote opponent (sanitized). */
  opponentName: string | null;
  /** Display name of the local player for this session. */
  localPlayerName: string | null;
  /** Human-readable error message if connection failed. */
  error: string | null;
  /** Current round-trip latency in milliseconds (null if unknown). */
  latency: number | null;
  /** Timestamp of the last ping sent (for latency calculation). */
  lastPingTime: number | null;
  /** Interval handle for the heartbeat timer. */
  heartbeatInterval: ReturnType<typeof setInterval> | null;
  /** How many consecutive pings have gone unanswered. */
  missedPings: number;
  
  // ─── Actions ────────────────────────────────────────────────────
  /** Create a new game room and return the short code for the guest. */
  hostGame: (playerName: string) => Promise<string>;
  /** Join an existing game room using the host's short code. */
  joinGame: (hostId: string, playerName: string) => Promise<void>;
  /** Attempt to reconnect after a disconnection. */
  reconnect: (gameCode: string, playerName: string) => Promise<void>;
  /** Send a typed message to the remote peer. */
  sendMessage: (message: GameMessage) => void;
  /** Notify the opponent of forfeit and disconnect. */
  sendForfeit: () => void;
  /** Send a ping to measure latency. */
  sendPing: () => void;
  /** Start the periodic heartbeat ping/pong cycle. */
  startHeartbeat: () => void;
  /** Stop the heartbeat timer. */
  stopHeartbeat: () => void;
  /** Cleanly disconnect and destroy the peer. */
  disconnect: () => void;
  setOpponentName: (name: string) => void;
  setLocalPlayerName: (name: string) => void;
  /** Register a callback for incoming messages; returns an unsubscribe function. */
  onMessage: (callback: (message: GameMessage) => void) => () => void;
  /** Full reset — disconnect and clear all message listeners. */
  reset: () => void;
}

/** Set of active message listeners (external to the store to avoid serialization). */
const messageCallbacks: Set<(message: GameMessage) => void> = new Set();

/** Broadcast an incoming message to all registered listeners. */
const notifyListeners = (message: GameMessage) => {
  messageCallbacks.forEach((callback) => callback(message));
};

/** How often to send heartbeat pings (milliseconds). */
const HEARTBEAT_INTERVAL = 3000;
/** How many consecutive missed pings before declaring disconnection. */
const MAX_MISSED_PINGS = 3;

// Use cryptographically secure code generation for game room IDs
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
      // Get ICE/TURN servers from remote config for NAT traversal
      const iceServers = useRemoteConfigStore.getState().config.iceServers;
      
      const peer = new Peer(shortCode, {
        config: { iceServers },
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
        
        /**
         * Handler for incoming connections. Supports reconnection by
         * closing any existing connection before accepting the new one.
         */
        const setupConnectionHandlers = (conn: DataConnection) => {
          conn.on('open', () => {
            // Close previous connection if this is a reconnection
            const { connection: existingConn, stopHeartbeat } = get();
            if (existingConn && existingConn !== conn) {
              stopHeartbeat();
              existingConn.close();
            }
            
            set({ connection: conn, state: 'connected', missedPings: 0 });
            // Exchange player names on connection
            conn.send({ type: 'chat', payload: { name: playerName } });
            get().startHeartbeat();
          });
          
          conn.on('data', (data) => {
            const message = data as GameMessage;
            
            // Handle heartbeat ping/pong (don't propagate to game logic)
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
            
            // Extract opponent name from chat messages
            if (message.type === 'chat' && (message.payload as { name?: string }).name) {
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
        // If the generated short code collides, retry with a new one
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
      const iceServers = useRemoteConfigStore.getState().config.iceServers;
      
      // Guest creates an anonymous peer (auto-generated ID)
      const peer = new Peer({
        config: { iceServers },
        debug: 1,
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
        
        // Connect to the host's peer ID
        const conn = peer.connect(hostId, { reliable: true });
        
        conn.on('open', () => {
          set({ connection: conn, state: 'connected', missedPings: 0 });
          conn.send({ type: 'chat', payload: { name: playerName } });
          get().startHeartbeat();
          resolve();
        });
        
        conn.on('data', (data) => {
          const message = data as GameMessage;
          
          // Handle heartbeat ping/pong
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

  /**
   * Attempt to reconnect after a dropped connection.
   * Host re-creates their session; guest re-joins the host.
   */
  reconnect: async (gameCode: string, playerName: string): Promise<void> => {
    const { peer, connection, isHost, stopHeartbeat } = get();
    
    // Clean up existing connection
    stopHeartbeat();
    connection?.close();
    peer?.destroy();
    set({ latency: null, missedPings: 0 });
    
    if (isHost) {
      // Host creates a new session — guest will need the new code
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

  /** Notify opponent of forfeit, then disconnect after a brief delay. */
  sendForfeit: () => {
    const { connection } = get();
    if (connection && connection.open) {
      connection.send({ type: 'action', payload: { action: 'forfeit' } });
    }
    // Small delay to let the forfeit message send before tearing down
    setTimeout(() => get().disconnect(), 100);
  },

  /** Send a ping and increment the missed ping counter. */
  sendPing: () => {
    const { connection, missedPings } = get();
    if (connection && connection.open) {
      set({ lastPingTime: Date.now(), missedPings: missedPings + 1 });
      connection.send({ type: 'ping', payload: Date.now() });
      
      // If too many pings have gone unanswered, declare disconnection
      if (missedPings + 1 >= MAX_MISSED_PINGS) {
        debugLog('engine', 'Heartbeat', 'Too many missed pings, marking as disconnected');
        get().stopHeartbeat();
        set({ state: 'disconnected', latency: null });
      }
    }
  },

  /** Start periodic heartbeat pings to detect connection loss. */
  startHeartbeat: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    // Send initial ping immediately
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

  /** Cleanly tear down the connection, destroy the peer, and reset all state. */
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
