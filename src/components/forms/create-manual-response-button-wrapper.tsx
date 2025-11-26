"use client"

import { api } from "@/trpc/react"
import { canCreateSolicitacoes } from "@/lib/access-control"
import { CreateManualResponseButton } from "./create-manual-response-button"
import type { Field } from "@/lib/form-types"

interface CreateManualResponseButtonWrapperProps {
    formId: string
    formFields: Field[]
}

export function CreateManualResponseButtonWrapper({ formId, formFields }: CreateManualResponseButtonWrapperProps) {
    const { data: userData } = api.user.me.useQuery()

    if (!canCreateSolicitacoes(userData?.role_config)) {
        return null
    }

    return <CreateManualResponseButton formId={formId} formFields={formFields} />
}

