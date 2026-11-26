import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, Loader2, RotateCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import {
  VIEWER_MESSAGE,
  buildViewerPayload,
  getViewerLocation,
  type ReportOrder,
} from "@/lib/consultationViewer";

/** How long the viewer has to render before we show an error. */
const VIEWER_TIMEOUT_MS = 20_000;

const NOT_CONFIGURED_MESSAGE =
  "O endereço da plataforma de consultas não está configurado (VITE_CLIENT_APP_URL).";
const TIMEOUT_MESSAGE =
  "O relatório não respondeu. Verifique se a plataforma de consultas está disponível e tente novamente.";

type ViewerStatus = { status: "loading" } | { status: "ready" } | { status: "error"; message: string };

function ReportViewer({ order }: { order: ReportOrder }) {
  const location = getViewerLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [viewer, setViewer] = useState<ViewerStatus>(() =>
    location ? { status: "loading" } : { status: "error", message: NOT_CONFIGURED_MESSAGE },
  );

  useEffect(() => {
    if (!location) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== iframeRef.current?.contentWindow) return;

      switch (event.data?.type) {
        case VIEWER_MESSAGE.ready:
          iframeRef.current?.contentWindow?.postMessage(
            { type: VIEWER_MESSAGE.snapshot, payload: buildViewerPayload(order) },
            location.origin,
          );
          break;
        case VIEWER_MESSAGE.rendered:
          setViewer({ status: "ready" });
          break;
        case VIEWER_MESSAGE.error:
          setViewer({
            status: "error",
            message: typeof event.data.message === "string" ? event.data.message : TIMEOUT_MESSAGE,
          });
          break;
      }
    };

    const timeoutId = window.setTimeout(() => {
      setViewer((current) =>
        current.status === "loading" ? { status: "error", message: TIMEOUT_MESSAGE } : current,
      );
    }, VIEWER_TIMEOUT_MS);

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.clearTimeout(timeoutId);
    };
  }, [location?.url, location?.origin, order, attempt]);

  const retry = () => {
    setViewer({ status: "loading" });
    setAttempt((value) => value + 1);
  };

  return (
    <div className="relative flex-1 bg-[#F4F6FA]">
      {location && (
        <iframe
          key={attempt}
          ref={iframeRef}
          src={location.url}
          title="Relatório da consulta"
          className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-200 ${
            viewer.status === "ready" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {viewer.status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Carregando relatório...</p>
        </div>
      )}

      {viewer.status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-5 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-3 font-semibold text-slate-900">Não foi possível exibir o relatório</p>
            <p className="mt-1 text-sm text-slate-600">{viewer.message}</p>
            {location && (
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={retry}>
                <RotateCw size={14} />
                Tentar novamente
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Full-screen modal with the consultation report exactly as the operator saw it: the
 * credits-platform result page, embedded read-only (it never calls the consultation API).
 */
export function ConsultationReportDialog({
  order,
  description,
  onClose,
}: {
  order: (ReportOrder & { id: string }) | null;
  description?: string;
  onClose: () => void;
}) {
  return (
    <DialogPrimitive.Root open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-lg font-semibold text-slate-900">
                Relatório da consulta
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="truncate text-sm text-slate-600">
                {description ?? "Relatório gerado a partir dos dados salvos da consulta."}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Fechar relatório">
                <X size={18} />
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Remount per order so status, retries and the iframe start fresh. */}
          {order && <ReportViewer key={order.id} order={order} />}
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
