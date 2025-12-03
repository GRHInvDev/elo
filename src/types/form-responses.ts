export type ResponseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

export interface FormResponse {
    id: string
    number: number | null // Número sequencial do chamado (#0000001) - null para registros antigos
    userId: string
    formId: string
    responses: unknown[]
    status: ResponseStatus
    statusComment: string | null
    tags?: string[] | null // IDs das tags aplicadas
    createdAt: Date
    updatedAt: Date
    // Campos derivados (Kanban)
    lastChatAt?: Date | null
    myLastViewedAt?: Date | null
    hasNewMessages?: boolean
    form: {
        id: string
        title: string
        description: string | null
        userId: string
        user: {
            id: string
            firstName: string | null
            lastName: string | null
            email: string
            imageUrl: string | null
        }
    }
    user: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string
        imageUrl: string | null
        setor?: string | null
    }
}

export interface ChatMessage {
    id: string
    userId: string
    formResponseId: string
    message: string
    createdAt: Date
    updatedAt: Date
    user: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string
        imageUrl: string | null
        setor?: string | null
    }
}
