import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ReloadConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ReloadConfirmationDialog({
  open,
  onOpenChange,
  onCancel,
  onConfirm,
}: ReloadConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Voltar para a tela de consulta?</AlertDialogTitle>

          <AlertDialogDescription>
            Esta ação retornará para a tela de consulta SPC MAXI. Confirme
            abaixo se deseja continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>

          <AlertDialogAction onClick={onConfirm}>Voltar</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
