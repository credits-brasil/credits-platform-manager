import type { DocType } from "@/types/docType";

export function detectDocTypeByInput(value: string): DocType {
  const cleanAlnum = value.replace(/[^a-zA-Z0-9]/g, "");
  const cleanDigits = value.replace(/\D/g, "");

  if (/[a-zA-Z]/.test(cleanAlnum)) return "CNPJ";

  return cleanDigits.length > 11 ? "CNPJ" : "CPF";
}