import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Machine,
  MachinesResponse,
  MachineSearchInput,
  UpdateMachineStatusInput,
  SlittingScheduleWithStats,
  SlittingScheduleWithRelations,
  SlittingSchedulesResponse,
  SlittingJobWithRelations,
  SlittingJobsResponse,
  SlittingHistoryWithActor,
  SlittingScheduleResult,
  SlittingJobResult,
  ScheduleSearchInput,
  JobSearchInput,
  CreateScheduleInput,
  UpdateScheduleInput,
  CreateJobInput,
  MarkJobReadyInput,
  StartJobInput,
  CompleteJobInput,
  ApproveJobInput,
  PublishScheduleInput,
} from "@repo/shared";

const MACHINES_KEY = ["machines"];
const SCHEDULES_KEY = ["slitting", "schedules"];
const JOBS_KEY = ["slitting", "jobs"];

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

export function useMachines(searchParams?: MachineSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...MACHINES_KEY, searchParams],
    queryFn: () => api.get<MachinesResponse>(`/api/v1/machines${queryString}`),
  });
}

export function useMachine(id: string) {
  return useQuery({
    queryKey: [...MACHINES_KEY, id],
    queryFn: () => api.get<Machine>(`/api/v1/machines/${id}`),
    enabled: !!id,
  });
}

export function useUpdateMachineStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMachineStatusInput;
    }) => api.patch<Machine>(`/api/v1/machines/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MACHINES_KEY });
    },
  });
}

export function useSlittingSchedules(searchParams?: ScheduleSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...SCHEDULES_KEY, searchParams],
    queryFn: () =>
      api.get<SlittingSchedulesResponse>(
        `/api/v1/slitting/schedules${queryString}`,
      ),
  });
}

export function useSlittingSchedule(id: string) {
  return useQuery({
    queryKey: [...SCHEDULES_KEY, id],
    queryFn: () =>
      api.get<SlittingScheduleWithRelations>(
        `/api/v1/slitting/schedules/${id}`,
      ),
    enabled: !!id,
  });
}

export function useSlittingScheduleHistory(scheduleId: string) {
  return useQuery({
    queryKey: [...SCHEDULES_KEY, scheduleId, "history"],
    queryFn: () =>
      api.get<SlittingHistoryWithActor[]>(
        `/api/v1/slitting/schedules/${scheduleId}/history`,
      ),
    enabled: !!scheduleId,
  });
}

export function useCreateSlittingSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleInput) =>
      api.post<SlittingScheduleResult>("/api/v1/slitting/schedules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
    },
  });
}

export function useUpdateSlittingSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleInput }) =>
      api.patch<SlittingScheduleResult>(
        `/api/v1/slitting/schedules/${id}`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
    },
  });
}

export function usePublishSlittingSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: PublishScheduleInput }) =>
      api.post<SlittingScheduleResult>(
        `/api/v1/slitting/schedules/${id}/publish`,
        data ?? {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
    },
  });
}

export function useSlittingJobs(searchParams?: JobSearchInput) {
  const queryString = searchParams ? buildQueryString(searchParams) : "";

  return useQuery({
    queryKey: [...JOBS_KEY, searchParams],
    queryFn: () =>
      api.get<SlittingJobsResponse>(`/api/v1/slitting/jobs${queryString}`),
  });
}

export function useSlittingJob(id: string) {
  return useQuery({
    queryKey: [...JOBS_KEY, id],
    queryFn: () =>
      api.get<SlittingJobWithRelations>(`/api/v1/slitting/jobs/${id}`),
    enabled: !!id,
  });
}

export function useSlittingJobHistory(jobId: string) {
  return useQuery({
    queryKey: [...JOBS_KEY, jobId, "history"],
    queryFn: () =>
      api.get<SlittingHistoryWithActor[]>(
        `/api/v1/slitting/jobs/${jobId}/history`,
      ),
    enabled: !!jobId,
  });
}

export function useCreateSlittingJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobInput) =>
      api.post<SlittingJobResult>("/api/v1/slitting/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
    },
  });
}

export function useMarkJobReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: MarkJobReadyInput }) =>
      api.post<SlittingJobResult>(
        `/api/v1/slitting/jobs/${id}/ready`,
        data ?? {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
    },
  });
}

export function useStartSlittingJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: StartJobInput }) =>
      api.post<SlittingJobResult>(
        `/api/v1/slitting/jobs/${id}/start`,
        data ?? {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      queryClient.invalidateQueries({ queryKey: MACHINES_KEY });
    },
  });
}

export function useCompleteSlittingJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteJobInput }) =>
      api.post<SlittingJobResult>(`/api/v1/slitting/jobs/${id}/complete`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      queryClient.invalidateQueries({ queryKey: MACHINES_KEY });
    },
  });
}

export function useApproveSlittingJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApproveJobInput }) =>
      api.post<SlittingJobResult>(
        `/api/v1/slitting/jobs/${id}/approve`,
        data ?? {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
  });
}
