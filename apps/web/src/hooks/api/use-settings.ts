import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Setting, SettingCategory } from "@repo/shared";

const SETTINGS_KEY = ["settings"];

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => api.get<Setting[]>("/api/v1/settings"),
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      category,
      key,
      value,
    }: {
      category: SettingCategory;
      key: string;
      value: unknown;
    }) => api.patch<Setting>(`/api/v1/settings/${category}/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}
