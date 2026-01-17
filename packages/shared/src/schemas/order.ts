import { z } from "zod";
import {
  ORDER_TYPES,
  ORDER_STATUSES,
  ORDER_IN_REASONS,
  ORDER_OUT_REASONS,
  ORDER_HISTORY_ACTIONS,
} from "../types/order";

export const orderTypeSchema = z.enum(ORDER_TYPES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const orderInReasonSchema = z.enum(ORDER_IN_REASONS);
export const orderOutReasonSchema = z.enum(ORDER_OUT_REASONS);
export const orderReasonSchema = z.union([
  orderInReasonSchema,
  orderOutReasonSchema,
]);
export const orderHistoryActionSchema = z.enum(ORDER_HISTORY_ACTIONS);

export const orderSearchSchema = z.object({
  type: orderTypeSchema.optional(),
  status: orderStatusSchema.optional(),
  statuses: z
    .string()
    .transform(
      (val) =>
        val.split(",").filter(Boolean) as Array<
          (typeof ORDER_STATUSES)[number]
        >,
    )
    .optional(),
  reason: orderReasonSchema.optional(),
  partnerId: z.string().uuid().optional(),
  requestedBy: z.string().uuid().optional(),
  isUrgent: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  scheduledDateFrom: z.string().optional(),
  scheduledDateTo: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type OrderSearchInput = z.infer<typeof orderSearchSchema>;

export const createOrderItemSchema = z.object({
  itemId: z.string().uuid(),
  stockId: z.string().uuid().optional(),
  widthMm: z.coerce.number().int().min(50).max(2500),
  requestedQty: z.coerce.number().int().positive(),
  requestedWeightKg: z.coerce.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const createOrderSchema = z
  .object({
    type: orderTypeSchema,
    reason: z.string(),
    partnerId: z.string().uuid().optional(),
    scheduledDate: z.string().optional(),
    memo: z.string().max(1000).optional(),
    items: z.array(createOrderItemSchema).min(1).max(100),
  })
  .superRefine((data, ctx) => {
    if (data.type === "stock_in") {
      if (
        !ORDER_IN_REASONS.includes(
          data.reason as (typeof ORDER_IN_REASONS)[number],
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid reason for stock_in. Must be one of: ${ORDER_IN_REASONS.join(", ")}`,
          path: ["reason"],
        });
      }
    } else if (data.type === "stock_out") {
      if (
        !ORDER_OUT_REASONS.includes(
          data.reason as (typeof ORDER_OUT_REASONS)[number],
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid reason for stock_out. Must be one of: ${ORDER_OUT_REASONS.join(", ")}`,
          path: ["reason"],
        });
      }
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
  reason: orderReasonSchema.optional(),
  partnerId: z.string().uuid().nullable().optional(),
  scheduledDate: z.string().nullable().optional(),
  memo: z.string().max(1000).nullable().optional(),
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const processOrderItemSchema = z.object({
  orderItemId: z.string().uuid(),
  processedQty: z.coerce.number().int().min(0),
  processedWeightKg: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const processOrderSchema = z.object({
  items: z.array(processOrderItemSchema).min(1),
  memo: z.string().max(1000).optional(),
});

export type ProcessOrderInput = z.infer<typeof processOrderSchema>;

export const approveOrderSchema = z.object({
  memo: z.string().max(1000).optional(),
});

export type ApproveOrderInput = z.infer<typeof approveOrderSchema>;

export const rejectOrderSchema = z.object({
  memo: z.string().min(1).max(1000),
});

export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;

export const urgentApproveOrderSchema = z.object({
  items: z.array(processOrderItemSchema).min(1),
  memo: z.string().max(1000).optional(),
});

export type UrgentApproveOrderInput = z.infer<typeof urgentApproveOrderSchema>;
