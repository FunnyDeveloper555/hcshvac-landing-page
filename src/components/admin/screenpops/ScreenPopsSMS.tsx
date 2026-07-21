import { MessageSquare } from "lucide-react";

export default function ScreenPopsSMS() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4" /> Screen Pops — SMS
      </h2>
      <p className="text-sm text-muted-foreground mt-2">
        Coming soon. Inbound SMS screen pops will appear here.
      </p>
    </div>
  );
}
