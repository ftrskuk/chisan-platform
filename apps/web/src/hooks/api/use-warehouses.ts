import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Warehouse,
  WarehouseWithLocations,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  Location,
  CreateLocationInput,
  UpdateLocationInput,
} from "@repo/shared";

const WAREHOUSES_KEY = ["warehouses"];

export function useWarehouses() {
  return useQuery({
    queryKey: WAREHOUSES_KEY,
    queryFn: () => api.get<Warehouse[]>("/api/v1/warehouses"),
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: [...WAREHOUSES_KEY, id],
    queryFn: () => api.get<WarehouseWithLocations>(`/api/v1/warehouses/${id}`),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarehouseInput) =>
      api.post<Warehouse>("/api/v1/warehouses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_KEY });
    },
  });
}

export function useUpdateWarehouse(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWarehouseInput) =>
      api.patch<Warehouse>(`/api/v1/warehouses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_KEY });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_KEY });
    },
  });
}

export function useCreateLocation(warehouseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLocationInput) =>
      api.post<Location>(`/api/v1/warehouses/${warehouseId}/locations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...WAREHOUSES_KEY, warehouseId],
      });
    },
  });
}

export function useUpdateLocation(warehouseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLocationInput }) =>
      api.patch<Location>(`/api/v1/locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...WAREHOUSES_KEY, warehouseId],
      });
    },
  });
}

export function useDeleteLocation(warehouseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...WAREHOUSES_KEY, warehouseId],
      });
    },
  });
}

export function useLocations(warehouseId: string) {
  return useQuery({
    queryKey: [...WAREHOUSES_KEY, warehouseId, "locations"],
    queryFn: () =>
      api.get<Location[]>(`/api/v1/warehouses/${warehouseId}/locations`),
    enabled: !!warehouseId,
  });
}
