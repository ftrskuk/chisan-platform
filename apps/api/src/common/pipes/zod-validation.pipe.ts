import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { ZodError, ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = this.formatErrors(result.error);
      throw new BadRequestException({
        message: "Validation failed",
        errors,
      });
    }

    return result.data;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const path = issue.path.join(".") || "value";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }

    return errors;
  }
}
