/** ICE server config. TURN credentials never touch the client bundle — fetched from /api/turn. */

export interface IceConfig {
  iceServers: RTCIceServer[];
  hasTurn: boolean;
}

const STUN = [{ urls: "stun:stun.lacity.pro:3478" }, { urls: "stun:stun1.l.google.com:19302" }];

export function stunOnly(): IceConfig {
  return { iceServers: [...STUN], hasTurn: false };
}

export async function fetchIceConfig(): Promise<IceConfig> {
  try {
    const res = await fetch("/api/turn", { cache: "no-store" });
    if (!res.ok) return stunOnly();
    const json = (await res.json()) as { iceServers?: RTCIceServer[] };
    if (!Array.isArray(json.iceServers) || json.iceServers.length === 0) return stunOnly();
    return { iceServers: json.iceServers, hasTurn: true };
  } catch {
    return stunOnly();
  }
}

/** Media constraints per mode. Latency first: cap video at 640p. */
export function constraintsFor(mode: "audio" | "video", deviceIds?: { audio?: string; video?: string }): MediaStreamConstraints {
  return {
    audio: deviceIds?.audio ? { deviceId: { exact: deviceIds.audio } } : true,
    video:
      mode === "video"
        ? deviceIds?.video
          ? { deviceId: { exact: deviceIds.video }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
        : false,
  };
}
