// app/admin-home/mailings/[id]/page.tsx
import MassEmailSender from '@/app/components/admin-components/MassEmailSender';

export default function EditMailingPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8">
      <MassEmailSender mailingId={params.id} />
    </div>
  );
}
