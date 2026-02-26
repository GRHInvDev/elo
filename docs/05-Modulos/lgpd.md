# Política de Privacidade e Proteção de Dados (LGPD)

## Visão geral

A plataforma ELO dispõe de uma **página dedicada de Política de Privacidade e Proteção de Dados**, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD). O tratamento de dados de colaboradores está alinhado ao **termo de autorização de tratamento de dados** previsto no contrato de trabalho (cláusulas 18 a 26).

## Acesso

- **Rota**: `/lgpd`
- **Contexto**: Página acessível na área autenticada do sistema (`(authenticated)/lgpd/page.tsx`).

## Conteúdo da página

A página descreve:

1. **Tratamento de dados pessoais** — Uso transparente e seguro dos dados na plataforma ELO e nos sistemas do Grupo RHenz.
2. **Base legal** — Execução de contrato ou medidas pré-contratuais (relação de trabalho), cumprimento de obrigação legal e legítimo interesse para operação dos sistemas.
3. **Finalidades do tratamento** — Inclui gestão da relação de trabalho, **pré-cadastro e processamento de pedidos na Lojinha (SIGIN)** (nome, CPF, endereço, RG, e-mail, telefone), organização de eventos, formulários, encartes, agendamentos e controle de acesso.
4. **Direitos do titular** — Acesso, correção, anonimização, eliminação, portabilidade e revogação do consentimento; contato com o DPO.
5. **Contato do encarregado de dados (DPO)** — Canal para dúvidas e exercício de direitos (RH ou canal indicado internamente).

## Alinhamento com o contrato de trabalho (termo de tratamento de dados)

O contrato de trabalho prevê, em resumo:

- **Dados tratados** (quando necessário): nome completo, data de nascimento, RG, CPF, Título de Eleitor, CNH, vale transporte, PIS, CTPS, fotografia, certidões, diploma, endereço, telefone/WhatsApp/e-mail, dados bancários, exames e atestados médicos, certidões de filhos (nascimento, vacinação, matrícula), carteira profissional.
- **Finalidades**: identificação e contato em razão do contrato; cumprimento de obrigações legais (trabalhista e previdenciária); admissão e execução do contrato; fiscalização; execução de contrato do qual o empregado seja parte; a pedido do titular; exercício de direitos em processo; proteção da vida ou saúde; tutela da saúde por profissionais/serviços de saúde; interesses legítimos (respeitados direitos fundamentais); contratação de vale alimentação/transporte; contratação de outros benefícios com interesse do empregado.
- **Compartilhamento**: a empregadora pode compartilhar dados com outros agentes de tratamento quando necessário para essas finalidades (ex.: assessoria contábil e jurídica, folha de pagamento), respeitando boa-fé, finalidade, adequação e necessidade.
- **Segurança**: medidas técnicas e administrativas para proteger os dados; comunicação à ANPD em caso de incidente que possa acarretar risco ou dano relevante (art. 48 da Lei nº 13.709/2020).
- **Retenção**: dados mantidos durante o contrato e, após o término, pelo tempo necessário para cumprimento de obrigação legal ou de órgãos de fiscalização (art. 16 da Lei nº 13.709/2018).
- **Revogação do consentimento**: o empregado pode revogar o consentimento a qualquer tempo, por e-mail ou carta; os tratamentos realizados sob o consentimento anterior permanecem válidos; o empregado fica ciente das consequências da revogação (art. 8º, §5º, Lei nº 13.709/2020).
- **Guarda mínima**: a empregadora permanecerá com os dados pelo período mínimo de guarda de documentos trabalhistas, previdenciários e de segurança e saúde no trabalho, mesmo após o encerramento do vínculo.
- **Responsabilidade**: em caso de vazamento ou acesso não autorizado, as partes podem acordar sobre eventuais danos; na ausência de acordo, aplicam-se as penalidades do art. 52 da Lei nº 13.709/2018.
- **Obrigações do empregado**: guarda de login e senha; uso de dispositivos e redes confiáveis; comunicação imediata em caso de perda ou divulgação de credenciais; adoção das medidas de segurança orientadas pela empregadora; responsabilização em caso de vazamento por conduta em desconformidade.

## Uso no sistema

- A **janela de pré-cadastro da Lojinha** informa que os dados são para pré-cadastro no SIGIN e que estão seguros conforme esta política, com link para `/lgpd`.
- Na **aba Dados privados** do painel de usuários, ao acessar a aba é exibido uma notificação lembrando que os dados são protegidos pela LGPD e que o usuário está ciente ao acessar; a política completa está em `/lgpd`.
- Os **dados coletados na etapa primária da Lojinha** (pré-cadastro) ficam visíveis para quem emite/visualiza o pedido: no botão **Detalhes** do pedido (card **Dados do Cliente**) e no **e-mail de notificação** enviado ao colaborador responsável pelos pedidos.

## Referência

- **Componente da página**: `src/app/(authenticated)/lgpd/page.tsx`
- **Módulo relacionado**: [Loja (shop)](./shop.md#-pré-cadastro-lojinha-sigin) — pré-cadastro Lojinha e dados armazenados em `users`.
