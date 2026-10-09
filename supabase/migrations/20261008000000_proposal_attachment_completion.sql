-- A lost completion response must never cause a published attachment to be deleted.
alter table public.project_proposals add constraint proposal_reviewer_complete check(
 (reviewer_staff_user_id is null and reviewer_access_revision is null and reviewer_assignment_revision is null)
 or (reviewer_staff_user_id is not null and reviewer_access_revision is not null and reviewer_assignment_revision is not null));
drop function public.abort_proposal_attachment(uuid,uuid);
create function public.abort_proposal_attachment(p_attachment_id uuid,p_actor_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare path text;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Trusted attachment cleanup is required'; end if;
 delete from public.attachments where id=p_attachment_id and uploaded_by_user_id=p_actor_id and state='uploading' returning storage_path into path;
 return path;
end; $$;
revoke all on function public.abort_proposal_attachment(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.abort_proposal_attachment(uuid,uuid) to service_role;
create or replace function public.organization_proposal(p_organization_id uuid,p_proposal_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_proposal(p_proposal_id) then raise exception using errcode='42501',message='Proposal is unavailable'; end if;
 select (to_jsonb(p)-'reviewer_access_revision'-'reviewer_assignment_revision')||jsonb_build_object('revision',p.revision::text,
 'author_name',u.full_name,'reviewer_name',r.full_name,
 'can_upload',o.status='active' and p.status='pending' and securedesk_private.active_actor_role() in ('client','admin','super_admin') and (p.proposed_by_user_id=auth.uid() or securedesk_private.can_administer_organization(p.organization_id)),
 'can_recommend',o.status='active' and p.status='pending' and (securedesk_private.can_administer_organization(p.organization_id) or (p.reviewer_staff_user_id=auth.uid() and securedesk_private.active_actor_role()='staff')))
 into result from public.project_proposals p join public.organizations o on o.id=p.organization_id join public.profiles u on u.id=p.proposed_by_user_id
 left join public.profiles r on r.id=p.reviewer_staff_user_id where p.id=p_proposal_id and p.organization_id=p_organization_id;
 if result is null then raise exception using errcode='42501',message='Proposal is unavailable'; end if;
 return result;
end; $$;
notify pgrst,'reload schema';
