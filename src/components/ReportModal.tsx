"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export const REPORT_CATEGORIES = [
  "harassment",
  "sexual content",
  "hate/abusive content",
  "spam",
  "scam",
  "impersonation",
  "illegal content",
  "other",
] as const;

/** Live — sends peer.report over WS; reporter identity stays server-side. */
export function ReportModal({
  open,
  onClose,
  onReport,
}: {
  open: boolean;
  onClose: () => void;
  onReport: (category: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} label="Report stranger">
      <h2 className="text-lg font-bold">Report</h2>
      <p className="mt-1 text-xs text-slate-500">They won&apos;t know who reported.</p>
      <ul className="mt-3 grid gap-2">
        {REPORT_CATEGORIES.map((c) => (
          <li key={c}>
            <Button
              variant="secondary"
              size="sm"
              className="w-full capitalize"
              onClick={() => {
                onReport(c);
                onClose();
              }}
            >
              {c}
            </Button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
