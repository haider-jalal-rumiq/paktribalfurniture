-- Transaction-only verification. All test records roll back; explicit negative
-- invoice/order numbers avoid consuming the business's numbering sequences.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","app_metadata":{"role":"admin"}}', true);
do $$
declare
  client_uuid uuid;
  invoice_uuid uuid;
  order_uuid uuid;
  base jsonb;
  totals jsonb;
  item_uuid uuid := gen_random_uuid();
  rejected boolean := false;
begin
  base := public.cms_financial_totals();
  insert into public.clients (name) values ('Transaction-only verification') returning id into client_uuid;
  insert into public.orders (order_no, client_id, title, items)
    values (-900001, client_uuid, 'Verification order', jsonb_build_array(jsonb_build_object('id',item_uuid,'name','Chair','quantity',2,'status','completed','notes','')))
    returning id into order_uuid;
  assert (select items->0->>'status' from public.orders where id=order_uuid) = 'completed', 'Order item status';
  assert not public.cms_valid_order_items('[{"id":"00000000-0000-4000-8000-000000000000","name":"Chair","quantity":null,"status":"pending","notes":""}]'), 'Null quantities rejected';
  assert not public.cms_valid_order_items('[{"id":"00000000-0000-4000-8000-000000000000","name":"Chair","quantity":1,"status":"unknown","notes":""}]'), 'Unknown statuses rejected';
  insert into public.balance_entries (amount,note) values (100000,'Test opening balance');
  insert into public.expenses (amount,category) values (7000,'Any custom category');
  insert into public.labour_entries (name,period,salary,total_amount,advance,salary_paid,leaves)
    values ('Verification labour','2026-09-01',40000,38000,10000,5000,2);
  insert into public.wood_entries (purchaser_name,period,paid_on,purchased_amount,paid_amount)
    values ('Verification timber supplier','2026-09-01','2026-09-20',20000,10000),
           ('Verification timber supplier','2026-10-01','2026-10-20',30000,20000);
  insert into public.invoices (invoice_no,client_id,client_name,issued_on,items) overriding system value
    values (-900001,client_uuid,'Client snapshot','2026-09-20',jsonb_build_array(jsonb_build_object('id',item_uuid,'item','Dining table','quantity',2,'amount',12500,'source','Order'),jsonb_build_object('id',gen_random_uuid(),'item','Chair','quantity',3,'amount',4000,'source','Stock')))
    returning id into invoice_uuid;
  assert (select total_amount from public.invoices where id=invoice_uuid) = 37000, 'Generated invoice total';
  totals := public.cms_financial_totals();
  assert (totals->>'added')::bigint - (base->>'added')::bigint = 100000, 'Added funds';
  assert (totals->>'expenses')::bigint - (base->>'expenses')::bigint = 7000, 'Custom expenses';
  assert (totals->>'labourPaid')::bigint - (base->>'labourPaid')::bigint = 15000, 'Labour actual payments';
  assert (totals->>'woodPaid')::bigint - (base->>'woodPaid')::bigint = 30000, 'Wood actual payments';
  assert (select sum(purchased_amount-paid_amount) from public.wood_entries where purchaser_name='Verification timber supplier') = 20000, 'Wood balance carries across months';
  assert (totals->>'sales')::bigint - (base->>'sales')::bigint = 37000, 'Invoice sales';
  assert (select count(*) from public.invoices where client_id=client_uuid and issued_on >= '2026-09-20' and issued_on <= '2026-09-20') = 1, 'Inclusive dates';
  update public.invoices set items=jsonb_build_array(jsonb_build_object('id',item_uuid,'item','Dining table','quantity',2,'amount',15000,'source','Order')) where id=invoice_uuid;
  assert (select total_amount from public.invoices where id=invoice_uuid)=30000, 'Edit recalculates total';
  update public.clients set name='Renamed client' where id=client_uuid;
  assert (select client_name from public.invoices where id=invoice_uuid)='Client snapshot', 'Snapshot retained';
  update public.invoices set status='void' where id=invoice_uuid;
  assert (public.cms_financial_totals()->>'sales')::bigint = (base->>'sales')::bigint, 'Voided sales excluded';
  assert (select count(*) from public.invoices where id=invoice_uuid)=1, 'Voided record retained';
  begin
    perform public.cms_invoice_total('[{"id":"00000000-0000-4000-8000-000000000000","item":"Chair","quantity":1,"amount":12.5,"source":"Order"}]');
  exception when others then rejected:=true;
  end;
  assert rejected, 'Fractional rupees rejected';
  rejected:=false;
  begin
    insert into public.labour_entries (name,period,salary,total_amount,advance,salary_paid) values ('Invalid test','2026-09-01',100,100,90,90);
  exception when check_violation then rejected:=true;
  end;
  assert rejected, 'Overpaid labour rejected';
  perform set_config('request.jwt.claims','{"role":"authenticated","app_metadata":{}}',true);
  assert (select count(*) from public.balance_entries)=0, 'Non-admin cannot read balances';
  assert (select count(*) from public.labour_entries)=0, 'Non-admin cannot read labour';
  assert (select count(*) from public.wood_entries)=0, 'Non-admin cannot read wood ledger';
  assert (select count(*) from public.invoices)=0, 'Non-admin cannot read invoices';
  rejected:=false;
  begin
    insert into public.balance_entries (amount,note) values (1,'Unauthorized entry');
  exception when insufficient_privilege then rejected:=true;
  end;
  assert rejected, 'Non-admin writes rejected';
end;
$$;
rollback;
select '22 transaction assertions passed; all test records rolled back' as result;
