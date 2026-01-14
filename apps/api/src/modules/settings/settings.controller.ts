import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { settingCategorySchema, updateSettingSchema } from "@repo/shared";
import type { SettingCategory, UpdateSettingInput } from "@repo/shared";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import type { RequestUser } from "../../core/auth/types/auth.types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { SettingsService } from "./settings.service";

@Controller("settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles("admin")
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(":category")
  @Roles("admin")
  findByCategory(@Param("category") category: SettingCategory) {
    const result = settingCategorySchema.safeParse(category);
    if (!result.success) {
      throw new BadRequestException("Invalid category");
    }
    return this.settingsService.findByCategory(result.data);
  }

  @Patch(":category/:key")
  @Roles("admin")
  update(
    @Param("category") category: SettingCategory,
    @Param("key") key: string,
    @Body(new ZodValidationPipe(updateSettingSchema))
    updateDto: UpdateSettingInput,
    @CurrentUser() currentUser: RequestUser,
  ) {
    const categoryResult = settingCategorySchema.safeParse(category);
    if (!categoryResult.success) {
      throw new BadRequestException("Invalid category");
    }
    return this.settingsService.update(
      categoryResult.data,
      key,
      updateDto.value,
      currentUser.id,
    );
  }
}
