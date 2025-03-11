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

interface UPLTButtonProps {
    onClientUploadComplete?: (res: ClientUploadedFileData<unknown>[]) => void,
    onUploadError?: (e: UploadThingError) => void,
    onUploadBegin?: (filename: string) => void
}

export function UPLTButton({
    onClientUploadComplete,
    onUploadBegin,
    onUploadError
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

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} onChange={()=> startUpload(files)} />
      <Button disabled={files.length > 0} className="w-full h-32 border-dashed" variant='outline'>
        { files.length > 0 ? isUploading? <LucideLoader2 className="animate-spin"/>: <>Arquivo carregado <LucideImagePlus/></> : <>Arraste ou clique para adicionar a imagem <LucideUpload/></> }
      </Button>
      {files.length > 0 &&
        <Button variant='destructive' className="w-full mt-2" size='sm' onClick={() => setFiles([])}>
            Remover arquivos <LucideTrash2/>
        </Button>
      }
    </div>
  );
}
