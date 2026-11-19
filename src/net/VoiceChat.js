// Real-time WebRTC mesh voice chat with proximity volume attenuation and local mic level detection.

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class VoiceChat {
  constructor(opts = {}) {
    this.sendSignal = opts.sendSignal || (() => {});
    this.onStatus = opts.onStatus || (() => {});
    this.selfId = null;
    this.muted = true;
    this.proximityEnabled = true;
    this.speaking = false;
    this.micState = 'muted'; // 'muted' | 'active' | 'denied' | 'unsupported'
    this.peers = new Map();

    this.localStream = null;
    this._audioCtx = null;
    this._analyser = null;
    this._timeData = null;
    this._lastSpeakMs = 0;
    this._disposed = false;
  }

  setSelfId(id) {
    this.selfId = id;
    for (const [peerId, entry] of this.peers.entries()) {
      entry.polite = Boolean(this.selfId && this.selfId > peerId);
    }
  }

  _emitStatus() {
    this.onStatus({
      muted: this.muted,
      speaking: this.speaking,
      proximityEnabled: this.proximityEnabled,
      micState: this.micState,
      connectedPeers: [...this.peers.values()].filter((p) => p.pc.connectionState === 'connected').length,
    });
  }

  setProximityEnabled(enabled) {
    this.proximityEnabled = Boolean(enabled);
    this._emitStatus();
  }

  async setMuted(muted) {
    this.muted = Boolean(muted);
    if (!this.muted && !this.localStream) {
      await this._acquireMic();
    }
    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = !this.muted;
      }
      if (!this.muted) {
        this.micState = 'active';
      } else {
        this.micState = 'muted';
        this.speaking = false;
      }
    } else if (this.muted && this.micState !== 'denied' && this.micState !== 'unsupported') {
      this.micState = 'muted';
      this.speaking = false;
    }
    this._emitStatus();
    return { muted: this.muted, micState: this.micState };
  }

  async _acquireMic() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.micState = 'unsupported';
      this.muted = true;
      this._emitStatus();
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      if (this._disposed) {
        for (const t of stream.getTracks()) t.stop();
        return null;
      }
      this.localStream = stream;
      this.micState = this.muted ? 'muted' : 'active';

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this._audioCtx = new AudioCtx();
        const src = this._audioCtx.createMediaStreamSource(stream);
        this._analyser = this._audioCtx.createAnalyser();
        this._analyser.fftSize = 512;
        src.connect(this._analyser);
        this._timeData = new Uint8Array(this._analyser.fftSize);
      }

      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !this.muted;
        for (const entry of this.peers.values()) {
          await this._attachLocalTrack(entry, track, stream);
        }
      }
      this._emitStatus();
      return stream;
    } catch {
      this.micState = 'denied';
      this.muted = true;
      this._emitStatus();
      return null;
    }
  }

  async _attachLocalTrack(entry, track, stream) {
    const pc = entry.pc;
    const senders = pc.getSenders();
    const audioSender = senders.find((s) => s.track?.kind === 'audio');
    if (audioSender) {
      await audioSender.replaceTrack(track);
      return;
    }
    const audioTransceiver = pc.getTransceivers().find(
      (t) => t.receiver?.track?.kind === 'audio',
    );
    if (audioTransceiver) {
      audioTransceiver.direction = 'sendrecv';
      await audioTransceiver.sender.replaceTrack(track);
      await this._negotiate(entry);
    } else {
      pc.addTrack(track, stream);
    }
  }

  addPeer(peerId) {
    if (!peerId || peerId === this.selfId || this.peers.has(peerId) || this._disposed) return;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioEl.playsInline = true;
    audioEl.style.display = 'none';
    document.body.appendChild(audioEl);

    const entry = {
      id: peerId,
      pc,
      audioEl,
      pendingCandidates: [],
      makingOffer: false,
      ignoreOffer: false,
      polite: Boolean(this.selfId && this.selfId > peerId),
    };
    this.peers.set(peerId, entry);

    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        pc.addTrack(track, this.localStream);
      }
    } else {
      try {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      } catch {
        // Fallback if transceiver creation fails
      }
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate && !this._disposed) {
        this.sendSignal(peerId, 'rtc_ice', ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate);
      }
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams?.[0] || new MediaStream([ev.track]);
      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
        audioEl.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      this._emitStatus();
    };

    pc.onnegotiationneeded = () => {
      if (!entry.polite || this.localStream) {
        this._negotiate(entry);
      }
    };

    if (!entry.polite) {
      this._negotiate(entry);
    }
  }

  async _negotiate(entry) {
    if (entry.makingOffer || this._disposed) return;
    try {
      entry.makingOffer = true;
      await entry.pc.setLocalDescription();
      if (entry.pc.localDescription) {
        this.sendSignal(entry.id, 'rtc_offer', entry.pc.localDescription);
      }
    } catch {
      // Ignore transient signaling races
    } finally {
      entry.makingOffer = false;
    }
  }

  async handleSignal(fromId, type, payload) {
    if (!fromId || this._disposed) return;
    if (!this.peers.has(fromId)) {
      this.addPeer(fromId);
    }
    const entry = this.peers.get(fromId);
    if (!entry) return;
    const pc = entry.pc;

    try {
      if (type === 'rtc_offer') {
        const offerCollision = entry.makingOffer || pc.signalingState !== 'stable';
        entry.ignoreOffer = !entry.polite && offerCollision;
        if (entry.ignoreOffer) return;

        await pc.setRemoteDescription(new RTCSessionDescription(payload));
        if (this.localStream) {
          const track = this.localStream.getAudioTracks()[0];
          if (track) {
            const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
            if (!sender) {
              const t = pc.getTransceivers().find((tr) => tr.receiver?.track?.kind === 'audio');
              if (t) {
                t.direction = 'sendrecv';
                await t.sender.replaceTrack(track);
              } else {
                pc.addTrack(track, this.localStream);
              }
            }
          }
        }
        await pc.setLocalDescription();
        if (pc.localDescription) {
          this.sendSignal(fromId, 'rtc_answer', pc.localDescription);
        }
        await this._flushCandidates(entry);
      } else if (type === 'rtc_answer') {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          await this._flushCandidates(entry);
        }
      } else if (type === 'rtc_ice' && payload) {
        if (!pc.remoteDescription) {
          entry.pendingCandidates.push(payload);
        } else {
          await pc.addIceCandidate(new RTCIceCandidate(payload)).catch(() => {});
        }
      }
    } catch {
      // Recover gracefully from stale SDP state
    }
  }

  async _flushCandidates(entry) {
    while (entry.pendingCandidates.length) {
      const c = entry.pendingCandidates.shift();
      await entry.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }
  }

  removePeer(peerId) {
    const entry = this.peers.get(peerId);
    if (!entry) return;
    try {
      entry.pc.onicecandidate = null;
      entry.pc.ontrack = null;
      entry.pc.onnegotiationneeded = null;
      entry.pc.close();
    } catch {
      // ignore close errors
    }
    if (entry.audioEl) {
      entry.audioEl.srcObject = null;
      entry.audioEl.remove();
    }
    this.peers.delete(peerId);
    this._emitStatus();
  }

  updateSpatial(selfPos, peerPosMap) {
    if (this._disposed) return;

    // Poll local mic level
    let nowSpeaking = false;
    if (!this.muted && this._analyser && this._timeData) {
      this._analyser.getByteTimeDomainData(this._timeData);
      let sumSq = 0;
      for (let i = 0; i < this._timeData.length; i++) {
        const v = (this._timeData[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / this._timeData.length);
      const now = performance.now();
      if (rms > 0.025) {
        this._lastSpeakMs = now;
        nowSpeaking = true;
      } else if (now - this._lastSpeakMs < 280) {
        nowSpeaking = true;
      }
    }
    if (nowSpeaking !== this.speaking) {
      this.speaking = nowSpeaking;
      this._emitStatus();
    }

    // Attenuate peer audio by world distance when proximity mode is on
    if (!selfPos) return;
    for (const [peerId, entry] of this.peers.entries()) {
      const pPos = peerPosMap?.get(peerId);
      if (!this.proximityEnabled || !pPos) {
        entry.audioEl.volume = 1;
      } else {
        const d = Math.hypot(selfPos.x - pPos.x, selfPos.z - pPos.z);
        if (d <= 10) entry.audioEl.volume = 1;
        else if (d >= 95) entry.audioEl.volume = 0.04;
        else entry.audioEl.volume = Math.max(0.04, 1 - ((d - 10) / 85) * 0.96);
      }
    }
  }

  dispose() {
    this._disposed = true;
    for (const peerId of [...this.peers.keys()]) {
      this.removePeer(peerId);
    }
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) track.stop();
      this.localStream = null;
    }
    if (this._audioCtx) {
      this._audioCtx.close().catch(() => {});
      this._audioCtx = null;
    }
  }
}
