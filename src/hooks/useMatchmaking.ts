"use client";

/**
 * Backwards-compatible re-export: matchmaking state now lives in the
 * app-wide MatchmakingProvider (survives route changes), but existing
 * `@/hooks/useMatchmaking` imports keep working.
 */
export {
  MatchmakingProvider,
  ChatReturnPill,
  useMatchmaking,
  type Matchmaking,
  type MatchState,
  type ChatFile,
  type ChatMessage,
  type ReactionMap,
  type RtcSignal,
  type TipIncoming,
  type TipOutgoing,
} from "@/components/matchmaking/MatchmakingProvider";
