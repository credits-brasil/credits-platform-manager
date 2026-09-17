import { cnpj } from "cpf-cnpj-validator";

export function validateCNPJ(value: string): boolean {
  return cnpj.isValid(value);
}
