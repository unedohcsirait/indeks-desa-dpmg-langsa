import { useState } from "react";
import { useVillages, useCreateVillage, useDeleteVillage } from "@/hooks/use-villages";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Plus, Search, Trash2, MapPin, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertVillageSchema } from "@shared/schema";

const formSchema = insertVillageSchema;

export default function VillageList() {
  const [search, setSearch] = useState("");
  const { data: villages, isLoading } = useVillages(search);
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<any>(null);

  const createMutation = useCreateVillage();
  const updateMutation = useVillages().updateMutation;
  const deleteMutation = useDeleteVillage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      district: "",
      districtCode: "",
      regency: "",
      regencyCode: "",
      province: "",
      provinceCode: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (editingVillage) {
        await updateMutation.mutateAsync({ id: editingVillage.id, data });
        toast({ title: "Berhasil", description: "Data desa diperbarui" });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: "Berhasil", description: "Desa baru ditambahkan" });
      }
      setIsCreateOpen(false);
      setEditingVillage(null);
      form.reset();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (village: any) => {
    setEditingVillage(village);
    form.reset({
      code: village.code || "",
      name: village.name,
      district: village.district,
      districtCode: village.districtCode || "",
      regency: village.regency,
      regencyCode: village.regencyCode || "",
      province: village.province,
      provinceCode: village.provinceCode || "",
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this village?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Deleted", description: "Village removed successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <LayoutShell title="Data Desa">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search villages..." 
            className="pl-9 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/25">
              <Plus className="w-4 h-4 mr-2" />
              Add Village
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingVillage ? "Edit Data Desa" : "Tambah Desa Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Desa</Label>
                <Input {...form.register("name")} placeholder="Contoh: Desa Sukamaju" />
                {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Kode Desa</Label>
                <Input {...form.register("code")} placeholder="Contoh: 11.74.02.2001" />
              </div>
              <div className="space-y-2">
                <Label>Kecamatan</Label>
                <Input {...form.register("district")} placeholder="Contoh: Cibinong" />
              </div>
              <div className="space-y-2">
                <Label>Kode Kec</Label>
                <Input {...form.register("districtCode")} placeholder="Contoh: 11.74.02" />
              </div>
              <div className="space-y-2">
                <Label>Kabupaten/Kota</Label>
                <Input {...form.register("regency")} placeholder="Contoh: Kabupaten Bogor" />
              </div>
              <div className="space-y-2">
                <Label>Kode Kab</Label>
                <Input {...form.register("regencyCode")} placeholder="Contoh: 11.74" />
              </div>
              <div className="space-y-2">
                <Label>Provinsi</Label>
                <Input {...form.register("province")} placeholder="Contoh: Jawa Barat" />
              </div>
              <div className="space-y-2">
                <Label>Kode Prov</Label>
                <Input {...form.register("provinceCode")} placeholder="Contoh: 11" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                {editingVillage 
                  ? (updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan")
                  : (createMutation.isPending ? "Membuat..." : "Tambah Desa")
                }
              </Button>
            </DialogFooter>
          </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 lg:hidden mt-6">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="p-4 dark:bg-slate-900 dark:border-slate-800">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-4" />
              <div className="flex justify-end">
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))
        ) : villages?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800">
            No villages found.
          </div>
        ) : (
          villages?.map((village) => (
            <Card key={village.id} className="p-4 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{village.name}</div>
                  <div className="text-[10px] text-muted-foreground dark:text-slate-400 font-mono">{village.code || 'NO CODE'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Kecamatan</div>
                  <div className="dark:text-slate-300">{village.district}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Kabupaten</div>
                  <div className="dark:text-slate-300">{village.regency}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="text-[10px] text-muted-foreground">Prov: <span className="font-semibold dark:text-slate-400">{village.province}</span></div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => handleEdit(village)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(village.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 overflow-hidden mt-6">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow className="dark:border-slate-800">
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Village</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">District</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Regency</TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Province</TableHead>
              <TableHead className="text-right dark:text-slate-100">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1,2,3].map(i => (
                <TableRow key={i} className="dark:border-slate-800">
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : villages?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground dark:text-slate-500">
                  No villages found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              villages?.map((village) => (
                <TableRow key={village.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors dark:border-slate-800">
                  <TableCell className="font-medium dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">{village.name}</div>
                        <div className="text-[10px] text-muted-foreground dark:text-slate-400 font-mono">{village.code || 'NO CODE'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="dark:text-slate-300">
                    <div>{village.district}</div>
                    <div className="text-[10px] text-muted-foreground dark:text-slate-400 font-mono">{village.districtCode || '-'}</div>
                  </TableCell>
                  <TableCell className="dark:text-slate-300">
                    <div>{village.regency}</div>
                    <div className="text-[10px] text-muted-foreground dark:text-slate-400 font-mono">{village.regencyCode || '-'}</div>
                  </TableCell>
                  <TableCell className="dark:text-slate-300">
                    <div>{village.province}</div>
                    <div className="text-[10px] text-muted-foreground dark:text-slate-400 font-mono">{village.provinceCode || '-'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => handleEdit(village)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(village.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </LayoutShell>
  );
}
