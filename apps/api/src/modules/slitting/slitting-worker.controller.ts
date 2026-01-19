import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  workerJobSearchSchema,
  registerRollSchema,
  startRollSchema,
  recordActualOutputSchema,
  updateActualOutputSchema,
  completeRollSchema,
  cancelRollSchema,
  completeJobV2Schema,
} from "@repo/shared";
import type {
  WorkerJobSearchInput,
  RegisterRollInput,
  StartRollInput,
  RecordActualOutputInput,
  UpdateActualOutputInput,
  CompleteRollInput,
  CancelRollInput,
  CompleteJobV2Input,
} from "@repo/shared";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { RequestUser } from "../../core/auth/types/auth.types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { SlittingService } from "./slitting.service";

@Controller("slitting/worker")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SlittingWorkerController {
  constructor(private readonly slittingService: SlittingService) {}

  @Get("jobs")
  findWorkerJobs(
    @Query(new ZodValidationPipe(workerJobSearchSchema))
    search: WorkerJobSearchInput,
  ) {
    return this.slittingService.findWorkerJobs(search);
  }

  @Get("jobs/:id")
  findOneJob(@Param("id", ParseUUIDPipe) id: string) {
    return this.slittingService.findOneJob(id);
  }

  @Post("jobs/:id/rolls")
  registerRoll(
    @Param("id", ParseUUIDPipe) jobId: string,
    @Body(new ZodValidationPipe(registerRollSchema)) input: RegisterRollInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.registerJobRoll(jobId, input, user.id);
  }

  @Post("jobs/:jobId/rolls/:rollId/start")
  startRoll(
    @Param("jobId", ParseUUIDPipe) jobId: string,
    @Param("rollId", ParseUUIDPipe) rollId: string,
    @Body(new ZodValidationPipe(startRollSchema)) input: StartRollInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.startJobRoll(jobId, rollId, input, user.id);
  }

  @Post("jobs/:jobId/rolls/:rollId/outputs")
  recordOutput(
    @Param("jobId", ParseUUIDPipe) jobId: string,
    @Param("rollId", ParseUUIDPipe) rollId: string,
    @Body(new ZodValidationPipe(recordActualOutputSchema))
    input: RecordActualOutputInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.recordActualOutput(
      jobId,
      rollId,
      input,
      user.id,
    );
  }

  @Put("jobs/:jobId/rolls/:rollId/outputs/:outputId")
  updateOutput(
    @Param("jobId", ParseUUIDPipe) jobId: string,
    @Param("rollId", ParseUUIDPipe) rollId: string,
    @Param("outputId", ParseUUIDPipe) outputId: string,
    @Body(new ZodValidationPipe(updateActualOutputSchema))
    input: UpdateActualOutputInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.updateActualOutput(
      jobId,
      rollId,
      outputId,
      input,
      user.id,
    );
  }

  @Post("jobs/:jobId/rolls/:rollId/complete")
  completeRoll(
    @Param("jobId", ParseUUIDPipe) jobId: string,
    @Param("rollId", ParseUUIDPipe) rollId: string,
    @Body(new ZodValidationPipe(completeRollSchema)) input: CompleteRollInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.completeJobRoll(jobId, rollId, input, user.id);
  }

  @Post("jobs/:jobId/rolls/:rollId/cancel")
  cancelRoll(
    @Param("jobId", ParseUUIDPipe) jobId: string,
    @Param("rollId", ParseUUIDPipe) rollId: string,
    @Body(new ZodValidationPipe(cancelRollSchema)) input: CancelRollInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.cancelJobRoll(jobId, rollId, input, user.id);
  }

  @Post("jobs/:id/complete")
  completeJob(
    @Param("id", ParseUUIDPipe) jobId: string,
    @Body(new ZodValidationPipe(completeJobV2Schema)) input: CompleteJobV2Input,
    @CurrentUser() user: RequestUser,
  ) {
    return this.slittingService.completeJobV2(jobId, input, user.id);
  }
}
