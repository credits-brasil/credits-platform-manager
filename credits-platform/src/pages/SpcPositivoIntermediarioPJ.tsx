import { useState, useMemo, ChangeEvent } from "react";
import { useLocation } from "wouter";
import { Search, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { FilterCheckboxComponent, InputComponent } from "@/components";
import { InsumoGroupCard } from "@/containers/SpcMaxi/components/InsumoGroupCard";
import { CNPJ_INSUMO_GROUPS } from "@/constants/insumo-groups";
import type { DocType } from "@/types/docType";
import {
  detectDocTypeByInput,
  formatCnpj,
  validateCNPJ,
} from "@/utils";

const DEFAULT_SELECTED = new Set<string>([]);

export default function SpcMaxiPage() {
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState<DocType>("CNPJ");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [touched, setTouched] = useState(false);
  const [touchedTelefone, setTouchedTelefone] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(DEFAULT_SELECTED),
  );

  const insumoGroups = useMemo(() => CNPJ_INSUMO_GROUPS, [docType]);

  const allSelectableIds = useMemo(
    () => insumoGroups.flatMap((group) => group.items.map((item) => item.id)),
    [insumoGroups],
  );

  const isAllSelected =
    allSelectableIds.length > 0 &&
    allSelectableIds.every((id) => selected.has(id));

  const rawClean = documento.replace(/[^a-zA-Z0-9]/g, "");
  const telefoneClean = telefone.replace(/\D/g, "");
  const shouldRequireTelefone = docType === "CPF" && selected.has("5268");
  const isComplete = rawClean.length === 14;
  const isValid = useMemo(() => {
    if (!isComplete) return null;
    return validateCNPJ(documento);
  }, [documento, docType, isComplete]);
  const isTelefoneComplete =
    !shouldRequireTelefone || telefoneClean.length === 11;

  const showError = touched && isComplete && isValid === false;
  const showSuccess = isComplete && isValid === true;
  const canSubmit = showSuccess && isTelefoneComplete;

  const handleDocumento = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const detectedType = detectDocTypeByInput(raw);

    setDocType(detectedType);
    setDocumento(formatCnpj(raw, "input"),
    );

    if (detectedType === "CNPJ") {
      setTelefone("");
      setTouchedTelefone(false);
    }

    if (!touched) setTouched(true);
  };

  const toggleInsumo = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFilters = () => {
    setSelected(new Set(allSelectableIds));
  };

  const handleClearAllFilters = () => {
    setSelected(new Set());
  };

  const [, navigate] = useLocation();

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || loading) return;

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      queryClient.setQueryData(["spc-maxi-request"], {
        document: rawClean,
        typeDocument: docType,
        telefone: shouldRequireTelefone ? telefoneClean : undefined,
        insumos: Array.from(selected),
      });

      navigate("/verticais/credito-risco/spc-positivo-intermediario-pj/resultado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-screen w-full flex-col gap-3 overflow-hidden px-1">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-[#192949] via-[#243871] to-[#3357a5] p-4 shadow-[0_12px_30px_rgba(36,56,113,0.18)] sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-100">
              Risco e crédito
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-white">
              629 - SPC POSITIVO INTERMEDIÁRIO PJ
            </h1>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 backdrop-blur-sm">
            Consulta completa de crédito e risco
          </div>
        </div>
      </div>

      <form
        onSubmit={handleConsultar}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 sm:p-5"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Documento</p>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Pessoa jurídica
            </span>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="min-w-0 flex-1">
              <InputComponent
                value={documento}
                onChange={handleDocumento}
                onBlur={() => setTouched(true)}
                placeholder={"AB.CDE.FGH/0001-00"}
                autoComplete="on"
                disabled={loading}
                showError={showError}
                showSuccess={showSuccess}
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 whitespace-nowrap shadow-sm"
              style={{
                backgroundColor: canSubmit ? "#243871" : "#9ca3af",
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: canSubmit ? 1 : 0.7,
                boxShadow: canSubmit
                  ? "0 10px 20px rgba(36, 56, 113, 0.2)"
                  : "none",
              }}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search size={14} />
                  Consultar
                </>
              )}
            </button>
          </div>

          {showError && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle size={11} />
              CNPJ inválido. Verifique os dígitos informados.
            </p>
          )}
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Insumos Opcionais
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <FilterCheckboxComponent
              checked={isAllSelected}
              onChange={() => {
                if (isAllSelected) {
                  handleClearAllFilters();
                } else {
                  handleSelectAllFilters();
                }
              }}
              label="Selecionar todos"
              labelFirst
              className="px-3 py-1.5"
            />

            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
              {selected.size} selecionada{selected.size !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {insumoGroups.map((group) => {
          return (
            <InsumoGroupCard
              key={group.id}
              group={group}
              selected={selected}
              onToggleInsumo={toggleInsumo}
            />
          );
        })}
      </div>
    </div>
  );
}
