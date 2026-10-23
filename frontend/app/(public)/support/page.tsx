import { LegalShell } from '@/components/landing/LegalShell';

export const metadata = {
  title: 'Support | Kyriq',
  description: 'Get help with Kyriq and the Kyriq Chrome extension',
};

export default function SupportPage() {
  return (
    <LegalShell title="Support" updated="October 23, 2026">
      <h2>Contact us</h2>
      <p>
        Email <a href="mailto:support@kyriq.com">support@kyriq.com</a>. We reply within one business day.
      </p>

      <h2>Chrome extension</h2>
      <ul>
        <li>Sign in with your Kyriq account from the extension side panel.</li>
        <li>Connect QuickBooks Online from the side panel or from Connections in the Kyriq app.</li>
        <li>Open a QuickBooks register or reconcile page; matched cheques appear in the side panel.</li>
        <li>Approve one match at a time. Rows with an amount difference must be fixed in QuickBooks first.</li>
      </ul>

      <h2>Uploads and extraction</h2>
      <ul>
        <li>Upload cheque image PDFs or bank statements with cheque images from Upload in the app.</li>
        <li>Review extracted fields under History before approving or exporting.</li>
        <li>If a cheque comes back empty, use Retry failed on the job.</li>
      </ul>

      <h2>Policies</h2>
      <p>
        <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a>
      </p>
    </LegalShell>
  );
}
