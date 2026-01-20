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
  importOrderSearchSchema,
  createImportOrderSchema,
  updateImportOrderSchema,
  confirmImportOrderSchema,
  shipmentSearchSchema,
  createShipmentSchema,
  updateShipmentSchema,
  updateShipmentStatusSchema,
  receiveShipmentSchema,
  importCostSearchSchema,
  createImportCostSchema,
  updateImportCostSchema,
  ADMIN_MANAGER_ROLES,
} from "@repo/shared";
import type {
  ImportOrderSearchInput,
  CreateImportOrderInput,
  UpdateImportOrderInput,
  ConfirmImportOrderInput,
  ShipmentSearchInput,
  CreateShipmentInput,
  UpdateShipmentInput,
  UpdateShipmentStatusInput,
  ReceiveShipmentInput,
  ImportCostSearchInput,
  CreateImportCostInput,
  UpdateImportCostInput,
} from "@repo/shared";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { RequestUser } from "../../core/auth/types/auth.types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ImportService } from "./import.service";

@Controller("import")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get("orders")
  findAllOrders(
    @Query(new ZodValidationPipe(importOrderSearchSchema))
    search: ImportOrderSearchInput,
  ) {
    return this.importService.findAllOrders(search);
  }

  @Get("orders/:id")
  findOneOrder(@Param("id", ParseUUIDPipe) id: string) {
    return this.importService.findOneOrder(id);
  }

  @Get("orders/:id/history")
  getOrderHistory(@Param("id", ParseUUIDPipe) id: string) {
    return this.importService.getOrderHistory(id);
  }

  @Post("orders")
  @Roles(...ADMIN_MANAGER_ROLES)
  createOrder(
    @Body(new ZodValidationPipe(createImportOrderSchema))
    input: CreateImportOrderInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.createOrder(input, user.id);
  }

  @Patch("orders/:id")
  @Roles(...ADMIN_MANAGER_ROLES)
  updateOrder(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateImportOrderSchema))
    input: UpdateImportOrderInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.updateOrder(id, input, user.id);
  }

  @Post("orders/:id/confirm")
  @Roles(...ADMIN_MANAGER_ROLES)
  confirmOrder(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(confirmImportOrderSchema))
    input: ConfirmImportOrderInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.confirmOrder(id, input, user.id);
  }

  @Delete("orders/:id")
  @Roles(...ADMIN_MANAGER_ROLES)
  cancelOrder(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { memo?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.cancelOrder(id, user.id, body.memo);
  }

  @Get("shipments")
  findAllShipments(
    @Query(new ZodValidationPipe(shipmentSearchSchema))
    search: ShipmentSearchInput,
  ) {
    return this.importService.findAllShipments(search);
  }

  @Get("shipments/:id")
  findOneShipment(@Param("id", ParseUUIDPipe) id: string) {
    return this.importService.findOneShipment(id);
  }

  @Get("shipments/:id/history")
  getShipmentHistory(@Param("id", ParseUUIDPipe) id: string) {
    return this.importService.getShipmentHistory(id);
  }

  @Post("shipments")
  @Roles(...ADMIN_MANAGER_ROLES)
  createShipment(
    @Body(new ZodValidationPipe(createShipmentSchema))
    input: CreateShipmentInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.createShipment(input, user.id);
  }

  @Patch("shipments/:id")
  @Roles(...ADMIN_MANAGER_ROLES)
  updateShipment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateShipmentSchema))
    input: UpdateShipmentInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.updateShipment(id, input, user.id);
  }

  @Patch("shipments/:id/status")
  @Roles(...ADMIN_MANAGER_ROLES)
  updateShipmentStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateShipmentStatusSchema))
    input: UpdateShipmentStatusInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.updateShipmentStatus(id, input, user.id);
  }

  @Post("shipments/:id/receive")
  @Roles(...ADMIN_MANAGER_ROLES)
  receiveShipment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(receiveShipmentSchema))
    input: ReceiveShipmentInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.receiveShipment(id, input, user.id);
  }

  @Get("costs")
  findAllCosts(
    @Query(new ZodValidationPipe(importCostSearchSchema))
    search: ImportCostSearchInput,
  ) {
    return this.importService.findAllCosts(search);
  }

  @Post("costs")
  @Roles(...ADMIN_MANAGER_ROLES)
  createCost(
    @Body(new ZodValidationPipe(createImportCostSchema))
    input: CreateImportCostInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.createCost(input, user.id);
  }

  @Patch("costs/:id")
  @Roles(...ADMIN_MANAGER_ROLES)
  updateCost(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateImportCostSchema))
    input: UpdateImportCostInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.updateCost(id, input, user.id);
  }

  @Delete("costs/:id")
  @Roles(...ADMIN_MANAGER_ROLES)
  deleteCost(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.importService.deleteCost(id, user.id);
  }
}
