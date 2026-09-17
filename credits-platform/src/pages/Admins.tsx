import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Admin,
  AdminCreatePayload,
  AdminStatus,
  createAdmin,
  deleteAdmin,
  listAdmins,
  toggleAdminStatus,
  updateAdmin,
} from "@/lib/admin";
import { formatCpf } from "@/utils/formatCPF";

const STATUS_LABEL: Record<AdminStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  DELETED: "Excluído",
};

const STATUS_BADGE_VARIANT: Record<
  AdminStatus,
  "default" | "secondary" | "destructive"
> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  DELETED: "destructive",
};

const EMPTY_FORM_STATE = {
  name: "",
  cpf: "",
  email: "",
  password: "",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Admin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [formState, setFormState] = useState(EMPTY_FORM_STATE);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  const {
    data: admins = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admins", debouncedSearch],
    queryFn: () => listAdmins(debouncedSearch),
  });

  const createMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast({ title: "Admin criado com sucesso." });
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
      payload: Partial<AdminCreatePayload> & { status?: "ACTIVE" | "INACTIVE" };
    }) => updateAdmin(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast({ title: "Admin atualizado com sucesso." });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast({ title: "Admin excluído com sucesso." });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleAdminStatus,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      const admin = admins.find((item) => item.id === id);
      const nextStatus = admin?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      toast({
        title: `Admin ${nextStatus === "ACTIVE" ? "ativado" : "inativado"} com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const loggedAdminId = (() => {
    try {
      const storedUser = localStorage.getItem("credits-platform-auth-user");
      if (!storedUser) return null;

      const parsedUser = JSON.parse(storedUser) as { id?: string };
      return parsedUser.id ?? null;
    } catch {
      return null;
    }
  })();

  const filteredUsers = admins.filter(
    (admin) => admin.id !== loggedAdminId,
  );

  const openCreateForm = () => {
    setEditingUser(null);
    setFormState(EMPTY_FORM_STATE);
    setIsFormOpen(true);
  };

  const openEditForm = (user: Admin) => {
    setEditingUser(user);
    setFormState({
      name: user.name,
      cpf: user.cpf,
      email: user.email,
      password: "",
      status: user.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingUser) {
      const payload: Partial<AdminCreatePayload> & {
        status?: "ACTIVE" | "INACTIVE";
      } = {
        name: formState.name.trim(),
        cpf: formState.cpf.trim(),
        email: formState.email.trim(),
        status: formState.status,
      };

      if (formState.password.trim()) {
        payload.password = formState.password.trim();
      }

      updateMutation.mutate({ id: editingUser.id, payload });

      return;
    }

    createMutation.mutate({
      name: formState.name.trim(),
      cpf: formState.cpf.trim(),
      email: formState.email.trim(),
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Admins</h1>
          <p className="text-sm text-gray-500">
            Consulte os administradores cadastrados na plataforma.
          </p>
        </div>

        <Button onClick={openCreateForm}>
          <Plus size={16} />
          Novo admin
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Admins cadastrados</CardTitle>

          <div className="relative w-full max-w-xs">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF ou e-mail"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-gray-300"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Primeiro acesso</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-sm text-gray-500">
                    Carregando admins...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-sm text-red-500">
                    Não foi possível carregar os admins.
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-sm text-gray-500">
                    Nenhum admin encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-gray-800">
                      {user.name}
                    </TableCell>
                    <TableCell>{user.cpf}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge variant={STATUS_BADGE_VARIANT[user.status]}>
                          {STATUS_LABEL[user.status]}
                        </Badge>
                        {user.status !== "DELETED" && (
                          <Switch
                            checked={user.status === "ACTIVE"}
                            onCheckedChange={() => toggleStatusMutation.mutate(user.id)}
                            disabled={toggleStatusMutation.isPending}
                            aria-label={`Alternar status de ${user.name}`}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.firstAccess ? "secondary" : "default"}>
                        {user.firstAccess ? "Pendente" : "Concluído"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(user)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={user.status === "DELETED"}
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
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
              {editingUser ? "Editar admin" : "Novo admin"}
            </SheetTitle>
          </SheetHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formState.cpf}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    cpf: formatCpf(e.target.value, "input"),
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            {!editingUser && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                A senha padrão para esse admin será gerada automaticamente: 1234567890
              </div>
            )}

            {editingUser && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nova senha (opcional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formState.password}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={formState.status}
                    onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                      setFormState((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="INACTIVE">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                {editingUser ? "Salvar alterações" : "Criar admin"}
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
            <AlertDialogTitle>Excluir admin</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? O admin não
              será removido do banco, apenas marcado como excluído.
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
