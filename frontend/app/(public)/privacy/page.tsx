import { LegalShell } from '@/components/landing/LegalShell';

export const metadata = {
  title: 'Privacy Policy | Kyriq',
  description: 'Privacy Policy for Kyriq',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="October 19, 2026">
      <h2>1. Introduction</h2>
      <p>
        Kyriq (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) provides this Privacy Policy to explain how we collect, use, disclose, and safeguard your information when you use our check reconciliation platform, including our web application, Chrome extension, and related services (collectively, the &ldquo;Service&rdquo;).
      </p>

      <h2>2. Information We Collect</h2>
      <p>We collect the following types of information:</p>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, company name, and password when you create an account.</li>
        <li><strong>Financial Data:</strong> Check images, extracted check data (payee names, amounts, dates, check numbers), and QuickBooks transaction data that you voluntarily upload or connect to the Service.</li>
        <li><strong>Usage Data:</strong> Log data, device information, browser type, pages visited, and features used within the Service.</li>
        <li><strong>Integration Data:</strong> OAuth tokens and connection details for third-party services like QuickBooks Online, Xero, Sage, and Zoho that you authorize.</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use collected information to:</p>
      <ul>
        <li>Provide, operate, and maintain the Service</li>
        <li>Process check images using AI-powered OCR extraction</li>
        <li>Match extracted check data against your accounting software transactions</li>
        <li>Improve and personalize your experience</li>
        <li>Send administrative communications (account updates, security alerts)</li>
        <li>Provide customer support</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>4. Data Storage and Security</h2>
      <p>
        Uploaded PDFs are sent to our processing server, which renders the pages and crops each cheque into its own image. The uploaded PDF and the cropped cheque images are then stored in Supabase Storage, and the extracted cheque data is stored in our Supabase database, so that you can review, re-check, and reconcile them. Temporary copies on the processing server (the PDF, page renders and OCR working files) are removed once extraction finishes. Data is sent to and from the Service over HTTPS. How long stored documents are kept is described in Section 7.
      </p>

      <h2>5. Third-Party Services</h2>
      <p>We integrate with the following third-party services:</p>
      <ul>
        <li><strong>Google (Gemini API):</strong> Cheque images are sent from our processing server to Google&rsquo;s Gemini API for OCR extraction.</li>
        <li><strong>OpenAI:</strong> A fallback OCR engine; when enabled, cheque images may be sent from our processing server to the OpenAI API.</li>
        <li><strong>Hugging Face:</strong> Cheque images are sent to a NuMarkdown OCR model hosted on Hugging Face Spaces.</li>
        <li><strong>Railway:</strong> Hosts our processing server, which receives uploaded PDFs and runs extraction.</li>
        <li><strong>Supabase:</strong> Authentication, database, and file storage for uploaded PDFs and cheque images.</li>
        <li><strong>Vercel:</strong> Hosts the Kyriq web application and its API.</li>
        <li><strong>Intuit QuickBooks:</strong> For transaction matching and reconciliation. We access only the data you authorize via OAuth 2.0.</li>
      </ul>
      <p>
        The Kyriq Chrome extension does not send cheque images or other data to Google or any AI provider directly; it communicates only with Kyriq&rsquo;s own servers and the QuickBooks pages you open.
      </p>

      <h2>6. Data Sharing</h2>
      <p>
        We do not sell your personal information. We share data only with service providers necessary to operate the Service, when required by law, or with your explicit consent.
      </p>

      <h2>7. Data Retention</h2>
      <p>
        We retain your account data for as long as your account is active.
      </p>
      <p>
        <strong>Uploaded source documents are deleted 14 days after the reconciliation they belong to is completed.</strong> The 14 days are counted from completion, not from upload, so a reconciliation you pause mid-month keeps its documents until you have finished with it. A scheduled job performs the deletion and removes the uploaded PDF from our storage.
      </p>
      <p>
        The cropped cheque images are not removed by that job: they, the extracted cheque data, the match and approval results, and the reconciliation history remain stored until you delete the job in the Service or close your account. Deleting a job removes its PDF, cheque images, and extracted data from our storage and database. Records we are required to keep for billing and security purposes are retained separately.
      </p>
      <p>
        You may also request deletion of your data at any time by emailing <a href="mailto:privacy@itaxhub.com">privacy@itaxhub.com</a>.
      </p>

      <h2>8. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access, correct, or delete your personal information</li>
        <li>Export your data in standard formats (CSV, JSON)</li>
        <li>Revoke third-party integrations at any time</li>
        <li>Close your account and request data deletion</li>
      </ul>

      <h2>9. Cookies</h2>
      <p>
        We use essential cookies for authentication and session management. We do not use third-party tracking cookies or advertising cookies.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us at{' '}
        <a href="mailto:privacy@itaxhub.com">privacy@itaxhub.com</a>.
      </p>
    
    </LegalShell>
  );
}
