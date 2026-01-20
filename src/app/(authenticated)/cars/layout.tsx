import { DashboardShell } from "@/components/ui/dashboard-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardShell>
            {children}
        </DashboardShell>
    );
}