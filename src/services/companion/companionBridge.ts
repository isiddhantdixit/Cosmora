import Peer, { DataConnection, MediaConnection } from 'peerjs';

export interface CompanionMotionPacket {
  type: 'motion';
  heading: number; // 0..360
  pitch: number;   // -90..90
  roll: number;    // -180..180
  timestamp: number;
}

export interface CompanionStatusPacket {
  type: 'status';
  isCameraActive: boolean;
  deviceName?: string;
}

export type CompanionPacket = CompanionMotionPacket | CompanionStatusPacket;

export function generatePairingCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export class CompanionHost {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private call: MediaConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  public roomId: string;

  constructor(roomId?: string) {
    this.roomId = roomId || generatePairingCode();
    // Setup local BroadcastChannel for zero-latency local/multi-window synchronization
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(`cosmora_pair_${this.roomId.toLowerCase()}`);
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }
  }

  public init(
    onConnected: () => void,
    onData: (data: CompanionPacket) => void,
    onStream: (stream: MediaStream) => void,
    onError: (err: Error) => void
  ): Promise<string> {
    // Listen on BroadcastChannel for instant local testing
    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'connected') {
          onConnected();
        } else if (event.data?.type === 'motion' || event.data?.type === 'status') {
          onData(event.data);
        }
      };
    }

    return new Promise((resolve) => {
      // Resolve immediately so UI never blocks on network handshakes!
      resolve(this.roomId);

      try {
        const peerId = `cosmora-host-${this.roomId.toLowerCase()}`;
        this.peer = new Peer(peerId, {
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('connection', (conn) => {
          this.connection = conn;
          conn.on('open', () => {
            onConnected();
          });
          conn.on('data', (data) => {
            onData(data as CompanionPacket);
          });
        });

        this.peer.on('call', (call) => {
          this.call = call;
          call.answer();
          call.on('stream', (remoteStream) => {
            onStream(remoteStream);
          });
        });

        this.peer.on('error', (err) => {
          console.warn('Companion host fallback active:', err.message);
          onError(err);
        });
      } catch (err: any) {
        console.warn('Peer host exception, using local sync channel:', err);
      }
    });
  }

  public destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.connection) this.connection.close();
    if (this.call) this.call.close();
    if (this.peer) this.peer.destroy();
  }
}

export class CompanionClient {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private call: MediaConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  public roomId: string = '';

  public connect(
    roomId: string,
    stream: MediaStream | null,
    onConnected: () => void,
    onError: (err: Error) => void
  ): Promise<void> {
    this.roomId = roomId;

    // Connect BroadcastChannel immediately
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(`cosmora_pair_${roomId.toLowerCase()}`);
        this.broadcastChannel.postMessage({ type: 'connected' });
        onConnected();
      } catch (e) {
        console.warn('BroadcastChannel error', e);
      }
    }

    return new Promise((resolve) => {
      resolve();

      try {
        const clientPeerId = `cosmora-client-${Math.random().toString(36).substring(2, 8)}`;
        this.peer = new Peer(clientPeerId, {
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', () => {
          const targetHostId = `cosmora-host-${roomId.toLowerCase()}`;
          const conn = this.peer!.connect(targetHostId);
          this.connection = conn;

          conn.on('open', () => {
            onConnected();
          });

          if (stream) {
            const call = this.peer!.call(targetHostId, stream);
            this.call = call;
          }
        });

        this.peer.on('error', (err) => {
          console.warn('Companion client peer notice:', err.message);
          onError(err);
        });
      } catch (err: any) {
        console.warn('Peer client fallback mode:', err);
      }
    });
  }

  public sendPacket(packet: CompanionPacket) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(packet);
    }
    if (this.connection && this.connection.open) {
      this.connection.send(packet);
    }
  }

  public destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.connection) this.connection.close();
    if (this.call) this.call.close();
    if (this.peer) this.peer.destroy();
  }
}
