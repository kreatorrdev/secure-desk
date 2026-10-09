import { createHash } from 'node:crypto';
import { organizationAccess, organizationIdPattern } from '@/lib/organizations/access';
import { createStorageClient } from '@/lib/supabase/storage-server';
import { MAX_ATTACHMENT_BYTES, validateAttachment } from '@/lib/attachments/validation';
import { attachmentUnavailable, boundedBody, privateHeaders } from '@/lib/attachments/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const revisionPattern = /^[1-9][0-9]{0,17}$/;
function field(form: FormData, name: string) {
  const values = form.getAll(name);
  if (values.length !== 1 || typeof values[0] !== 'string') throw new Error('Invalid field');
  return values[0];
}

export async function POST(request: Request, ctx: RouteContext<'/organizations/[id]/tickets/[ticketId]/attachments'>) {
  const { id, ticketId } = await ctx.params;
  if (![id, ticketId].every(value => organizationIdPattern.test(value))) return attachmentUnavailable();
  // A plain multipart Route Handler needs its own CSRF boundary.
  const site = process.env.SITE_URL;
  if (!site || request.headers.get('origin') !== new URL(site).origin) {
    return new Response('Request origin is unavailable.', { status: 403, headers: privateHeaders });
  }
  const access = await organizationAccess();
  if (access.kind !== 'allowed') return attachmentUnavailable();
  const [parent, context, user] = await Promise.all([
    access.supabase.from('tickets').select('id').eq('organization_id', id).eq('id', ticketId).maybeSingle(),
    access.supabase.rpc('ticket_context', { p_organization_id: id }),
    access.supabase.auth.getUser(),
  ]);
  if (parent.error || !parent.data || context.error || context.data?.[0]?.organization_status !== 'active' || !user.data.user) return attachmentUnavailable();
  const target = '/organizations/' + id + '/tickets/' + ticketId;
  const redirect = (error: string) => new Response(null, { status: 303, headers: {
    ...privateHeaders, Location: target + '?' + (error ? 'upload_error=' + error : 'notice=upload'),
  } });
  let bytes: Buffer, file: File, mime: string, revision: string, accessRevision: string, scope: string;
  try {
    const body = await boundedBody(request, MAX_ATTACHMENT_BYTES + 65536);
    const parsed = new Request(request.url, { method: 'POST', headers: {
      'content-type': request.headers.get('content-type') || '',
    }, body: new Uint8Array(body) });
    const form = await parsed.formData();
    const allowed = new Set(['file', 'revision', 'access_revision', 'scope_revision']);
    if ([...form.keys()].some(name => !allowed.has(name))) throw new Error('Invalid field');
    const uploaded = form.getAll('file');
    if (uploaded.length !== 1 || !(uploaded[0] instanceof File)) throw new Error('Invalid file');
    file = uploaded[0];
    bytes = Buffer.from(await file.arrayBuffer());
    mime = validateAttachment(file.name, file.type, bytes);
    revision = field(form, 'revision');
    accessRevision = field(form, 'access_revision');
    scope = field(form, 'scope_revision');
    if (!revisionPattern.test(revision) || !revisionPattern.test(accessRevision)
      || (scope !== '' && !revisionPattern.test(scope) && !organizationIdPattern.test(scope))) throw new Error('Invalid version');
  } catch { return redirect('invalid'); }

  let storage: ReturnType<typeof createStorageClient>;
  try { storage = createStorageClient(); } catch { return redirect('unavailable'); }
  const reservation = await access.supabase.rpc('reserve_ticket_attachment', {
    p_organization_id: id, p_ticket_id: ticketId, p_expected_revision: revision,
    p_expected_access_revision: accessRevision, p_expected_scope: scope || null,
    p_name: file.name, p_mime: mime, p_size: bytes.length,
  });
  if (reservation.error || !reservation.data?.[0]) return redirect('stale');
  const reserved = reservation.data[0] as { id: string; storage_path: string };
  let complete = false;
  try {
    const uploaded = await storage.storage.from('ticket-attachments').upload(reserved.storage_path, bytes, { contentType: mime, upsert: false });
    if (uploaded.error) return redirect('unavailable');
    const finalized = await storage.rpc('complete_ticket_attachment', {
      p_attachment_id: reserved.id, p_actor_id: user.data.user.id,
      p_sha256: createHash('sha256').update(bytes).digest('hex'),
    });
    if (finalized.error) return redirect('stale');
    complete = true;
    return redirect('');
  } catch { return redirect('unavailable'); }
  finally {
    if (!complete) {
      // Claim the unpublished path in the DB first. A lost successful response never deletes ready bytes.
      const aborted = await Promise.resolve(storage.rpc('abort_ticket_attachment', {
        p_attachment_id: reserved.id, p_actor_id: user.data.user.id,
      })).catch(() => null);
      if (aborted && !aborted.error && aborted.data === reserved.storage_path) {
        await storage.storage.from('ticket-attachments').remove([reserved.storage_path]).catch(() => undefined);
      }
    }
  }
}
