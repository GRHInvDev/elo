import { ContentFeed } from "@/components/content-feed";
import { DashboardShell } from "@/components/dashboard-shell";

export default function NewsPage() {
  return (
    <DashboardShell className="flex justify-center">
      <ContentFeed className="w-full max-w-xl"/>
    </DashboardShell>
  );
}