import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type FormResponse, type ResponseStatus } from "@/types/form-responses";
import { Badge } from "@/components/ui/badge";
import { TagsContextMenu } from "./tags-context-menu";
import { api } from "@/trpc/react";

interface KanbanColumnProps {
    title: string;
    status: ResponseStatus;
    responses: FormResponse[];
    onOpenDetails: (responseId: string) => void;
}

interface ResponseCardProps {
    response: FormResponse;
    onOpenDetails: (responseId: string) => void;
}

function ResponseCard({ response, onOpenDetails }: ResponseCardProps) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const utils = api.useUtils();
    const { data: allTags = [] } = api.formResponse.getAllTags.useQuery();

    const handleContextMenu = (e: React.MouseEvent) => {
        // Apenas em desktop (não mobile)
        if (window.innerWidth >= 768) {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY });
        }
    };

    const handleTagChange = () => {
        void utils.formResponse.listKanBan.invalidate();
    };

    // Obter informações das tags aplicadas
    const appliedTags = response.tags
        ? allTags.filter(tag => response.tags?.includes(tag.id))
        : [];

    return (
        <>
            <Card
                className="bg-muted shadow-sm"
                onContextMenu={handleContextMenu}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">
                            {response.form.title}
                        </CardTitle>
                        {response.hasNewMessages && (
                            <Badge variant="destructive">Novo</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pb-2">
                    {/* Tags */}
                    {appliedTags.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                            {appliedTags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    style={{
                                        backgroundColor: tag.cor,
                                        color: "#fff",
                                    }}
                                    className="text-xs px-2 py-0.5"
                                >
                                    {tag.nome}
                                </Badge>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={response.user.imageUrl ?? ""} />
                                <AvatarFallback>
                                    {response.user.firstName?.[0] ?? response.user.email[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span>
                                {response.user.firstName
                                    ? `${response.user.firstName} ${response.user.lastName ?? ""}`
                                    : response.user.email}
                            </span>
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {formatDistanceToNow(new Date(response.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                            })}
                        </span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => onOpenDetails(response.id)}
                    >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Detalhes
                    </Button>
                </CardFooter>
            </Card>
            {contextMenu && (
                <TagsContextMenu
                    responseId={response.id}
                    currentTags={response.tags || []}
                    position={contextMenu}
                    onClose={() => setContextMenu(null)}
                    onTagChange={handleTagChange}
                />
            )}
        </>
    );
}

export function KanbanColumn({ title, status, responses, onOpenDetails }: KanbanColumnProps) {
    const getStatusColor = (status: ResponseStatus) => {
        switch (status) {
            case "NOT_STARTED":
                return "bg-red-100 text-red-800 border-red-200 dark:bg-red-300/50 dark:text-red-100";
            case "IN_PROGRESS":
                return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-300/50 dark:text-yellow-100";
            case "COMPLETED":
                return "bg-green-100 text-green-800 border-green-200 dark:bg-green-300/50 dark:text-green-100";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className={`rounded-lg border p-4 ${getStatusColor(status)}`}>
            <h2 className="mb-4 text-xl font-semibold">{title} ({responses.length})</h2>

            <Droppable droppableId={status}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex min-h-[600px] max-h-[calc(100vh-300px)] overflow-y-auto flex-col gap-3"
                    >
                        {responses.map((response, index) => (
                            <Draggable key={response.id} draggableId={response.id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    >
                                        <ResponseCard
                                            response={response}
                                            onOpenDetails={onOpenDetails}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
