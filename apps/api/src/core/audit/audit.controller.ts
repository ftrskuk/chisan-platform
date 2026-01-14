import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { auditLogQuerySchema } from "@repo/shared";
import type { AuditLogQueryInput } from "@repo/shared";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AuditService } from "./audit.service";

@Controller("api/v1/audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(auditLogQuerySchema))
  findAll(@Query() query: AuditLogQueryInput) {
    return this.auditService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}
