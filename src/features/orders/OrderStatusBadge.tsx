import type { OrderStatus } from "@prisma/client";
import { Badge, type Tone } from "@/components/ui/Badge";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order";

const TONE: Record<OrderStatus, Tone> = {
  pending: "warning",
  paid: "outline",
  packed: "neutral",
  shipped: "neutral",
  done: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}
