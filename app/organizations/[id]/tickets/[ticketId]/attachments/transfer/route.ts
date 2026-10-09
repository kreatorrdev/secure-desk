import { attachmentTransfer } from '@/lib/attachments/transfer';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(request:Request,ctx:RouteContext<'/organizations/[id]/tickets/[ticketId]/attachments/transfer'>) {
 const {id,ticketId}=await ctx.params;return attachmentTransfer(request,'ticket',id,ticketId);
}
