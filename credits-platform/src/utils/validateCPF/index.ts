export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number.parseInt(digits[i], 10) * (10 - i);

  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== Number.parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number.parseInt(digits[i], 10) * (11 - i);

  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;

  return rest === Number.parseInt(digits[10], 10);
}