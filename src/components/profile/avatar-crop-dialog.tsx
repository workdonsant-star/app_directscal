"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AvatarCropDialogProps = {
  onApply: (avatarUrl: string) => void;
  onCancel: () => void;
  onError: () => void;
  source: string;
};

type ImageSize = {
  height: number;
  width: number;
};

type Position = {
  x: number;
  y: number;
};

const cropViewportSize = 320;
const avatarOutputSize = 512;
const avatarOutputQuality = 0.82;
const maximumZoom = 3;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getCropGeometry(
  imageSize: ImageSize,
  zoom: number,
  position: Position,
) {
  const baseScale = Math.max(
    cropViewportSize / imageSize.width,
    cropViewportSize / imageSize.height,
  );
  const scale = baseScale * zoom;
  const renderedWidth = imageSize.width * scale;
  const renderedHeight = imageSize.height * scale;
  const maximumX = Math.max(0, (renderedWidth - cropViewportSize) / 2);
  const maximumY = Math.max(0, (renderedHeight - cropViewportSize) / 2);

  return {
    maximumX,
    maximumY,
    position: {
      x: clamp(position.x, -maximumX, maximumX),
      y: clamp(position.y, -maximumY, maximumY),
    },
    renderedHeight,
    renderedWidth,
  };
}

export function AvatarCropDialog({
  onApply,
  onCancel,
  onError,
  source,
}: AvatarCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    clientX: number;
    clientY: number;
    pointerId: number;
  } | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const image = new Image();

    image.addEventListener("load", () => {
      imageRef.current = image;
      setImageSize({
        height: image.naturalHeight,
        width: image.naturalWidth,
      });
    });
    image.addEventListener("error", onError);
    image.src = source;

    return () => {
      imageRef.current = null;
    };
  }, [onError, source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || !imageSize) return;

    const context = canvas.getContext("2d");

    if (!context) {
      onError();
      return;
    }

    const geometry = getCropGeometry(imageSize, zoom, position);
    const outputScale = avatarOutputSize / cropViewportSize;
    const destinationX =
      ((cropViewportSize - geometry.renderedWidth) / 2 +
        geometry.position.x) *
      outputScale;
    const destinationY =
      ((cropViewportSize - geometry.renderedHeight) / 2 +
        geometry.position.y) *
      outputScale;

    context.clearRect(0, 0, avatarOutputSize, avatarOutputSize);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.save();
    context.beginPath();
    context.arc(
      avatarOutputSize / 2,
      avatarOutputSize / 2,
      avatarOutputSize / 2,
      0,
      Math.PI * 2,
    );
    context.clip();
    context.drawImage(
      image,
      destinationX,
      destinationY,
      geometry.renderedWidth * outputScale,
      geometry.renderedHeight * outputScale,
    );
    context.restore();
  }, [imageSize, onError, position, zoom]);

  function updateZoom(nextZoom: number) {
    if (!imageSize) return;

    const nextGeometry = getCropGeometry(imageSize, nextZoom, position);
    setZoom(nextZoom);
    setPosition(nextGeometry.position);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!imageSize) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId || !imageSize) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerScale = cropViewportSize / bounds.width;
    const deltaX = (event.clientX - drag.clientX) * pointerScale;
    const deltaY = (event.clientY - drag.clientY) * pointerScale;

    drag.clientX = event.clientX;
    drag.clientY = event.clientY;
    setPosition((current) =>
      getCropGeometry(imageSize, zoom, {
        x: current.x + deltaX,
        y: current.y + deltaY,
      }).position,
    );
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);
  }

  function handleApply() {
    const canvas = canvasRef.current;

    if (!canvas || !imageSize) return;

    onApply(canvas.toDataURL("image/webp", avatarOutputQuality));
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
          <DialogDescription>
            Arraste a imagem para reposicionar e use o controle para ajustar o
            enquadramento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div
            aria-label="Área de recorte da foto"
            className={`relative mx-auto aspect-square w-full max-w-80 touch-none overflow-hidden rounded-full border bg-muted select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerCancel={endDrag}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
          >
            <canvas
              ref={canvasRef}
              aria-label="Prévia da foto recortada"
              className="block size-full"
              height={avatarOutputSize}
              role="img"
              width={avatarOutputSize}
            />
          </div>

          <label className="grid gap-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              <ZoomIn aria-hidden="true" className="size-4" />
              Zoom
            </span>
            <input
              aria-label="Zoom da foto"
              className="h-2 w-full cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              disabled={!imageSize}
              max={maximumZoom}
              min={1}
              onChange={(event) => updateZoom(Number(event.target.value))}
              step={0.01}
              type="range"
              value={zoom}
            />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={!imageSize} onClick={handleApply}>
            Aplicar recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
