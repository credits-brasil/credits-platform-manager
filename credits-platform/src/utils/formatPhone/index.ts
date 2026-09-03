export function formatPhone(phone?: string): string {
  if (!phone) return "-";

  const value = phone.replace(/\D/g, "");

  if (value.length === 11) {
    return value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (value.length === 10) {
    return value.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone;
}