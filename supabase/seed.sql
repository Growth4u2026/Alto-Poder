-- Alta · valores iniciais (seção 3). Editáveis depois no painel admin.
-- null = sem limite.

insert into settings (chave, valor) values
('limites', '{
  "alto_poder": { "conteudo": {"semana": 1},  "ideia": {"semana": 3},  "duvida": {"semana": 10}, "concorrencia": {"mes": 1}, "extras": false },
  "start":      { "conteudo": {"semana": 3},  "ideia": {"dia": 10},    "duvida": {"dia": 30},    "concorrencia": {"mes": 2}, "extras": true  },
  "master":     { "conteudo": {"semana": 3},  "ideia": {"dia": 10},    "duvida": {"dia": 30},    "concorrencia": {"mes": 4}, "extras": true  },
  "admin":      { "conteudo": null,           "ideia": null,           "duvida": null,           "concorrencia": null,       "extras": true  }
}'),
('horarios', '{
  "fuso": "America/Sao_Paulo",
  "reset_semanal": "segunda 00:00",
  "reset_mensal": "dia 1 00:00",
  "checkin": "segunda 09:00",
  "lembrete_checkin": "quarta",
  "placar_mensal": "dia 1"
}'),
('contato_growth4u', '{ "whatsapp": "" }')
on conflict (chave) do nothing;

-- Os textos fixos da seção 8 entram na tarefa 1.1.
