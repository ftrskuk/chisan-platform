import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  machineSearchSchema,
  updateMachineStatusSchema,
  ADMIN_MANAGER_ROLES,
} from "@repo/shared";
import type {
  MachineSearchInput,
  UpdateMachineStatusInput,
} from "@repo/shared";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { RequestUser } from "../../core/auth/types/auth.types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { MachinesService } from "./machines.service";

@Controller("machines")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(machineSearchSchema))
    search: MachineSearchInput,
  ) {
    return this.machinesService.findAll(search);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.machinesService.findOne(id);
  }

  @Patch(":id/status")
  @Roles(...ADMIN_MANAGER_ROLES)
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateMachineStatusSchema))
    input: UpdateMachineStatusInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.machinesService.updateStatus(id, input.status, user.id);
  }
}
