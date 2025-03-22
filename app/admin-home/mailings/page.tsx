// app/admin-home/mailings/page.tsx
import MailingTable from '@/app/components/admin-components/MailingTable';

export default function MailingsPage() {
  return (
    <div className="container mx-auto py-8">
      <MailingTable />
    </div>
  );
}
