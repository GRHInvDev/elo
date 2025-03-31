import { ContentFeed } from "@/components/content-feed";
import { DashboardShell } from "@/components/dashboard-shell";

export default function NewsPage() {
  return (
    <DashboardShell>
      <ContentFeed/>
    </DashboardShell>
  );
}