-- Nova categoria de documento: apólice (seguros vinculados ao contrato).
alter type documento_categoria add value if not exists 'apolice';
