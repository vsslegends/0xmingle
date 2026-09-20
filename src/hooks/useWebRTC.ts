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
  const [devices, setDevices] = React.useState<MediaDevices>({ audio: [], video: [], speaker: [] });
  const [error, setError] = React.useState<string | null>(null);
  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
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

  return { localStream, remoteStream, state, muted, camOff, devices, error, toggleMute, toggleCam, restart };
}
