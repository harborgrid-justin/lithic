/**
 * WebRTC Client for Video Conferencing
 * Handles WebRTC peer connections, media streams, and ICE candidates
 */

import { PeerConnectionManager } from "@/lib/webrtc/peer-connection";

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  signalingUrl: string;
  roomId: string;
  userId: string;
  userName: string;
}

export interface MediaConstraints {
  audio: boolean | MediaTrackConstraints;
  video: boolean | MediaTrackConstraints;
}

export interface ScreenShareOptions {
  audio?: boolean;
  video?: boolean | MediaTrackConstraints;
}

export class WebRTCClient {
  private config: WebRTCConfig;
  private peerConnections: Map<string, PeerConnectionManager> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private signalingSocket: WebSocket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  /**
   * Initialize WebRTC client
   */
  async initialize(): Promise<void> {
    await this.connectSignaling();
  }

  /**
   * Connect to signaling server
   */
  private async connectSignaling(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.signalingSocket = new WebSocket(this.config.signalingUrl);

      this.signalingSocket.onopen = () => {
        console.log("Signaling connection established");
        this.sendSignalingMessage({
          type: "join",
          roomId: this.config.roomId,
          userId: this.config.userId,
          userName: this.config.userName,
        });
        resolve();
      };

      this.signalingSocket.onerror = (error) => {
        console.error("Signaling connection error:", error);
        reject(error);
      };

      this.signalingSocket.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };

      this.signalingSocket.onclose = () => {
        console.log("Signaling connection closed");
        this.emit("signaling:disconnected");
      };
    });
  }

  /**
   * Handle signaling messages
   */
  private async handleSignalingMessage(message: any): Promise<void> {
    const { type, from, data } = message;

    switch (type) {
      case "user-joined":
        await this.handleUserJoined(from);
        break;

      case "user-left":
        await this.handleUserLeft(from);
        break;

      case "offer":
        await this.handleOffer(from, data);
        break;

      case "answer":
        await this.handleAnswer(from, data);
        break;

      case "ice-candidate":
        await this.handleIceCandidate(from, data);
        break;

      case "room-full":
        this.emit("room:full");
        break;

      default:
        console.warn("Unknown signaling message type:", type);
    }
  }

  /**
   * Handle user joined
   */
  private async handleUserJoined(userId: string): Promise<void> {
    console.log("User joined:", userId);

    // Create peer connection for new user
    const peerConnection = await this.createPeerConnection(userId);

    // Create and send offer
    const offer = await peerConnection.createOffer();
    this.sendSignalingMessage({
      type: "offer",
      to: userId,
      data: offer,
    });

    this.emit("user:joined", { userId });
  }

  /**
   * Handle user left
   */
  private async handleUserLeft(userId: string): Promise<void> {
    console.log("User left:", userId);

    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.close();
      this.peerConnections.delete(userId);
    }

    this.emit("user:left", { userId });
  }

  /**
   * Handle offer
   */
  private async handleOffer(
    userId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    const peerConnection = await this.createPeerConnection(userId);

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();

    this.sendSignalingMessage({
      type: "answer",
      to: userId,
      data: answer,
    });
  }

  /**
   * Handle answer
   */
  private async handleAnswer(
    userId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(
    userId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }

  /**
   * Create peer connection for user
   */
  private async createPeerConnection(
    userId: string
  ): Promise<PeerConnectionManager> {
    if (this.peerConnections.has(userId)) {
      return this.peerConnections.get(userId)!;
    }

    const peerConnection = new PeerConnectionManager({
      iceServers: this.config.iceServers,
      onIceCandidate: (candidate) => {
        this.sendSignalingMessage({
          type: "ice-candidate",
          to: userId,
          data: candidate,
        });
      },
      onTrack: (event) => {
        this.emit("track:added", { userId, track: event.track });
      },
      onConnectionStateChange: (state) => {
        this.emit("connection:state-change", { userId, state });
      },
    });

    await peerConnection.initialize();

    // Add local stream if available
    if (this.localStream) {
      peerConnection.addLocalStream(this.localStream);
    }

    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
  }

  /**
   * Start local media stream
   */
  async startLocalStream(
    constraints: MediaConstraints = { audio: true, video: true }
  ): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Add stream to all existing peer connections
      this.peerConnections.forEach((peerConnection) => {
        if (this.localStream) {
          peerConnection.addLocalStream(this.localStream);
        }
      });

      this.emit("stream:local", { stream: this.localStream });
      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }

  /**
   * Stop local media stream
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());

      // Remove stream from all peer connections
      this.peerConnections.forEach((peerConnection) => {
        peerConnection.removeLocalStream();
      });

      this.localStream = null;
      this.emit("stream:local-stopped");
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(options: ScreenShareOptions = {}): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: options.video || true,
        audio: options.audio || false,
      });

      // Replace video track in all peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0];
      if (videoTrack) {
        this.peerConnections.forEach((peerConnection) => {
          peerConnection.replaceVideoTrack(videoTrack);
        });

        // Handle screen share stop
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }

      this.emit("screen:started", { stream: this.screenStream });
      this.sendSignalingMessage({
        type: "screen-share-started",
        userId: this.config.userId,
      });

      return this.screenStream;
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;

      // Restore original video track
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
          this.peerConnections.forEach((peerConnection) => {
            peerConnection.replaceVideoTrack(videoTrack);
          });
        }
      }

      this.emit("screen:stopped");
      this.sendSignalingMessage({
        type: "screen-share-stopped",
        userId: this.config.userId,
      });
    }
  }

  /**
   * Toggle audio
   */
  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled !== undefined ? enabled : !audioTrack.enabled;
      this.emit("audio:toggled", { enabled: audioTrack.enabled });
      return audioTrack.enabled;
    }

    return false;
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled !== undefined ? enabled : !videoTrack.enabled;
      this.emit("video:toggled", { enabled: videoTrack.enabled });
      return videoTrack.enabled;
    }

    return false;
  }

  /**
   * Switch camera (front/back on mobile)
   */
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const constraints = videoTrack.getConstraints();
    const facingMode =
      constraints.facingMode === "user" ? "environment" : "user";

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace track in peer connections
      this.peerConnections.forEach((peerConnection) => {
        peerConnection.replaceVideoTrack(newVideoTrack);
      });

      // Stop old track and replace in local stream
      videoTrack.stop();
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);

      this.emit("camera:switched");
    } catch (error) {
      console.error("Error switching camera:", error);
      throw error;
    }
  }

  /**
   * Get available devices
   */
  async getDevices(): Promise<{
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }> {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return {
      audioInputs: devices.filter((d) => d.kind === "audioinput"),
      audioOutputs: devices.filter((d) => d.kind === "audiooutput"),
      videoInputs: devices.filter((d) => d.kind === "videoinput"),
    };
  }

  /**
   * Switch audio input device
   */
  async switchAudioInput(deviceId: string): Promise<void> {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
      video: false,
    });

    const newAudioTrack = newStream.getAudioTracks()[0];

    // Replace track in peer connections
    this.peerConnections.forEach((peerConnection) => {
      peerConnection.replaceAudioTrack(newAudioTrack);
    });

    // Stop old track and replace in local stream
    audioTrack.stop();
    this.localStream.removeTrack(audioTrack);
    this.localStream.addTrack(newAudioTrack);

    this.emit("audio-input:switched");
  }

  /**
   * Switch video input device
   */
  async switchVideoInput(deviceId: string): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });

    const newVideoTrack = newStream.getVideoTracks()[0];

    // Replace track in peer connections
    this.peerConnections.forEach((peerConnection) => {
      peerConnection.replaceVideoTrack(newVideoTrack);
    });

    // Stop old track and replace in local stream
    videoTrack.stop();
    this.localStream.removeTrack(videoTrack);
    this.localStream.addTrack(newVideoTrack);

    this.emit("video-input:switched");
  }

  /**
   * Get connection statistics
   */
  async getStats(): Promise<Map<string, RTCStatsReport | null>> {
    const statsMap = new Map<string, RTCStatsReport | null>();

    for (const [userId, peerConnection] of this.peerConnections) {
      const stats = await peerConnection.getConnectionStats();
      statsMap.set(userId, stats);
    }

    return statsMap;
  }

  /**
   * Send signaling message
   */
  private sendSignalingMessage(message: any): void {
    if (this.signalingSocket?.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify(message));
    }
  }

  /**
   * Event emitter
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Leave room and cleanup
   */
  async leave(): Promise<void> {
    this.sendSignalingMessage({
      type: "leave",
      userId: this.config.userId,
    });

    this.stopLocalStream();
    await this.stopScreenShare();

    // Close all peer connections
    for (const [userId, peerConnection] of this.peerConnections) {
      await peerConnection.close();
    }
    this.peerConnections.clear();

    // Close signaling connection
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }

    this.emit("left");
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? audioTrack.enabled : false;
  }

  /**
   * Check if video is enabled
   */
  isVideoEnabled(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    return videoTrack ? videoTrack.enabled : false;
  }

  /**
   * Check if screen sharing
   */
  isScreenSharing(): boolean {
    return this.screenStream !== null;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get screen stream
   */
  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }
}
