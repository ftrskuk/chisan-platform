import type { MachineStatus, ScheduleStatus, JobStatus } from "@repo/shared";

export const machineStatusLabels: Record<MachineStatus, string> = {
  idle: "대기",
  running: "가동중",
  maintenance: "정비중",
};

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  draft: "초안",
  published: "배포됨",
  in_progress: "진행중",
  completed: "완료",
};

export const jobStatusLabels: Record<JobStatus, string> = {
  pending: "대기",
  ready: "준비완료",
  in_progress: "작업중",
  completed: "완료",
  approved: "승인완료",
};

export const JOBS_DEFAULT_FILTER_STATUSES: JobStatus[] = [
  "pending",
  "ready",
  "in_progress",
];
