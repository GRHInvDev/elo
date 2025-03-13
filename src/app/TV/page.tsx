import { AvailableRooms } from "@/components/avalible-rooms";
import { EventsList } from "@/components/events-list";
import { MonthlyBirthdays } from "@/components/monthly-birthdays";
import { PostList } from "@/components/posts-list";
import { LucideCalendar } from "lucide-react";

export default function Page() {
    return (
        <div className="flex justify-around gap-4 p-4 w-full">
            <div className="w-full space-y-4">
                <div className="flex gap-4 w-full">
                    <PostList/>
                    <div className="grid grid-cols-7 space-x-6 w-full">
                        <div className="col-span-3 space-y-6">
                            <MonthlyBirthdays/>
                            <AvailableRooms/>
                        </div>    
                        <div className="col-span-4 w-full">
                            <h1 className="text-2xl flex mb-2 items-center font-semibold w-full">
                                <LucideCalendar className="mr-2"/>
                                Próximos Eventos:
                            </h1>
                            <EventsList/>
                        </div>
                        {/* <h1 className="w-1/2 text-2xl text-nowrap font-semibold ml-2 mb-2 mt-6">Novidades:</h1>
                        <Card className="w-full min-h-96">
                            
                        </Card> */}
                    </div>
                </div>
            </div>
        </div>
    );
}