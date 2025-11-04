export type ResponseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

export interface FormResponse {
    id: string
    userId: string
    formId: string
    responses: unknown[]
    status: ResponseStatus
    statusComment: string | null
    createdAt: Date
    updatedAt: Date
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
