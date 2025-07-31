import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { eventRouter } from "./routers/event";
import { flyerRouter } from "./routers/flyer";
import { roomRouter } from "./routers/room";
import { userRouter } from "./routers/user";
import { bookingRouter } from "./routers/booking";
import { birthdayRouter } from "./routers/birthday";
import { reactionRouter } from "./routers/reaction";
import { commentRouter } from "./routers/comment";
import { vehicleRouter } from "./routers/vehicle";
import { vehicleRentRouter } from "./routers/vehicle-rent";
import { productRouter } from "./routers/product";
import { formsRouter } from "./routers/forms";
import { formResponseRouter } from "./routers/form-response";
import { restaurantRouter } from "./routers/restaurant";
import { menuItemRouter } from "./routers/menu-item";
import { menuItemOptionRouter } from "./routers/menu-item-option";
import { menuItemOptionChoiceRouter } from "./routers/menu-item-option-choice";
import { foodOrderRouter } from "./routers/food-order";
import { orderLogRouter } from "./routers/order-log";

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
  reaction: reactionRouter,
  comment: commentRouter,
  vehicle: vehicleRouter,
  vehicleRent: vehicleRentRouter,
  product: productRouter,
  form: formsRouter,
  formResponse: formResponseRouter,
  restaurant: restaurantRouter,
  menuItem: menuItemRouter,
  menuItemOption: menuItemOptionRouter,
  menuItemOptionChoice: menuItemOptionChoiceRouter,
  foodOrder: foodOrderRouter,
  orderLog: orderLogRouter,
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
