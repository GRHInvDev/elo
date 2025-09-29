import { ContentFeed } from "@/components/content-feed";
import { DashboardShell } from "@/components/dashboard-shell";

export default function NewsPage() {
  return (
    <DashboardShell className="p-0 md:p-8">
      <div className="flex justify-center w-full">
        <ContentFeed className="w-full max-w-4xl"/>
      </div>
    </DashboardShell>
  );
}