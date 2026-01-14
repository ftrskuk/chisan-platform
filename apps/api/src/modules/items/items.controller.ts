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
  UsePipes,
} from "@nestjs/common";
import {
  createItemSchema,
  updateItemSchema,
  createPaperTypeSchema,
  updatePaperTypeSchema,
  itemSearchSchema,
} from "@repo/shared";
import type {
  CreateItemInput,
  UpdateItemInput,
  CreatePaperTypeInput,
  UpdatePaperTypeInput,
  ItemSearchInput,
} from "@repo/shared";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ItemsService } from "./items.service";

@Controller("api/v1/paper-types")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaperTypesController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll() {
    return this.itemsService.getAllPaperTypes();
  }

  @Post()
  @Roles("admin")
  @UsePipes(new ZodValidationPipe(createPaperTypeSchema))
  create(@Body() input: CreatePaperTypeInput) {
    return this.itemsService.createPaperType(input);
  }

  @Patch(":id")
  @Roles("admin")
  @UsePipes(new ZodValidationPipe(updatePaperTypeSchema))
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: UpdatePaperTypeInput,
  ) {
    return this.itemsService.updatePaperType(id, input);
  }
}

@Controller("api/v1/items")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(itemSearchSchema)) search: ItemSearchInput,
  ) {
    return this.itemsService.findAll(search);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.itemsService.findOne(id);
  }

  @Post()
  @Roles("admin", "manager")
  @UsePipes(new ZodValidationPipe(createItemSchema))
  create(@Body() input: CreateItemInput) {
    return this.itemsService.create(input);
  }

  @Patch(":id")
  @Roles("admin", "manager")
  @UsePipes(new ZodValidationPipe(updateItemSchema))
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: UpdateItemInput,
  ) {
    return this.itemsService.update(id, input);
  }

  @Delete(":id")
  @Roles("admin")
  deactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.itemsService.deactivate(id);
  }
}
