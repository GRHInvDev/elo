import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { eventRouter } from "./routers/event";
import { flyerRouter } from "./routers/flyer";
import { roomRouter } from "./routers/room";
import { userRouter } from "./routers/user";
import { bookingRouter } from "./routers/booking";
import { birthdayRouter } from "./routers/birthday";
import { newsRouter } from "./routers/news";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  event: eventRouter,
  flyer: flyerRouter,
  room: roomRouter,
  user: userRouter,
  booking: bookingRouter,
  birthday: birthdayRouter,
  news: newsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
