import { EmptyState } from "@/components/ui/states";

/** Shell — Phase 4 renders live messages, timestamps, delivered state. */
export function ChatPanel() {
  return (
    <div aria-label="Chat messages">
      <EmptyState title="No messages yet" hint="Messages are ephemeral and never permanently stored." />
    </div>
  );
}
