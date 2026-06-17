"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { CreateManualResponseDialog } from "./create-manual-response-dialog"
import { cn } from "@/lib/utils"
import type { Field } from "@/lib/form-types"

interface CreateManualResponseButtonProps {
    formId: string
    formFields: Field[]
    className?: string
}

export function CreateManualResponseButton({ formId, formFields, className }: CreateManualResponseButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                variant="outline"
                className={cn("w-full", className)}
                onClick={() => setOpen(true)}
            >
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Chamado Manual
            </Button>
            <CreateManualResponseDialog
                formId={formId}
                formFields={formFields}
                open={open}
                onOpenChange={setOpen}
                onSuccess={() => {
                    // Recarregar página ou atualizar lista
                    window.location.reload()
                }}
            />
        </>
    )
}

