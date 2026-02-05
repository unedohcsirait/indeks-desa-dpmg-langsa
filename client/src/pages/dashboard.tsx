import { useState } from "react";
import { useVillages } from "@/hooks/use-villages";
import { 
  useAssessments,
  useIndicators 
} from "@/hooks/use-assessments";
import { LayoutShell } from "@/components/layout-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ClipboardCheck, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { getStatusColor } from "@/lib/indicators";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const { data: villages, isLoading: loadingVillages } = useVillages();
  const { data: assessments, isLoading: loadingAssessments } = useAssessments();
  const { data: DIMENSIONS_DB, isLoading: loadingIndicators } = useIndicators();

  if (loadingVillages || loadingAssessments || loadingIndicators) {
    return (
      <LayoutShell title="Dashboard Overview">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl mt-8" />
      </LayoutShell>
    );
  }

  const DIMENSIONS = DIMENSIONS_DB || [];

  // Filter assessments by year
  const filteredAssessments = selectedYear === "all" 
    ? assessments 
    : assessments?.filter(a => a.year.toString() === selectedYear);

  // Calculate Stats
  const totalVillages = villages?.length || 0;
  const completedAssessments = filteredAssessments?.filter(a => !!a.status).length || 0;
  
  const statusCounts: Record<string, number> = {
    "Mandiri": 0, "Maju": 0, "Berkembang": 0, "Tertinggal": 0, "Sangat Tertinggal": 0
  };

  filteredAssessments?.forEach(a => {
    if (a.status && statusCounts[a.status] !== undefined) {
      statusCounts[a.status]++;
    }
  });

  // Average Dimension Scores across all completed assessments
  const dimensionAverages = DIMENSIONS.map(dim => {
    let total = 0;
    let count = 0;
    filteredAssessments?.forEach(a => {
      // Dimension keys in dimensionScores match DIMENSIONS names
      // We check if the score exists for this dimension name from DB
      const score = a.dimensionScores ? a.dimensionScores[dim.name] : undefined;
      if (score !== undefined) {
        total += Number(score);
        count++;
      }
    });
    return {
      subject: dim.name,
      score: count > 0 ? Number((total / count).toFixed(1)) : 0,
      fullMark: 100,
    };
  });

  const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const years = Array.from({ length: 10 }, (_, i) => 2026 - i);

  return (
    <LayoutShell>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-slate-900 dark:border-slate-800">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun</SelectItem>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover border-l-4 border-l-blue-500 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Villages</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display dark:text-white">{totalVillages}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered in system</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-green-500 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Assessments</CardTitle>
            <ClipboardCheck className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display dark:text-white">{completedAssessments}</div>
            <p className="text-xs text-muted-foreground mt-1">With calculated status</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-yellow-500 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Status</CardTitle>
            <TrendingUp className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display dark:text-white">Berkembang</div>
            <p className="text-xs text-muted-foreground mt-1">Majority status level</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-red-500 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Attention</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display dark:text-white">{statusCounts['Tertinggal'] + statusCounts['Sangat Tertinggal']}</div>
            <p className="text-xs text-muted-foreground mt-1">Villages lagging behind</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Radar Chart */}
        <Card className="shadow-lg dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Dimension Performance</CardTitle>
            <CardDescription className="dark:text-slate-400">Average scores across assessed villages ({selectedYear === "all" ? "Semua Tahun" : selectedYear})</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dimensionAverages}>
                <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Average"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="shadow-lg dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Status Distribution</CardTitle>
            <CardDescription className="dark:text-slate-400">Number of villages by development status ({selectedYear === "all" ? "Semua Tahun" : selectedYear})</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
