import type { RolesConfig } from "./role-config"

// export Define interfaces específicas para os tipos de dados
export interface AuthorWithRoleConfig {
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
    role_config: RolesConfig
    enterprise?: string
}

export interface PostWithAuthor {
    id: string
    title: string
    content: string
    authorId: string
    imageUrl: string | null
    images?: Array<{ imageUrl: string }>
    createdAt: Date
    author: AuthorWithRoleConfig
}

export interface EventWithAuthor {
    id: string
    title: string
    description: string
    location: string
    startDate: Date
    endDate: Date
    authorId: string
    published: boolean
    createdAt: Date
    author: AuthorWithRoleConfig
}

export interface FlyerWithAuthor {
    id: string
    title: string
    description: string
    imageUrl: string
    iframe: string | null
    authorId: string
    published: boolean
    createdAt: Date
    author: AuthorWithRoleConfig
}

export interface ContentFeedProps {
    className?: string
    postsPerPage?: number
    enablePagination?: boolean
}