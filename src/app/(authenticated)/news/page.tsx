import { ContentFeed } from "@/components/content-feed";
import { DashboardShell } from "@/components/dashboard-shell";

export default function NewsPage() {
  return (
    <DashboardShell className="flex justify-center p-0 md:p-8">
      <ContentFeed className="w-full md:max-w-lg lg:max-w-xl"/>
    </DashboardShell>
  );
}