import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { 
  useAssessment, 
  useUpdateAssessmentValues, 
  useCalculateAssessment, 
  useExportAssessment,
  useIndicators
} from "@/hooks/use-assessments";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { getStatusColor } from "@/lib/indicators";
import { useToast } from "@/hooks/use-toast";
import { Save, Calculator, Download, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AssessmentDetail() {
  const [, params] = useRoute("/assessments/:id");
  const id = parseInt(params?.id || "0");
  const { data: assessment, isLoading: isAssessmentLoading } = useAssessment(id);
  const { data: DIMENSIONS_DB, isLoading: isIndicatorsLoading } = useIndicators();
  const isLoading = isAssessmentLoading || isIndicatorsLoading;
  const toast = useToast().toast;

  const DIMENSIONS = DIMENSIONS_DB || [];

  const updateValuesMutation = useUpdateAssessmentValues();
  const calculateMutation = useCalculateAssessment();
  const exportMutation = useExportAssessment();

  // Local state for form values: Record<indicatorCode_aspect, value>
  const [values, setValues] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("1"); // Dimension ID

  // Load initial values when data fetched
  useEffect(() => {
    if (assessment?.values) {
      const map: Record<string, number> = {};
      assessment.values.forEach((v: any) => {
        // Find if this indicator still exists in current structure
        const dim = DIMENSIONS.find(d => d.subDimensions.some((sd: any) => sd.indicators.some((i: any) => i.code === v.indicatorCode)));
        if (dim) {
          const key = v.aspect ? `${v.indicatorCode}_${v.aspect}` : v.indicatorCode;
          map[key] = v.value;
        }
      });
      setValues(map);
    }
  }, [assessment, DIMENSIONS]);

  const handleValueChange = (code: string, aspect: string | undefined, val: string) => {
    const key = aspect ? `${code}_${aspect}` : code;
    setValues(prev => ({ ...prev, [key]: parseInt(val) }));
  };

  const handleSave = async () => {
    const payload = Object.entries(values).map(([key, val]) => {
      const [code, ...aspectParts] = key.split('_');
      const aspect = aspectParts.length > 0 ? aspectParts.join('_') : undefined;
      return {
        indicatorCode: code,
        aspect,
        value: val
      };
    });
    
    try {
      await updateValuesMutation.mutateAsync({ id, values: payload });
      toast({ title: "Saved", description: "Progress saved successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCalculate = async () => {
    // First save
    await handleSave();
    
    try {
      await calculateMutation.mutateAsync(id);
      toast({ title: "Calculated", description: "Assessment score updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading || !assessment) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </LayoutShell>
    );
  }

  // Calculate progress for current dimension
  const currentDim = DIMENSIONS.find(d => d.id.toString() === activeTab);
  const allIndicators = currentDim?.subDimensions.flatMap(sd => sd.indicators) || [];
  
  // Total expected entries (indicators + their aspects)
  const totalEntries = allIndicators.reduce((acc, ind) => {
    const indFromDb = currentDim?.subDimensions.flatMap((sd: any) => sd.indicators).find((i: any) => i.code === ind.code);
    return acc + (indFromDb?.aspects?.length || 1);
  }, 0);
  
  const filledCount = allIndicators.reduce((acc, ind) => {
    const indFromDb = currentDim?.subDimensions.flatMap((sd: any) => sd.indicators).find((i: any) => i.code === ind.code);
    if (indFromDb?.aspects && indFromDb.aspects.length > 0) {
      return acc + indFromDb.aspects.filter((a: any) => values[`${ind.code}_${a}`]).length;
    }
    return acc + (values[ind.code] ? 1 : 0);
  }, 0);
  
  const progress = (filledCount / (totalEntries || 1)) * 100;

  return (
    <LayoutShell>
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-xl md:text-2xl font-bold dark:text-white">Assessment: {assessment.village.name}</h2>
        <p className="text-sm text-muted-foreground">Tahun Penilaian: {assessment.year}</p>
      </div>
      {/* Header Summary */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl shadow-sm border border-border dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8">
        <div className="w-full md:w-auto">
          <h3 className="font-bold text-sm md:text-lg mb-1 dark:text-white uppercase tracking-wider text-muted-foreground lg:normal-case lg:text-slate-900">Current Status</h3>
          <div className="flex items-center justify-between md:justify-start gap-3">
            {assessment.status ? (
              <span className={cn("px-3 py-1 rounded-full text-xs md:text-sm font-bold border", getStatusColor(assessment.status))}>
                {assessment.status}
              </span>
            ) : (
              <span className="text-muted-foreground italic text-sm dark:text-slate-400">Not Calculated</span>
            )}
            {assessment.totalScore && (
              <span className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white">
                {assessment.totalScore}<span className="text-xs md:text-sm text-muted-foreground font-normal dark:text-slate-400">/100</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={handleSave} disabled={updateValuesMutation.isPending} className="flex-1 md:flex-none dark:border-slate-700 dark:text-slate-200 h-9 px-3 text-xs md:text-sm">
            <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Save
          </Button>
          <Button onClick={handleCalculate} disabled={calculateMutation.isPending} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 h-9 px-3 text-xs md:text-sm">
            <Calculator className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Calculate
          </Button>
          {assessment.status && (
            <Button variant="secondary" onClick={() => exportMutation.mutate(id)} className="w-full md:w-auto dark:bg-slate-800 dark:text-slate-200 h-9 px-3 text-xs md:text-sm">
              <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar - Horizontal on Mobile */}
        <div className="lg:col-span-1">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="pb-3 hidden lg:block">
              <CardTitle className="text-sm uppercase text-muted-foreground font-bold tracking-wider dark:text-slate-400">Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 overflow-x-auto scrollbar-hide">
              <Tabs 
                orientation="vertical" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="flex lg:flex-col h-auto w-full bg-transparent gap-2 px-4 lg:px-1 pb-1 justify-start">
                  {DIMENSIONS.map((dim) => {
                    const dimScore = assessment.dimensionScores?.[dim.name];
                    const isActive = activeTab === dim.id.toString();
                    
                    return (
                      <TabsTrigger 
                        key={dim.id} 
                        value={dim.id.toString()}
                        className={cn(
                          "flex-shrink-0 lg:w-full justify-start lg:justify-between px-4 py-2.5 lg:px-4 lg:py-3 h-auto text-left rounded-lg transition-all border-2",
                          isActive 
                            ? "bg-primary text-white shadow-md border-primary !bg-primary !text-white" 
                            : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 data-[state=active]:bg-primary data-[state=active]:text-white"
                        )}
                      >
                        <div className="flex flex-col items-start">
                          <span className={cn("font-bold text-xs lg:text-sm whitespace-nowrap", isActive ? "text-white !text-white" : "text-slate-700 dark:text-slate-200")}>{dim.name}</span>
                          <span className={cn("text-[10px] lg:text-xs opacity-90", isActive ? "text-white/90 !text-white/90" : "text-muted-foreground dark:text-slate-400")}>
                            {dim.weight}%
                          </span>
                        </div>
                        {dimScore !== undefined && (
                          <span className={cn(
                            "font-mono text-[10px] lg:text-xs font-bold px-1.5 py-0.5 rounded ml-auto lg:ml-2",
                            isActive ? "bg-white/20 text-white !text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          )}>
                            {Number(dimScore).toFixed(1)}
                          </span>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Questionnaire Area */}
        <div className="lg:col-span-3">
          <Card className="h-full border-t-4 border-t-primary dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-primary">{currentDim?.name}</CardTitle>
                  <CardDescription className="mt-2 dark:text-slate-400">
                    Complete all {totalEntries} entries in this dimension.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-slate-300 dark:text-slate-700">
                    {filledCount}/{totalEntries}
                  </div>
                </div>
              </div>
              <Progress value={progress} className="h-2 mt-4" />
            </CardHeader>
            <CardContent className="space-y-8 md:space-y-12 py-4 md:py-8">
              {currentDim?.subDimensions.map((subDim) => (
                <div key={subDim.id} className="space-y-4 md:space-y-6">
                  <div className="flex items-center gap-3 border-b dark:border-slate-800 pb-2">
                    <div className="bg-primary/10 text-primary px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold">
                      {subDim.id}
                    </div>
                    <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200">Sub-Dimensi: {subDim.name}</h3>
                  </div>
                  
                  <div className="space-y-4 md:space-y-8">
                    {subDim.indicators.map((indicator, index) => (
                      <div key={indicator.code} className="p-4 md:p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center text-[10px] md:text-sm shadow-sm">
                            {indicator.code}
                          </div>
                          <div className="flex-1 space-y-3 md:space-y-4">
                            <div>
                              <h4 className="font-semibold text-base md:text-lg text-slate-900 dark:text-slate-100">{indicator.name}</h4>
                              <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400 mt-1">{indicator.description}</p>
                            </div>

                                  <div className="pt-1 md:pt-2 space-y-6">
                                    {(indicator.aspects && indicator.aspects.length > 0 ? indicator.aspects : [undefined]).map((aspect: any) => (
                                      <div key={aspect || 'default'} className="space-y-3">
                                        {aspect && (
                                          <Label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
                                            {aspect}
                                          </Label>
                                        )}
                                        {!aspect && (
                                          <Label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
                                            Score (1-5)
                                          </Label>
                                        )}
                                        <RadioGroup 
                                          value={values[aspect ? `${indicator.code}_${aspect}` : indicator.code]?.toString()} 
                                          onValueChange={(val) => handleValueChange(indicator.code, aspect, val)}
                                          className="grid grid-cols-5 gap-2"
                                        >
                                          {[1, 2, 3, 4, 5].map((val) => (
                                            <div key={val} className="w-full">
                                              <RadioGroupItem value={val.toString()} id={`${indicator.code}-${aspect || 'default'}-${val}`} className="peer sr-only" />
                                              <Label
                                                htmlFor={`${indicator.code}-${aspect || 'default'}-${val}`}
                                                className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 md:p-3 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 dark:peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full dark:text-slate-200"
                                              >
                                                <span className="text-sm md:text-lg font-bold">{val}</span>
                                              </Label>
                                            </div>
                                          ))}
                                        </RadioGroup>
                                      </div>
                                    ))}
                                  </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
            
            <div className="p-4 md:p-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-xl">
               <span className="text-xs md:text-sm text-muted-foreground dark:text-slate-400 order-2 sm:order-1">
                 {filledCount === totalEntries 
                   ? "All indicators in this dimension completed." 
                   : `${totalEntries - filledCount} indicators remaining.`}
               </span>
               <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                 <Button variant="outline" onClick={handleSave} className="flex-1 sm:flex-none dark:border-slate-700 dark:text-slate-200 text-xs md:text-sm h-9 md:h-10">Save</Button>
                 {parseInt(activeTab) < 6 && (
                   <Button className="flex-1 sm:flex-none text-xs md:text-sm h-9 md:h-10" onClick={() => {
                     setActiveTab((parseInt(activeTab) + 1).toString());
                     window.scrollTo(0, 0);
                   }}>
                     Next <ArrowRight className="ml-1 md:ml-2 w-3 h-3 md:w-4 md:h-4" />
                   </Button>
                 )}
                 {parseInt(activeTab) === 6 && (
                   <Button onClick={handleCalculate} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-xs md:text-sm h-9 md:h-10">
                     Finish <CheckCircle2 className="ml-1 md:ml-2 w-3 h-3 md:w-4 md:h-4" />
                   </Button>
                 )}
               </div>
            </div>
          </Card>
        </div>
      </div>
    </LayoutShell>
  );
}
