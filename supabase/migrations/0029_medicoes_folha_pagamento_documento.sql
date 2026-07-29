-- Ao fechar uma medição (status aprovada/paga), o sistema salva um
-- snapshot da Folha de Pagamento do mês em Storage e vincula aqui, para
-- download posterior sem precisar recalcular a folha atual.
alter type documento_categoria add value if not exists 'folha_pagamento';
