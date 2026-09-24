import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Label } from "@/components/ui/label";
import { InputComponent } from "@/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { formatCnpj } from "@/utils/formatCNPJ";
import { validateCNPJ } from "@/utils/validateCNPJ";
import {
  Company,
  CompanyCreatePayload,
  CompanyStatus,
  createCompany,
  deleteCompany,
  listCompanies,
  toggleCompanyStatus,
  updateCompany,
} from "@/lib/company";
import { useCNPJServices } from "@/lib/cnpj";

const STATUS_LABEL: Record<CompanyStatus, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  DELETED: "Excluída",
};

const STATUS_BADGE_VARIANT: Record<
  CompanyStatus,
  "default" | "secondary" | "destructive"
> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  DELETED: "destructive",
};

const EMPTY_FORM_STATE = {
  cnpj: "",
  name: "",
  operator_SPC: "",
  operator_SPC_password: "",
  daily_limit_consults: "100",
  monthly_limit_consults: "1000",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE",
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function CompaniesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSpcPassword, setShowSpcPassword] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [formState, setFormState] = useState(EMPTY_FORM_STATE);
  const { search: cnpjSearch } = useCNPJServices(formState.cnpj.replace(/\D/g, ""));

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  const {
    data: companies = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["companies", debouncedSearch],
    queryFn: () => listCompanies(debouncedSearch),
  });

  useEffect(() => {
    if (!cnpjSearch.data?.company?.name) {
      return;
    }

    const companyName = cnpjSearch.data.company.name?.trim();
    if (!companyName) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      name: prev.name ? prev.name : companyName,
    }));
  }, [cnpjSearch.data]);

  const createMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({ title: "Empresa criada com sucesso." });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CompanyCreatePayload & { status?: "ACTIVE" | "INACTIVE" };
    }) => updateCompany(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({ title: "Empresa atualizada com sucesso." });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: (_, id) => {
      queryClient.setQueriesData({ queryKey: ["companies"] }, (oldData: Company[] | undefined) => {
        if (!oldData) {
          return oldData;
        }

        return oldData.map((company) =>
          company.id === id ? { ...company, status: "DELETED" } : company,
        );
      });

      toast({ title: "Empresa excluída com sucesso." });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleCompanyStatus,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      const company = companies.find((item) => item.id === id);
      const nextStatus = company?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      toast({
        title: `Empresa ${nextStatus === "ACTIVE" ? "ativada" : "inativada"} com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const filteredCompanies = companies;

  const openCreateForm = () => {
    setEditingCompany(null);
    setFormState(EMPTY_FORM_STATE);
    setIsFormOpen(true);
  };

  const openEditForm = (company: Company) => {
    setEditingCompany(company);
    setFormState({
      cnpj: company.cnpj,
      name: company.name,
      operator_SPC: company.operator_SPC ?? "",
      operator_SPC_password: "",
      daily_limit_consults: String(company.limit_consults_daily),
      monthly_limit_consults: String(company.limit_consults_monthly),
      status: company.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanCnpj = formState.cnpj.replace(/\D/g, "");
    if (!validateCNPJ(cleanCnpj)) {
      toast({ title: "CNPJ inválido.", variant: "destructive" });
      return;
    }

    const dailyLimit = Number(formState.daily_limit_consults) || 0;
    const monthlyLimit = Number(formState.monthly_limit_consults) || 0;

    const payload: CompanyCreatePayload & { status?: "ACTIVE" | "INACTIVE" } = {
      cnpj: cleanCnpj,
      name: formState.name.trim(),
      operator_SPC: formState.operator_SPC.trim() || undefined,
      limit_consults_daily: dailyLimit,
      limit_consults_monthly: monthlyLimit,
      ...(formState.operator_SPC_password.trim()
        ? { operator_SPC_password: formState.operator_SPC_password.trim() }
        : {}),
    };

    if (editingCompany) {
      updateMutation.mutate({
        id: editingCompany.id,
        payload: { ...payload, status: formState.status },
      });

      return;
    }

    createMutation.mutate(payload);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const hasActionsColumn = filteredCompanies.some((company) => company.status !== "DELETED");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Empresas</h1>
          <p className="text-sm text-gray-500">
            Consulte as empresas cadastradas na plataforma.
          </p>
        </div>

        <Button onClick={openCreateForm}>
          <Plus size={16} />
          Nova empresa
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Empresas cadastradas</CardTitle>

          <div className="relative w-full max-w-xs">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CNPJ ou operador"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-gray-300"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Limite mensal</TableHead>
                <TableHead>Limite diário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                {hasActionsColumn && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={hasActionsColumn ? 7 : 6} className="py-6 text-center text-sm text-gray-500">
                    Carregando empresas...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={hasActionsColumn ? 7 : 6} className="py-6 text-center text-sm text-red-500">
                    Não foi possível carregar as empresas.
                  </TableCell>
                </TableRow>
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasActionsColumn ? 7 : 6} className="py-6 text-center text-sm text-gray-500">
                    Nenhuma empresa encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium text-gray-800">
                      {company.name}
                    </TableCell>
                    <TableCell>{company.cnpj}</TableCell>
                    <TableCell>{company.limit_consults_monthly}</TableCell>
                    <TableCell>{company.limit_consults_daily}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge variant={STATUS_BADGE_VARIANT[company.status]}>
                          {STATUS_LABEL[company.status]}
                        </Badge>
                        {company.status !== "DELETED" && (
                          <Switch
                            checked={company.status === "ACTIVE"}
                            onCheckedChange={() => toggleStatusMutation.mutate(company.id)}
                            disabled={toggleStatusMutation.isPending}
                            aria-label={`Alternar status de ${company.name}`}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(company.createdAt)}</TableCell>
                    {company.status !== "DELETED" && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditForm(company)}
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(company)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {editingCompany ? "Editar empresa" : "Nova empresa"}
            </SheetTitle>
          </SheetHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <InputComponent
                  id="cnpj"
                  value={formState.cnpj}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      cnpj: formatCnpj(e.target.value, "input"),
                    }))
                  }
                  placeholder="00.000.000/0000-00"
                  autoComplete="on"
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <InputComponent
                id="name"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nome da empresa"
                autoComplete="organization"
                required
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="operator_SPC">Usuário Web Service SPC</Label>
                <InputComponent
                  id="operator_SPC"
                  value={formState.operator_SPC}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, operator_SPC: e.target.value }))
                  }
                  placeholder="Usuário SPC"
                  autoComplete="username"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="operator_SPC_password">Senha Web Service SPC</Label>
                <div className="relative">
                  <InputComponent
                    id="operator_SPC_password"
                    type={showSpcPassword ? "text" : "password"}
                    value={formState.operator_SPC_password}
                    className="w-full pr-10"
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        operator_SPC_password: e.target.value,
                      }))
                    }
                    placeholder="Senha do Web Service"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showSpcPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowSpcPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSpcPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="daily_limit_consults">Limite de consultas diárias</Label>
                <InputComponent
                  id="daily_limit_consults"
                  type="number"
                  min={0}
                  value={formState.daily_limit_consults}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      daily_limit_consults: e.target.value,
                    }))
                  }
                  placeholder="100"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="monthly_limit_consults">Limite de consultas mensais</Label>
                <InputComponent
                  id="monthly_limit_consults"
                  type="number"
                  min={0}
                  value={formState.monthly_limit_consults}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      monthly_limit_consults: e.target.value,
                    }))
                  }
                  placeholder="1000"
                  className="w-full"
                />
              </div>
            </div>

            <SheetFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                {editingCompany ? "Salvar alterações" : "Criar empresa"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? A empresa não
              será removida do banco, apenas marcada como excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
