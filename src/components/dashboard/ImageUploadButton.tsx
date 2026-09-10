import { ImageUp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadBiofyImage } from "@/lib/media";

export function ImageUploadButton({
  userId,
  area,
  label = "Enviar imagem",
  onUploaded,
}: {
  userId: string;
  area: "avatar" | "background" | "block";
  label?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source);
    },
    [source],
  );

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (area === "avatar") {
      if (!file.type.startsWith("image/")) {
        toast.error("Escolha uma imagem válida.");
        return;
      }
      setSource(URL.createObjectURL(file));
      setSourceFile(file);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      return;
    }
    await uploadFile(file);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const { publicUrl } = await uploadBiofyImage(userId, file, area);
      onUploaded(publicUrl);
      toast.success("Imagem enviada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function resetCrop() {
    setSource(null);
    setSourceFile(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    if (inputRef.current) inputRef.current.value = "";
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset({
      x: drag.offsetX + event.clientX - drag.x,
      y: drag.offsetY + event.clientY - drag.y,
    });
  }

  function endDrag() {
    dragRef.current = null;
  }

  async function applyCrop() {
    const image = imageRef.current;
    const cropArea = cropAreaRef.current;
    if (!image || !cropArea || !sourceFile || !image.naturalWidth) return;

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;
    const rect = cropArea.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const scale = image.naturalWidth / imageRect.width;
    const left = (rect.left - imageRect.left) * scale;
    const top = (rect.top - imageRect.top) * scale;
    const width = rect.width * scale;
    context.clearRect(0, 0, size, size);
    context.drawImage(image, left, top, width, width, 0, 0, size, size);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) {
      toast.error("Não foi possível preparar a foto.");
      return;
    }
    const cropped = new File([blob], `${sourceFile.name.replace(/\.[^.]+$/, "")}-avatar.jpg`, {
      type: "image/jpeg",
    });
    await uploadFile(cropped);
    resetCrop();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImageUp className="mr-2 h-4 w-4" />
        )}
        {uploading ? "Enviando..." : label}
      </Button>
      <Dialog open={Boolean(source)} onOpenChange={(open) => !open && resetCrop()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajuste sua foto</DialogTitle>
            <DialogDescription>
              Arraste a imagem e use o zoom para centralizar seu avatar.
            </DialogDescription>
          </DialogHeader>
          <div
            ref={cropAreaRef}
            className="relative mx-auto aspect-square w-full max-w-[320px] cursor-grab touch-none overflow-hidden rounded-full bg-black/30 active:cursor-grabbing"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {source ? (
              <img
                ref={imageRef}
                src={source}
                alt="Prévia do avatar"
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: `${Math.max(100, 100 * zoom)}%`,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            ) : null}
          </div>
          <label className="space-y-2 text-sm font-medium">
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetCrop}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void applyCrop()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {uploading ? "Enviando..." : "Usar foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
