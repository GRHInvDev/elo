import { createRouteHandler } from "uploadthing/next";
import { utapi } from "@/server/uploadthing";

import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

// DELETE route for deleting files
export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { fileKey?: string };

    if (!body.fileKey) {
      return Response.json({ error: "File key is required" }, { status: 400 });
    }

    await utapi.deleteFiles(body.fileKey);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return Response.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
