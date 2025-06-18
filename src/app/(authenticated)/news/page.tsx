import { ContentFeed } from "@/components/content-feed";
import { DashboardShell } from "@/components/dashboard-shell";

export default function NewsPage() {
  return (
    <DashboardShell className="flex justify-center">
      <ContentFeed className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl"/>
    </DashboardShell>
  );
}