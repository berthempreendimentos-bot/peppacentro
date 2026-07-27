-- Funções auxiliares e triggers genéricos

-- Cria automaticamente o perfil em `usuarios` quando alguém se cadastra no Supabase Auth.
-- Role inicial é sempre 'visualizador'; promoção a outros papéis é manual (painel/SQL).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    'visualizador'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lê o role do usuário autenticado. security definer evita recursão de RLS
-- ao consultar a própria tabela `usuarios` dentro das policies.
create function public.auth_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.usuarios where id = auth.uid();
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on clientes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on fornecedores for each row execute function public.set_updated_at();
create trigger set_updated_at before update on contratos for each row execute function public.set_updated_at();
create trigger set_updated_at before update on cronograma for each row execute function public.set_updated_at();
create trigger set_updated_at before update on lancamentos for each row execute function public.set_updated_at();
create trigger set_updated_at before update on medicoes for each row execute function public.set_updated_at();

-- Log genérico de auditoria (fase 2 terá uma UI dedicada; por ora só a tabela).
create function public.log_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.historico (tabela, registro_id, acao, usuario_id, dados_depois)
    values (tg_table_name, new.id, 'insert', auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.historico (tabela, registro_id, acao, usuario_id, dados_antes, dados_depois)
    values (tg_table_name, new.id, 'update', auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.historico (tabela, registro_id, acao, usuario_id, dados_antes)
    values (tg_table_name, old.id, 'delete', auth.uid(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

create trigger log_historico after insert or update or delete on clientes for each row execute function public.log_historico();
create trigger log_historico after insert or update or delete on contratos for each row execute function public.log_historico();
create trigger log_historico after insert or update or delete on aditivos for each row execute function public.log_historico();
create trigger log_historico after insert or update or delete on cronograma for each row execute function public.log_historico();
create trigger log_historico after insert or update or delete on lancamentos for each row execute function public.log_historico();
create trigger log_historico after insert or update or delete on medicoes for each row execute function public.log_historico();
create trigger log_historico after insert or update or delete on documentos for each row execute function public.log_historico();
