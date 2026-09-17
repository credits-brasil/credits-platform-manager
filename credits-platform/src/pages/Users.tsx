import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InputComponent } from "@/components";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { listCompanies } from "@/lib/company";
import { formatCpf } from "@/utils/formatCPF";
import { formatCnpj } from "@/utils/formatCNPJ";
import { formatPhone } from "@/utils/formatPhone";
import { validateCPF } from "@/utils/validateCPF";

const API_URL = import.meta.env.VITE_API_URL;

type OperatorRole = "ADMIN" | "OPERATOR";
type OperatorCompanyStatus = "ACTIVE" | "INACTIVE" | "DELETED";

type CompanyRelation = {
  id: string;
  name: string;
  cnpj: string;
  role?: OperatorRole;
  companyStatus?: "ACTIVE" | "INACTIVE";
};

type CompanyOperator = {
  id: string;
  companyId: string;
  operatorId: string;
  role: OperatorRole;
  status: OperatorCompanyStatus;
  createdAt: string;
  updatedAt: string;
  operator: {
    id: string;
    user?: string;
    name: string;
    cpf: string;
    email: string;
    phone: string;
    password?: string;
    firstAccess?: boolean;
    createdAt: string;
    updatedAt: string;
  };
  company: {
    id: string;
    name: string;
    cnpj: string;
    status: "ACTIVE" | "INACTIVE" | "DELETED";
  };
};

type UserListItem = {
  id: string;
  user?: string | null;
  name: string;
  cpf: string;
  email?: string | null;
  phone: string;
  firstAccess?: boolean;
  createdAt: string;
  updatedAt: string;
  companies: Array<{
    id: string;
    role: OperatorRole;
    status: OperatorCompanyStatus;
    createdAt: string;
    updatedAt: string;
    company: {
      id: string;
      name: string;
      cnpj: string;
      status: "ACTIVE" | "INACTIVE" | "DELETED";
    };
  }>;
};

type OperatorFormState = {
  user: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  role: OperatorRole;
};

const generateRandomUserCode = () => String(Math.floor(10000000 + Math.random() * 90000000));

const EMPTY_FORM_STATE: OperatorFormState = {
  user: "",
  name: "",
  cpf: "",
  email: "",
  phone: "",
  role: "OPERATOR",
};

const normalizeOperatorRole = (role?: string): OperatorRole => {
  if (role === "ADMIN") return "ADMIN";
  return "OPERATOR";
};

const ROLE_LABEL: Record<OperatorRole, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
};

const OPERATOR_STATUS_LABEL: Record<OperatorCompanyStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Excluído",
  DELETED: "Excluído",
};

const OPERATOR_STATUS_VARIANT: Record<OperatorCompanyStatus, "default" | "secondary"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  DELETED: "secondary",
};

async function listCompanyOperators(companyId: string): Promise<CompanyOperator[]> {
  const response = await fetch(`${API_URL}/api/company/${companyId}/users`);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Não foi possível carregar os usuários.");
  }

  const payload = await response.json();
  return payload.users ?? [];
}

async function listAllUsers(): Promise<UserListItem[]> {
  const response = await fetch(`${API_URL}/api/users`);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Não foi possível carregar os usuários.");
  }

  const payload = await response.json();
  return payload.users ?? [];
}

function flattenUserCompanies(users: UserListItem[]): CompanyOperator[] {
  return users.flatMap((user) => {
    if (!user.companies?.length) {
      return [];
    }

    return user.companies.map((companyLink) => ({
      id: companyLink.id,
      companyId: companyLink.company.id,
      operatorId: user.id,
      role: normalizeOperatorRole(companyLink.role),
      status: companyLink.status ?? "ACTIVE",
      createdAt: companyLink.createdAt ?? "",
      updatedAt: companyLink.updatedAt ?? "",
      operator: {
        id: user.id,
        user: user.user ?? "",
        name: user.name,
        cpf: user.cpf,
        email: user.email ?? "",
        phone: user.phone,
        firstAccess: user.firstAccess ?? true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      company: companyLink.company,
    }));
  });
}

async function createCompanyOperator(companyId: string, payload: Record<string, string>) {
  const response = await fetch(`${API_URL}/api/company/${companyId}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível criar o usuário.");
  }

  return data.companyUser;
}

async function updateCompanyOperator(companyId: string, id: string, payload: Record<string, string>) {
  const response = await fetch(`${API_URL}/api/company/${companyId}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível atualizar o usuário.");
  }

  return data.companyUser;
}

async function deleteCompanyOperator(companyId: string, id: string) {
  const response = await fetch(`${API_URL}/api/company/${companyId}/users/${id}`, {
    method: "DELETE",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível inativar o usuário.");
  }

  return data.companyUser;
}

function CompanyMultiSelect({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; name: string }>;
  value: string[];
  onChange: (nextValue: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCompanies = options.filter((company) => value.includes(company.id));
  const filteredCompanies = options.filter((company) =>
    company.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleCompany = (companyId: string) => {
    onChange(
      value.includes(companyId)
        ? value.filter((id) => id !== companyId)
        : [...value, companyId],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex min-h-12 w-full justify-start rounded-lg px-3 py-2 text-left"
        >
          <div className="flex w-full flex-wrap items-center gap-2">
            {selectedCompanies.length > 0 ? (
              selectedCompanies.map((company) => (
                <Badge
                  key={company.id}
                  variant="secondary"
                  className="flex items-center gap-1 rounded-full px-2 py-1"
                >
                  <span>{company.name}</span>
                  <button
                    type="button"
                    className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleCompany(company.id);
                    }}
                  >
                    ×
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Selecione as empresas</span>
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar empresa..."
          />
          <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
          <CommandGroup>
            {filteredCompanies.map((company) => {
              const isSelected = value.includes(company.id);

              return (
                <CommandItem
                  key={company.id}
                  value={company.name}
                  onSelect={() => {
                    toggleCompany(company.id);
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <span>{company.name}</span>
                  {isSelected && <span className="text-xs text-primary">Selecionado</span>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedCompany, setSelectedCompany] = useState<CompanyRelation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<CompanyOperator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyOperator | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [formState, setFormState] = useState<OperatorFormState>(EMPTY_FORM_STATE);

  useEffect(() => {
    const storedCompany = localStorage.getItem("credits-platform-selected-company");
    if (!storedCompany) {
      setSelectedCompany(null);
      return;
    }

    try {
      const parsed = JSON.parse(storedCompany) as CompanyRelation;
      setSelectedCompany(parsed);
    } catch {
      setSelectedCompany(null);
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const storedCompany = localStorage.getItem("credits-platform-selected-company");
      if (!storedCompany) {
        setSelectedCompany(null);
        return;
      }

      try {
        const parsed = JSON.parse(storedCompany) as CompanyRelation;
        setSelectedCompany(parsed);
      } catch {
        setSelectedCompany(null);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const sessionUser = useMemo(() => {
    try {
      const storedUser = localStorage.getItem("credits-platform-auth-user");
      return storedUser ? (JSON.parse(storedUser) as { id?: string; companies?: CompanyRelation[] }) : null;
    } catch {
      return null;
    }
  }, [selectedCompany]);

  const loggedOperatorId = sessionUser?.id ?? null;
  const hasCompanyAccessList = Boolean(sessionUser?.companies?.length);
  const selectedCompanyRole =
    sessionUser?.companies?.find((company) => company.id === selectedCompany?.id)?.role ??
    (hasCompanyAccessList ? "OPERATOR" : "ADMIN");
  const isAdminForSelectedCompany = selectedCompanyRole === "ADMIN";
  const canManageCompany = (companyId: string) => {
    if (!sessionUser?.companies || !sessionUser.companies.length) {
      return true;
    }

    return sessionUser.companies.some((company) => company.id === companyId && company.role === "ADMIN");
  };

  const {
    data: operators = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const users = await listAllUsers();
      return flattenUserCompanies(users);
    },
    enabled: !!sessionUser,
  });

  const normalizedOperators = useMemo<CompanyOperator[]>(
    () =>
      (operators as any[]).map((operator) => ({
        ...operator,
        companyId: operator.companyId ?? operator.company?.id ?? "",
        operatorId: operator.userId ?? operator.operatorId ?? operator.user?.id ?? operator.operator?.id ?? "",
        operator: operator.user ?? operator.operator ?? {
          id: "",
          user: "",
          name: "-",
          cpf: "-",
          email: "-",
          phone: "-",
          createdAt: "",
          updatedAt: "",
        },
        company:
          operator.company ?? {
            id: "",
            name: "-",
            cnpj: "-",
            status: "ACTIVE",
          },
      })),
    [operators],
  );

  const {
    data: companyOptions = [],
  } = useQuery({
    queryKey: ["companies"],
    queryFn: () => listCompanies(),
  });

  const createMutation = useMutation({
    mutationFn: ({ companyIds, payload }: { companyIds: string[]; payload: Record<string, string> }) =>
      Promise.all(companyIds.map((companyId) => createCompanyOperator(companyId, payload))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast({ title: "Operador criado com sucesso." });
      setIsDrawerOpen(false);
      setFormState(EMPTY_FORM_STATE);
      setSelectedCompanyIds(selectedCompany ? [selectedCompany.id] : []);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ companyId, id, payload }: { companyId: string; id: string; payload: Record<string, string> }) =>
      updateCompanyOperator(companyId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast({ title: "Operador atualizado com sucesso." });
      setIsDrawerOpen(false);
      setFormState(EMPTY_FORM_STATE);
      setEditingOperator(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) => deleteCompanyOperator(companyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast({ title: "Operador inativado com sucesso." });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const toggleOperatorStatus = (operator: CompanyOperator) => {
    if (!canManageCompany(operator.companyId)) {
      toast({ title: "Você não tem permissão para alterar este operador.", variant: "destructive" });
      return;
    }

    const nextStatus: OperatorCompanyStatus = operator.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    fetch(`${API_URL}/api/company/${operator.companyId}/users/${operator.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Não foi possível alterar o status do usuário.");
        }

        queryClient.invalidateQueries({ queryKey: ["all-users"] });
        toast({
          title: `Usuário ${nextStatus === "ACTIVE" ? "ativado" : "inativado"} com sucesso.`,
        });
      })
      .catch((error: Error) => {
        toast({ title: error.message, variant: "destructive" });
      });
  };

  const filteredOperators = useMemo(() => {
    const visibleOperators = (normalizedOperators ?? []).filter(
      (operator: any) => (operator?.operator?.id ?? "") !== loggedOperatorId,
    );
    const term = search.trim().toLowerCase();

    if (!term) {
      return visibleOperators;
    }

    return visibleOperators.filter((operator) => {
      const values = [
        operator?.operator?.name ?? "",
        operator?.operator?.cpf ?? "",
        operator?.operator?.email ?? "",
        operator?.company?.name ?? "",
      ];
      return values.some((value) => value.toLowerCase().includes(term));
    });
  }, [normalizedOperators, loggedOperatorId, search]);

  const openCreateDrawer = () => {
    setEditingOperator(null);
    setFormState({ ...EMPTY_FORM_STATE });
    setSelectedCompanyIds(selectedCompany ? [selectedCompany.id] : []);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (operator: CompanyOperator) => {
    if (!canManageCompany(operator.companyId)) {
      toast({ title: "Você não tem permissão para editar este operador.", variant: "destructive" });
      return;
    }

    setEditingOperator(operator);
    setSelectedCompanyIds([operator.companyId]);
    setFormState({
      user: operator.operator.user ?? "",
      name: operator.operator.name,
      cpf: operator.operator.cpf,
      email: operator.operator.email ?? "",
      phone: operator.operator.phone,
      role: normalizeOperatorRole(operator.role),
    });
    setIsDrawerOpen(true);
  };

  const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCompanyIds.length) {
      toast({ title: "Selecione pelo menos uma empresa para o operador.", variant: "destructive" });
      return;
    }

    const cleanCpf = formState.cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCpf)) {
      toast({ title: "CPF inválido.", variant: "destructive" });
      return;
    }

    const userCode = formState.user.trim().replace(/\D/g, "").slice(0, 8);
    const emailValue = formState.email.trim().toLowerCase();
    const hasUser = Boolean(userCode);
    const hasEmail = Boolean(emailValue);

    if (hasUser === hasEmail) {
      toast({
        title: "Informe apenas um identificador: usuário ou e-mail.",
        variant: "destructive",
      });
      return;
    }

    if (hasUser && !/^\d{8}$/.test(userCode)) {
      toast({ title: "Usuário deve conter 8 dígitos numéricos.", variant: "destructive" });
      return;
    }

    const payload: Record<string, string> = {
      name: formState.name.trim(),
      cpf: cleanCpf,
      phone: formState.phone.trim(),
      role: formState.role,
    };

    if (hasUser) {
      payload.user = userCode;
    } else {
      payload.email = emailValue;
    }

    if (editingOperator) {
      updateMutation.mutate({
        companyId: editingOperator.companyId,
        id: editingOperator.id,
        payload,
      });
      return;
    }

    createMutation.mutate({ companyIds: selectedCompanyIds, payload });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Usuários</h1>
          <p className="text-sm text-gray-500">
            Veja todos os usuários e a empresa na qual cada um está vinculado.
          </p>
        </div>

        <Button onClick={openCreateDrawer} disabled={!selectedCompany && !companyOptions.length}>
          <Plus size={16} className="mr-2" />
          Novo usuário
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Todos os usuários</CardTitle>

          <div className="relative w-full max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, CPF ou e-mail"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-gray-300"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-500">
              <Loader2 size={15} className="mr-2 animate-spin" />
              Carregando users...
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-sm text-red-500">
              Não foi possível carregar os users desta empresa.
            </div>
          ) : filteredOperators.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Nenhum user encontrado para esta empresa.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Primeiro acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperators.map((operator) => {
                  const itemOperator = operator?.operator ?? {
                    id: "",
                    name: "-",
                    cpf: "-",
                    email: "-",
                    phone: "-",
                  };
                  const itemCompany = operator?.company ?? {
                    id: "",
                    name: "-",
                    cnpj: "-",
                    status: "ACTIVE" as const,
                  };

                  const displayStatus = operator.status === "INACTIVE" ? "DELETED" : operator.status;

                  return (
                    <TableRow key={operator.id}>
                      <TableCell className="font-medium text-gray-800">{itemOperator.name}</TableCell>
                      <TableCell>{itemCompany.name}</TableCell>
                      <TableCell>{formatCnpj(itemCompany.cnpj)}</TableCell>
                      <TableCell>{formatCpf(itemOperator.cpf, "display")}</TableCell>
                      <TableCell>{itemOperator.email}</TableCell>
                      <TableCell>{ROLE_LABEL[operator.role] ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Badge variant={OPERATOR_STATUS_VARIANT[displayStatus] ?? "secondary"}>
                            {OPERATOR_STATUS_LABEL[displayStatus] ?? "-"}
                          </Badge>
                          <Switch
                            checked={operator.status === "ACTIVE"}
                            onCheckedChange={() => toggleOperatorStatus(operator)}
                            disabled={!canManageCompany(operator.companyId) || updateMutation.isPending}
                            aria-label={`Alternar status do operador ${itemOperator.name}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={operator.operator.firstAccess ? "secondary" : "default"}>
                          {operator.operator.firstAccess ? "Pendente" : "Concluído"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDrawer(operator)}
                            disabled={!canManageCompany(operator.companyId)}
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(operator)}
                            disabled={!canManageCompany(operator.companyId)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="inset-y-0 right-0 m-0 ml-auto h-full w-full max-w-xl rounded-none border-l bg-background shadow-lg">
          <DrawerHeader>
            <DrawerTitle>{editingOperator ? "Editar usuário" : "Novo usuário"}</DrawerTitle>
          </DrawerHeader>

          <form onSubmit={submitForm} className="w-full space-y-4 px-4 pb-4">
            <div className="w-full space-y-2">
              <Label htmlFor="operator-user">Usuário</Label>
              <div className="flex w-full min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <InputComponent
                    id="operator-user"
                    value={formState.user}
                    readOnly
                    placeholder="8 dígitos"
                    className="w-full min-w-0 bg-muted/30"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      user: generateRandomUserCode(),
                      email: "",
                    }))
                  }
                >
                  Gerar usuário
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-name">Nome</Label>
              <InputComponent
                id="operator-name"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-cpf">CPF</Label>
              <InputComponent
                id="operator-cpf"
                value={formState.cpf}
                onChange={(event) => setFormState((prev) => ({ ...prev, cpf: formatCpf(event.target.value, "input") }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-email">E-mail</Label>
              <InputComponent
                id="operator-email"
                type="email"
                value={formState.email}
                disabled={Boolean(formState.user)}
                onChange={(event) => {
                  const nextEmail = event.target.value;
                  setFormState((prev) => ({
                    ...prev,
                    email: nextEmail,
                    user: nextEmail ? "" : prev.user,
                  }));
                }}
                placeholder={formState.user ? "Desabilitado quando há usuário" : "Opcional se o usuário for informado"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator-phone">Telefone</Label>
              <InputComponent
                id="operator-phone"
                value={formState.phone}
                onChange={(event) => setFormState((prev) => ({ ...prev, phone: formatPhone(event.target.value) }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={formState.role}
                onValueChange={(value: OperatorRole) => setFormState((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="OPERATOR">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Empresas vinculadas</Label>
              {companyOptions.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma empresa cadastrada.</p>
              ) : (
                <CompanyMultiSelect
                  options={companyOptions}
                  value={selectedCompanyIds}
                  onChange={setSelectedCompanyIds}
                />
              )}
            </div>

            <DrawerFooter className="flex-row justify-end gap-2 p-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingOperator
                    ? "Salvar"
                    : "Criar"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação vai deixar o usuário inativo para esta empresa, sem remover o cadastro global.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate({ companyId: deleteTarget.companyId, id: deleteTarget.id });
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
