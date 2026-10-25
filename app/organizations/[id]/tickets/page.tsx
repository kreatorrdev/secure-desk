import { TicketsPageContent } from '@/components/tickets-page';
export default async function CompanyTickets({ params, searchParams }: PageProps<'/organizations/[id]/tickets'>) { return <TicketsPageContent organization={(await params).id} params={await searchParams}/>; }
