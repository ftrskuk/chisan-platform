import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  scheduleSearchSchema,
  jobSearchSchema,
  createScheduleSchema,
  updateScheduleSchema,
  createJobSchema,
  updateJobSchema,
  markJobReadySchema,
  startJobSchema,
  completeJobSchema,
  approveJobSchema,
  publishScheduleSchema,
} from "@repo/shared";
import type {
  ScheduleSearchInput,
  JobSearchInput,
  CreateScheduleInput,
  UpdateScheduleInput,
  CreateJobInput,
  UpdateJobInput,
  MarkJobReadyInput,
  StartJobInput,
  CompleteJobInput,
  ApproveJobInput,
  PublishScheduleInput,
} from "@repo/shared";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { RequestUser } from "../../core/auth/types/auth.types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { SlittingService } from "./slitting.service";

@Controller("slitting")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SlittingController {
  constructor(private readonly slittingService: SlittingService) {}

  @Get("schedules")
  findAllSchedules(
    @Query(new ZodValidationPipe(scheduleSearchSchema))
    search: ScheduleSearchInput,
  ) {
    return this.slittingService.findAllSchedules(search);
  }

  @Get("schedules/:id")
  findOneSchedule(@Param("id", ParseUUIDPipe) id: string) {
    return this.slittingService.findOneSchedule(id);
  }

  @Get("schedules/:id/history")
  getScheduleHistory(@Param("id", ParseUUIDPipe) id: string) {
    return this.slittingService.getHistory("schedule", id);
  }

  @Post("schedules")
  @Roles("admin", "manager")
  createSchedule(
    @Body(new ZodValidationPipe(createScheduleSchema))
    input: CreateScheduleInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.createSchedule(input, user.id);
  }

  @Patch("schedules/:id")
  @Roles("admin", "manager")
  updateSchedule(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateScheduleSchema))
    input: UpdateScheduleInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.updateSchedule(id, input, user.id);
  }

  @Post("schedules/:id/publish")
  @Roles("admin", "manager")
  publishSchedule(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(publishScheduleSchema))
    input: PublishScheduleInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.publishSchedule(id, user.id, input.memo);
  }

  @Get("jobs")
  findAllJobs(
    @Query(new ZodValidationPipe(jobSearchSchema)) search: JobSearchInput,
  ) {
    return this.slittingService.findAllJobs(search);
  }

  @Get("jobs/:id")
  findOneJob(@Param("id", ParseUUIDPipe) id: string) {
    return this.slittingService.findOneJob(id);
  }

  @Get("jobs/:id/history")
  getJobHistory(@Param("id", ParseUUIDPipe) id: string) {
    return this.slittingService.getHistory("job", id);
  }

  @Post("jobs")
  @Roles("admin", "manager")
  createJob(
    @Body(new ZodValidationPipe(createJobSchema)) input: CreateJobInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.createJob(input, user.id);
  }

  @Patch("jobs/:id")
  @Roles("admin", "manager")
  updateJob(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateJobSchema)) input: UpdateJobInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.updateSchedule(id, input, user.id);
  }

  @Post("jobs/:id/ready")
  markJobReady(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(markJobReadySchema)) input: MarkJobReadyInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.markJobReady(id, user.id, input.memo);
  }

  @Post("jobs/:id/start")
  startJob(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(startJobSchema)) input: StartJobInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.startJob(
      id,
      user.id,
      input.operatorId,
      input.memo,
    );
  }

  @Post("jobs/:id/complete")
  completeJob(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(completeJobSchema)) input: CompleteJobInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.completeJob(id, input, user.id);
  }

  @Post("jobs/:id/approve")
  @Roles("admin", "manager")
  approveJob(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(approveJobSchema)) input: ApproveJobInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.approveJob(id, user.id, input.memo);
  }
}
