import { OrganizationShell } from '@/components/organization-shell';
export const metadata = { title: 'Audit history | SecureDesk' };
export default function AuditLayout({ children }: { children: React.ReactNode }) { return <OrganizationShell>{children}</OrganizationShell>; }
