export type ResponseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

export interface UserBasicInfo {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
    setor?: string | null
}

export interface FormBasicInfo {
    id: string
    title: string | null
    description: string | null
    userId: string
    user?: UserBasicInfo
}

export interface ChatMessage {
    id: string
    userId: string
    formResponseId: string
    message: string
    createdAt: Date | string
    updatedAt: Date | string
    user: UserBasicInfo
}

export interface FormResponse {
    id: string
    number: number | null
    userId: string
    formId: string
    responses: Record<string, unknown>[]
    status: ResponseStatus
    statusComment: string | null
    tags?: string[] | null
    createdAt: Date | string
    updatedAt: Date | string
    lastChatAt?: Date | string | null
    myLastViewedAt?: Date | string | null
    hasNewMessages?: boolean

    // Relations (Prisma returns these based on include)
    form: FormBasicInfo
    user: UserBasicInfo
    FormResponseChat?: ChatMessage[]

    // Legacy/Alternative names
    formResponseChat?: ChatMessage[]
}

/**
 * Type helper for FormResponse with Chat included
 */
export type FormResponseWithChat = FormResponse & {
    FormResponseChat: ChatMessage[]
}
