import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

export const metadata = { title: "Profile — STRANGER" };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card className="mt-4">
        <CardBody>
          <EmptyState
            title="Connect a wallet to see your profile"
            hint="Username, avatar, chats, and reputation unlock in Phase 2 + Phase 7."
          />
        </CardBody>
      </Card>
    </div>
  );
}
