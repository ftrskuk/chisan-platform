import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  SlittingJobWithRelations,
  SlittingJobsResponse,
  SlittingJobResult,
  SlittingJobRollWithRelations,
  SlittingActualOutputWithRelations,
  WorkerJobSearchInput,
  RegisterRollInput,
  StartRollInput,
  RecordActualOutputInput,
  UpdateActualOutputInput,
  CompleteRollInput,
  CancelRollInput,
  CompleteJobV2Input,
} from "@repo/shared";

const WORKER_JOBS_KEY = ["slitting", "worker", "jobs"];
const JOBS_KEY = ["slitting", "jobs"];
const SCHEDULES_KEY = ["slitting", "schedules"];

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

export function useWorkerJobs(searchParams?: WorkerJobSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...WORKER_JOBS_KEY, searchParams],
    queryFn: () =>
      api.get<SlittingJobsResponse>(
        `/api/v1/slitting/worker/jobs${queryString}`,
      ),
  });
}

export function useWorkerJob(id: string) {
  return useQuery({
    queryKey: [...WORKER_JOBS_KEY, id],
    queryFn: () =>
      api.get<SlittingJobWithRelations>(`/api/v1/slitting/worker/jobs/${id}`),
    enabled: !!id,
  });
}

export function useRegisterRoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: RegisterRollInput }) =>
      api.post<SlittingJobRollWithRelations>(
        `/api/v1/slitting/worker/jobs/${jobId}/rolls`,
        data,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKER_JOBS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...JOBS_KEY, variables.jobId],
      });
    },
  });
}

export function useStartRoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      rollId,
      data,
    }: {
      jobId: string;
      rollId: string;
      data?: StartRollInput;
    }) =>
      api.post<SlittingJobRollWithRelations>(
        `/api/v1/slitting/worker/jobs/${jobId}/rolls/${rollId}/start`,
        data ?? {},
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKER_JOBS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...JOBS_KEY, variables.jobId],
      });
    },
  });
}

export function useRecordOutput() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      rollId,
      data,
    }: {
      jobId: string;
      rollId: string;
      data: RecordActualOutputInput;
    }) =>
      api.post<SlittingActualOutputWithRelations>(
        `/api/v1/slitting/worker/jobs/${jobId}/rolls/${rollId}/outputs`,
        data,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKER_JOBS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...JOBS_KEY, variables.jobId],
      });
    },
  });
}

export function useUpdateOutput() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      rollId,
      outputId,
      data,
    }: {
      jobId: string;
      rollId: string;
      outputId: string;
      data: UpdateActualOutputInput;
    }) =>
      api.put<SlittingActualOutputWithRelations>(
        `/api/v1/slitting/worker/jobs/${jobId}/rolls/${rollId}/outputs/${outputId}`,
        data,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKER_JOBS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...JOBS_KEY, variables.jobId],
      });
    },
  });
}

export function useCompleteRoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      rollId,
      data,
    }: {
      jobId: string;
      rollId: string;
      data?: CompleteRollInput;
    }) =>
      api.post<SlittingJobRollWithRelations>(
        `/api/v1/slitting/worker/jobs/${jobId}/rolls/${rollId}/complete`,
        data ?? {},
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKER_JOBS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...JOBS_KEY, variables.jobId],
      });
    },
  });
}

export function useCancelRoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      rollId,
      data,
    }: {
      jobId: string;
      rollId: string;
      data: CancelRollInput;
    }) =>
      api.post<SlittingJobRollWithRelations>(
        `/api/v1/slitting/worker/jobs/${jobId}/rolls/${rollId}/cancel`,
        data,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKER_JOBS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...JOBS_KEY, variables.jobId],
      });
    },
  });
}

export function useCompleteJobV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: string;
      data?: CompleteJobV2Input;
    }) =>
      api.post<SlittingJobResult>(
        `/api/v1/slitting/worker/jobs/${jobId}/complete`,
        data ?? {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
    },
  });
}
