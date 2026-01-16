import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  StockWithRelations,
  StockSearchInput,
  StocksResponse,
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
