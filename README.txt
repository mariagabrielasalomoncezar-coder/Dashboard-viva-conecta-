VIVA CONECTA TELECOM — DASHBOARD V3

COMO TESTAR NA VERCEL
1. Faça upload desta pasta/ZIP em um NOVO projeto.
2. Framework Preset: Other / Static.
3. Não preencha Build Command.
4. Não preencha Output Directory.
5. Clique em Deploy.

LINKS DAS TELAS
- Painel: /?view=admin
- TV Torres: /?view=torres
- TV Equipe: /?view=equipe

SINCRONIZAÇÃO ENTRE COMPUTADOR E TVs
No modo atual, sem Supabase configurado, os dados ficam no navegador do dispositivo.
Para as TVs receberem automaticamente o que foi lançado no computador, configure o Supabase:
1. Execute supabase-schema.sql no SQL Editor do Supabase.
2. Abra config.js.
3. Cole apenas:
   - Project URL
   - anon public key
4. Faça novo deploy.

NUNCA coloque a service_role key no config.js.

DADOS QUE AINDA PRECISAMOS CONFIRMAR PARA A VERSÃO FINAL
- Meta geral mensal atual.
- Meta individual de cada consultor.
- Meta de cada produto.
- Se os produtos de valor (TV, MDM/Office, Aparelhos, Link, SIP, VVN etc.) serão medidos por R$ ou quantidade.
- Project URL + anon public key do Supabase para sincronização real.
- Fotos dos colaboradores (opcional; o sistema funciona com iniciais sem elas).

ACESSOS SEPARADOS
- Painel administrativo: abrir a raiz do site. Exige login.
- TV Torres: /torres.html (pública, somente visualização)
- TV Equipe: /equipe.html (pública, somente visualização)

As TVs usam acesso anônimo somente para leitura no Supabase. Alterações continuam exigindo usuário autenticado.

V20 — DESEMPENHO INDIVIDUAL
- Adicionada nova área administrativa "Desempenho Individual".
- Consulta por colaborador e por período atual/meses fechados.
- Exibe meta, realizado, atingimento, gap/acima da meta, posição por realizado, vendas por produto e histórico do colaborador.
- Área somente de consulta: não altera lançamentos nem dados do banco.
- Mantidas TVs, zoom independente, relatórios e conexão Supabase da V19.


VERSÃO 21 — RELATÓRIOS CORRIGIDOS
- Relatório geral: impressão/PDF em janela própria e Excel estruturado em abas.
- Desempenho individual: botões de PDF/Impressão e Excel por colaborador/período.
- Nenhuma alteração no banco de dados ou nas telas das TVs.
