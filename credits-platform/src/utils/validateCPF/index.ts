import { cpf } from "cpf-cnpj-validator";

export function validateCPF(value: string): boolean {
  return cpf.isValid(value);
}
