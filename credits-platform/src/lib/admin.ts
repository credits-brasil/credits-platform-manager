export type AdminStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export interface Admin {
  id: string;
  name: string;
  cpf: string;
  email: string;
  status: AdminStatus;
  firstAccess: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreatePayload {
  name: string;
  cpf: string;
  email: string;
  password?: string;
}

export type AdminUpdatePayload = Partial<AdminCreatePayload> & {
  status?: "ACTIVE" | "INACTIVE";
};

const API_URL = import.meta.env.VITE_API_URL;

async function handleResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text();
  const data = rawText ? JSON.parse(rawText) : ({} as T);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível completar a operação.");
  }

  return data;
}

export async function listAdmins(search?: string): Promise<Admin[]> {
  const query = search?.trim();
  const url = new URL(`${API_URL}/api/admins`);

  if (query) {
    url.searchParams.set("q", query);
  }

  const response = await fetch(url.toString());
  const data = await handleResponse<{ admins: Admin[] }>(response);

  return data.admins;
}

export async function createAdmin(payload: AdminCreatePayload): Promise<Admin> {
  const response = await fetch(`${API_URL}/api/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ admin: Admin }>(response);
  return data.admin;
}

export async function updateAdmin(
  id: string,
  payload: AdminUpdatePayload,
): Promise<Admin> {
  const response = await fetch(`${API_URL}/api/admin/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ admin: Admin }>(response);
  return data.admin;
}

export async function toggleAdminStatus(id: string): Promise<Admin> {
  const response = await fetch(`${API_URL}/api/admin/${id}/status`, {
    method: "PATCH",
  });

  const data = await handleResponse<{ admin: Admin }>(response);
  return data.admin;
}

export async function deleteAdmin(id: string): Promise<Admin> {
  const response = await fetch(`${API_URL}/api/admin/${id}`, {
    method: "DELETE",
  });

  const data = await handleResponse<{ admin: Admin }>(response);
  return data.admin;
}
