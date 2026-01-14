import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  PaperType,
  CreatePaperTypeInput,
  UpdatePaperTypeInput,
} from "@repo/shared";

const PAPER_TYPES_KEY = ["paper-types"];

export function usePaperTypes() {
  return useQuery({
    queryKey: PAPER_TYPES_KEY,
    queryFn: () => api.get<PaperType[]>("/api/v1/paper-types"),
  });
}

export function useCreatePaperType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaperTypeInput) =>
      api.post<PaperType>("/api/v1/paper-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAPER_TYPES_KEY });
    },
  });
}

export function useUpdatePaperType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaperTypeInput }) =>
      api.patch<PaperType>(`/api/v1/paper-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAPER_TYPES_KEY });
    },
  });
}
