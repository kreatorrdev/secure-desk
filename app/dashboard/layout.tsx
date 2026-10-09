import { OrganizationShell } from '@/components/organization-shell';
export const metadata = { title: 'Dashboard | SecureDesk' };
export default function DashboardLayout({ children }: { children: React.ReactNode }) { return <OrganizationShell>{children}</OrganizationShell>; }
