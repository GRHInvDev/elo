"use server";

import { Resend } from "resend";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM =
  '"Intranet Grupo RHenz" <intranet.rhenz@apps.allpines.com.br>';

/**
 * @params to - Destinatário
 * @params subject - Assunto
 * @params htmlContent - Conteúdo
 * @params cc - Copia
 */

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  cc?: string
): Promise<void> {
  console.log("Envio via Resend (SMTP não utilizado): Payload simples")
  try {
    const toList = to.split(",").map((e) => e.trim()).filter(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to: toList,
      subject,
      html: htmlContent,
      ...(cc?.trim() && {
        cc: cc.split(",").map((e) => e.trim()).filter(Boolean),
      }),
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail: ", error);
    throw error;
  }
}
