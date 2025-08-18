import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail/email-utils";
import { mockEmailPedidosRestauranteAgrupado, type MockPedido } from "@/lib/mail/html-mock";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const to = url.searchParams.get("to") ?? process.env.MAILUSER ?? "";
    if (!to) {
      return NextResponse.json({ success: false, error: "Parâmetro 'to' é obrigatório" }, { status: 400 });
    }

    // Separar emails por vírgula ou ponto e vírgula
    const emails = to.split(/[,;]/).map(email => email.trim()).filter(email => email);

    const hoje = new Date();
    const data = hoje.toLocaleDateString("pt-BR");

    const nomes = Array.from({ length: 12 }, (_, i) => `Func ${i + 1}`);
    const prato = "Entrecot";
    const opcionais = ["", "", ""];

    const pedidos: MockPedido[] = Array.from({ length: 10 }, (_, i) => {
      const func = nomes.at((i * 2) % nomes.length) ?? `Func ${i + 1}`;
      const opc = opcionais.at(i % opcionais.length) ?? "Frango";
      return {
        num: i + 1,
        data,
        func,
        prato,
        opc,
        obs: "Teste",
      };
    });

    const html = mockEmailPedidosRestauranteAgrupado("Restaurante Teste", data, pedidos);

    // Enviar para todos os emails
    const emailPromises = emails.map(email => 
      sendEmail(
        email,
        `TESTE - Pedidos (Agrupados por Opcionais) - Restaurante Teste`,
        html,
      )
    );

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      sentTo: emails,
      totalPedidos: pedidos.length,
      grupos: opcionais.map((opc) => `${prato} com ${opc}`),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 },
    );
  }
}
