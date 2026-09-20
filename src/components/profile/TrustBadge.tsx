import { Badge } from "@/components/ui/badge";
import { tierLabel } from "@/server/reputation/scorer";
import type { TrustTier } from "@/lib/profiles";

export function TrustBadge({ tier }: { tier: TrustTier }) {
  return (
    <Badge aria-label={`Trust: ${tierLabel(tier)}`}>
      {tierLabel(tier)}
    </Badge>
  );
}
