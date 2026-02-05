import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertVillage, Village } from "@shared/schema";

export function useVillages(search?: string) {
  const queryClient = useQueryClient();
  const query = useQuery<Village[]>({
    queryKey: [api.villages.list.path, search],
    queryFn: async () => {
      const url = search 
        ? `${api.villages.list.path}?search=${encodeURIComponent(search)}` 
        : api.villages.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch villages");
      return api.villages.list.responses[200].parse(await res.json());
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVillage> }) => {
      const validated = api.villages.update.input.parse(data);
      const url = buildUrl(api.villages.update.path, { id });
      const res = await fetch(url, {
        method: api.villages.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update village");
      return api.villages.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.villages.list.path] }),
  });

  return { ...query, updateMutation };
}

export function useVillage(id: number) {
  return useQuery({
    queryKey: [api.villages.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.villages.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch village");
      return api.villages.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateVillage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVillage) => {
      const validated = api.villages.create.input.parse(data);
      const res = await fetch(api.villages.create.path, {
        method: api.villages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.villages.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create village");
      }
      return api.villages.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.villages.list.path] }),
  });
}

export function useUpdateVillage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertVillage>) => {
      const validated = api.villages.update.input.parse(updates);
      const url = buildUrl(api.villages.update.path, { id });
      const res = await fetch(url, {
        method: api.villages.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update village");
      return api.villages.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.villages.list.path] }),
  });
}

export function useDeleteVillage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.villages.delete.path, { id });
      const res = await fetch(url, {
        method: api.villages.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete village");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.villages.list.path] }),
  });
}
