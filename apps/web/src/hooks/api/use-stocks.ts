import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  StockWithRelations,
  StockSearchInput,
  StocksResponse,
  CreateStockInInput,
  StockInResult,
  BulkStockInInput,
  BulkStockInResult,
} from "@repo/shared";

const STOCKS_KEY = ["stocks"];

function buildQueryString(params: StockSearchInput): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function useStocks(searchParams?: StockSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...STOCKS_KEY, searchParams],
    queryFn: () => api.get<StocksResponse>(`/api/v1/stocks${queryString}`),
  });
}

export function useStock(id: string) {
  return useQuery({
    queryKey: [...STOCKS_KEY, id],
    queryFn: () => api.get<StockWithRelations>(`/api/v1/stocks/${id}`),
    enabled: !!id,
  });
}

export function useCreateStockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStockInInput) =>
      api.post<StockInResult>("/api/v1/stocks/in", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCKS_KEY });
    },
  });
}

export function useBulkStockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkStockInInput) =>
      api.post<BulkStockInResult>("/api/v1/stocks/in/bulk", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCKS_KEY });
    },
  });
}
