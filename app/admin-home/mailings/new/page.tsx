// app/admin-home/mailings/new/page.tsx
import MassEmailSender from '@/app/components/admin-components/MassEmailSender';

export default function NewMailingPage() {
  return (
    <div className="container mx-auto py-8">
      <MassEmailSender />
    </div>
  );
}
