import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ImportOrderWithRelations,
  ImportOrdersResponse,
  ImportHistoryWithActor,
  ImportOrderResult,
  ImportOrderSearchInput,
  CreateImportOrderInput,
  UpdateImportOrderInput,
  ConfirmImportOrderInput,
  ShipmentWithRelations,
  ShipmentsResponse,
  ShipmentResult,
  ShipmentSearchInput,
  CreateShipmentInput,
  UpdateShipmentInput,
  UpdateShipmentStatusInput,
  ReceiveShipmentInput,
  ImportCost,
  ImportCostSearchInput,
  CreateImportCostInput,
  UpdateImportCostInput,
} from "@repo/shared";

const IMPORT_ORDERS_KEY = ["import", "orders"];
const SHIPMENTS_KEY = ["import", "shipments"];
const IMPORT_COSTS_KEY = ["import", "costs"];

function buildQueryString<T extends Record<string, unknown>>(
  params: T,
): string {
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

export function useImportOrders(searchParams?: ImportOrderSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...IMPORT_ORDERS_KEY, searchParams],
    queryFn: () =>
      api.get<ImportOrdersResponse>(`/api/v1/import/orders${queryString}`),
  });
}

export function useImportOrder(id: string) {
  return useQuery({
    queryKey: [...IMPORT_ORDERS_KEY, id],
    queryFn: () =>
      api.get<ImportOrderWithRelations>(`/api/v1/import/orders/${id}`),
    enabled: !!id,
  });
}

export function useImportOrderHistory(orderId: string) {
  return useQuery({
    queryKey: [...IMPORT_ORDERS_KEY, orderId, "history"],
    queryFn: () =>
      api.get<ImportHistoryWithActor[]>(
        `/api/v1/import/orders/${orderId}/history`,
      ),
    enabled: !!orderId,
  });
}

export function useCreateImportOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateImportOrderInput) =>
      api.post<ImportOrderResult>("/api/v1/import/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_ORDERS_KEY });
    },
  });
}

export function useUpdateImportOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateImportOrderInput }) =>
      api.patch<ImportOrderResult>(`/api/v1/import/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_ORDERS_KEY });
    },
  });
}

export function useConfirmImportOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: ConfirmImportOrderInput;
    }) =>
      api.post<ImportOrderResult>(
        `/api/v1/import/orders/${id}/confirm`,
        data ?? {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_ORDERS_KEY });
    },
  });
}

export function useCancelImportOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, memo }: { id: string; memo?: string }) =>
      api.delete<ImportOrderResult>(`/api/v1/import/orders/${id}`, {
        body: JSON.stringify({ memo }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_ORDERS_KEY });
    },
  });
}

export function useShipments(searchParams?: ShipmentSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...SHIPMENTS_KEY, searchParams],
    queryFn: () =>
      api.get<ShipmentsResponse>(`/api/v1/import/shipments${queryString}`),
  });
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, id],
    queryFn: () =>
      api.get<ShipmentWithRelations>(`/api/v1/import/shipments/${id}`),
    enabled: !!id,
  });
}

export function useShipmentHistory(shipmentId: string) {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, shipmentId, "history"],
    queryFn: () =>
      api.get<ImportHistoryWithActor[]>(
        `/api/v1/import/shipments/${shipmentId}/history`,
      ),
    enabled: !!shipmentId,
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShipmentInput) =>
      api.post<ShipmentResult>("/api/v1/import/shipments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: IMPORT_ORDERS_KEY });
    },
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShipmentInput }) =>
      api.patch<ShipmentResult>(`/api/v1/import/shipments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_KEY });
    },
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateShipmentStatusInput;
    }) =>
      api.patch<ShipmentResult>(`/api/v1/import/shipments/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: IMPORT_ORDERS_KEY });
    },
  });
}

export function useReceiveShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReceiveShipmentInput }) =>
      api.post<ShipmentResult>(`/api/v1/import/shipments/${id}/receive`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: IMPORT_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
  });
}

export function useImportCosts(searchParams?: ImportCostSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...IMPORT_COSTS_KEY, searchParams],
    queryFn: () =>
      api.get<{ data: ImportCost[]; total: number }>(
        `/api/v1/import/costs${queryString}`,
      ),
  });
}

export function useCreateImportCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateImportCostInput) =>
      api.post<ImportCost>("/api/v1/import/costs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_COSTS_KEY });
    },
  });
}

export function useUpdateImportCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateImportCostInput }) =>
      api.patch<ImportCost>(`/api/v1/import/costs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_COSTS_KEY });
    },
  });
}

export function useDeleteImportCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/v1/import/costs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_COSTS_KEY });
    },
  });
}
