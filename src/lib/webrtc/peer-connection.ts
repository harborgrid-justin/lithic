/**
 * WebRTC Peer Connection Manager
 * Handles peer-to-peer connections, ICE handling, and SDP negotiation
 */

import { ConnectionStatus, ConnectionQuality } from "@/types/telehealth";

export interface PeerConnectionConfig {
  iceServers: RTCIceServer[];
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  onDataChannel?: (channel: RTCDataChannel) => void;
}

export class PeerConnectionManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private config: PeerConnectionConfig;
  private stats: Map<string, RTCStatsReport> = new Map();
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(config: PeerConnectionConfig) {
    this.config = config;
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  async initialize(): Promise<void> {
    const configuration: RTCConfiguration = {
      iceServers:
        this.config.iceServers.length > 0
          ? this.config.iceServers
          : this.getDefaultIceServers(),
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Set up event listeners
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.config.onIceCandidate) {
        this.config.onIceCandidate(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      this.remoteStream.addTrack(event.track);

      if (this.config.onTrack) {
        this.config.onTrack(event);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.config.onConnectionStateChange) {
        this.config.onConnectionStateChange(
          this.peerConnection.connectionState,
        );
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection && this.config.onIceConnectionStateChange) {
        this.config.onIceConnectionStateChange(
          this.peerConnection.iceConnectionState,
        );
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel);

      if (this.config.onDataChannel) {
        this.config.onDataChannel(event.channel);
      }
    };
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(
    description: RTCSessionDescriptionInit,
  ): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description),
    );
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // ============================================================================
  // Media Stream Management
  // ============================================================================

  addLocalStream(stream: MediaStream): void {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    this.localStream = stream;

    stream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, stream);
    });
  }

  removeLocalStream(): void {
    if (!this.peerConnection || !this.localStream) {
      return;
    }

    const senders = this.peerConnection.getSenders();
    senders.forEach((sender) => {
      if (sender.track) {
        this.peerConnection!.removeTrack(sender);
      }
    });

    this.localStream = null;
  }

  replaceVideoTrack(newTrack: MediaStreamTrack): void {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    const senders = this.peerConnection.getSenders();
    const videoSender = senders.find(
      (sender) => sender.track?.kind === "video",
    );

    if (videoSender) {
      videoSender.replaceTrack(newTrack);
    }
  }

  replaceAudioTrack(newTrack: MediaStreamTrack): void {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    const senders = this.peerConnection.getSenders();
    const audioSender = senders.find(
      (sender) => sender.track?.kind === "audio",
    );

    if (audioSender) {
      audioSender.replaceTrack(newTrack);
    }
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // ============================================================================
  // Data Channel Management
  // ============================================================================

  createDataChannel(
    label: string,
    options?: RTCDataChannelInit,
  ): RTCDataChannel {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    this.dataChannel = this.peerConnection.createDataChannel(label, options);
    this.setupDataChannel(this.dataChannel);
    return this.dataChannel;
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log("Data channel opened:", channel.label);
    };

    channel.onclose = () => {
      console.log("Data channel closed:", channel.label);
    };

    channel.onerror = (error) => {
      console.error("Data channel error:", error);
    };
  }

  sendData(data: string | Blob | ArrayBuffer | ArrayBufferView): void {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      throw new Error("Data channel not open");
    }

    this.dataChannel.send(data);
  }

  // ============================================================================
  // Statistics and Quality Monitoring
  // ============================================================================

  async getConnectionStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) {
      return null;
    }

    return await this.peerConnection.getStats();
  }

  startStatsMonitoring(interval: number = 1000): void {
    this.statsInterval = setInterval(async () => {
      const stats = await this.getConnectionStats();
      if (stats) {
        this.stats.set(Date.now().toString(), stats);
      }
    }, interval);
  }

  stopStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  async getConnectionQuality(): Promise<ConnectionQuality> {
    const stats = await this.getConnectionStats();
    if (!stats) {
      return "UNKNOWN";
    }

    let packetLoss = 0;
    let jitter = 0;
    let rtt = 0;

    stats.forEach((report) => {
      if (report.type === "inbound-rtp") {
        const packetsLost = report.packetsLost || 0;
        const packetsReceived = report.packetsReceived || 1;
        packetLoss = (packetsLost / (packetsLost + packetsReceived)) * 100;
        jitter = report.jitter || 0;
      }

      if (report.type === "candidate-pair" && report.state === "succeeded") {
        rtt = report.currentRoundTripTime || 0;
      }
    });

    // Determine quality based on metrics
    if (packetLoss < 1 && jitter < 30 && rtt < 100) {
      return "EXCELLENT";
    } else if (packetLoss < 3 && jitter < 50 && rtt < 200) {
      return "GOOD";
    } else if (packetLoss < 5 && jitter < 100 && rtt < 300) {
      return "FAIR";
    } else {
      return "POOR";
    }
  }

  async getBandwidthEstimate(): Promise<{ upload: number; download: number }> {
    const stats = await this.getConnectionStats();
    if (!stats) {
      return { upload: 0, download: 0 };
    }

    let upload = 0;
    let download = 0;

    stats.forEach((report) => {
      if (report.type === "outbound-rtp") {
        upload += report.bytesSent || 0;
      }
      if (report.type === "inbound-rtp") {
        download += report.bytesReceived || 0;
      }
    });

    return { upload, download };
  }

  // ============================================================================
  // Connection State
  // ============================================================================

  getConnectionState(): ConnectionStatus {
    if (!this.peerConnection) {
      return "DISCONNECTED";
    }

    const state = this.peerConnection.connectionState;

    switch (state) {
      case "new":
      case "connecting":
        return "CONNECTING";
      case "connected":
        return "CONNECTED";
      case "disconnected":
        return "RECONNECTING";
      case "failed":
        return "FAILED";
      case "closed":
        return "DISCONNECTED";
      default:
        return "DISCONNECTED";
    }
  }

  getIceConnectionState(): RTCIceConnectionState | null {
    if (!this.peerConnection) {
      return null;
    }
    return this.peerConnection.iceConnectionState;
  }

  getSignalingState(): RTCSignalingState | null {
    if (!this.peerConnection) {
      return null;
    }
    return this.peerConnection.signalingState;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async close(): Promise<void> {
    this.stopStatsMonitoring();

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.stats.clear();
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private getDefaultIceServers(): RTCIceServer[] {
    return [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
      // In production, add TURN servers for NAT traversal
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'credential',
      // },
    ];
  }

  isConnected(): boolean {
    return this.peerConnection?.connectionState === "connected";
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }
}
