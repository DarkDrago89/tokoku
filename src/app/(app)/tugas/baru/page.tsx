import { PageHeader } from "@/components/ui/PageHeader";
import { StandaloneTaskForm } from "@/features/interactions/QuickForms";

export const metadata = { title: "Tugas baru" };

export default function NewTaskPage() {
  return (
    <>
      <PageHeader title="Tugas follow-up" subtitle="Muncul di halaman Hari Ini saat jatuh tempo" back="/hari-ini" />
      <StandaloneTaskForm />
    </>
  );
}
