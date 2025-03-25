"use server"
import nodemailer from 'nodemailer';

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> {

  const transporter = nodemailer.createTransport({
    host: process.env.MAILHOST,
    port: process.env.MAILPORT??465,
    secure: false,
    auth: {
      user: process.env.MAILUSER??'', // Seu e-mail
      pass: process.env.MAILPASS??'', // Sua senha
    },
  });

  // Configuração do e-mail
  const mailOptions = {
    from: '"Intranet Grupo RHenz" <elo@intranet.boxdistribuidor.com.br>', // Remetente
    to: to, // Destinatário
    subject: subject, // Assunto
    html: htmlContent, // Conteúdo HTML
  };

  // Envio do e-mail
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado para: %s', to);
  } catch (error) {
    console.error('Erro ao enviar e-mail: ', error);
  }
}
