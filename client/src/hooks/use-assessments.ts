import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertAssessment } from "@shared/schema";

export function useAssessments(params?: { villageId?: number; year?: number }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [api.assessments.list.path, params],
    queryFn: async () => {
      let url = api.assessments.list.path;
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.villageId) queryParams.append("villageId", params.villageId.toString());
        if (params.year) queryParams.append("year", params.year.toString());
        url += `?${queryParams.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return api.assessments.list.responses[200].parse(await res.json());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.assessments.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete assessment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assessments.list.path] });
    },
  });

  return { ...query, deleteMutation };
}

export function useAssessment(id: number) {
  return useQuery({
    queryKey: [api.assessments.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.assessments.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch assessment detail");
      return api.assessments.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAssessment) => {
      const validated = api.assessments.create.input.parse(data);
      const res = await fetch(api.assessments.create.path, {
        method: api.assessments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.assessments.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create assessment");
      }
      return api.assessments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.assessments.list.path] }),
  });
}

export function useUpdateAssessmentValues() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: { indicatorCode: string; aspect?: string; value: number }[] }) => {
      const validated = api.assessments.updateValues.input.parse({ values });
      const url = buildUrl(api.assessments.updateValues.path, { id });
      const res = await fetch(url, {
        method: api.assessments.updateValues.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update values");
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.assessments.get.path, id] });
    },
  });
}

export function useCalculateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.assessments.calculate.path, { id });
      const res = await fetch(url, {
        method: api.assessments.calculate.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to calculate assessment");
      return api.assessments.calculate.responses[200].parse(await res.json());
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [api.assessments.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.assessments.list.path] });
    },
  });
}

export function useExportAssessment() {
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.assessments.export.path, { id });
      // Trigger download by opening in new tab or creating link
      window.open(url, '_blank');
    }
  });
}

export function useIndicators() {
  return useQuery({
    queryKey: ["/api/indicators/all"],
    queryFn: async () => {
      const [dimsRes, subsRes, indsRes, aspectsRes] = await Promise.all([
        fetch("/api/indicators/dimensions", { credentials: "include" }),
        fetch("/api/indicators/sub-dimensions", { credentials: "include" }),
        fetch("/api/indicators/indicators", { credentials: "include" }),
        fetch("/api/indicators/aspects", { credentials: "include" }),
      ]);

      if (!dimsRes.ok || !subsRes.ok || !indsRes.ok || !aspectsRes.ok) {
        throw new Error("Failed to fetch indicators");
      }

      const dims = await dimsRes.json();
      const subs = await subsRes.json();
      const inds = await indsRes.json();
      const aspects = await aspectsRes.json();

      // Hierarchical assembly and sort by code
      return dims.map((d: any) => ({
        ...d,
        weight: parseFloat(d.weight),
        subDimensions: subs
          .filter((s: any) => s.dimensionId === d.id)
          .sort((a: any, b: any) => a.code.localeCompare(b.code, undefined, { numeric: true }))
          .map((s: any) => ({
            ...s,
            indicators: inds
              .filter((i: any) => i.subDimensionId === s.id)
              .sort((a: any, b: any) => a.code.localeCompare(b.code, undefined, { numeric: true }))
              .map((i: any) => ({
                ...i,
                aspects: aspects
                  .filter((a: any) => a.indicatorId === i.id)
                  .map((a: any) => a.aspect)
                  .sort((a: any, b: any) => a.localeCompare(b, undefined, { numeric: true }))
              }))
          }))
      })).sort((a: any, b: any) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    }
  });
}
