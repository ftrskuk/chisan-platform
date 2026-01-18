import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  orderSearchSchema,
  createOrderSchema,
  updateOrderSchema,
  processOrderSchema,
  approveOrderSchema,
  rejectOrderSchema,
  urgentApproveOrderSchema,
  ADMIN_MANAGER_ROLES,
} from "@repo/shared";
import type {
  OrderSearchInput,
  CreateOrderInput,
  UpdateOrderInput,
  ProcessOrderInput,
  ApproveOrderInput,
  RejectOrderInput,
  UrgentApproveOrderInput,
} from "@repo/shared";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { RequestUser } from "../../core/auth/types/auth.types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { OrdersService } from "./orders.service";

@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(orderSearchSchema)) search: OrderSearchInput,
  ) {
    return this.ordersService.findAll(search);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Get(":id/history")
  getHistory(@Param("id", ParseUUIDPipe) id: string) {
    return this.ordersService.getHistory(id);
  }

  @Post()
  @Roles(...ADMIN_MANAGER_ROLES)
  create(
    @Body(new ZodValidationPipe(createOrderSchema)) input: CreateOrderInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.create(input, user.id);
  }

  @Patch(":id")
  @Roles(...ADMIN_MANAGER_ROLES)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateOrderSchema)) input: UpdateOrderInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.update(id, input, user.id);
  }

  @Delete(":id")
  @Roles(...ADMIN_MANAGER_ROLES)
  cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { memo?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.cancel(id, user.id, body.memo);
  }

  @Post(":id/start")
  startFieldProcessing(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.startFieldProcessing(id, user.id);
  }

  @Post(":id/process")
  completeFieldProcessing(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(processOrderSchema)) input: ProcessOrderInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.completeFieldProcessing(id, input, user.id);
  }

  @Post(":id/approve")
  @Roles(...ADMIN_MANAGER_ROLES)
  approve(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(approveOrderSchema)) input: ApproveOrderInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.approve(id, input, user.id);
  }

  @Post(":id/reject")
  @Roles(...ADMIN_MANAGER_ROLES)
  reject(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(rejectOrderSchema)) input: RejectOrderInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.reject(id, input, user.id);
  }

  @Post(":id/urgent")
  @Roles(...ADMIN_MANAGER_ROLES)
  urgentApprove(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(urgentApproveOrderSchema))
    input: UrgentApproveOrderInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.urgentApprove(id, input, user.id);
  }
}
