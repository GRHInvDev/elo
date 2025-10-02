"use client"
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
import { deleteFiles } from "@/server/upltActions";

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
  const [fileUrl, setFileUrl] = useState("")

  const { startUpload, routeConfig, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      console.log("Upload concluído:", res);
      // Quando o upload for concluído, extrair a URL e passar para o componente pai
      if (res && res.length > 0 && res[0]?.ufsUrl) {
        const imageUrl = res[0].ufsUrl
        console.log("URL da imagem:", imageUrl);
        onImageUrlGenerated(imageUrl);
        setFileUrl(imageUrl)
      }
      // Ainda chama o callback original se existir
      onClientUploadComplete?.(res);
    },
    onUploadError: (error) => {
      console.error("Erro no upload:", error);
      onUploadError?.(error);
    },
    onUploadBegin: (filename) => {
      console.log("Iniciando upload:", filename);
      onUploadBegin?.(filename);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log("Arquivos dropped:", acceptedFiles);
    setFiles(acceptedFiles);
    if (acceptedFiles.length > 0) {
      void startUpload(acceptedFiles)
    }
  }, [startUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(
      generatePermittedFileTypes(routeConfig).fileTypes,
    ),
  });

  const handleRemove = async () => {
    if (fileUrl.trim() !== ""){
      await deleteFiles(fileUrl)
    }
    setFiles([])
    setFileUrl("")
  }
  // Função para lidar com seleção de arquivo via input tradicional
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    console.log("Arquivos selecionados via input:", selectedFiles);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      void startUpload(selectedFiles);
    }
  }, [startUpload]);

  return (
    <>
      <div className="space-y-2">
        {/* Área de drop e input oculto */}
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-input"
          />
          <div className="w-full h-32 border-dashed flex items-center justify-center border rounded-md gap-2 cursor-pointer hover:bg-muted hover:border-primary transition-all">
            {isUploading ? (
              <>
                <LucideLoader2 className="animate-spin h-6 w-6" />
                <span>Fazendo upload...</span>
              </>
            ) : files.length > 0 && fileUrl ? (
              <>
                <LucideImagePlus className="h-6 w-6 text-green-600" />
                <span>Imagem carregada</span>
              </>
            ) : (
              <>
                <LucideUpload className="h-6 w-6" />
                <span>Arraste ou clique para adicionar imagem</span>
              </>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          {files.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <LucideUpload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          )}

          {files.length > 0 && fileUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <LucideTrash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          )}
        </div>

        {/* Preview da imagem */}
        {fileUrl && (
          <div className="mt-2">
            <img
              src={fileUrl}
              alt="Preview"
              className="w-full max-w-xs h-auto rounded border"
            />
          </div>
        )}
      </div>
    </>
  );
}