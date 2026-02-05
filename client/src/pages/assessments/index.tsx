import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAssessments, useCreateAssessment, useIndicators } from "@/hooks/use-assessments";
import { useVillages } from "@/hooks/use-villages";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowRight, FileText, Download, Search, Trash2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getStatusColor } from "@/lib/indicators";
import { api } from "@shared/routes";

export default function AssessmentList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: assessments, isLoading } = useAssessments();
  const { data: villages } = useVillages();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [exportYear, setExportYear] = useState<string>("all");

  const createMutation = useCreateAssessment();
  const { deleteMutation } = useAssessments();

  const handleExportAll = () => {
    const yearQuery = exportYear === "all" ? "" : `?year=${exportYear}`;
    window.location.href = `${api.assessments.exportBulk.path}${yearQuery}`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus penilaian ini?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Berhasil", description: "Penilaian dihapus" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (!selectedVillage || !selectedYear) return;

    try {
      const result = await createMutation.mutateAsync({
        villageId: parseInt(selectedVillage),
        year: parseInt(selectedYear),
      });
      toast({ title: "Success", description: "Assessment initialized" });
      setIsCreateOpen(false);
      // Navigate to detail page
      setLocation(`/assessments/${result.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => 2026 - i);

  const filteredAssessments = assessments?.filter(a => 
    a.village?.name.toLowerCase().includes(search.toLowerCase()) ||
    a.village?.district.toLowerCase().includes(search.toLowerCase()) ||
    a.status?.toLowerCase().includes(search.toLowerCase())
  );

  // Group assessments by year
  const groupedAssessments = filteredAssessments?.reduce((acc, curr) => {
    const year = curr.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(curr);
    return acc;
  }, {} as Record<number, typeof filteredAssessments>);

  const sortedYears = Object.keys(groupedAssessments || {}).map(Number).sort((a, b) => b - a);

  return (
    <LayoutShell title="Penilaian Indeks Desa">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search assessments..." 
            className="pl-9 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={exportYear} onValueChange={setExportYear}>
              <SelectTrigger className="flex-1 sm:w-[120px] bg-white dark:bg-slate-900 dark:border-slate-800">
                <Filter className="w-3 h-3 mr-2" />
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportAll} className="flex-1 sm:flex-none dark:border-slate-700 dark:text-slate-200">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto shadow-lg shadow-primary/25">
                <Plus className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Assessment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Village</Label>
                  <Select value={selectedVillage} onValueChange={setSelectedVillage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select village..." />
                    </SelectTrigger>
                    <SelectContent>
                      {villages?.map((v) => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.name} ({v.district})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assessment Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year..." />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!selectedVillage || createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Start Assessment"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[1, 2].map(i => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(j => (
                  <Card key={j} className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sortedYears.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800">
          No assessments found.
        </div>
      ) : (
        <div className="space-y-8">
          {sortedYears.map(year => (
            <div key={year} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tahun {year}</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {groupedAssessments![year].length} Data
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedAssessments![year].map((assessment) => (
                  <Card key={assessment.id} className="p-4 dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{assessment.village?.name}</div>
                          <div className="text-xs text-muted-foreground dark:text-slate-400">{assessment.village?.district}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-slate-800">
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Status & Skor</div>
                        <div className="flex items-center gap-2">
                          {assessment.status ? (
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", getStatusColor(assessment.status))}>
                              {assessment.status}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-[10px]">In Progress</span>
                          )}
                          <span className="font-mono text-sm dark:text-slate-300">{assessment.totalScore || "-"}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                          onClick={() => handleDelete(assessment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Link href={`/assessments/${assessment.id}`}>
                          <Button size="sm" className="h-8 text-xs">
                            Detail
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </LayoutShell>
  );
}
