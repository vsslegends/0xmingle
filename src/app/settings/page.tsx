import { Card, CardBody } from "@/components/ui/card";

export const metadata = { title: "Settings — STRANGER" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card className="mt-4">
        <CardBody className="space-y-3 text-sm text-slate-300">
          <p>Media devices, interests, and notification preferences land here in Phase 5.</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="accent-violet-500" />
            Respect reduced-motion system setting (always on)
          </label>
        </CardBody>
      </Card>
    </div>
  );
}
