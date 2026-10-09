import 'server-only';
import { redirect } from 'next/navigation';
import { organizationAccess } from '@/lib/organizations/access';
export async function ticketAccess() {
  const access = await organizationAccess();
  if (access.kind === 'signed-out') redirect('/login');
  if (access.kind === 'forbidden') redirect('/account');
  return access;
}
