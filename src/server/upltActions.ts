"use server"
import { utapi } from "./uploadthing"
import { db } from "./db"

export async function deleteFiles(url: string) {
  try {
    if (url.startsWith("/api/files/")) {
      const fileId = url.replace("/api/files/", "")
      await db.storedFile.updateMany({
        where: { OR: [{ id: fileId }, { legacyUrl: url }] },
        data: { isActive: false },
      })
      return
    }

    await db.storedFile.updateMany({
      where: { legacyUrl: url },
      data: { isActive: false },
    })

    if (url.includes("ufs.sh") || url.includes("uploadthing")) {
      try {
        if (process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET) {
          const fileKey = url.replace("https://162synql7v.ufs.sh/f/", "")
          await utapi.deleteFiles(fileKey)
        }
      } catch (upltErr) {
        console.warn("[deleteFiles] Aviso ao deletar arquivo:", upltErr)
      }
    }
  } catch (error) {
    console.warn("[deleteFiles] Aviso ao deletar arquivo:", error)
  }
}