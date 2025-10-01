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
import { LucideImagePlus, LucideLoader2, LucideTrash2, LucideUpload, LucideEdit } from 'lucide-react';
import { type MaybePromise } from "@trpc/server/unstable-core-do-not-import";
import { deleteFiles } from "@/server/upltActions";
import { ImageEditor } from "@/components/image-editor";
import { useImageDimensions } from "@/hooks/use-image-dimensions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropRequired, setCropRequired] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState<string>("")

  const { checkDimensions } = useImageDimensions()

  const { startUpload, routeConfig, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: async (res) => {
      // Quando o upload for concluído, extrair a URL e passar para o componente pai
      if (res && res.length > 0 && res[0]?.ufsUrl) {
        const imageUrl = res[0].ufsUrl

        // Verificar dimensões da imagem
        const dims = await checkDimensions(imageUrl)

        if (dims && dims.height > 300) {
          // Imagem alta demais, forçar crop
          setCropRequired(true)
          setTempImageUrl(imageUrl)
          setShowCropModal(true)
        } else {
          // Imagem OK, prosseguir normalmente
          onImageUrlGenerated(imageUrl);
          setFileUrl(imageUrl)
        }
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

  const handleRemove = async () => {
    if (fileUrl.trim() !== ""){
      await deleteFiles(fileUrl)
    }
    setFiles([])
    setFileUrl("")
    setTempImageUrl("")
    setCropRequired(false)
    setShowCropModal(false)
  }

  const handleCropComplete = (croppedImageUrl: string) => {
    setFileUrl(croppedImageUrl)
    onImageUrlGenerated(croppedImageUrl)
    setShowCropModal(false)
    setCropRequired(false)
    setTempImageUrl("")
  }

  const handleForceCrop = () => {
    setShowCropModal(true)
  }
  return (
    <>
      <div className="space-y-2">
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <div className="w-full h-32 border-dashed flex items-center justify-center border rounded-md gap-2 cursor-pointer hover:bg-muted hover:border-primary transition-all">
            { files.length > 0 ? isUploading? <LucideLoader2 className="animate-spin"/>: <>Arquivo carregado <LucideImagePlus/></> : <>Arraste ou clique para adicionar a imagem <LucideUpload/></> }
          </div>
        </div>

        {/* Texto de tamanho recomendado */}
        <p className="text-sm text-muted-foreground text-center">
          Tamanho recomendado: 515 x 300
        </p>

        {files.length > 0 && fileUrl && (
          <div className="flex gap-2">
            <ImageEditor
              imagemOriginal={fileUrl}
              onImagemEditada={(novaUrl) => {
                setFileUrl(novaUrl)
                onImageUrlGenerated(novaUrl)
              }}
            >
              <Button variant="outline" size="sm" className="flex-1">
                <LucideEdit className="h-4 w-4 mr-2" />
                Editar Imagem
              </Button>
            </ImageEditor>

            <Button variant='destructive' size='sm' onClick={handleRemove}>
              <LucideTrash2 className="h-4 w-4 mr-2"/>
              Remover
            </Button>
          </div>
        )}

        {/* Crop obrigatório quando imagem é muito alta */}
        {cropRequired && tempImageUrl && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleForceCrop}
            >
              <LucideEdit className="h-4 w-4 mr-2" />
              Cortar Imagem (Obrigatório - Altura {">"} 300px)
            </Button>
          </div>
        )}
      </div>

      {/* Modal obrigatório para crop */}
      <AlertDialog open={showCropModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Corte de Imagem Obrigatório</AlertDialogTitle>
            <AlertDialogDescription>
              A imagem possui mais de 300px de altura. Você deve cortar a imagem para continuar.
              O tamanho recomendado é 515 x 300 pixels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <ImageEditor
              imagemOriginal={tempImageUrl}
              onImagemEditada={handleCropComplete}
            >
              <Button variant="default">
                <LucideEdit className="h-4 w-4 mr-2" />
                Abrir Editor de Imagem
              </Button>
            </ImageEditor>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}