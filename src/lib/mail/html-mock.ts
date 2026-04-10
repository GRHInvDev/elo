import { formatFormResponseNumber } from "@/lib/utils/form-response-number"

export const mockEmailRespostaFormulario = (
  nomeAutor: string,
  idFormulario: string,
  nomeFormulario: string,
  chamadoNumero: number | null | undefined,
) => {
  const chamadoLabel = formatFormResponseNumber(chamadoNumero ?? null)
  const chamadoBlock = chamadoLabel
    ? `<p><strong>Número do chamado:</strong> ${chamadoLabel}</p>`
    : ""
  return (`
    <!DOCTYPE html>
    <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    max-width: 600px;
                    margin: auto;
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #555;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #aaa;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Olá, ${nomeAutor}!</h1>
                <p>Você acabou de receber uma resposta no seu formulário "${nomeFormulario}".</p>
                ${chamadoBlock}
                <p>Por favor, clique no link abaixo para conferir a resposta:</p>
                <p><a href="https://intranet.boxdistribuidor.com.br/forms/${idFormulario}/responses" style="color: #007BFF;">Ver Resposta</a></p>

                <div class="footer">
                    <p>Atenciosamente,</p>
                    <p>Equipe de suporte</p>
                    <p>elo</p>
                </div>
            </div>
        </body>
    </html>
`)
}

export const mockEmailSituacaoFormulario = (
  nomeUsuario: string,
  status: string,
  idResponse: string,
  idFormulario: string,
  nomeFormulario: string,
) => (`
    <!DOCTYPE html>
    <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    max-width: 600px;
                    margin: auto;
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #555;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #aaa;
                }
            </style>
        </head>
    <body>
        <div class="container">
            <h1>Olá, ${nomeUsuario}!</h1>
            <p>Sua resposta ao formulário "${nomeFormulario}" teve o status atualizado para "${status}".</p>
            <p>Por favor, clique no link abaixo para conferir:</p>
            <p><a href="https://intranet.boxdistribuidor.com.br/forms/${idFormulario}/responses/${idResponse}" style="color: #007BFF;">Ver status</a></p>

            <div class="footer">
                <p>Atenciosamente,</p>
                <p>Equipe de suporte</p>
                <p>elo</p>
            </div>
        </div>
    </body>
</html>
`)

export const mockEmailTagFormulario = (
  nomeUsuario: string,
  executorNome: string,
  tagName: string,
  idResponse: string,
  idFormulario: string,
  nomeFormulario: string,
) => (`
    <!DOCTYPE html>
    <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    max-width: 600px;
                    margin: auto;
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #555;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #aaa;
                }
            </style>
        </head>
    <body>
        <div class="container">
            <h1>Olá, ${nomeUsuario}!</h1>
            <p>${executorNome} adicionou sua solicitação no formulário "${nomeFormulario}" para a tag "${tagName}".</p>
            <p>Por favor, clique no link abaixo para conferir:</p>
            <p><a href="https://intranet.boxdistribuidor.com.br/forms/${idFormulario}/responses/${idResponse}" style="color: #007BFF;">Ver solicitação</a></p>

            <div class="footer">
                <p>Atenciosamente,</p>
                <p>Equipe de suporte</p>
                <p>elo</p>
            </div>
        </div>
    </body>
</html>
`)

export const mockEmailReservaCarro = (
  nomeUsuario: string,
  idReserva: string,
  idVeiculo: string,
  modeloVeiculo: string,
  dataInicio: string,
  dataFim: string,
) => (`
    <!DOCTYPE html>
    <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    max-width: 600px;
                    margin: auto;
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #555;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #aaa;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Olá, ${nomeUsuario}!</h1>
                <p>Sua reserva do veículo "${modeloVeiculo}" foi confirmada.</p>
                <p>Detalhes da reserva:</p>
                <ul>
                    <li>Período: ${dataInicio} a ${dataFim}</li>
                    <li>ID da Reserva: ${idReserva}</li>
                    <li>ID do Veículo: ${idVeiculo}</li>
                </ul>
                <p>Por favor, entre em contato caso precise de mais informações.</p>

                <div class="footer">
                    <p>Atenciosamente,</p>
                    <p>Equipe de suporte</p>
                    <p>elo</p>
                </div>
            </div>
        </body>
    </html>
`)

export const mockEmailPedidoComida = (
  nomeUsuario: string,
  nomeRestaurante: string,
  nomePrato: string,
  preco: number,
  dataPedido: string,
  observacoes: string | null,
  opcionais: string[] = [],
) => (`
    <!DOCTYPE html>
    <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    max-width: 600px;
                    margin: auto;
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #555;
                }
                .order-details {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #aaa;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Olá, ${nomeUsuario}!</h1>
                <p>Seu pedido de comida foi confirmado com sucesso!</p>
                
                <div class="order-details">
                    <h3>Detalhes do Pedido:</h3>
                    <ul>
                        <li><strong>Restaurante:</strong> ${nomeRestaurante}</li>
                        <li><strong>Prato:</strong> ${nomePrato}</li>
                        <li><strong>Preço:</strong> R$ ${preco.toFixed(2)}</li>
                        <li><strong>Data do Pedido:</strong> ${dataPedido}</li>
                        ${opcionais && opcionais.length > 0 ? `<li><strong>Opcionais:</strong> ${opcionais.join(", ")}</li>` : ''}
                        ${observacoes ? `<li><strong>Observações:</strong> ${observacoes}</li>` : ''}
                    </ul>
                </div>

                <p>Seu pedido será entregue no horário de almoço. Bom apetite!</p>

                <div class="footer">
                    <p>Atenciosamente,</p>
                    <p>Equipe de suporte</p>
                    <p>elo</p>
                </div>
            </div>
        </body>
    </html>
`)

export const mockEmailPedidosRestaurante = (
  nomeRestaurante: string,
  dataPedidos: string,
  pedidos: Array<{
    nomeUsuario: string;
    prato: string;
    observacoes: string | null;
    opcionais?: string[];
  }>,
) => (`
    <!DOCTYPE html>
    <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pedidos do Dia - ${nomeRestaurante}</title>
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    background-color: #f7f7f7;
                    margin: 0;
                    padding: 0;
                    -webkit-text-size-adjust: 100%;
                    -ms-text-size-adjust: 100%;
                    color: #333;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    margin: 20px auto;
                    max-width: 800px;
                    overflow: hidden;
                }
                .header {
                    background-color: #007bff; /* Azul vibrante */
                    color: #fff;
                    padding: 24px 20px;
                    text-align: center;
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 2.2rem;
                    line-height: 1.2;
                }
                .header p {
                    margin: 8px 0 0;
                    font-size: 1rem;
                    opacity: 0.9;
                }
                .content-section {
                    padding: 20px 30px;
                }
                .info-block {
                    background-color: #e9f7ff; /* Azul claro para o bloco de informações */
                    border-left: 5px solid #007bff;
                    padding: 15px 20px;
                    margin-bottom: 25px;
                    border-radius: 4px;
                    font-size: 1.05rem;
                }
                .info-block div {
                    margin-bottom: 5px;
                }
                .info-block div:last-child {
                    margin-bottom: 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                th, td {
                    border: 1px solid #e0e0e0;
                    padding: 12px 15px;
                    text-align: left;
                    vertical-align: top;
                }
                th {
                    background-color: #f0f4f7; /* Cinza claro azulado */
                    color: #555;
                    font-weight: bold;
                    font-size: 0.95rem;
                    text-transform: uppercase;
                }
                tr:nth-child(even) {
                    background-color: #fbfbfb; /* Cinza muito claro */
                }
                .opcionais-list {
                    margin: 0;
                    padding-left: 20px;
                    list-style-type: disc;
                }
                .opcionais-list li {
                    margin-bottom: 3px;
                }
                .no-data {
                    color: #aaa;
                    font-style: italic;
                }
                .call-to-action {
                    text-align: center;
                    margin: 30px 0;
                }
                .button {
                    display: inline-block;
                    background-color: #28a745; /* Verde para call to action */
                    color: #ffffff;
                    padding: 12px 25px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 1.05rem;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 0.85rem;
                    color: #888;
                    border-top: 1px solid #eee;
                    padding: 20px 30px;
                    text-align: center;
                    background-color: #f0f0f0;
                    border-bottom-left-radius: 8px;
                    border-bottom-right-radius: 8px;
                }

                @media screen and (max-width: 600px) {
                    .container {
                        margin: 10px;
                        border-radius: 0;
                    }
                    .content-section {
                        padding: 15px 20px;
                    }
                    .header {
                        padding: 20px 15px;
                        border-radius: 0;
                    }
                    .header h1 {
                        font-size: 1.8rem;
                    }
                    table {
                        display: block;
                        overflow-x: auto;
                        white-space: nowrap;
                    }
                    thead {
                        display: none; /* Hide header on small screens */
                    }
                    tr {
                        display: block;
                        margin-bottom: 10px;
                        border: 1px solid #e0e0e0;
                        border-radius: 4px;
                    }
                    td {
                        display: block;
                        text-align: right;
                        border: none;
                        border-bottom: 1px solid #eee;
                        padding: 10px 15px;
                        position: relative;
                        padding-left: 50%;
                    }
                    td:last-child {
                        border-bottom: none;
                    }
                    td::before {
                        content: attr(data-label);
                        position: absolute;
                        left: 15px;
                        width: calc(50% - 30px);
                        text-align: left;
                        font-weight: bold;
                        color: #555;
                    }
                    td:nth-of-type(1)::before { content: "Nº"; }
                    td:nth-of-type(2)::before { content: "Cliente"; }
                    td:nth-of-type(3)::before { content: "Prato"; }
                    td:nth-of-type(4)::before { content: "Opcionais"; }
                    td:nth-of-type(5)::before { content: "Observações"; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Pedidos do Dia</h1>
                    <p>${nomeRestaurante}</p>
                </div>
                <div class="content-section">
                    <div class="info-block">
                        <div><strong>Data:</strong> ${dataPedidos}</div>
                        <div><strong>Total de Pedidos:</strong> ${pedidos.length}</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Funcionário</th>
                                <th>Prato</th>
                                <th>Opcionais</th>
                                <th>Observações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pedidos.map((pedido, index) => `
                                <tr>
                                    <td data-label="Nº">${index + 1}</td>
                                    <td data-label="Funcionário">${pedido.nomeUsuario}</td>
                                    <td data-label="Prato">${pedido.prato}</td>
                                    <td data-label="Opcionais">
                                        ${(pedido.opcionais && pedido.opcionais.length > 0)
    ? `<ul class='opcionais-list'>${pedido.opcionais.map(opc => `<li>${opc}</li>`).join('')}</ul>`
    : '<span class="no-data">-</span>'}
                                    </td>
                                    <td data-label="Observações">${pedido.observacoes ?? '<span class="no-data">-</span>'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p style="font-size:1.1rem; color:#333; text-align: center; margin-bottom: 30px;">Por favor, prepare os pedidos para entrega no horário de almoço.</p>
                </div>
                <div class="footer">
                    <p>Atenciosamente,</p>
                    <p>Equipe de suporte elo</p>
                </div>
            </div>
        </body>
    </html>
`)
export type GroupedEmailOrder = {
  num: number;
  data: string;
  func: string;
  prato: string;
  opc: string | null | undefined;
  obs: string | null;
};

export const mockEmailNotificacaoSugestao = (
  nomeUsuario: string,
  analyst: string,
  ideaNumber: number,
  status: string,
  motivo?: string
) => (`
  <!DOCTYPE html>
  <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  background-color: #f7f7f7;
                  margin: 0;
                  padding: 20px;
                  color: #333;
              }
              .container {
                  background-color: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                  padding: 30px;
                  max-width: 600px;
                  margin: auto;
              }
              .header {
                  text-align: center;
                  margin-bottom: 30px;
                  padding-bottom: 20px;
                  border-bottom: 2px solid #f0f0f0;
              }
              .header h1 {
                  color: #007bff;
                  margin: 0 0 10px;
                  font-size: 1.8rem;
              }
              .header p {
                  color: #666;
                  margin: 0;
                  font-size: 1rem;
              }
              .content {
                  margin-bottom: 30px;
              }
              .info-box {
                  background-color: #f8f9fa;
                  border-left: 4px solid #007bff;
                  padding: 15px 20px;
                  margin-bottom: 20px;
                  border-radius: 4px;
              }
              .info-box p {
                  margin: 8px 0;
                  color: #555;
              }
              .motivo-box {
                  background-color: #fff3cd;
                  border: 1px solid #ffeaa7;
                  border-left: 4px solid #f39c12;
                  padding: 15px 20px;
                  margin-bottom: 20px;
                  border-radius: 4px;
              }
              .motivo-box h3 {
                  color: #856404;
                  margin: 0 0 10px;
                  font-size: 1.1rem;
              }
              .motivo-box p {
                  color: #856404;
                  margin: 0;
                  font-size: 0.95rem;
                  line-height: 1.4;
              }
              .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e9ecef;
                  font-size: 0.9rem;
                  color: #666;
                  text-align: center;
              }
              .footer p {
                  margin: 5px 0;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Atualização da Ideia</h1>
                  <p>Sua ideia foi avaliada</p>
              </div>

              <div class="content">
                  <div class="info-box">
                      <p><strong>Olá, ${nomeUsuario}!</strong></p>
                      <p>Sua ideia <strong>#${ideaNumber}</strong> teve o status atualizado.</p>
                      <p><strong>Status:</strong> ${status}</p>
                      <p><strong>Responsável pela devolutiva:</strong> ${analyst}</p>
                  </div>

                  ${motivo ? `
                  <div class="motivo-box">
                      <h3>Motivo da decisão:</h3>
                      <p>${motivo}</p>
                  </div>
                  ` : ''}

                  <p>Para visualizar os detalhes completos da sua ideia, acesse a intranet.</p>
              </div>

              <div class="footer">
                  <p>Atenciosamente,</p>
                  <p>Equipe de Avaliação de Ideias</p>
                  <p>elo - Sistema de Intranet</p>
              </div>
          </div>
      </body>
  </html>
`);

function normalizeStr(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getGroupKey(p: GroupedEmailOrder) {
  const opcRaw = (p.opc ?? "").trim();
  if (!opcRaw) return `${p.prato} sem adicional`;

  // Quebra por vírgula e limpa
  const tokens = opcRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Dedupe e normalização de pares chave:valor (ex.: "Feijão: Sim") - seja la o que for dedupe
  const map = new Map<
    string,
    { display: string; value: string }
  >();

  for (const tok of tokens) {
    const parts = tok.split(":");
    const kRaw = parts[0]?.trim();
    const vRaw = parts.slice(1).join(":").trim(); // suporta "Observação: algo: extra"
    if (!kRaw || !vRaw) continue;

    const kNorm = normalizeStr(kRaw);
    const display =
      kNorm === "feijao" ? "Feijão" : kNorm === "salada" ? "Salada" : kRaw;

    const vBase = normalizeStr(vRaw);
    const v = vBase.startsWith("s")
      ? "Sim"
      : vBase.startsWith("n")
        ? "Não"
        : vRaw;

    if (map.has(kNorm)) {
      // Se já existir, prioriza "Sim" se houver conflito/duplicata
      const prev = map.get(kNorm)!;
      const newVal = prev.value === "Sim" || v === "Sim" ? "Sim" : v;
      map.set(kNorm, { display, value: newVal });
    } else {
      map.set(kNorm, { display, value: v });
    }
  }

  // Completa pares esperados: se só veio Salada, assume Feijão: Não; e vice-versa
  const hasFeijao = map.has("feijao");
  const hasSalada = map.has("salada");
  if (hasFeijao && !hasSalada) map.set("salada", { display: "Salada", value: "Não" });
  if (hasSalada && !hasFeijao) map.set("feijao", { display: "Feijão", value: "Não" });

  // Se tudo é "Não", trata como "sem adicional"
  const entries = Array.from(map.values());
  const allNo = entries.length > 0 && entries.every((e) => e.value === "Não");
  if (allNo) return `${p.prato} sem adicional`;

  // Ordena: Feijão, Salada, depois demais chaves em ordem alfabética
  const ordered: Array<{ display: string; value: string }> = [
    ...(["feijao", "salada"] as const)
      .filter((k) => map.has(k))
      .map((k) => map.get(k)!),
    ...Array.from(map.entries())
      .filter(([k]) => k !== "feijao" && k !== "salada")
      .sort((a, b) =>
        a[1].display.localeCompare(b[1].display, "pt-BR", {
          sensitivity: "base",
        }),
      )
      .map(([, v]) => v),
  ];

  const normalized = ordered
    .map(({ display, value }) => `${display}: ${value}`)
    .join(", ");

  return `${p.prato} com ${normalized}`;
}

function groupPedidosByPratoOpc(pedidos: GroupedEmailOrder[]) {
  const groups = new Map<string, GroupedEmailOrder[]>();
  for (const p of pedidos) {
    const key = getGroupKey(p);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return groups;
}

export const mockEmailPedidoProduto = (
  nomeUsuario: string,
  nomeProduto: string,
  quantidade: number,
  precoUnitario: number,
  precoTotal: number,
  empresa: string,
  dataPedido: string,
) => (`
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin: 20px auto;
          max-width: 600px;
          overflow: hidden;
        }
        .header {
          background-color: #007bff;
          color: #fff;
          padding: 24px 20px;
          text-align: center;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .header h1 {
          margin: 0;
          font-size: 2rem;
          line-height: 1.2;
        }
        .content-section {
          padding: 30px;
        }
        .info-box {
          background-color: #e9f7ff;
          border-left: 5px solid #007bff;
          padding: 20px;
          margin-bottom: 25px;
          border-radius: 4px;
        }
        .info-box h2 {
          margin: 0 0 15px;
          color: #007bff;
          font-size: 1.3rem;
        }
        .order-details {
          background-color: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .order-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .order-details td {
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .order-details td:first-child {
          font-weight: bold;
          color: #555;
          width: 40%;
        }
        .order-details tr:last-child td {
          border-bottom: none;
        }
        .total-box {
          background-color: #007bff;
          color: #fff;
          padding: 15px 20px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 20px;
        }
        .total-box .label {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        .total-box .value {
          font-size: 1.8rem;
          font-weight: bold;
          margin-top: 5px;
        }
        .instructions {
          background-color: #fff3cd;
          border-left: 5px solid #ffc107;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .instructions h3 {
          margin: 0 0 10px;
          color: #856404;
          font-size: 1.1rem;
        }
        .instructions p {
          margin: 8px 0;
          color: #856404;
          line-height: 1.6;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          font-size: 0.9rem;
          color: #666;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pedido Recebido!</h1>
        </div>
        <div class="content-section">
          <div class="info-box">
            <h2>Olá, ${nomeUsuario}!</h2>
            <p>Seu pedido foi recebido com sucesso e está sendo processado.</p>
          </div>

          <div class="order-details">
            <table>
              <tr>
                <td>Produto:</td>
                <td>${nomeProduto}</td>
              </tr>
              <tr>
                <td>Empresa:</td>
                <td>${empresa}</td>
              </tr>
              <tr>
                <td>Quantidade:</td>
                <td>${quantidade} unidade${quantidade > 1 ? 's' : ''}</td>
              </tr>
              <tr>
                <td>Preço Unitário:</td>
                <td>R$ ${precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>Data do Pedido:</td>
                <td>${dataPedido}</td>
              </tr>
            </table>
          </div>

          <div class="total-box">
            <div class="label">Total do Pedido</div>
            <div class="value">R$ ${precoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div class="instructions">
            <h3>📦 Instruções para Retirada</h3>
            <p><strong>Local e prazo:</strong>Seu pedido estará disponível para retirada na Expedição em Santa Cruz do Sul em 24 horas após a confirmação.</p>
            <p><strong>Exemplo:</strong>Pedido confirmado às 14h → retirada liberada após as 14h do próximo dia útil. </p>
            <p><strong>Importante:</strong>Equipe de outras unidades receberão contato da equipe interna para agendar retirada ou envio.</p>
            <p>Dúvidas? Use o chat na opção Shop → Meus Pedidos no Elo | Intranet.</p>
          </div>

          <div class="footer">
            <p>Atenciosamente,</p>
            <p>Equipe de Suporte</p>
            <p>elo - Sistema de Intranet</p>
          </div>
        </div>
      </div>
    </body>
  </html>
`)

// Tipo para item do pedido
export interface OrderItem {
  nome: string
  codigo?: string | null
  quantidade: number
  precoUnitario: number
  subtotal: number
}

/** Dados do pré-cadastro Lojinha (etapa primária) para exibir no e-mail de notificação ao responsável pelos pedidos */
export interface LojinhaClientData {
  lojinha_full_name?: string | null
  lojinha_cpf?: string | null
  lojinha_address?: string | null
  lojinha_neighborhood?: string | null
  lojinha_cep?: string | null
  lojinha_rg?: string | null
  lojinha_email?: string | null
  lojinha_phone?: string | null
}

export const mockEmailNotificacaoPedidoProduto = (
  nomeUsuario: string,
  emailUsuario: string,
  nomeProduto: string,
  quantidade: number,
  precoTotal: number,
  empresa: string,
  dataPedido: string,
  contactWhatsapp?: string,
  itens?: OrderItem[], // Lista de itens para pedidos agrupados
  codigoProduto?: string | null,
  dadosClienteLojinha?: LojinhaClientData | null,
) => {
  // Se itens foi fornecido, usar a lista de itens; caso contrário, criar um item único
  const itemsList: OrderItem[] = itens ?? [{
    nome: nomeProduto,
    quantidade,
    precoUnitario: precoTotal / quantidade,
    subtotal: precoTotal
  }]

  // Gerar HTML da tabela de itens
  const itemsTable = itemsList.map((item, index) => {
    const precoUnitario = item.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const subtotal = item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `
    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <strong>${item.nome}</strong>
        ${item.codigo ? `<br><small style="color: #666;">Código: ${item.codigo}</small>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
        ${item.quantidade}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">
        R$ ${precoUnitario}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">
        R$ ${subtotal}
      </td>
    </tr>
  `
  }).join('')

  const precoTotalFormatado = precoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin: 20px auto;
          max-width: 600px;
          overflow: hidden;
        }
        .header {
          background-color: #28a745;
          color: #fff;
          padding: 24px 20px;
          text-align: center;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .header h1 {
          margin: 0;
          font-size: 2rem;
          line-height: 1.2;
        }
        .content-section {
          padding: 30px;
        }
        .alert-box {
          background-color: #d4edda;
          border-left: 5px solid #28a745;
          padding: 20px;
          margin-bottom: 25px;
          border-radius: 4px;
        }
        .alert-box h2 {
          margin: 0 0 10px;
          color: #155724;
          font-size: 1.3rem;
        }
        .order-details {
          background-color: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .order-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .order-details td {
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .order-details td:first-child {
          font-weight: bold;
          color: #555;
          width: 40%;
        }
        .order-details tr:last-child td {
          border-bottom: none;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          font-size: 0.9rem;
          color: #666;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Novo Pedido Recebido</h1>
        </div>
        <div class="content-section">
          <div class="alert-box">
            <h2>⚠️ Novo Pedido de Produto</h2>
            <p style="margin: 0; color: #155724;">Um novo pedido foi realizado e requer atenção.</p>
          </div>

          <div class="order-details">
            <table>
              <tr>
                <td>Cliente:</td>
                <td>${nomeUsuario}</td>
              </tr>
              <tr>
                <td>Email:</td>
                <td>${emailUsuario}</td>
              </tr>
              ${contactWhatsapp ? `
              <tr>
                <td>WhatsApp:</td>
                <td>${contactWhatsapp}</td>
              </tr>` : ""}
              <tr>
                <td>Empresa:</td>
                <td>${empresa}</td>
              </tr>
              <tr>
                <td>Data do Pedido:</td>
                <td>${dataPedido}</td>
              </tr>
            </table>
          </div>

          ${(dadosClienteLojinha && [
            dadosClienteLojinha.lojinha_full_name,
            dadosClienteLojinha.lojinha_cpf,
            dadosClienteLojinha.lojinha_address,
            dadosClienteLojinha.lojinha_neighborhood,
            dadosClienteLojinha.lojinha_cep,
            dadosClienteLojinha.lojinha_rg,
            dadosClienteLojinha.lojinha_email,
            dadosClienteLojinha.lojinha_phone,
          ].some(Boolean)) ? (() => {
            const d = dadosClienteLojinha
            const endereco = [d.lojinha_address, d.lojinha_neighborhood, d.lojinha_cep ? `CEP ${d.lojinha_cep}` : null].filter(Boolean).join(" — ") || "—"
            return `
          <div class="order-details" style="margin-top: 20px;">
            <h3 style="margin: 0 0 15px; color: #333; font-size: 1.1rem;">Dados do Cliente (pré-cadastro Lojinha)</h3>
            <table>
              ${d.lojinha_full_name ? `
              <tr>
                <td>Nome completo:</td>
                <td>${d.lojinha_full_name}</td>
              </tr>` : ""}
              ${d.lojinha_cpf ? `
              <tr>
                <td>CPF:</td>
                <td>${d.lojinha_cpf}</td>
              </tr>` : ""}
              ${d.lojinha_rg ? `
              <tr>
                <td>RG:</td>
                <td>${d.lojinha_rg}</td>
              </tr>` : ""}
              ${d.lojinha_email ? `
              <tr>
                <td>E-mail:</td>
                <td>${d.lojinha_email}</td>
              </tr>` : ""}
              ${d.lojinha_phone ? `
              <tr>
                <td>Telefone:</td>
                <td>${d.lojinha_phone}</td>
              </tr>` : ""}
              ${(d.lojinha_address || d.lojinha_neighborhood || d.lojinha_cep) ? `
              <tr>
                <td>Endereço:</td>
                <td>${endereco}</td>
              </tr>` : ""}
            </table>
          </div>
          `
          })() : ""}

          ${itemsList.length > 0 ? `
          <div class="order-details" style="margin-top: 20px;">
            <h3 style="margin: 0 0 15px; color: #333; font-size: 1.1rem;">Itens do Pedido:</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
              <thead>
                <tr style="background-color: #28a745; color: #fff;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #1e7e34;">Produto</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #1e7e34;">Quantidade</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #1e7e34;">Preço Unitário</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #1e7e34;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTable}
                <tr style="background-color: #28a745; color: #fff; font-weight: bold;">
                  <td colspan="3" style="padding: 12px; text-align: right; border-top: 2px solid #1e7e34;">Total:</td>
                  <td style="padding: 12px; text-align: right; border-top: 2px solid #1e7e34;">
                    R$ ${precoTotalFormatado}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : `
          <div class="order-details" style="margin-top: 20px;">
            <table>
              <tr>
                <td>Produto:</td>
                <td>${nomeProduto}</td>
              </tr>
              <tr>
                <td>Código do Produto:</td>
                <td>${codigoProduto}</td>
              </tr>
              <tr>
                <td>Quantidade:</td>
                <td>${quantidade} unidade${quantidade > 1 ? 's' : ''}</td>
              </tr>
              <tr>
                <td>Valor Total:</td>
                <td>R$ ${precoTotalFormatado}</td>
              </tr>
            </table>
          </div>
          `}

          <div class="footer">
            <p>Atenciosamente,</p>
            <p>Sistema de Notificações</p>
            <p>elo - Sistema de Intranet</p>
          </div>
        </div>
      </div>
    </body>
  </html>
`
}

export const mockEmailChatMensagemPedido = (
  nomeDestinatario: string,
  nomeRemetente: string,
  mensagem: string,
  orderId: string,
  produtoNome?: string,
  isComprador?: boolean, // Se true, o destinatário é o comprador (link para /shop)
) => (`
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin: 20px auto;
          max-width: 600px;
          overflow: hidden;
        }
        .header {
          background-color: #007bff;
          color: #fff;
          padding: 24px 20px;
          text-align: center;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .header h1 {
          margin: 0;
          font-size: 1.8rem;
          line-height: 1.2;
        }
        .content-section {
          padding: 30px;
        }
        .info-box {
          background-color: #e9f7ff;
          border-left: 5px solid #007bff;
          padding: 20px;
          margin-bottom: 25px;
          border-radius: 4px;
        }
        .info-box h2 {
          margin: 0 0 10px;
          color: #007bff;
          font-size: 1.2rem;
        }
        .message-box {
          background-color: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .message-box .sender {
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        .message-box .message {
          color: #333;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .order-info {
          background-color: #fff3cd;
          border-left: 5px solid #ffc107;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .order-info p {
          margin: 5px 0;
          color: #856404;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: #fff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
          font-weight: bold;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          font-size: 0.9rem;
          color: #666;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 Nova Mensagem em Pedidos</h1>
        </div>
        <div class="content-section">
          <div class="info-box">
            <h2>Olá, ${nomeDestinatario}!</h2>
            <p>Você recebeu uma nova mensagem no chat de um pedido.</p>
          </div>

          ${produtoNome ? `
          <div class="order-info">
            <p><strong>Pedido relacionado:</strong> ${produtoNome}</p>
          </div>
          ` : ''}

          <div class="message-box">
            <div class="sender">De: ${nomeRemetente}</div>
            <div class="message">${mensagem}</div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://intranet.boxdistribuidor.com.br'}${isComprador ? '/shop' : '/admin/products'}" class="button" style="color: #fff; text-decoration: none;">
              Ver Mensagem
            </a>
          </div>

          <div class="footer">
            <p>Atenciosamente,</p>
            <p>Sistema de Notificações</p>
            <p>elo - Sistema de Intranet</p>
          </div>
        </div>
      </div>
    </body>
  </html>
`)

export const mockEmailChatMensagemFormulario = (
  nomeDestinatario: string,
  nomeRemetente: string,
  mensagem: string,
  responseId: string,
  formTitle: string,
  isAutor: boolean, // Se true, o destinatário é o autor da solicitação (link para /forms/my-responses)
  chamadoNumero?: number | null,
) => {
  const chamadoLabel = formatFormResponseNumber(chamadoNumero ?? null)
  const chamadoLine = chamadoLabel
    ? `<p><strong>Número do chamado:</strong> ${chamadoLabel}</p>`
    : ""
  return (`
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin: 20px auto;
          max-width: 600px;
          overflow: hidden;
        }
        .header {
          background-color: #007bff;
          color: #fff;
          padding: 24px 20px;
          text-align: center;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .header h1 {
          margin: 0;
          font-size: 1.8rem;
          line-height: 1.2;
        }
        .content-section {
          padding: 30px;
        }
        .info-box {
          background-color: #e9f7ff;
          border-left: 5px solid #007bff;
          padding: 20px;
          margin-bottom: 25px;
          border-radius: 4px;
        }
        .info-box h2 {
          margin: 0 0 10px;
          color: #007bff;
          font-size: 1.2rem;
        }
        .message-box {
          background-color: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .message-box .sender {
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        .message-box .message {
          color: #333;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .form-info {
          background-color: #fff3cd;
          border-left: 5px solid #ffc107;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .form-info p {
          margin: 5px 0;
          color: #856404;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: #fff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
          font-weight: bold;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          font-size: 0.9rem;
          color: #666;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 Nova Mensagem em Solicitação</h1>
        </div>
        <div class="content-section">
          <div class="info-box">
            <h2>Olá, ${nomeDestinatario}!</h2>
            <p>Você recebeu uma nova mensagem no chat de uma solicitação.</p>
          </div>

          <div class="form-info">
            <p><strong>Formulário:</strong> ${formTitle}</p>
            ${chamadoLine}
          </div>

          <div class="message-box">
            <div class="sender">De: ${nomeRemetente}</div>
            <div class="message">${mensagem}</div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://intranet.boxdistribuidor.com.br'}${isAutor ? '/forms/my-responses' : '/forms'}" class="button" style="color: #fff; text-decoration: none;">
              Ver Mensagem
            </a>
          </div>

          <div class="footer">
            <p>Atenciosamente,</p>
            <p>Sistema de Notificações</p>
            <p>elo - Sistema de Intranet</p>
          </div>
        </div>
      </div>
    </body>
  </html>
`)
}

export const emailPedidosRestauranteAgrupado = (
  nomeRestaurante: string,
  dataPedidos: string,
  pedidos: GroupedEmailOrder[],
) => {
  const groups = groupPedidosByPratoOpc(pedidos);
  const totalPedidos = pedidos.length;

  const totalsHtml = Array.from(groups.entries())
    .map(([key, arr]) => `<li><strong>Total de pedidos de ${key}:</strong> ${arr.length}</li>`)
    .join("");

  const sectionsHtml = Array.from(groups.entries())
    .map(([key, arr]) => {
      const itemsHtml = arr
        .map(
          (p) => `
              <div class="pedido">
                <div><strong>Pedido:</strong> ${p.num}</div>
                <div><strong>Data:</strong> ${p.data}</div>
                <div><strong>Funcionário:</strong> ${p.func}</div>
                <div><strong>Prato:</strong> ${p.prato}</div>
                <div><strong>Opcionais:</strong> ${(p.opc ?? "").trim() || "-"}</div>
                <div><strong>Observações:</strong> ${p.obs ?? "-"}</div>
              </div>
            `,
        )
        .join("");

      return `
          <section class="group">
            <h2>${key}</h2>
            <div class="group-count">Total de pedidos de ${key}: ${arr.length}</div>
            <div class="pedidos">
              ${itemsHtml}
            </div>
          </section>
        `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Pedidos do Dia - ${nomeRestaurante}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; color: #333; margin: 0; padding: 0; }
          .container { max-width: 900px; margin: 24px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
          .header { background: #0d6efd; color: #fff; padding: 20px; }
          .header h1 { margin: 0; }
          .summary { padding: 16px 20px; background: #f0f4ff; border-bottom: 1px solid #e6ecff; }
          .summary p { margin: 6px 0; }
          .summary ul { margin: 8px 0 0 20px; }
          .content { padding: 20px; }
          .group { margin-bottom: 24px; }
          .group h2 { margin: 0 0 6px; }
          .group-count { font-size: 0.95rem; color: #555; margin-bottom: 10px; }
          .pedidos { display: grid; grid-template-columns: 1fr; gap: 10px; }
          .pedido { padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; background: #fafafa; }
          .footer { padding: 14px 20px; background: #f5f5f5; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pedidos do Dia</h1>
            <div>${nomeRestaurante}</div>
          </div>
          <div class="summary">
            <p><strong>Data:</strong> ${dataPedidos}</p>
            <p><strong>Total de pedidos:</strong> ${totalPedidos}</p>
            <ul>
              ${totalsHtml}
            </ul>
          </div>
          <div class="content">
            ${sectionsHtml}
          </div>
          <div class="footer">
            <div>Este é um envio automático. Não responda este email.</div>
          </div>
        </div>
      </body>
    </html>
    `;
};

export const mockEmailAtualizacaoStatusPedido = (
  nomeUsuario: string,
  itens: OrderItem[],
  totalGeral: number,
  status: string,
  _empresa: string,
) => {
  const itemsTable = itens.map((item, index) => {
    const precoUnitario = item.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const subtotal = item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `
    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <strong>${item.nome}</strong>
        ${item.codigo ? `<br><small style="color: #666;">Código: ${item.codigo}</small>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
        ${item.quantidade}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">
        R$ ${precoUnitario}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">
        R$ ${subtotal}
      </td>
    </tr>
  `
  }).join('')

  const totalGeralFormatado = totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const statusColor = status === "Em Andamento" ? "#ffc107" : "#28a745"
  const statusBgColor = status === "Em Andamento" ? "#fff3cd" : "#d4edda"
  const statusBorderColor = status === "Em Andamento" ? "#ffc107" : "#28a745"

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin: 20px auto;
          max-width: 600px;
          overflow: hidden;
        }
        .header {
          background-color: ${statusColor};
          color: #fff;
          padding: 24px 20px;
          text-align: center;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .header h1 {
          margin: 0;
          font-size: 2rem;
          line-height: 1.2;
        }
        .content-section {
          padding: 30px;
        }
        .status-box {
          background-color: ${statusBgColor};
          border-left: 5px solid ${statusBorderColor};
          padding: 20px;
          margin-bottom: 25px;
          border-radius: 4px;
        }
        .status-box h2 {
          margin: 0 0 10px;
          color: ${status === "Em Andamento" ? "#856404" : "#155724"};
          font-size: 1.3rem;
        }
        .status-box p {
          margin: 8px 0;
          color: ${status === "Em Andamento" ? "#856404" : "#155724"};
        }
        .order-details {
          background-color: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .order-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .order-details th {
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #e0e0e0;
          font-weight: bold;
          color: #555;
        }
        .order-details td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        .total-box {
          background-color: ${statusColor};
          color: #fff;
          padding: 15px 20px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 20px;
        }
        .total-box .label {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        .total-box .value {
          font-size: 1.8rem;
          font-weight: bold;
          margin-top: 5px;
        }
        .instructions {
          background-color: #e9f7ff;
          border-left: 5px solid #007bff;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .instructions h3 {
          margin: 0 0 10px;
          color: #007bff;
          font-size: 1.1rem;
        }
        .instructions p {
          margin: 8px 0;
          color: #555;
          line-height: 1.6;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          font-size: 0.9rem;
          color: #666;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Atualização do Pedido</h1>
        </div>
        <div class="content-section">
          <div class="status-box">
            <h2>Olá, ${nomeUsuario}!</h2>
            <p>Seu pedido teve o status atualizado para: <strong>${status}</strong></p>
            ${status === "Em Andamento"
      ? "<p>Seu pedido está sendo preparado e em breve estará disponível para retirada.</p>"
      : "<p>Seu pedido foi processado e está pronto para retirada!</p>"
    }
          </div>

          <div class="order-details">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style="text-align: center;">Qtd</th>
                  <th style="text-align: right;">Preço Unit.</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTable}
              </tbody>
            </table>
          </div>

          <div class="total-box">
            <div class="label">Total do Pedido</div>
            <div class="value">R$ ${totalGeralFormatado}</div>
          </div>

          ${status === "Pedido Processado" ? `
          <div class="instructions">
            <h3>📦 Instruções para Retirada</h3>
            <p><strong>Local:</strong> Expedição em Santa Cruz do Sul</p>
            <p><strong>Prazo:</strong> Seu pedido está disponível para retirada.</p>
            <p><strong>Importante:</strong> Equipe de outras unidades receberão contato da equipe interna para agendar retirada ou envio.</p>
            <p>Dúvidas? Use o chat na opção Shop → Meus Pedidos no Elo | Intranet.</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Atenciosamente,</p>
            <p>Equipe de Suporte</p>
            <p>elo - Sistema de Intranet</p>
          </div>
        </div>
      </div>
    </body>
  </html>
  `
}