import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConsultarInsumoDialogProps = {
  open: boolean;
  label?: string;
  isConsulting?: boolean;
  disabled?: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConsultarInsumoDialog({
  open,
  label,
  isConsulting = false,
  disabled = false,
  onOpenChange,
  onCancel,
  onConfirm,
}: ConsultarInsumoDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:rounded-2xl">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold"
              style={{ backgroundColor: "#E0E7FF", color: "#243871" }}
            >
              !
            </div>

            <div>
              <AlertDialogTitle className="text-left text-base font-semibold text-slate-800">
                Consultar {label}?
              </AlertDialogTitle>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <AlertDialogHeader className="space-y-3 text-left">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                Consulta adicional
              </p>
            </div>

            <AlertDialogDescription className="text-sm leading-6 text-slate-600">
              Ao prosseguir, será feita uma nova consulta desse insumo. Caso o
              sistema identifique dados disponíveis, pode haver cobrança
              adicional.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <AlertDialogCancel
            className="border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
            onClick={onCancel}
          >
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction
            className="bg-[#243871] text-white hover:bg-[#1d2d5f] cursor-pointer"
            disabled={isConsulting || disabled}
            onClick={onConfirm}
          >
            Prosseguir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
