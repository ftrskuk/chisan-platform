import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Item,
  ItemWithRelations,
  CreateItemInput,
  UpdateItemInput,
  ItemSearchInput,
} from "@repo/shared";

const ITEMS_KEY = ["items"];

function buildQueryString(params: ItemSearchInput): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function useItems(searchParams?: ItemSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...ITEMS_KEY, searchParams],
    queryFn: () => api.get<ItemWithRelations[]>(`/api/v1/items${queryString}`),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: [...ITEMS_KEY, id],
    queryFn: () => api.get<ItemWithRelations>(`/api/v1/items/${id}`),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemInput) =>
      api.post<Item>("/api/v1/items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

export function useUpdateItem(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateItemInput) =>
      api.patch<Item>(`/api/v1/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}
