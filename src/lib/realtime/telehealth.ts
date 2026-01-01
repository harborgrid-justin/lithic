/**
 * Telehealth Module for Lithic Enterprise Healthcare Platform
 * Video call management, screen sharing, virtual waiting room, and call quality monitoring
 */

import { getRealtimeEngine } from './engine';
import {
  VideoCall,
  CallType,
  CallStatus,
  CallParticipant,
  RecordingConsent,
  VirtualRoom,
  WaitingRoomParticipant,
  CallQuality,
  CallMetadata,
  RealtimeEvent,
} from '@/types/communication';

export class TelehealthManager {
  private engine = getRealtimeEngine();
  private activeCalls = new Map<string, VideoCall>();
  private localStream: MediaStream | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private qualityMonitorInterval: NodeJS.Timeout | null = null;

  // WebRTC configuration
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // In production, add TURN servers for better connectivity
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'password',
      // },
    ],
  };

  constructor() {
    this.setupTelehealthListeners();
  }

  /**
   * Initialize video call
   */
  public async initiateCall(params: {
    participantIds: string[];
    type?: CallType;
    metadata?: CallMetadata;
    recordingEnabled?: boolean;
    virtualRoom?: Partial<VirtualRoom>;
  }): Promise<VideoCall> {
    const {
      participantIds,
      type = CallType.VIDEO,
      metadata,
      recordingEnabled = false,
      virtualRoom,
    } = params;

    const call: Partial<VideoCall> = {
      id: this.generateCallId(),
      type,
      status: CallStatus.INITIATING,
      participants: [],
      recordingEnabled,
      recordingConsent: [],
      metadata,
      startedAt: new Date(),
    };

    if (virtualRoom) {
      call.virtualRoom = {
        id: this.generateRoomId(),
        name: virtualRoom.name || 'Virtual Room',
        capacity: virtualRoom.capacity || 10,
        waitingRoomEnabled: virtualRoom.waitingRoomEnabled || false,
        waitingRoomParticipants: [],
        requiresApproval: virtualRoom.requiresApproval || false,
        ...virtualRoom,
      };
    }

    // Get local media stream
    await this.getLocalStream(type);

    // Notify participants
    this.engine.send('initiate_call', {
      call,
      participantIds,
    });

    // Store call
    this.activeCalls.set(call.id!, call as VideoCall);

    return call as VideoCall;
  }

  /**
   * Answer incoming call
   */
  public async answerCall(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error('Call not found');
    }

    // Get local media stream
    await this.getLocalStream(call.type);

    // Update call status
    call.status = CallStatus.CONNECTING;
    this.activeCalls.set(callId, call);

    // Send answer
    this.engine.send('answer_call', {
      callId,
      timestamp: new Date(),
    });

    // Start WebRTC connection
    await this.startPeerConnection(callId);
  }

  /**
   * Reject incoming call
   */
  public async rejectCall(callId: string, reason?: string): Promise<void> {
    this.engine.send('reject_call', {
      callId,
      reason,
      timestamp: new Date(),
    });

    this.activeCalls.delete(callId);
  }

  /**
   * End active call
   */
  public async endCall(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      return;
    }

    // Stop local stream
    this.stopLocalStream();

    // Close peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    // Stop quality monitoring
    this.stopQualityMonitoring();

    // Update call
    call.status = CallStatus.ENDED;
    call.endedAt = new Date();
    call.duration = call.endedAt.getTime() - (call.startedAt?.getTime() || 0);

    // Send end call event
    this.engine.send('end_call', {
      callId,
      duration: call.duration,
      timestamp: call.endedAt,
    });

    this.activeCalls.delete(callId);
  }

  /**
   * Toggle video
   */
  public toggleVideo(callId: string): void {
    if (!this.localStream) return;

    const videoTracks = this.localStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    this.engine.send('toggle_video', {
      callId,
      enabled: videoTracks[0]?.enabled || false,
    });
  }

  /**
   * Toggle audio (mute/unmute)
   */
  public toggleAudio(callId: string): void {
    if (!this.localStream) return;

    const audioTracks = this.localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    this.engine.send('toggle_audio', {
      callId,
      enabled: audioTracks[0]?.enabled || false,
    });
  }

  /**
   * Start screen sharing
   */
  public async startScreenShare(callId: string): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        },
        audio: false,
      });

      // Replace video track in peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share stop
      videoTrack.onended = () => {
        this.stopScreenShare(callId);
      };

      this.engine.send('start_screen_share', {
        callId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Screen share error:', error);
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  public async stopScreenShare(callId: string): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];

    // Replace screen share track with camera track
    this.peerConnections.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    });

    this.engine.send('stop_screen_share', {
      callId,
      timestamp: new Date(),
    });
  }

  /**
   * Request recording consent
   */
  public async requestRecordingConsent(callId: string): Promise<void> {
    this.engine.send('request_recording_consent', {
      callId,
      timestamp: new Date(),
    });
  }

  /**
   * Provide recording consent
   */
  public async provideRecordingConsent(
    callId: string,
    consented: boolean
  ): Promise<void> {
    const consent: Partial<RecordingConsent> = {
      consented,
      consentedAt: new Date(),
    };

    this.engine.send('provide_recording_consent', {
      callId,
      consent,
    });
  }

  /**
   * Start recording
   */
  public async startRecording(callId: string): Promise<void> {
    // Verify all participants have consented
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error('Call not found');
    }

    const allConsented = call.participants.every((p) => {
      const consent = call.recordingConsent?.find((c) => c.userId === p.userId);
      return consent?.consented;
    });

    if (!allConsented) {
      throw new Error('Not all participants have consented to recording');
    }

    this.engine.send('start_recording', {
      callId,
      timestamp: new Date(),
    });
  }

  /**
   * Stop recording
   */
  public async stopRecording(callId: string): Promise<void> {
    this.engine.send('stop_recording', {
      callId,
      timestamp: new Date(),
    });
  }

  /**
   * Admit from waiting room
   */
  public async admitFromWaitingRoom(
    callId: string,
    participantId: string
  ): Promise<void> {
    this.engine.send('admit_participant', {
      callId,
      participantId,
      timestamp: new Date(),
    });
  }

  /**
   * Remove participant from call
   */
  public async removeParticipant(
    callId: string,
    participantId: string
  ): Promise<void> {
    this.engine.send('remove_participant', {
      callId,
      participantId,
      timestamp: new Date(),
    });

    // Close peer connection
    const pc = this.peerConnections.get(participantId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(participantId);
    }
  }

  /**
   * Get local media stream
   */
  private async getLocalStream(type: CallType): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === CallType.VIDEO || type === CallType.SCREEN_SHARE,
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  /**
   * Stop local stream
   */
  private stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Start WebRTC peer connection
   */
  private async startPeerConnection(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    // Create peer connections for each participant
    for (const participant of call.participants) {
      if (participant.userId === this.engine.getConnectionStatus().userId) {
        continue; // Skip self
      }

      const pc = new RTCPeerConnection(this.rtcConfig);

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.engine.send('ice_candidate', {
            callId,
            participantId: participant.userId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        // Emit event for UI to handle
        this.engine.emit('remote_track_added' as any, {
          callId,
          participantId: participant.userId,
          stream: event.streams[0],
        });
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          this.startQualityMonitoring(callId, participant.userId, pc);
        }
      };

      this.peerConnections.set(participant.userId, pc);

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.engine.send('webrtc_offer', {
        callId,
        participantId: participant.userId,
        offer,
      });
    }
  }

  /**
   * Handle WebRTC offer
   */
  private async handleOffer(
    callId: string,
    fromParticipantId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    const pc = new RTCPeerConnection(this.rtcConfig);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Set up event handlers
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.engine.send('ice_candidate', {
          callId,
          participantId: fromParticipantId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      this.engine.emit('remote_track_added' as any, {
        callId,
        participantId: fromParticipantId,
        stream: event.streams[0],
      });
    };

    // Set remote description and create answer
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.peerConnections.set(fromParticipantId, pc);

    // Send answer
    this.engine.send('webrtc_answer', {
      callId,
      participantId: fromParticipantId,
      answer,
    });
  }

  /**
   * Handle WebRTC answer
   */
  private async handleAnswer(
    fromParticipantId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const pc = this.peerConnections.get(fromParticipantId);
    if (pc) {
      await pc.setRemoteDescription(answer);
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(
    fromParticipantId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const pc = this.peerConnections.get(fromParticipantId);
    if (pc) {
      await pc.addIceCandidate(candidate);
    }
  }

  /**
   * Start quality monitoring
   */
  private startQualityMonitoring(
    callId: string,
    participantId: string,
    pc: RTCPeerConnection
  ): void {
    this.qualityMonitorInterval = setInterval(async () => {
      const stats = await pc.getStats();
      const quality = this.calculateCallQuality(stats);

      this.engine.send('call_quality_update', {
        callId,
        participantId,
        quality,
      });

      // Emit local event
      this.engine.emit(RealtimeEvent.CALL_QUALITY_UPDATE, {
        callId,
        participantId,
        quality,
      });
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop quality monitoring
   */
  private stopQualityMonitoring(): void {
    if (this.qualityMonitorInterval) {
      clearInterval(this.qualityMonitorInterval);
      this.qualityMonitorInterval = null;
    }
  }

  /**
   * Calculate call quality from WebRTC stats
   */
  private calculateCallQuality(stats: RTCStatsReport): CallQuality {
    let audioQuality = 0;
    let videoQuality = 0;
    let latency = 0;
    let packetLoss = 0;
    let jitter = 0;
    let bandwidth = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        if (report.kind === 'audio') {
          audioQuality = this.calculateQualityScore(report);
        } else if (report.kind === 'video') {
          videoQuality = this.calculateQualityScore(report);
        }

        packetLoss = report.packetsLost || 0;
        jitter = report.jitter || 0;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime || 0;
      }
    });

    return {
      audioQuality,
      videoQuality,
      connectionLatency: latency * 1000, // Convert to ms
      packetLoss,
      jitter: jitter * 1000, // Convert to ms
      bandwidth,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate quality score (0-5)
   */
  private calculateQualityScore(report: any): number {
    // Simplified quality calculation
    // In production, use more sophisticated metrics
    const packetLoss = report.packetsLost || 0;
    const totalPackets = report.packetsReceived || 1;
    const lossRate = packetLoss / totalPackets;

    if (lossRate < 0.01) return 5; // Excellent
    if (lossRate < 0.03) return 4; // Good
    if (lossRate < 0.05) return 3; // Fair
    if (lossRate < 0.10) return 2; // Poor
    return 1; // Very poor
  }

  /**
   * Get active call
   */
  public getActiveCall(callId: string): VideoCall | undefined {
    return this.activeCalls.get(callId);
  }

  /**
   * Get all active calls
   */
  public getAllActiveCalls(): VideoCall[] {
    return Array.from(this.activeCalls.values());
  }

  /**
   * Get local stream
   */
  public getLocalMediaStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Setup telehealth event listeners
   */
  private setupTelehealthListeners(): void {
    this.engine.on(RealtimeEvent.CALL_INCOMING, (data: { call: VideoCall }) => {
      this.activeCalls.set(data.call.id, data.call);
    });

    this.engine.on(RealtimeEvent.CALL_ACCEPTED, (data: { callId: string }) => {
      const call = this.activeCalls.get(data.callId);
      if (call) {
        call.status = CallStatus.CONNECTED;
        this.activeCalls.set(data.callId, call);
      }
    });

    this.engine.on(RealtimeEvent.CALL_REJECTED, (data: { callId: string }) => {
      this.activeCalls.delete(data.callId);
    });

    this.engine.on(RealtimeEvent.CALL_ENDED, (data: { callId: string }) => {
      this.activeCalls.delete(data.callId);
      this.stopLocalStream();
    });

    this.engine.on(RealtimeEvent.PARTICIPANT_JOINED_CALL, (data: { callId: string; participant: CallParticipant }) => {
      const call = this.activeCalls.get(data.callId);
      if (call) {
        call.participants.push(data.participant);
        this.activeCalls.set(data.callId, call);
      }
    });

    this.engine.on(RealtimeEvent.PARTICIPANT_LEFT_CALL, (data: { callId: string; participantId: string }) => {
      const call = this.activeCalls.get(data.callId);
      if (call) {
        call.participants = call.participants.filter(
          (p) => p.userId !== data.participantId
        );
        this.activeCalls.set(data.callId, call);
      }

      // Close peer connection
      const pc = this.peerConnections.get(data.participantId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(data.participantId);
      }
    });

    // WebRTC signaling
    this.engine.on('webrtc_offer' as any, (data: any) => {
      this.handleOffer(data.callId, data.fromParticipantId, data.offer);
    });

    this.engine.on('webrtc_answer' as any, (data: any) => {
      this.handleAnswer(data.fromParticipantId, data.answer);
    });

    this.engine.on('ice_candidate' as any, (data: any) => {
      this.handleIceCandidate(data.fromParticipantId, data.candidate);
    });
  }

  /**
   * Generate unique call ID
   */
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique room ID
   */
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.stopLocalStream();
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.activeCalls.clear();
    this.stopQualityMonitoring();
  }
}

// Singleton instance
let telehealthInstance: TelehealthManager | null = null;

/**
 * Get telehealth manager instance
 */
export function getTelehealthManager(): TelehealthManager {
  if (!telehealthInstance) {
    telehealthInstance = new TelehealthManager();
  }
  return telehealthInstance;
}

/**
 * Destroy telehealth manager instance
 */
export function destroyTelehealthManager(): void {
  if (telehealthInstance) {
    telehealthInstance.destroy();
    telehealthInstance = null;
  }
}
