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

export class CompanionHost {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private call: MediaConnection | null = null;
  public roomId: string;

  constructor(roomId?: string) {
    this.roomId = roomId || Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  public init(
    onConnected: () => void,
    onData: (data: CompanionPacket) => void,
    onStream: (stream: MediaStream) => void,
    onError: (err: Error) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const peerId = `cosmora-host-${this.roomId.toLowerCase()}`;
        this.peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          resolve(this.roomId);
        });

        this.peer.on('connection', (conn) => {
          this.connection = conn;
          conn.on('open', () => {
            onConnected();
          });
          conn.on('data', (data) => {
            onData(data as CompanionPacket);
          });
          conn.on('close', () => {
            console.log('Companion data connection closed');
          });
        });

        this.peer.on('call', (call) => {
          this.call = call;
          call.answer(); // Answer incoming mobile video stream
          call.on('stream', (remoteStream) => {
            onStream(remoteStream);
          });
        });

        this.peer.on('error', (err) => {
          console.warn('Companion Host Peer error:', err);
          onError(err);
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  public destroy() {
    if (this.connection) this.connection.close();
    if (this.call) this.call.close();
    if (this.peer) this.peer.destroy();
  }
}

export class CompanionClient {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private call: MediaConnection | null = null;

  public connect(
    roomId: string,
    stream: MediaStream | null,
    onConnected: () => void,
    onError: (err: Error) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const clientPeerId = `cosmora-client-${Math.random().toString(36).substring(2, 8)}`;
        this.peer = new Peer(clientPeerId, {
          debug: 1,
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
            resolve();
          });

          conn.on('error', (err) => {
            onError(err);
          });

          // Call host with mobile camera video stream if available
          if (stream) {
            const call = this.peer!.call(targetHostId, stream);
            this.call = call;
          }
        });

        this.peer.on('error', (err) => {
          console.warn('Companion Client Peer error:', err);
          onError(err);
          reject(err);
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  public sendPacket(packet: CompanionPacket) {
    if (this.connection && this.connection.open) {
      this.connection.send(packet);
    }
  }

  public destroy() {
    if (this.connection) this.connection.close();
    if (this.call) this.call.close();
    if (this.peer) this.peer.destroy();
  }
}
