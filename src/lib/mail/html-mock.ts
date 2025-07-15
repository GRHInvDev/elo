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
        preco: number;
        observacoes: string | null;
    }>,
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
                    max-width: 800px;
                    margin: auto;
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #555;
                }
                .order-summary {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                }
                .order-list {
                    margin: 20px 0;
                }
                .order-item {
                    background-color: #ffffff;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    padding: 10px;
                    margin: 10px 0;
                }
                .total {
                    font-weight: bold;
                    font-size: 18px;
                    color: #333;
                    border-top: 2px solid #333;
                    padding-top: 10px;
                    margin-top: 15px;
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
                <h1>Pedidos do Dia - ${nomeRestaurante}</h1>
                <p>Data: ${dataPedidos}</p>
                <p>Total de pedidos: ${pedidos.length}</p>
                
                <div class="order-summary">
                    <h3>Resumo dos Pedidos:</h3>
                    <div class="order-list">
                        ${pedidos.map((pedido, index) => `
                            <div class="order-item">
                                <strong>Pedido ${index + 1}:</strong><br>
                                <strong>Cliente:</strong> ${pedido.nomeUsuario}<br>
                                <strong>Prato:</strong> ${pedido.prato}<br>
                                <strong>Preço:</strong> R$ ${pedido.preco.toFixed(2)}<br>
                                ${pedido.observacoes ? `<strong>Observações:</strong> ${pedido.observacoes}<br>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="total">
                        <strong>Valor Total: R$ ${pedidos.reduce((total, pedido) => total + pedido.preco, 0).toFixed(2)}</strong>
                    </div>
                </div>

                <p>Por favor, prepare os pedidos para entrega no horário de almoço.</p>

                <div class="footer">
                    <p>Atenciosamente,</p>
                    <p>Equipe de suporte</p>
                    <p>elo</p>
                </div>
            </div>
        </body>
    </html>
`)