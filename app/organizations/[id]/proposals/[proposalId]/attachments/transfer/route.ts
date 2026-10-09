import { attachmentTransfer } from '@/lib/attachments/transfer';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(request:Request,ctx:RouteContext<'/organizations/[id]/proposals/[proposalId]/attachments/transfer'>) {
 const {id,proposalId}=await ctx.params;return attachmentTransfer(request,'proposal',id,proposalId);
}
