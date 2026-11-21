"use client";

import { useTransition } from "react";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { duplicateOrderAction } from "./actions";

export function ReorderButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" disabled={pending} onClick={() => start(() => duplicateOrderAction(orderId))}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />} Pesan ulang
    </Button>
  );
}
