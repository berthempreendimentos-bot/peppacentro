-- "Praça de Pagamento" (banco/agência onde o pagamento é processado),
-- usada no Espelho de Medição impresso. Fica no cadastro do cliente para
-- ser preenchida uma vez e reaproveitada em todas as medições dele.
alter table clientes
  add column praca_pagamento text;
