import { TicketsPageContent } from '@/components/tickets-page';
export default async function TicketsPage({ searchParams }: PageProps<'/tickets'>) { return <TicketsPageContent params={await searchParams}/>; }
