"use client"

import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, FileText, Mail } from "lucide-react"
export default function LGPDPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7" />
            Política de Privacidade e Proteção de Dados (LGPD)
          </h1>
          <p className="text-muted-foreground mt-1">
            Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              1. Tratamento de Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              A plataforma ELO e os sistemas do Grupo RHenz tratam dados pessoais de colaboradores e usuários
              de forma transparente, segura e em conformidade com a LGPD. Coletamos apenas os dados necessários
              para as finalidades descritas nesta política.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Base Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              O tratamento de dados pessoais está fundamentado em: execução de contrato ou medidas pré-contratuais
              (relação de trabalho), cumprimento de obrigação legal ou regulatória, e legítimo interesse para
              operação dos sistemas corporativos (comunicação interna, pedidos, eventos, formulários).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Finalidades do Tratamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Gestão da relação de trabalho e comunicação interna</li>
              <li>Pré-cadastro e processamento de pedidos na Lojinha (SIGIN), incluindo nome, CPF, endereço, RG, e-mail e telefone para entrega e contato</li>
              <li>Organização de eventos, formulários, encartes e agendamentos</li>
              <li>Controle de acesso e permissões aos módulos da plataforma</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">4. Direitos do Titular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Você tem direito a: confirmação da existência de tratamento, acesso aos dados, correção de dados
              incompletos ou desatualizados, anonimização ou eliminação de dados desnecessários, portabilidade,
              eliminação dos dados tratados com consentimento, e revogação do consentimento. Para exercer esses
              direitos, entre em contato com o encarregado de dados (DPO) da empresa.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              5. Contato do Encarregado de Dados (DPO)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Para dúvidas, solicitações ou reclamações relativas ao tratamento de seus dados pessoais e ao
              exercício dos direitos previstos na LGPD, entre em contato com o encarregado de proteção de dados
              da sua empresa (RH ou canal indicado internamente).
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Última atualização: referente ao uso da plataforma ELO e módulos do Grupo RHenz. Esta política pode
          ser atualizada para refletir mudanças normativas ou de processo.
        </p>
      </div>
    </DashboardShell>
  )
}
