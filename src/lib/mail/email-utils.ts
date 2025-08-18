"use server"
import nodemailer from 'nodemailer';
import type SMTPPool from 'nodemailer/lib/smtp-pool';

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  cc?: string
): Promise<void> {

  const config: SMTPPool.Options = {
    pool: true,
    host: process.env.MAILHOST,
    port: Number(process.env.MAILPORT),
    secure: false,
    auth: {
      user: process.env.MAILUSER??'', // Seu e-mail
      pass: process.env.MAILPASS??'', // Sua senha
    },
  }
  const transporter = nodemailer.createTransport(config);

  // Configuração do e-mail
  const mailOptions = {
    from: '"Intranet Grupo RHenz" <elo@intranet.boxdistribuidor.com.br>', // Remetente
    to: to, // Destinatário
    cc: cc ?? undefined,
    subject: subject, // Assunto
    html: htmlContent, // Conteúdo HTML
  };

  // Envio do e-mail
  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail enviado para: %s', to);
  } catch (error) {
    console.error('Erro ao enviar e-mail: ', error);
  }
}
