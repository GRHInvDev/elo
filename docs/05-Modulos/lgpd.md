# Política de Privacidade e Proteção de Dados (LGPD)

## Visão geral

A plataforma ELO dispõe de uma **página dedicada de Política de Privacidade e Proteção de Dados**, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).

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

## Uso no sistema

- O **Dialog de pré-cadastro da Lojinha** informa que os dados são para pré-cadastro no SIGIN e que estão seguros conforme esta política, com link para `/lgpd`.
- Na **aba Dados privados** do painel de usuários (`/admin/users`), ao acessar a aba é exibido um toast lembrando que os dados são protegidos pela LGPD e que o usuário está ciente ao acessar; a política completa está em `/lgpd`.

## Referência

- **Componente da página**: `src/app/(authenticated)/lgpd/page.tsx`
- **Módulo relacionado**: [Loja (shop)](./shop.md#-pré-cadastro-lojinha-sigin) — pré-cadastro Lojinha e dados armazenados em `users`.
