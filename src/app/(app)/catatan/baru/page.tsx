import { PageHeader } from "@/components/ui/PageHeader";
import { StandaloneInteractionForm } from "@/features/interactions/QuickForms";

export const metadata = { title: "Catatan baru" };

export default function NewNotePage() {
  return (
    <>
      <PageHeader title="Catat interaksi" subtitle="Chat, telepon, tatap muka, atau keluhan" back="/hari-ini" />
      <StandaloneInteractionForm />
    </>
  );
}
