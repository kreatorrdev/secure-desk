import { OrganizationShell } from '@/components/organization-shell';
export const metadata = { title: 'Tickets | SecureDesk' };
export default function TicketsLayout({ children }: { children: React.ReactNode }) { return <OrganizationShell>{children}</OrganizationShell>; }
