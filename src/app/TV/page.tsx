import { AvailableRooms } from "@/components/avalible-rooms";
import { EventsList } from "@/components/events-list";
import { MonthlyBirthdays } from "@/components/monthly-birthdays";
import { PostList } from "@/components/posts-list";

export default function Page() {
    return (
        <div className="flex justify-around gap-4 p-4">
            <div className="w-full space-y-4">
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <PostList/>
                        <h1 className="text-2xl font-semibold m-2 mt-6 w-full">Próximos Eventos:</h1>
                        <EventsList/>
                    </div>
                    <div className="w-1/2">
                        <MonthlyBirthdays/>
                        <h1 className="text-2xl font-semibold text-nowrap ml-2 mb-2 mt-6 w-full">Salas Disponíveis Agora:</h1>
                        <AvailableRooms/>
                        {/* <h1 className="w-1/2 text-2xl text-nowrap font-semibold ml-2 mb-2 mt-6">Novidades:</h1>
                        <Card className="w-full min-h-96">
                            
                        </Card> */}
                    </div>
                </div>
            </div>
        </div>
    );
}