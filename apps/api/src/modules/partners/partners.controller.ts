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
  createPartnerSchema,
  updatePartnerSchema,
  createBrandSchema,
  updateBrandSchema,
  ADMIN_MANAGER_ROLES,
  ADMIN_ONLY_ROLES,
} from "@repo/shared";
import type {
  CreatePartnerInput,
  UpdatePartnerInput,
  CreateBrandInput,
  UpdateBrandInput,
} from "@repo/shared";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PartnersService } from "./partners.service";

@Controller("partners")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll() {
    return this.partnersService.findAll();
  }

  @Get("suppliers")
  findSuppliers() {
    return this.partnersService.findSuppliers();
  }

  @Get("customers")
  findCustomers() {
    return this.partnersService.findCustomers();
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.partnersService.findOne(id);
  }

  @Post()
  @Roles(...ADMIN_MANAGER_ROLES)
  @UsePipes(new ZodValidationPipe(createPartnerSchema))
  create(@Body() input: CreatePartnerInput) {
    return this.partnersService.create(input);
  }

  @Patch(":id")
  @Roles(...ADMIN_MANAGER_ROLES)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updatePartnerSchema)) input: UpdatePartnerInput,
  ) {
    return this.partnersService.update(id, input);
  }

  @Delete(":id")
  @Roles(...ADMIN_ONLY_ROLES)
  deactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.partnersService.deactivate(id);
  }

  @Get(":id/brands")
  getBrands(@Param("id", ParseUUIDPipe) id: string) {
    return this.partnersService.getBrands(id);
  }

  @Post(":id/brands")
  @Roles(...ADMIN_MANAGER_ROLES)
  createBrand(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createBrandSchema)) input: CreateBrandInput,
  ) {
    return this.partnersService.createBrand(id, input);
  }
}

@Controller("brands")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll() {
    return this.partnersService.getAllBrands();
  }

  @Patch(":id")
  @Roles(...ADMIN_MANAGER_ROLES)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBrandSchema)) input: UpdateBrandInput,
  ) {
    return this.partnersService.updateBrand(id, input);
  }
}
