-- Bucket privado para os documentos dos contratos.
-- Convenção de path: contrato_{contrato_id}/{categoria}/{arquivo}

insert into storage.buckets (id, name, public)
values ('contratos', 'contratos', false)
on conflict (id) do nothing;

create policy "contratos_bucket_select" on storage.objects for select to authenticated
  using (bucket_id = 'contratos');

create policy "contratos_bucket_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'contratos'
    and public.auth_role() in ('admin', 'gestor', 'financeiro', 'fiscal')
  );

create policy "contratos_bucket_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'contratos'
    and public.auth_role() in ('admin', 'gestor', 'financeiro', 'fiscal')
  )
  with check (
    bucket_id = 'contratos'
    and public.auth_role() in ('admin', 'gestor', 'financeiro', 'fiscal')
  );

create policy "contratos_bucket_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'contratos'
    and public.auth_role() in ('admin', 'gestor')
  );
