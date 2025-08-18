export const mockEmailRespostaFormulario = (
    nomeAutor: string,
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
                <h1>Olá, ${nomeAutor}!</h1>
                <p>Você acabou de receber uma resposta no seu formulário "${nomeFormulario}".</p>
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
// apagar os dados mock abaixo após testar

export type MockPedido = {
    num: number;
    data: string;
    func: string;
    prato: string;
    opc: string | null | undefined;
    obs: string | null;
  };
  
  function getGroupKey(p: MockPedido) {
    const opc = (p.opc ?? "").trim();
    return opc ? `${p.prato} com ${opc}` : `${p.prato} sem adicional`;
  }
  
  function groupPedidosByPratoOpc(pedidos: MockPedido[]) {
    const groups = new Map<string, MockPedido[]>();
    for (const p of pedidos) {
      const key = getGroupKey(p);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return groups;
  }
      
  export const mockEmailPedidosRestauranteAgrupado = (
    nomeRestaurante: string,
    dataPedidos: string,
    pedidos: MockPedido[],
  ) => {
    const groups = groupPedidosByPratoOpc(pedidos);
    const totalPedidos = pedidos.length;
  
    const totalsHtml = Array.from(groups.entries())
      .map(([key, arr]) => `<li><strong>Total de pedidos com ${key}:</strong> ${arr.length}</li>`)
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
                <div><strong>Opcionais:</strong> ${p.opc}</div>
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