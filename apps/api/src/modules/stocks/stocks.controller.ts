import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  stockSearchSchema,
  createStockInSchema,
  bulkStockInSchema,
} from "@repo/shared";
import type {
  StockSearchInput,
  CreateStockInInput,
  BulkStockInInput,
} from "@repo/shared";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import type { RequestUser } from "../../core/auth/types/auth.types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { StocksService } from "./stocks.service";

@Controller("stocks")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(stockSearchSchema)) search: StockSearchInput,
  ) {
    return this.stocksService.findAll(search);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.stocksService.findOne(id);
  }

  @Post("in")
  @Roles("admin", "manager")
  stockIn(
    @Body(new ZodValidationPipe(createStockInSchema)) input: CreateStockInInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.stocksService.stockIn(input, user.id);
  }

  @Post("in/bulk")
  @Roles("admin", "manager")
  bulkStockIn(
    @Body(new ZodValidationPipe(bulkStockInSchema)) input: BulkStockInInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.stocksService.bulkStockIn(input, user.id);
  }
}
