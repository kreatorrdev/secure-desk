begin;
-- Hosting adaptation: temporary bytes are never readable by application roles.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('attachment-quarantine','attachment-quarantine',false,10485760,
 array['image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) on conflict(id) do nothing;
do $bucket$ begin
 if not exists(select 1 from storage.buckets where id='attachment-quarantine' and name='attachment-quarantine' and public=false and file_size_limit=10485760 and allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) then
  raise exception 'Unexpected quarantine bucket configuration';
 end if;
end; $bucket$;

-- A server handler supplies its verified caller's identity. No table grant is added.
create function public.attachment_transfer_metadata(p_organization_id uuid,p_parent_id uuid,p_parent_kind text,p_attachment_id uuid,p_actor_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Trusted attachment transfer is required'; end if;
 if p_parent_kind is null or p_parent_kind not in ('ticket','proposal') then raise exception using errcode='22023',message='Invalid attachment parent'; end if;
 select jsonb_build_object('id',a.id,'storage_path',a.storage_path,'original_name',a.original_name,
  'mime_type',a.mime_type,'size_bytes',a.size_bytes,'state',a.state,'sha256',a.sha256,'expires_at',a.expires_at)
 into result from public.attachments a where a.id=p_attachment_id and a.organization_id=p_organization_id
  and a.uploaded_by_user_id=p_actor_id
  and ((p_parent_kind='ticket' and a.ticket_id=p_parent_id) or (p_parent_kind='proposal' and a.project_proposal_id=p_parent_id));
 return result;
end; $$;

-- Purge only reservations expired for a full day. Remove bytes through Storage API.
create function public.attachment_cleanup_batch(p_limit integer default 100)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Trusted attachment maintenance is required'; end if;
 if p_limit is null or p_limit not between 1 and 1000 then raise exception using errcode='22023',message='Invalid cleanup batch'; end if;
 with candidates as (
  select id from public.attachments where state='uploading' and expires_at<clock_timestamp()-interval '24 hours'
  order by expires_at,id limit p_limit for update skip locked
 ) delete from public.attachments a using candidates c where a.id=c.id and a.state='uploading';
 select coalesce(jsonb_agg(jsonb_build_object('bucket',o.bucket_id,'path',o.name)),'[]'::jsonb) into result from (
  select s.bucket_id,s.name from storage.objects s
  where s.created_at<clock_timestamp()-interval '24 hours'
   and (s.bucket_id='attachment-quarantine' or
    (s.bucket_id in ('ticket-attachments','proposal-attachments')
     and not exists(select 1 from public.attachments a where a.storage_path=s.name)))
  order by s.created_at,s.id limit p_limit
 ) o;
 return result;
end; $$;
revoke all on function public.attachment_transfer_metadata(uuid,uuid,text,uuid,uuid),public.attachment_cleanup_batch(integer) from public,anon,authenticated,service_role;
grant execute on function public.attachment_transfer_metadata(uuid,uuid,text,uuid,uuid),public.attachment_cleanup_batch(integer) to service_role;
notify pgrst,'reload schema';

commit;
