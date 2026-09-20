import { EmptyState } from "@/components/ui/states";

/** Shell — Phase 5 lazy-loads real WebRTC room (remote large, local preview, bottom controls). */
export function VideoRoom() {
  return (
    <div aria-label="Video room (coming soon)">
      <EmptyState title="Video arrives in Phase 5" hint="Camera/mic stay off until you enable them. TURN fallback included." />
    </div>
  );
}
