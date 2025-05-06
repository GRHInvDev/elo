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