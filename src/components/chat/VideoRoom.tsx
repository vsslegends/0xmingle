"use client";

import * as React from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCw } from "lucide-react";
import { useWebRTC, type SignalData } from "@/hooks/useWebRTC";
import type { RtcSignal } from "@/hooks/useMatchmaking";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function toSignal(data: RtcSignal): SignalData | null {
  if (data.kind === "offer" || data.kind === "answer") {
    return { kind: data.kind, sdp: String(data.sdp ?? "") };
  }
  if (data.kind === "ice") {
    return { kind: "ice", candidate: (data.candidate ?? {}) as RTCIceCandidateInit };
  }
  return null;
}

/** Lazy-loaded (Phase 5): P2P media room. Desktop PiP layout, mobile full-bleed. */
export function VideoRoom({
  mode,
  initiator,
  peer,
  rtcSend,
  onRtc,
}: {
  mode: "audio" | "video";
  initiator: boolean;
  peer: string;
  rtcSend: (data: RtcSignal) => void;
  onRtc: (cb: (data: RtcSignal) => void) => () => void;
}) {
  const rtc = useWebRTC({
    mode,
    initiator,
    enabled: true,
    sendSignal: (d) => rtcSend(d as unknown as RtcSignal),
    onSignal: (cb) => onRtc((raw) => {
      const s = toSignal(raw);
      if (s) cb(s);
    }),
  });

  const remoteRef = React.useRef<HTMLVideoElement>(null);
  const localRef = React.useRef<HTMLVideoElement>(null);
  const [speakerId, setSpeakerId] = React.useState("");

  React.useEffect(() => {
    if (remoteRef.current && rtc.remoteStream) remoteRef.current.srcObject = rtc.remoteStream;
  }, [rtc.remoteStream]);
  React.useEffect(() => {
    if (localRef.current && rtc.localStream) localRef.current.srcObject = rtc.localStream;
  }, [rtc.localStream]);
  React.useEffect(() => {
    const el = remoteRef.current as HTMLVideoElement & { setSinkId?: (id: string) => Promise<void> };
    if (el && speakerId && typeof el.setSinkId === "function") {
      el.setSinkId(speakerId).catch(() => {});
    }
  }, [speakerId]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      {/* Remote */}
      <div className="relative aspect-video w-full bg-gradient-to-b from-[#141a33] to-black">
        {mode === "video" ? (
          <video ref={remoteRef} autoPlay playsInline className="h-full w-full object-cover" aria-label={`${peer} video`} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-xl font-bold text-black">
              {peer.slice(0, 2).toUpperCase()}
            </span>
            <p className="text-sm text-slate-300">{peer}</p>
            <audio ref={remoteRef as unknown as React.Ref<HTMLAudioElement>} autoPlay />
          </div>
        )}
        {!rtc.remoteStream && rtc.state !== "denied" && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500" role="status">
            {rtc.state === "failed" ? "Connection failed." : "Waiting for peer media…"}
          </p>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-3 py-1 text-xs",
            rtc.state === "connected" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-300",
          )}
          role="status"
        >
          {rtc.state}
        </span>
        {/* Local preview */}
        {mode === "video" && (
          <video
            ref={localRef}
            autoPlay playsInline muted
            className="absolute bottom-3 right-3 h-24 w-32 rounded-xl border border-white/20 bg-black object-cover sm:h-28 sm:w-40"
            aria-label="Your preview"
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-3">
        <Button variant="secondary" size="sm" onClick={rtc.toggleMute} aria-pressed={rtc.muted} aria-label={rtc.muted ? "Unmute" : "Mute"}>
          {rtc.muted ? <MicOff size={16} /> : <Mic size={16} />}
        </Button>
        {mode === "video" && (
          <Button variant="secondary" size="sm" onClick={rtc.toggleCam} aria-pressed={rtc.camOff} aria-label={rtc.camOff ? "Camera on" : "Camera off"}>
            {rtc.camOff ? <VideoOff size={16} /> : <Video size={16} />}
          </Button>
        )}
        {rtc.state === "failed" && (
          <Button variant="secondary" size="sm" onClick={rtc.restart}>
            <RefreshCw size={16} /> Reconnect
          </Button>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <PhoneOff size={12} /> media is P2P — use Stop/Next below to leave
        </span>
      </div>

      {rtc.error && (
        <p role="alert" className="border-t border-white/10 px-4 py-3 text-sm text-amber-200">
          {rtc.error}
        </p>
      )}

      <details className="border-t border-white/10 px-4 py-2 text-sm text-slate-400">
        <summary className="cursor-pointer text-xs">Devices</summary>
        <div className="grid gap-2 py-2 sm:grid-cols-3">
          <label className="block text-xs">Microphone
            <select
              className="mt-1 w-full rounded-lg bg-black/40 p-2"
              onChange={() => {}}
              aria-label="Microphone"
            >
              {rtc.devices.audio.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || "Mic"}</option>
              ))}
            </select>
          </label>
          {mode === "video" && (
            <label className="block text-xs">Camera
              <select className="mt-1 w-full rounded-lg bg-black/40 p-2" aria-label="Camera" onChange={() => {}}>
                {rtc.devices.video.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || "Camera"}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs">Speaker
            <select
              className="mt-1 w-full rounded-lg bg-black/40 p-2"
              value={speakerId}
              onChange={(e) => setSpeakerId(e.target.value)}
              aria-label="Speaker"
            >
              <option value="">Default</option>
              {rtc.devices.speaker.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || "Speaker"}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="pb-2 text-[11px] text-slate-600">Changing mic/camera applies on next session (live switching lands with Phase 9 polish).</p>
      </details>
    </div>
  );
}
