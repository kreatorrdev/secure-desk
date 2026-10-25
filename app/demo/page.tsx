import { SecureDeskDemo } from '@/components/securedesk-demo';

export const metadata = {
  title: 'Try the demo | SecureDesk',
  description: 'Explore a fictional SecureDesk workspace. Follow a support request as a client and staff member, without creating an account.',
};

export default function DemoPage() {
  return <SecureDeskDemo />;
}
