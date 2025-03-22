import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn-ui/card';

const TermsAndConditions = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Terms and Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Ticket Purchase and Usage</h2>
          <div className="space-y-2 text-gray-700">
            <p>1.1. Tickets are non-refundable unless the event is cancelled by the platform or creator.</p>
            <p>1.2. Each ticket is valid for single-user access to the specified event only.</p>
            <p>1.3. Sharing or reselling of tickets is strictly prohibited and may result in access revocation.</p>
            <p>1.4. Users must maintain their ticket code/QR code securely and not share it with others.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Live Streaming Content</h2>
          <div className="space-y-2 text-gray-700">
            <p>2.1. The platform does not guarantee specific game content during streams.</p>
            <p>2.2. <strong>Important Notice:</strong> If a creator shows different game content than advertised, the platform bears no responsibility for such changes.</p>
            <p>2.3. Content creators maintain full discretion over their streaming content within platform guidelines.</p>
            <p>2.4. The platform does not provide refunds based on changes to game content during streams.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Technical Requirements & Service Disruptions</h2>
          <div className="space-y-2 text-gray-700">
            <p>3.1. Users are responsible for maintaining adequate internet connectivity for streaming.</p>
            <p>3.2. The platform will provide streaming at up to 1080p quality, subject to user's connection.</p>
            <p>3.3. Technical issues on the user's end do not qualify for refunds.</p>
            <p>3.4. <strong>Stream Disruptions and Recordings:</strong> In the event of significant platform-side streaming issues or service disruptions affecting multiple users, the platform may, at its sole discretion, provide access to an event recording as an alternative to the live stream.</p>
            <p>3.5. Access to recordings provided due to service disruptions will be granted automatically to all valid ticket holders through their user accounts.</p>
            <p>3.6. The provision of a recording does not entitle users to monetary compensation or refunds.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Event Access</h2>
          <div className="space-y-2 text-gray-700">
            <p>4.1. Access to events requires valid ticket verification.</p>
            <p>4.2. Users must log in using their registered account to access the event.</p>
            <p>4.3. The platform reserves the right to deny access in cases of suspicious activity.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Affiliate Program</h2>
          <div className="space-y-2 text-gray-700">
            <p>5.1. Purchases made through affiliate links are subject to the same terms and conditions.</p>
            <p>5.2. Commission rates are set by content creators and may vary by event.</p>
            <p>5.3. Affiliate earnings are processed according to the platform's payment schedule.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Recording and Content Usage</h2>
          <div className="space-y-2 text-gray-700">
            <p>6.1. Recording or redistributing the stream content is strictly prohibited.</p>
            <p>6.2. Any recorded content provided by the platform is for ticket holders only.</p>
            <p>6.3. Violation of content usage terms may result in account suspension.</p>
            <p>6.4. Event recordings provided as substitutes for disrupted live streams are subject to the same usage restrictions as live content.</p>
            <p>6.5. Access to recordings is provided via secure access links or codes that are intended for the original ticket holder only.</p>
            <p>6.6. The platform and content creators reserve the right to limit the availability period of recordings.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Recording Access Policy</h2>
          <div className="space-y-2 text-gray-700">
            <p>7.1. <strong>Service Disruption Compensation:</strong> If a live event experiences significant technical difficulties from the platform side that affect the viewing experience, the platform may provide affected ticket holders with access to a recording of the event.</p>
            <p>7.2. The platform, at its sole discretion, will determine when conditions warrant the provision of recordings as compensation.</p>
            <p>7.3. To qualify for recording access, users must have purchased a valid ticket for the affected event.</p>
            <p>7.4. Recording access will typically be granted within 72 hours of the event conclusion.</p>
            <p>7.5. Users will be notified via email when recordings become available.</p>
            <p>7.6. The platform makes no guarantee regarding the quality, length, or availability duration of compensatory recordings.</p>
          </div>
        </section>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            By purchasing a ticket, you acknowledge that you have read, understood, and agreed to these terms and conditions.
            The platform reserves the right to modify these terms at any time, with notice provided to users.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TermsAndConditions;
