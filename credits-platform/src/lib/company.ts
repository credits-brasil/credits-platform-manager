export type CompanyStatus = "ACTIVE" | "INACTIVE" | "DELETED";
export type CompanyPeriod = "DAILY" | "WEEKLY" | "MONTHLY";

export interface Company {
  id: string;
  cnpj: string;
  name: string;
  operator_SPC: string | null;
  operator_SPC_password: string | null;
  limit_consults: number;
  period_limit_consults: CompanyPeriod;
  tasting_product_quantity: number;
  tasting_start_date: string | null;
  tasting_end_date: string | null;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCreatePayload {
  cnpj: string;
  name: string;
  operator_SPC?: string;
  operator_SPC_password?: string;
  limit_consults?: number;
  period_limit_consults?: CompanyPeriod;
  tasting_product_quantity?: number;
  tasting_start_date?: string;
  tasting_end_date?: string;
}

export type CompanyUpdatePayload = Partial<CompanyCreatePayload> & {
  status?: "ACTIVE" | "INACTIVE";
};

const API_URL = import.meta.env.VITE_API_URL

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível completar a operação.");
  }

  return data;
}

export async function listCompanies(search?: string): Promise<Company[]> {
  const query = search?.trim();
  const url = new URL(`${API_URL}/api/companies`);

  if (query) {
    url.searchParams.set("q", query);
  }

  const response = await fetch(url.toString());
  const data = await handleResponse<{ companies: Company[] }>(response);

  return data.companies;
}

export async function createCompany(
  payload: CompanyCreatePayload,
): Promise<Company> {
  const response = await fetch(`${API_URL}/api/company`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ company: Company }>(response);

  return data.company;
}

export async function updateCompany(
  id: string,
  payload: CompanyUpdatePayload,
): Promise<Company> {
  const response = await fetch(`${API_URL}/api/company/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ company: Company }>(response);

  return data.company;
}

export async function toggleCompanyStatus(id: string): Promise<Company> {
  const response = await fetch(`${API_URL}/api/company/${id}/status`, {
    method: "PATCH",
  });
  const data = await handleResponse<{ company: Company }>(response);

  return data.company;
}

export async function deleteCompany(id: string): Promise<Company> {
  const response = await fetch(`${API_URL}/api/company/${id}`, {
    method: "DELETE",
  });
  const data = await handleResponse<{ company: Company }>(response);

  return data.company;
}
