"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HelpCircle, Search, BookOpen, MessageCircle, Settings, FileText, Users } from "lucide-react"
import { useState } from "react"

const faqData = [
  {
    id: "1",
    category: "Geral",
    question: "Como funciona o sistema de ideias?",
    answer: "O sistema de ideias permite que colaboradores enviem sugestões de melhoria, inovações ou soluções para problemas identificados. Cada ideia passa por avaliação, aprovação e implementação conforme os critérios estabelecidos."
  },
  {
    id: "2",
    category: "Geral",
    question: "Quais tipos de contribuição posso enviar?",
    answer: "Você pode enviar ideias inovadoras, sugestões de melhoria, soluções para problemas específicos ou outras contribuições que possam agregar valor à empresa."
  },
  {
    id: "3",
    category: "Avaliação",
    question: "Como as ideias são avaliadas?",
    answer: "As ideias são avaliadas por uma equipe especializada considerando três critérios principais: Impacto (benefício potencial), Capacidade (viabilidade técnica) e Esforço (recursos necessários para implementação)."
  },
  {
    id: "4",
    category: "Avaliação",
    question: "Quanto tempo leva para uma ideia ser avaliada?",
    answer: "O prazo médio para avaliação inicial é de 15 dias úteis. Ideias complexas podem levar mais tempo dependendo da necessidade de análise técnica adicional."
  },
  {
    id: "5",
    category: "Pagamento",
    question: "Como funciona o sistema de recompensas?",
    answer: "Ideias aprovadas e implementadas podem gerar recompensas financeiras baseadas no impacto e benefício gerado para a empresa. O valor é definido pela equipe de gestão."
  },
  {
    id: "6",
    category: "Técnico",
    question: "Posso editar minha ideia depois de enviada?",
    answer: "Não é possível editar ideias após o envio. Recomendamos revisar cuidadosamente antes de enviar. Em caso de necessidade, entre em contato com a equipe responsável."
  },
  {
    id: "7",
    category: "Técnico",
    question: "Como acompanhar o status da minha ideia?",
    answer: "Você pode acompanhar o status através da página 'Minhas Ideias' no menu principal. Lá você verá todas as suas ideias e seus respectivos status."
  }
]

const categories = [
  { id: "all", name: "Todas", icon: BookOpen },
  { id: "Geral", name: "Geral", icon: HelpCircle },
  { id: "Avaliação", name: "Avaliação", icon: Settings },
  { id: "Pagamento", name: "Pagamento", icon: MessageCircle },
  { id: "Técnico", name: "Técnico", icon: FileText }
]

export default function DoubtsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredFaq = faqData.filter(item => {
    const matchesSearch = searchTerm === "" ||
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Central de Dúvidas</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas rápidas para suas dúvidas mais frequentes sobre o sistema de ideias
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <Card>
          <CardContent className="p-6">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar dúvidas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filtros por Categoria */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id
            const count = category.id === "all"
              ? faqData.length
              : faqData.filter(item => item.category === category.id).length

            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {category.name}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>

        {/* Lista de FAQ */}
        <div className="space-y-4">
          {filteredFaq.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhuma dúvida encontrada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros de busca ou categoria
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaq.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border rounded-lg bg-card"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-start justify-between w-full gap-4 text-left">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-foreground">
                          {item.question}
                        </h3>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Contato */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Ainda tem dúvidas?
            </CardTitle>
            <CardDescription>
              Não encontrou a resposta que procurava? Entre em contato conosco.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
