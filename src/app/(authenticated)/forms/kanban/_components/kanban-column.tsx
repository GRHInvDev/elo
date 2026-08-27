import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Clock, X, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type FormResponse, type ResponseStatus } from "@/types/form-responses";
import { ResponseContextMenu } from "./tags-context-menu";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFormResponseNumber } from "@/lib/utils/form-response-number";

interface KanbanColumnProps {
    title: string;
    status: ResponseStatus;
    responses: FormResponse[];
    onOpenDetails: (responseId: string) => void;
    onEdit?: (responseId: string, formId: string) => void;
    onOpenChat?: (responseId: string) => void;
    onMoveToNextStatus?: (responseId: string, currentStatus: ResponseStatus) => void;
    onOpenTagsManager?: () => void;
    canDrag?: (response: FormResponse) => boolean;
}

interface ResponseCardProps {
    response: FormResponse;
    onOpenDetails: (responseId: string) => void;
    onEdit?: (responseId: string, formId: string) => void;
    onOpenChat?: (responseId: string) => void;
    onMoveToNextStatus?: (responseId: string, currentStatus: ResponseStatus) => void;
    onOpenTagsManager?: () => void;
}

const COLUMN_CONFIG: Record<ResponseStatus, { label: string; dot: string; bg: string; border: string; countBadge: string }> = {
    NOT_STARTED: {
        label: "Não Iniciado",
        dot: "bg-slate-400 dark:bg-slate-500",
        bg: "bg-slate-500/5",
        border: "border-border/60",
        countBadge: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    },
    IN_PROGRESS: {
        label: "Em Progresso",
        dot: "bg-amber-500",
        bg: "bg-amber-500/5",
        border: "border-amber-500/20",
        countBadge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    COMPLETED: {
        label: "Concluído",
        dot: "bg-emerald-500",
        bg: "bg-emerald-500/5",
        border: "border-emerald-500/20",
        countBadge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
};

function ResponseCard({ 
    response, 
    onOpenDetails,
    onEdit,
    onOpenChat,
    onMoveToNextStatus,
    onOpenTagsManager,
}: ResponseCardProps) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const utils = api.useUtils();
    const { data: allTags = [] } = api.formResponse.getAllTags.useQuery();
    const removeTag = api.formResponse.removeTag.useMutation({
        onSuccess: () => {
            toast.success("Tag removida");
            void utils.formResponse.listKanBan.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao remover tag");
        },
    });

    const handleContextMenu = (e: React.MouseEvent) => {
        if (window.innerWidth >= 768) {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY });
        }
    };

    const handleTagChange = () => {
        void utils.formResponse.listKanBan.invalidate();
    };

    const appliedTags = response.tags
        ? allTags.filter(tag => response.tags?.includes(tag.id))
        : [];

    const userName = response.user.firstName
        ? `${response.user.firstName} ${response.user.lastName ?? ""}`.trim()
        : response.user.email;

    return (
        <>
            <Card
                className={cn(
                    "group relative overflow-hidden rounded-xl border border-border/70 bg-card p-3.5 text-left transition-all duration-200 cursor-pointer shadow-xs",
                    "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
                )}
                onClick={() => onOpenDetails(response.id)}
                onContextMenu={handleContextMenu}
            >
                {/* Header: ID e Notificação */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-primary">
                        {response.number ? formatFormResponseNumber(response.number) : `#${response.id.slice(0, 6)}`}
                    </span>
                    {response.hasNewMessages && (
                        <span className="inline-flex items-center rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            Mensagens novas
                        </span>
                    )}
                </div>

                {/* Título do Formulário */}
                <h4 className="text-xs sm:text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-2.5">
                    {response.form.title}
                </h4>

                {/* Tags aplicadas */}
                {appliedTags.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-1">
                        {appliedTags.map((tag) => (
                            <span
                                key={tag.id}
                                className="group/tag inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-2xs"
                                style={{ backgroundColor: tag.cor || "#3B82F6" }}
                            >
                                <span className="truncate max-w-[110px]">{tag.nome}</span>
                                <button
                                    type="button"
                                    className="opacity-0 group-hover/tag:opacity-100 transition-opacity hover:opacity-80"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTag.mutate({ responseId: response.id, tagId: tag.id });
                                    }}
                                    aria-label={`Remover tag ${tag.nome}`}
                                >
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Solicitante */}
                <div className="flex items-center gap-2 mb-3 pt-1 border-t border-border/40">
                    <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={response.user.imageUrl ?? ""} />
                        <AvatarFallback className="text-[10px]">
                            {response.user.firstName?.[0] ?? response.user.email[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-xs font-medium text-foreground">{userName}</p>
                        {response.user.setor && (
                            <p className="truncate text-[10px] text-muted-foreground">{response.user.setor}</p>
                        )}
                    </div>
                </div>

                {/* Rodapé: Tempo e Ação */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="h-3 w-3 opacity-60" />
                        {formatDistanceToNow(new Date(response.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                        })}
                    </span>
                    <span className="inline-flex items-center text-[11px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform gap-0.5">
                        <span>Detalhes</span>
                        <ChevronRight className="h-3 w-3" />
                    </span>
                </div>
            </Card>

            {contextMenu && (
                <ResponseContextMenu
                    responseId={response.id}
                    formId={response.formId}
                    currentStatus={response.status}
                    currentTags={response.tags ?? []}
                    position={contextMenu}
                    onClose={() => setContextMenu(null)}
                    onTagChange={handleTagChange}
                    onOpenDetails={onOpenDetails}
                    onEdit={onEdit}
                    onOpenChat={onOpenChat}
                    onMoveToNextStatus={onMoveToNextStatus}
                    onOpenTagsManager={onOpenTagsManager}
                />
            )}
        </>
    );
}

export function KanbanColumn({ 
    title, 
    status, 
    responses, 
    onOpenDetails,
    onEdit,
    onOpenChat,
    onMoveToNextStatus,
    onOpenTagsManager,
    canDrag,
}: KanbanColumnProps) {
    const config = COLUMN_CONFIG[status];

    return (
        <div className={cn("flex flex-col rounded-2xl border p-3.5 transition-colors", config.border, config.bg)}>
            {/* Header da Coluna */}
            <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", config.dot)} aria-hidden />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {title}
                    </h3>
                </div>
                <span className={cn("rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold border border-border/30", config.countBadge)}>
                    {responses.length}
                </span>
            </div>

            {/* Lista Droppable */}
            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            "flex min-h-[450px] max-h-[calc(100vh-280px)] overflow-y-auto flex-col gap-2.5 pr-0.5 transition-colors rounded-xl",
                            snapshot.isDraggingOver && "bg-primary/5 ring-1 ring-primary/20",
                        )}
                    >
                        {responses.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground/60 min-h-[140px]">
                                Nenhuma solicitação nesta etapa
                            </div>
                        ) : (
                            responses.map((response, index) => {
                                const isDraggable = canDrag ? canDrag(response) : true;
                                
                                return (
                                    <Draggable 
                                        key={response.id} 
                                        draggableId={response.id} 
                                        index={index}
                                        isDragDisabled={!isDraggable}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...(isDraggable ? provided.dragHandleProps : {})}
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                                }}
                                            >
                                                <ResponseCard
                                                    response={response}
                                                    onOpenDetails={onOpenDetails}
                                                    onEdit={onEdit}
                                                    onOpenChat={onOpenChat}
                                                    onMoveToNextStatus={onMoveToNextStatus}
                                                    onOpenTagsManager={onOpenTagsManager}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
