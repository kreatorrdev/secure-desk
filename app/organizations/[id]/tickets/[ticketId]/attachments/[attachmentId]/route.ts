import { attachmentStream } from '@/lib/attachments/stream';
import { createHash } from 'node:crypto';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { createStorageClient } from '@/lib/supabase/storage-server';
import { MAX_ATTACHMENT_BYTES } from '@/lib/attachments/validation';
import { attachmentUnavailable, privateHeaders } from '@/lib/attachments/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, ctx: RouteContext<'/organizations/[id]/tickets/[ticketId]/attachments/[attachmentId]'>) {
  const { id, ticketId, attachmentId } = await ctx.params;
  if (![id, ticketId, attachmentId].every(value => organizationIdPattern.test(value))) return attachmentUnavailable();
  const access = await organizationAccess();
  if (access.kind !== 'allowed') return attachmentUnavailable();
  const args = { p_organization_id: id, p_ticket_id: ticketId, p_attachment_id: attachmentId };
  const metadata = await access.supabase.rpc('ticket_attachment', args);
  if (metadata.error || !metadata.data) return attachmentUnavailable();
  const file = metadata.data as { storage_path: string; original_name: string; size_bytes: number; sha256: string };
  if (!Number.isInteger(file.size_bytes) || file.size_bytes < 1 || file.size_bytes > MAX_ATTACHMENT_BYTES) return attachmentUnavailable();
  try {
    const storage = createStorageClient();
    const download = await storage.storage.from('ticket-attachments').download(file.storage_path);
    if (download.error || !download.data || download.data.size !== file.size_bytes) return attachmentUnavailable();
    const bytes = Buffer.from(await download.data.arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) return attachmentUnavailable();
    // Re-check live parent rights after fetching bytes. We never issue a reusable signed URL.
    const current = await access.supabase.rpc('ticket_attachment', args);
    if (current.error || !current.data || current.data.storage_path !== file.storage_path
      || current.data.sha256 !== file.sha256 || current.data.size_bytes !== file.size_bytes) return attachmentUnavailable();
    const encoded = encodeURIComponent(file.original_name).replace(/[!'()*]/g, value => '%' + value.charCodeAt(0).toString(16).toUpperCase());
    return new Response(attachmentStream(new Uint8Array(bytes)), { headers: {
      ...privateHeaders, 'Content-Type': 'application/octet-stream',
      'Content-Disposition': "attachment; filename=\"attachment\"; filename*=UTF-8''" + encoded,
      'Content-Security-Policy': "sandbox; default-src 'none'", 'Referrer-Policy': 'no-referrer',
    } });
  } catch { return attachmentUnavailable(); }
}
