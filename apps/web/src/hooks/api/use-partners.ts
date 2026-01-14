import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Partner,
  PartnerWithBrands,
  CreatePartnerInput,
  UpdatePartnerInput,
} from "@repo/shared";

const PARTNERS_KEY = ["partners"];

export function usePartners() {
  return useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: () => api.get<Partner[]>("/api/v1/partners"),
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: [...PARTNERS_KEY, "suppliers"],
    queryFn: () => api.get<Partner[]>("/api/v1/partners/suppliers"),
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: [...PARTNERS_KEY, "customers"],
    queryFn: () => api.get<Partner[]>("/api/v1/partners/customers"),
  });
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: [...PARTNERS_KEY, id],
    queryFn: () => api.get<PartnerWithBrands>(`/api/v1/partners/${id}`),
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePartnerInput) =>
      api.post<Partner>("/api/v1/partners", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
    },
  });
}

export function useUpdatePartner(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePartnerInput) =>
      api.patch<Partner>(`/api/v1/partners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
    },
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
    },
  });
}
