import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowLeft, Layers, ListTodo, ClipboardCheck } from "lucide-react";
import { Link } from "wouter";

export default function IndicatorManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States for different levels
  const [activeLevel, setActiveLevel] = useState<'dim' | 'sub' | 'ind' | 'aspect'>('dim');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Queries
  const { data: dimensions } = useQuery<any[]>({ queryKey: ["/api/indicators/dimensions"] });
  const { data: subDimensions } = useQuery<any[]>({ queryKey: ["/api/indicators/sub-dimensions"] });
  const { data: indicators } = useQuery<any[]>({ queryKey: ["/api/indicators/indicators"] });
  const { data: aspects } = useQuery<any[]>({ queryKey: ["/api/indicators/aspects"] });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ level, data }: any) => {
      const endpoint = level === 'dim' ? 'dimensions' : level === 'sub' ? 'sub-dimensions' : level === 'ind' ? 'indicators' : 'aspects';
      const res = await fetch(`/api/indicators/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: (_, { level }) => {
      const queryKey = level === 'dim' ? 'dimensions' : level === 'sub' ? 'sub-dimensions' : level === 'ind' ? 'indicators' : 'aspects';
      queryClient.invalidateQueries({ queryKey: [`/api/indicators/${queryKey}`] });
      // Invalidate ALL indicator related queries to ensure full sync
      queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/dimensions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/sub-dimensions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/aspects"] });
      
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Item created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ level, id, data }: any) => {
      const endpoint = level === 'dim' ? 'dimensions' : level === 'sub' ? 'sub-dimensions' : level === 'ind' ? 'indicators' : 'aspects';
      const res = await fetch(`/api/indicators/${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (_, { level }) => {
      const queryKey = level === 'dim' ? 'dimensions' : level === 'sub' ? 'sub-dimensions' : level === 'ind' ? 'indicators' : 'aspects';
      queryClient.invalidateQueries({ queryKey: [`/api/indicators/${queryKey}`] });
      // Invalidate ALL indicator related queries to ensure full sync
      queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/dimensions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/sub-dimensions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/aspects"] });

      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Item updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ level, id }: any) => {
      const endpoint = level === 'dim' ? 'dimensions' : level === 'sub' ? 'sub-dimensions' : level === 'ind' ? 'indicators' : 'aspects';
      const res = await fetch(`/api/indicators/${endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: (_, { level }) => {
      const queryKey = level === 'dim' ? 'dimensions' : level === 'sub' ? 'sub-dimensions' : level === 'ind' ? 'indicators' : 'aspects';
      queryClient.invalidateQueries({ queryKey: [`/api/indicators/${queryKey}`] });
      // Invalidate ALL indicator related queries to ensure full sync
      queryClient.invalidateQueries({ queryKey: ["/api/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/dimensions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/sub-dimensions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/indicators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indicators/aspects"] });

      toast({ title: "Success", description: "Item deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    if (data.weight) data.weight = data.weight.toString();
    if (data.dimensionId) data.dimensionId = parseInt(data.dimensionId);
    if (data.subDimensionId) data.subDimensionId = parseInt(data.subDimensionId);
    if (data.indicatorId) data.indicatorId = parseInt(data.indicatorId);

    // If it's an aspect and we removed the name field, use aspect as name
    if (activeLevel === 'aspect' && !data.name) {
      data.name = data.aspect;
    }

    if (editingItem) {
      updateMutation.mutate({ level: activeLevel, id: editingItem.id, data });
    } else {
      createMutation.mutate({ level: activeLevel, data });
    }
  };

  const renderForm = () => {
    switch (activeLevel) {
      case 'dim':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kode</Label>
                <Input name="code" defaultValue={editingItem?.code} required />
              </div>
              <div className="space-y-2">
                <Label>Bobot (%)</Label>
                <Input name="weight" type="number" step="0.01" defaultValue={editingItem?.weight} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Dimensi</Label>
              <Input name="name" defaultValue={editingItem?.name} required />
            </div>
          </>
        );
      case 'sub':
        return (
          <>
            <div className="space-y-2">
              <Label>Dimensi Induk</Label>
              <Select name="dimensionId" defaultValue={editingItem?.dimensionId?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Dimensi" />
                </SelectTrigger>
                <SelectContent>
                  {dimensions?.sort((a: any, b: any) => a.code.localeCompare(b.code, undefined, { numeric: true })).map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input name="code" defaultValue={editingItem?.code} required />
            </div>
            <div className="space-y-2">
              <Label>Nama Sub-Dimensi</Label>
              <Input name="name" defaultValue={editingItem?.name} required />
            </div>
          </>
        );
      case 'ind':
        return (
          <>
            <div className="space-y-2">
              <Label>Sub-Dimensi Induk</Label>
              <Select name="subDimensionId" defaultValue={editingItem?.subDimensionId?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Sub-Dimensi" />
                </SelectTrigger>
                <SelectContent>
                  {subDimensions?.sort((a: any, b: any) => a.code.localeCompare(b.code, undefined, { numeric: true })).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input name="code" defaultValue={editingItem?.code} required />
            </div>
            <div className="space-y-2">
              <Label>Nama Indikator</Label>
              <Input name="name" defaultValue={editingItem?.name} required />
            </div>
          </>
        );
      case 'aspect':
        return (
          <>
            <div className="space-y-2">
              <Label>Indikator Induk</Label>
              <Select name="indicatorId" defaultValue={editingItem?.indicatorId?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Indikator" />
                </SelectTrigger>
                <SelectContent>
                  {indicators?.sort((a: any, b: any) => a.code.localeCompare(b.code, undefined, { numeric: true })).map(i => <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input name="code" defaultValue={editingItem?.code} required />
            </div>
            <div className="space-y-2">
              <Label>Aspek Penilaian</Label>
              <Input name="aspect" defaultValue={editingItem?.aspect} required />
            </div>
          </>
        );
    }
  };

  return (
    <LayoutShell title="Manajemen Indikator">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-fit">
          <Button variant={activeLevel === 'dim' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveLevel('dim')}>
            <Layers className="w-4 h-4 mr-2" /> Dimensi
          </Button>
          <Button variant={activeLevel === 'sub' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveLevel('sub')}>
            <Layers className="w-4 h-4 mr-2" /> Sub-Dimensi
          </Button>
          <Button variant={activeLevel === 'ind' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveLevel('ind')}>
            <ListTodo className="w-4 h-4 mr-2" /> Indikator
          </Button>
          <Button variant={activeLevel === 'aspect' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveLevel('aspect')}>
            <ClipboardCheck className="w-4 h-4 mr-2" /> Aspek
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">Daftar {activeLevel === 'dim' ? 'Dimensi' : activeLevel === 'sub' ? 'Sub-Dimensi' : activeLevel === 'ind' ? 'Indikator' : 'Aspek'}</h3>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingItem(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit' : 'Tambah'} {activeLevel.toUpperCase()}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {renderForm()}
                <DialogFooter>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border bg-white dark:bg-slate-900 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Kode</TableHead>
                <TableHead>Nama</TableHead>
                {activeLevel === 'dim' && <TableHead>Bobot</TableHead>}
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activeLevel === 'dim' ? dimensions : activeLevel === 'sub' ? subDimensions : activeLevel === 'ind' ? indicators : aspects)
                ?.sort((a: any, b: any) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                ?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.code}</TableCell>
                  <TableCell>
                    <div className="font-medium">{activeLevel === 'aspect' ? item.aspect : item.name}</div>
                  </TableCell>
                  {activeLevel === 'dim' && <TableCell>{item.weight}%</TableCell>}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsDialogOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if(confirm('Hapus item ini?')) deleteMutation.mutate({ level: activeLevel, id: item.id }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </LayoutShell>
  );
}
