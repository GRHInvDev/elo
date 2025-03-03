import { AvailableRooms } from "@/components/avalible-rooms";
import { EventsList } from "@/components/events-list";
import { PostList } from "@/components/posts-list";

export default function Page() {
    return (
        <div className="flex justify-around gap-4 p-4">
            <div className="w-full space-y-4">
                <h1 className="text-2xl font-semibold m-2">Próximos Eventos:</h1>
                <EventsList/>
                <h1 className="text-2xl font-semibold m-2 mt-6">Ultimos posts:</h1>
                <PostList/>
            </div>
            <div className="w-96">
                <AvailableRooms/>
            </div>
        </div>
    );
}