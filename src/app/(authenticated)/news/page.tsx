import { ContentFeed } from "@/components/news/content-feed";
import { DashboardShell } from "@/components/ui/dashboard-shell";

export default function NewsPage() {
  return (
    <DashboardShell className="p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="flex justify-center w-full">
        <ContentFeed
          className="w-full max-w-xl"
          postsPerPage={5}
          enablePagination={true}
        />
      </div>
    </DashboardShell>
  );
}