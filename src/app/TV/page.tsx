import { AvailableRooms } from "@/components/avalible-rooms";
import { EventsList } from "@/components/events-list";
import { PostList } from "@/components/posts-list";
import { Card } from "@/components/ui/card";

export default function Page() {
    return (
        <div className="flex justify-around gap-4 p-4">
            <div className="w-full space-y-4">
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <h1 className="w-1/2 text-2xl font-semibold m-2 mt-6">Ultimos posts:</h1>
                        <PostList/>
                        <h1 className="text-2xl font-semibold m-2 mt-6 w-full">Próximos Eventos:</h1>
                        <EventsList/>
                    </div>
                    <div className="w-1/2">
                        <h1 className="w-1/2 text-2xl text-nowrap font-semibold ml-2 mb-2 mt-6">Aniversariantes do mês:</h1>
                        <Card className="w-full min-h-96">
                            
                        </Card>
                        <h1 className="w-1/2 text-2xl text-nowrap font-semibold ml-2 mb-2 mt-6">Novidades:</h1>
                        <Card className="w-full min-h-96">
                            
                        </Card>
                    </div>
                </div>
            </div>
            <div className="w-96">
                <h1 className="text-2xl font-semibold text-nowrap ml-2 mb-2 mt-6 w-full">Salas Disponíveis Agora:</h1>
                <AvailableRooms/>
            </div>
        </div>
    );
}