"use client";

import * as React from "react";
import { constraintsFor, fetchIceConfig } from "@/lib/rtc-config";

export type RtcState = "idle" | "acquiring" | "connecting" | "connected" | "failed" | "denied";
export type SignalData =
  | { kind: "offer"; sdp: string }
  | { kind: "answer"; sdp: string }
  | { kind: "ice"; candidate: RTCIceCandidateInit };

export interface MediaDevices {
  audio: MediaDeviceInfo[];
  video: MediaDeviceInfo[];
  speaker: MediaDeviceInfo[];
}

/**
 * P2P audio/video. Signaling travels over the WS gateway (`rtc.signal`);
 * media never touches our servers. Full cleanup on session end.
 */
export function useWebRTC(opts: {
  mode: "audio" | "video";
  initiator: boolean;
  enabled: boolean;
  sendSignal: (data: SignalData) => void;
  onSignal: (cb: (data: SignalData) => void) => () => void;
}) {
  const { mode, initiator, enabled, sendSignal, onSignal } = opts;
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
  const [state, setState] = React.useState<RtcState>("idle");
  const [muted, setMuted] = React.useState(false);
  const [camOff, setCamOff] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const [devices, setDevices] = React.useState<MediaDevices>({ audio: [], video: [], speaker: [] });
  const [error, setError] = React.useState<string | null>(null);
  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const camTrackRef = React.useRef<MediaStreamTrack | null>(null);
  const displayTrackRef = React.useRef<MediaStreamTrack | null>(null);
  const sendRef = React.useRef(sendSignal);
  sendRef.current = sendSignal;

  // Incoming signaling
  React.useEffect(() => {
    if (!enabled) return;
    return onSignal((data) => {
      const pc = pcRef.current;
      if (!pc) return;
      void (async () => {
        try {
          if (data.kind === "offer") {
            await pc.setRemoteDescription({ type: "offer", sdp: data.sdp });
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendRef.current({ kind: "answer", sdp: answer.sdp ?? "" });
          } else if (data.kind === "answer") {
            await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
          } else if (data.kind === "ice" && data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
          }
        } catch {
          setState((s) => (s === "connected" ? s : "failed"));
        }
      })();
    });
  }, [enabled, onSignal]);

  // Setup / teardown
  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let pc: RTCPeerConnection | null = null;

    void (async () => {
      setState("acquiring");
      setError(null);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintsFor(mode));
      } catch {
        if (!cancelled) {
          setState("denied");
          setError(
            mode === "video"
              ? "Camera/mic blocked. Allow access, or continue with text chat."
              : "Microphone blocked. Allow access, or continue with text chat.",
          );
        }
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      setLocalStream(stream);

      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          audio: list.filter((d) => d.kind === "audioinput"),
          video: list.filter((d) => d.kind === "videoinput"),
          speaker: list.filter((d) => d.kind === "audiooutput"),
        });
      } catch {
        /* device labels need permission; non-fatal */
      }

      const ice = await fetchIceConfig();
      pc = new RTCPeerConnection({ iceServers: ice.iceServers });
      pcRef.current = pc;
      setState("connecting");

      stream.getTracks().forEach((t) => pc?.addTrack(t, stream));
      pc.onicecandidate = (ev) => {
        if (ev.candidate) sendRef.current({ kind: "ice", candidate: ev.candidate.toJSON() });
      };
      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        if (remote) setRemoteStream(remote);
      };
      pc.onconnectionstatechange = () => {
        const s = pc?.connectionState;
        if (s === "connected") setState("connected");
        else if (s === "failed") setState("failed");
        else if (s === "connecting") setState("connecting");
      };
      pc.onnegotiationneeded = () => {
        if (!initiator) return;
        void (async () => {
          try {
            if (!pc || pc.signalingState !== "stable") return;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendRef.current({ kind: "offer", sdp: offer.sdp ?? "" });
          } catch {
            setState("failed");
          }
        })();
      };
    })();

    return () => {
      cancelled = true;
      displayTrackRef.current?.stop();
      displayTrackRef.current = null;
      camTrackRef.current = null;
      setSharing(false);
      try {
        pc?.getSenders().forEach((s) => s.track?.stop());
        pc?.close();
      } catch {
        /* noop */
      }
      pcRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      setState("idle");
    };
  }, [enabled, initiator, mode]);

  const toggleMute = React.useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setMuted(next);
  }, [muted]);

  const toggleCam = React.useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !camOff;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    setCamOff(next);
  }, [camOff]);

  const restart = React.useCallback(() => {
    try {
      pcRef.current?.restartIce();
      setState("connecting");
    } catch {
      setState("failed");
    }
  }, []);

  /**
   * TeamViewer-style screen share (video mode only). Swaps the camera track
   * for the display track — same kind, no renegotiation needed. Stopping the
   * OS share restores the camera automatically.
   */
  const stopShare = React.useCallback(async () => {
    const pc = pcRef.current;
    displayTrackRef.current?.stop();
    displayTrackRef.current = null;
    const cam = camTrackRef.current;
    if (pc && cam && cam.readyState === "live") {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      try {
        await sender?.replaceTrack(cam);
      } catch {
        /* non-fatal */
      }
    }
    camTrackRef.current = null;
    if (streamRef.current) setLocalStream(streamRef.current);
    setSharing(false);
  }, []);

  const startShare = React.useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || mode !== "video" || !streamRef.current) return;
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const [track] = display.getVideoTracks();
      if (!track) return;
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (!sender) {
        track.stop();
        return;
      }
      if (sender.track && sender.track !== displayTrackRef.current) camTrackRef.current = sender.track;
      displayTrackRef.current = track;
      await sender.replaceTrack(track);
      setLocalStream(new MediaStream([track]));
      setSharing(true);
      track.onended = () => {
        void stopShare();
      };
    } catch {
      /* user cancelled the picker — silent */
    }
  }, [mode, stopShare]);

  return { localStream, remoteStream, state, muted, camOff, sharing, devices, error, toggleMute, toggleCam, restart, startShare, stopShare };
}
