import {
  generateReactHelpers,
    generateUploadButton,
    generateUploadDropzone,
  } from "@uploadthing/react";
  
  import type { OurFileRouter } from "@/app/api/uploadthing/core";
  
  export const UploadButton = generateUploadButton<OurFileRouter>();
  export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
  export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

  // Função para deletar arquivos usando a API do UploadThing
  export const deleteFiles = async (fileKey: string): Promise<void> => {
    await fetch("/api/uploadthing", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileKey }),
    });
  };