begin;

do $$
declare
  v_run_id uuid;
  v_asset_id uuid;
  v_sensitive_accepted boolean := false;
  v_unredacted_accepted boolean := false;
  v_audit_mutated boolean := false;
  v_analysis_mutated boolean := false;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='products' and column_name='hardware_model'
  ) then
    raise exception 'products.hardware_model is missing';
  end if;

  insert into public.product_intake_runs (
    source,idempotency_key,request_hash,status,condition,submitted_by,submitted_by_role,intake_payload
  ) values (
    'test','migration:test-safe','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'collecting_assets','sealed','migration-test','system','{"model":"iPhone test"}'::jsonb
  ) returning id into v_run_id;

  begin
    insert into public.product_intake_runs (
      source,idempotency_key,request_hash,status,condition,submitted_by,submitted_by_role,intake_payload
    ) values (
      'test','migration:test-sensitive','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'collecting_assets','sealed','migration-test','system','{"imei":"490154203237518"}'::jsonb
    );
    v_sensitive_accepted := true;
  exception when check_violation then
    null;
  end;
  if v_sensitive_accepted then raise exception 'sensitive intake JSON was accepted'; end if;

  insert into public.product_intake_assets (
    run_id,asset_key,kind,sha256,content_type,byte_size,width,height,rights_basis,
    is_redacted,contains_sensitive_identifiers,external_processing_allowed,metadata
  ) values (
    v_run_id,'intake/APF-TEST01/about.webp','about_screenshot',
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    'image/webp',1000,100,100,'shop_owned',true,false,true,
    '{"assetType":"about_screen","solVisionCompleted":true}'::jsonb
  ) returning id into v_asset_id;

  begin
    insert into public.product_intake_assets (
      run_id,asset_key,kind,sha256,content_type,byte_size,width,height,rights_basis,
      is_redacted,contains_sensitive_identifiers,external_processing_allowed,metadata
    ) values (
      v_run_id,'intake/APF-TEST01/raw-about.jpg','about_screenshot',
      'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      'image/jpeg',1000,100,100,'shop_owned',false,true,true,'{}'::jsonb
    );
    v_unredacted_accepted := true;
  exception when check_violation then
    null;
  end;
  if v_unredacted_accepted then raise exception 'unredacted external asset was accepted'; end if;

  insert into public.product_intake_events (
    run_id,event_type,actor_type,actor_id,idempotency_key,request_hash,payload
  ) values (
    v_run_id,'asset_recorded','system','migration-test','migration:event-safe',
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee','{}'::jsonb
  );
  begin
    update public.product_intake_events set payload='{"changed":true}'::jsonb where run_id=v_run_id;
    v_audit_mutated := true;
  exception when raise_exception then
    null;
  end;
  if v_audit_mutated then raise exception 'append-only event was mutated'; end if;

  insert into public.product_intake_asset_analyses (
    run_id,asset_id,semantic_type,model,result_hash,result,idempotency_key,request_hash,actor_id
  ) values (
    v_run_id,v_asset_id,'about_screen','gpt-5.6-sol',
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    '{"modelName":"iPhone Test","conflicts":[],"requiresConfirmation":[]}'::jsonb,
    'migration:analysis-safe','1111111111111111111111111111111111111111111111111111111111111111','migration-test'
  );
  begin
    update public.product_intake_asset_analyses set result='{}'::jsonb where asset_id=v_asset_id;
    v_analysis_mutated := true;
  exception when raise_exception then
    null;
  end;
  if v_analysis_mutated then raise exception 'append-only analysis was mutated'; end if;

  if not public.product_intake_json_is_redacted('{"model":"SM-S938B"}'::jsonb) then
    raise exception 'safe public model was rejected';
  end if;
end;
$$;

rollback;
