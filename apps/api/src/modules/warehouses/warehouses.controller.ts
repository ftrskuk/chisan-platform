import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  createLocationSchema,
  updateLocationSchema,
  ADMIN_MANAGER_ROLES,
  ADMIN_ONLY_ROLES,
} from "@repo/shared";
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CreateLocationInput,
  UpdateLocationInput,
} from "@repo/shared";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { WarehousesService } from "./warehouses.service";

@Controller("warehouses")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  findAll() {
    return this.warehousesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post()
  @Roles(...ADMIN_MANAGER_ROLES)
  @UsePipes(new ZodValidationPipe(createWarehouseSchema))
  create(@Body() input: CreateWarehouseInput) {
    return this.warehousesService.create(input);
  }

  @Patch(":id")
  @Roles(...ADMIN_MANAGER_ROLES)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateWarehouseSchema))
    input: UpdateWarehouseInput,
  ) {
    return this.warehousesService.update(id, input);
  }

  @Delete(":id")
  @Roles(...ADMIN_ONLY_ROLES)
  deactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.warehousesService.deactivate(id);
  }

  @Get(":id/locations")
  getLocations(@Param("id", ParseUUIDPipe) id: string) {
    return this.warehousesService.getLocations(id);
  }

  @Post(":id/locations")
  @Roles(...ADMIN_MANAGER_ROLES)
  createLocation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createLocationSchema))
    input: CreateLocationInput,
  ) {
    return this.warehousesService.createLocation(id, input);
  }

  @Patch("locations/:locationId")
  @Roles(...ADMIN_MANAGER_ROLES)
  updateLocation(
    @Param("locationId", ParseUUIDPipe) locationId: string,
    @Body(new ZodValidationPipe(updateLocationSchema))
    input: UpdateLocationInput,
  ) {
    return this.warehousesService.updateLocation(locationId, input);
  }
}
