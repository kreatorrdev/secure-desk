-- Business conflicts must return HTTP 409 without PostgREST transaction retries.
-- Historical migrations stay immutable. Only the explicit RAISE error code changes.
-- Function identity, authorization, owner, grants, search_path and all data are preserved.
DO $stale_conflicts$
DECLARE
 target record;
 function_id regprocedure;
 before_function pg_catalog.pg_proc%rowtype;
 after_function pg_catalog.pg_proc%rowtype;
 definition text;
BEGIN
 FOR target IN SELECT * FROM (VALUES
  ('public.close_resolved_ticket(uuid, uuid, bigint, bigint, text, text, text)','ece6e3b3953e790985a80c5313570a37','aa6154c3af1351c8ee5ce2993a7eff25'),
  ('public.complete_ticket_attachment(uuid, uuid, text)','69f0215bcd6ef6e1bae1c8ef07c49a01','e09a9f73a8fe1a03454e69b67042661a'),
  ('public.create_organization_project(uuid, uuid, bigint, bigint, jsonb)','a67e36691ecc45401a66c5dae17e0661','4138f6f7a255d157c2c9effdd68067a4'),
  ('public.create_ticket(uuid, uuid, uuid, uuid, bigint, text, jsonb)','02f5cd177ff58070699165bc072025f4','02a2c92a5c23b62264cfe818af0e9bc1'),
  ('public.manage_organization_access_code(uuid, uuid, text)','b5f4c7fa063ee670b97b26e86f8b3e23','9238a2b2bbd734f86c1fa475a8aafb6e'),
  ('public.manage_ticket(uuid, uuid, bigint, bigint, text, text, text)','9197ad58e9aaeb3a15924de4022fa8fc','1d225bb6a12a3cc3bcf5bdd3ce151683'),
  ('public.request_ticket_participant(uuid, uuid, uuid, uuid, bigint, text)','21449c762ef4f043dc71e673fc34fbda','ddf9e7f9e32e98ff5d77b7502bc130ae'),
  ('public.request_ticket_reopen(uuid, uuid, uuid, bigint, bigint, text, text)','209fe6216a903d36f8d7aaa358afa597','8ffbff9291a2b7b2024619a540870823'),
  ('public.reserve_proposal_attachment(uuid, uuid, bigint, bigint, bigint, text, text, integer)','6a0869bec3642f5f9d77c544961ff3cf','dc07f5e9e605f4cb3c72b4db0c48aeb2'),
  ('public.reserve_ticket_attachment(uuid, uuid, bigint, bigint, text, text, text, integer)','cd75d980bcce36339319960e9d1c0863','7736cc47c45455d5c618aa88c3513c17'),
  ('public.review_organization_transfer(uuid, bigint, text, text, text)','1438000428010a4d01f03856b830b9c4','0612a94a8ca40ea9b9ba4f34b99b286c'),
  ('public.review_project_proposal(uuid, uuid, bigint, bigint, bigint, text, uuid, text)','efe410931ee2884e426fde59bcbf771c','b68be43f428d9959e0316ec40a5c7b5f'),
  ('public.review_ticket_participant(uuid, uuid, uuid, bigint, bigint, text, text, text)','77ecf16ee76354d0e98f4bce82aeb324','e4f6871330c06907b0c109864aaedfe3'),
  ('public.review_ticket_reopen(uuid, uuid, uuid, bigint, bigint, bigint, text, text, text, uuid)','179e2e47beb544e87e7190af76cd9eec','3a2e5ba8ec3156890d881654cefc6a06'),
  ('public.revoke_ticket_participant(uuid, uuid, uuid, bigint, bigint, text)','1d72a35ed98f53d1e5424795e3f17e5f','2f01bcc505ef9420c8215f45a23101ca'),
  ('public.set_audit_retention(integer, bigint, bigint)','5762e157a88d88100365ed241e12f53b','9d35b63ce113437cee7c05c3c8798b13'),
  ('public.submit_project_proposal(uuid, uuid, bigint, bigint, jsonb)','375af5e17b0785e4b090f14a128bb6e8','7d875860c3533a7842be99d26059c3e4'),
  ('public.update_organization_project(uuid, uuid, bigint, bigint, bigint, jsonb)','fdd1292d2e68bcb6272b87208c1172fd','d47eb799d84fe33c8cf9c31ae605ec0a'),
  ('public.write_ticket_comment(uuid, uuid, uuid, bigint, bigint, text, text)','a408bcf6a9b37e94ad252d8a2f72b51c','c5149dc851fdf2bc2b470c13cc30e232'),
  ('securedesk_private.lock_project_writer(uuid, bigint, bigint)','b021abfae95034a650996ffad647e87b','166352e73f9e42ed6460476975118867'),
  ('securedesk_private.lock_proposal_actor(uuid, bigint, bigint, text)','8243706d30f87c14a99083cbf393b355','7dbde534911241d427907436be6c3462'),
  ('securedesk_private.lock_ticket_actor(uuid, bigint, text)','470ab55fce2f0c69d176446ae9e58c4d','0d1fc040cbbb34e1dcfe8bff0ac1d3ab')
 ) AS reviewed(signature,old_hash,new_hash)
 LOOP
  function_id:=pg_catalog.to_regprocedure(target.signature);
  IF function_id IS NULL THEN RAISE EXCEPTION 'Missing reviewed conflict function: %',target.signature; END IF;
  SELECT * INTO before_function FROM pg_catalog.pg_proc WHERE oid=function_id;
  IF before_function.prokind<>'f' OR pg_catalog.md5(before_function.prosrc) NOT IN (target.old_hash,target.new_hash) THEN
   RAISE EXCEPTION 'Conflict function changed; review before migrating: %',target.signature;
  END IF;
  IF pg_catalog.md5(before_function.prosrc)=target.old_hash THEN
   definition:=pg_catalog.pg_get_functiondef(function_id);
   EXECUTE pg_catalog.replace(definition,$old_code$errcode='40001'$old_code$,$new_code$errcode='PT409'$new_code$);
  END IF;
  SELECT * INTO after_function FROM pg_catalog.pg_proc WHERE oid=function_id;
  IF pg_catalog.md5(after_function.prosrc)<>target.new_hash
   OR (pg_catalog.to_jsonb(before_function)-'prosrc') IS DISTINCT FROM (pg_catalog.to_jsonb(after_function)-'prosrc') THEN
   RAISE EXCEPTION 'Conflict migration altered unexpected function properties: %',target.signature;
  END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('public','securedesk_private') AND p.prokind='f' AND p.prosrc LIKE '%40001%') THEN
  RAISE EXCEPTION 'Unreviewed serialization code remains in a business function';
 END IF;
END;
$stale_conflicts$;
