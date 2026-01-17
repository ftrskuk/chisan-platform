import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiFetch } from "@/lib/api";
import type {
  OrderWithRelations,
  OrderSearchInput,
  OrdersResponse,
  OrderHistoryWithActor,
  CreateOrderInput,
  UpdateOrderInput,
  ProcessOrderInput,
  ApproveOrderInput,
  RejectOrderInput,
  UrgentApproveOrderInput,
  OrderResult,
} from "@repo/shared";

const ORDERS_KEY = ["orders"];

function buildQueryString(params: OrderSearchInput): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(","));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function useOrders(searchParams?: OrderSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...ORDERS_KEY, searchParams],
    queryFn: () => api.get<OrdersResponse>(`/api/v1/orders${queryString}`),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [...ORDERS_KEY, id],
    queryFn: () => api.get<OrderWithRelations>(`/api/v1/orders/${id}`),
    enabled: !!id,
  });
}

export function useOrderHistory(orderId: string) {
  return useQuery({
    queryKey: [...ORDERS_KEY, orderId, "history"],
    queryFn: () =>
      api.get<OrderHistoryWithActor[]>(`/api/v1/orders/${orderId}/history`),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderInput) =>
      api.post<OrderResult>("/api/v1/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderInput }) =>
      api.patch<OrderResult>(`/api/v1/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, memo }: { id: string; memo?: string }) =>
      apiFetch<OrderResult>(`/api/v1/orders/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ memo }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

export function useStartFieldProcessing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<OrderResult>(`/api/v1/orders/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

export function useCompleteFieldProcessing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProcessOrderInput }) =>
      api.post<OrderResult>(`/api/v1/orders/${id}/process`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

export function useApproveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveOrderInput }) =>
      api.post<OrderResult>(`/api/v1/orders/${id}/approve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectOrderInput }) =>
      api.post<OrderResult>(`/api/v1/orders/${id}/reject`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}

export function useUrgentApproveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UrgentApproveOrderInput }) =>
      api.post<OrderResult>(`/api/v1/orders/${id}/urgent`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}
