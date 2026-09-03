import { Printer, RefreshCw, Search, User } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";

type HeaderSectionProps = {
  protocol: string;
  dateTime: string;
  operator: string;
  documentLabel: string;
  documentCopyValue: string;
  consumerName: string;
  consumerNameCopyValue: string;
  documentTypeLabel: "CPF" | "CNPJ";
  situacao: string;
  isRegular: boolean;
  metadataText: string;
  onPrint: () => void;
  onReload: () => void;
  onNewQuery: () => void;
};

export function HeaderSection({
  protocol,
  dateTime,
  operator,
  documentLabel,
  documentCopyValue,
  consumerName,
  consumerNameCopyValue,
  documentTypeLabel,
  situacao,
  isRegular,
  metadataText,
  onPrint,
  onReload,
  onNewQuery,
}: HeaderSectionProps) {
  return (
    <div className="sticky top-[100px] z-20 bg-background pb-2 relative before:content-[''] before:absolute before:-top-8 before:left-0 before:right-0 before:h-8 before:bg-background">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Relatório SPC POSITIVO INTERMEDIÁRIO PJ
        </h1>
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center">
            <span className="text-gray-500 font-medium mr-1">Protocolo:</span>

            <div className="flex items-center gap-2">
              {protocol}
              <CopyButton value={protocol} title="Copiar Protocolo" />
            </div>
          </span>

          <span className="text-gray-200">|</span>

          <span>
            <span className="text-gray-500 font-medium">Data/Hora:</span>{" "}
            {dateTime}
          </span>

          <span className="text-gray-200">|</span>

          <span>
            <span className="text-gray-500 font-medium">Operador:</span>{" "}
            {operator}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <Printer size={14} />
          </button>

          <button
            type="button"
            onClick={onReload}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900 cursor-pointer"
          >
            <RefreshCw size={12} />
            Recarregar
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            style={{ backgroundColor: "#243871" }}
            onClick={onNewQuery}
          >
            <Search size={12} />
            Nova Consulta
          </button>
        </div>
      </div>

      <div
        id="section-identificacao"
        className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#EAECF0" }}
          >
            <User size={18} style={{ color: "#243871" }} strokeWidth={1.5} />
          </div>

          <div className="flex flex-col gap-0.5 min-w-0 basis-[25%] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{documentLabel}</span>

              <CopyButton
                value={documentCopyValue}
                title={
                  documentTypeLabel === "CPF" ? "Copiar CPF" : "Copiar CNPJ"
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 truncate">
                {consumerName}
              </span>

              <CopyButton
                value={consumerNameCopyValue}
                title={
                  documentTypeLabel === "CPF"
                    ? "Copiar Nome"
                    : "Copiar Razão Social"
                }
              />
            </div>
          </div>

          <div className="w-px self-stretch bg-gray-100" />

          <div className="flex flex-col gap-1.5 flex-1">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
              style={{
                backgroundColor: isRegular ? "#DCFCE7" : "#FEE2E2",
                color: isRegular ? "#15803D" : "#DC2626",
              }}
            >
              {situacao}
            </span>

            <span className="text-xs text-gray-400 whitespace-nowrap">
              {metadataText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
