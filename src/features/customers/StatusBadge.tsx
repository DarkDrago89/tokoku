import { Badge } from "@/components/ui/Badge";
import { CUSTOMER_STATUS_LABEL, customerStatus, isLoyal } from "@/lib/domain/customer";

export function CustomerStatusBadges({
  c,
  inactiveDays,
  now = new Date(),
}: {
  c: { createdAt: Date; lastOrderAt: Date | null; orderCount: number };
  inactiveDays: number;
  now?: Date;
}) {
  const status = customerStatus(c, now, inactiveDays);
  return (
    <>
      <Badge tone={status === "tidak_aktif" ? "warning" : status === "baru" ? "outline" : "neutral"}>
        {CUSTOMER_STATUS_LABEL[status]}
      </Badge>
      {isLoyal(c.orderCount) && <Badge tone="dark">Setia</Badge>}
    </>
  );
}
