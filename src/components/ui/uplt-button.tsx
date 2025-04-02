import { useDropzone } from "@uploadthing/react";
import {
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
} from "uploadthing/client";

import { useUploadThing } from "@/components/uploadthing";
import { useCallback, useState } from "react";
import { type ClientUploadedFileData } from "uploadthing/types";
import { type UploadThingError } from "uploadthing/server";
import { Button } from "./button";
import { LucideImagePlus, LucideLoader2, LucideTrash2, LucideUpload } from 'lucide-react';
import { type MaybePromise } from "@trpc/server/unstable-core-do-not-import";

type JsonValue = string | number | boolean | null | undefined;
type JsonObject = {
    [key: string]: JsonValue | JsonObject | JsonArray;
};
type JsonArray = (JsonValue | JsonObject)[];
type Json = JsonValue | JsonObject | JsonArray;

interface UPLTButtonProps {
    onClientUploadComplete?: (res: ClientUploadedFileData<unknown>[]) => void,
    onUploadError?: (e: UploadThingError<Json>) => MaybePromise<void>,
    onUploadBegin?: (filename: string) => void, 
    sendRef?: React.MutableRefObject<(()=>Promise<void>) | undefined>,
    onImageUrlGenerated: (url: string) => void // Nova prop para receber a URL da imagem
}

export function UPLTButton({
    onClientUploadComplete,
    onUploadBegin,
    onUploadError,
    onImageUrlGenerated
}: UPLTButtonProps) {
  const [files, setFiles] = useState<File[]>([]);
  
  const { startUpload, routeConfig, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      // Quando o upload for concluído, extrair a URL e passar para o componente pai
      if (res && res.length > 0 && res[0]?.ufsUrl) {
        onImageUrlGenerated(res[0].ufsUrl);
      }
      // Ainda chama o callback original se existir
      onClientUploadComplete?.(res);
    },
    onUploadError,
    onUploadBegin,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    void startUpload(acceptedFiles)
  }, [startUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(
      generatePermittedFileTypes(routeConfig).fileTypes,
    ),
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <div className="w-full h-32 border-dashed flex items-center justify-center border rounded-md gap-2 cursor-pointer hover:bg-muted hover:border-primary transition-all">
        { files.length > 0 ? isUploading? <LucideLoader2 className="animate-spin"/>: <>Arquivo carregado <LucideImagePlus/></> : <>Arraste ou clique para adicionar a imagem <LucideUpload/></> }
      </div>
      {files.length > 0 &&
        <Button variant='destructive' className="w-full mt-2" size='sm' onClick={() => setFiles([])}>
            Remover arquivos <LucideTrash2/>
        </Button>
      }
    </div>
  );
}