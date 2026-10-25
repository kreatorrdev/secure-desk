import { OrganizationShell } from '@/components/organization-shell';

export const metadata = { title: 'Organizations | SecureDesk' };

// Layout contains no private data or authorization result. Each page checks access.
export default function OrganizationsLayout({ children }: LayoutProps<'/organizations'>) {
  return <OrganizationShell>{children}</OrganizationShell>;
}
