import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Brand, CreateBrandInput, UpdateBrandInput } from "@repo/shared";

const BRANDS_KEY = ["brands"];
const PARTNERS_KEY = ["partners"];

export function useBrands() {
  return useQuery({
    queryKey: BRANDS_KEY,
    queryFn: () => api.get<Brand[]>("/api/v1/brands"),
  });
}

export function usePartnerBrands(partnerId: string) {
  return useQuery({
    queryKey: [...PARTNERS_KEY, partnerId, "brands"],
    queryFn: () => api.get<Brand[]>(`/api/v1/partners/${partnerId}/brands`),
    enabled: !!partnerId,
  });
}

export function useCreateBrand(partnerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBrandInput) =>
      api.post<Brand>(`/api/v1/partners/${partnerId}/brands`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_KEY });
      queryClient.invalidateQueries({ queryKey: [...PARTNERS_KEY, partnerId] });
    },
  });
}

export function useUpdateBrand(partnerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBrandInput }) =>
      api.patch<Brand>(`/api/v1/brands/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_KEY });
      queryClient.invalidateQueries({ queryKey: [...PARTNERS_KEY, partnerId] });
    },
  });
}

export function useDeleteBrand(partnerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_KEY });
      queryClient.invalidateQueries({ queryKey: [...PARTNERS_KEY, partnerId] });
    },
  });
}
