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
import { LucideImagePlus, LucideLoader2, LucideTrash2, LucideUpload } from "lucide-react";
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
    sendRef?: React.MutableRefObject<(()=>Promise<void>) | undefined>
}

export function UPLTButton({
    onClientUploadComplete,
    onUploadBegin,
    onUploadError,
    sendRef
}:UPLTButtonProps) {
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { startUpload, routeConfig, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete,
    onUploadError,
    onUploadBegin,
  });

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(
      generatePermittedFileTypes(routeConfig).fileTypes,
    ),
  });

  if(sendRef) sendRef.current = async () => {
    await startUpload(files)
    while (isUploading) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

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
