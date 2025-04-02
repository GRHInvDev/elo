"use server"
import { utapi } from "./uploadthing"


export async function deleteFiles(url: string){
  await utapi.deleteFiles(url.replace("https://162synql7v.ufs.sh/f/", ""))
}