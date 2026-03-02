export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: March 2, 2026</p>

        <div className="prose prose-blue max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Cheque Extractor ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal and financial information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cheque processing and accounting automation service.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              By using Cheque Extractor, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Information:</strong> Name, email address, company name, and password when you create an account</li>
              <li><strong>Financial Documents:</strong> Cheque images, bank statements, invoices, and receipts that you upload for processing</li>
              <li><strong>QuickBooks Data:</strong> When you connect your QuickBooks Online account, we access transaction data, vendor information, and account details necessary to provide our service</li>
              <li><strong>Payment Information:</strong> Billing details for subscription payments (processed securely through third-party payment processors)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Usage Data:</strong> Information about how you interact with our service, including pages visited, features used, and time spent</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> Server logs, error reports, and performance metrics</li>
              <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to enhance your experience (see Section 8)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.3 OCR and AI Processing Data</h3>
            <p className="text-gray-700 leading-relaxed">
              When you upload cheque images or financial documents, we process them using Optical Character Recognition (OCR) and AI technology (Google Gemini AI) to extract structured data such as:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li>Payee names and vendor information</li>
              <li>Cheque amounts and currency</li>
              <li>Dates and cheque numbers</li>
              <li>Memo lines and account information</li>
              <li>Bank routing and account numbers (when visible)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use the collected information for the following purposes:</p>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1 Service Delivery</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Process and extract data from uploaded cheque images using OCR and AI</li>
              <li>Compare extracted cheque data with QuickBooks Online transactions</li>
              <li>Create, update, or match accounting entries in your QuickBooks account</li>
              <li>Facilitate reconciliation between physical cheques and digital records</li>
              <li>Provide duplicate detection and data validation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.2 Account Management</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Create and maintain your user account</li>
              <li>Authenticate your identity and manage access</li>
              <li>Process subscription payments and billing</li>
              <li>Provide customer support and respond to inquiries</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.3 Service Improvement</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Analyze usage patterns to improve our OCR accuracy and features</li>
              <li>Monitor and improve system performance and reliability</li>
              <li>Develop new features and functionality</li>
              <li>Conduct research and analytics (using aggregated, anonymized data)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.4 Communication</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Send service-related notifications and updates</li>
              <li>Provide technical support and respond to requests</li>
              <li>Send important security or policy updates</li>
              <li>Send marketing communications (with your consent, which you can withdraw at any time)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Storage and Security</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1 Where We Store Your Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Your data is stored using the following infrastructure:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Database:</strong> Supabase (PostgreSQL) - Cloud-hosted with automatic backups</li>
              <li><strong>File Storage:</strong> Supabase Storage - Encrypted object storage for cheque images</li>
              <li><strong>Application Hosting:</strong> Vercel (Frontend) and Railway (Backend API)</li>
              <li><strong>OCR Processing:</strong> Google Gemini AI - Cloud-based AI processing</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              All services are hosted in secure, SOC 2 Type II compliant data centers with redundancy and disaster recovery capabilities.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.2 Security Measures</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We implement industry-standard security measures to protect your data:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using TLS 1.3</li>
              <li><strong>Encryption at Rest:</strong> All stored data, including database records and uploaded files, is encrypted using AES-256 encryption</li>
              <li><strong>OAuth Token Security:</strong> QuickBooks OAuth tokens are encrypted before storage and never exposed in logs or client-side code</li>
              <li><strong>Access Controls:</strong> Role-based access controls and row-level security policies limit data access</li>
              <li><strong>Regular Security Audits:</strong> We conduct regular security assessments and vulnerability scans</li>
              <li><strong>Secure Development:</strong> We follow secure coding practices and conduct code reviews</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.3 Data Backup and Recovery</h3>
            <p className="text-gray-700 leading-relaxed">
              We maintain automated daily backups of all data with point-in-time recovery capabilities. Backups are encrypted and stored in geographically separate locations to ensure business continuity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We retain your information for as long as necessary to provide our services and comply with legal obligations:</p>
            
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Data:</strong> Retained while your account is active and for 90 days after account closure (unless you request immediate deletion)</li>
              <li><strong>QuickBooks OAuth Tokens:</strong> Stored until you disconnect your QuickBooks integration or delete your account</li>
              <li><strong>Transaction Data:</strong> Cached for 90 days for comparison and reconciliation purposes, then automatically purged</li>
              <li><strong>Uploaded Cheque Images:</strong> Retained per your preference settings (default: 1 year), with option for immediate deletion after processing</li>
              <li><strong>Processed OCR Data:</strong> Retained for 90 days or until you delete the associated records</li>
              <li><strong>Audit Logs:</strong> Retained for 1 year for security and compliance purposes</li>
              <li><strong>Billing Records:</strong> Retained for 7 years to comply with tax and accounting regulations</li>
            </ul>

            <p className="text-gray-700 leading-relaxed mt-4">
              You can request deletion of your data at any time by contacting us at privacy@chequeextractor.com or using the data deletion feature in your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.1 We Do NOT Sell Your Data</h3>
            <p className="text-gray-700 leading-relaxed">
              We do not sell, rent, or trade your personal information or financial data to third parties for marketing purposes. Your data is yours, and we respect that.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.2 Service Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We share data with trusted service providers who help us operate our service:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Supabase:</strong> Database and file storage (data processing agreement in place)</li>
              <li><strong>Google Gemini AI:</strong> OCR and AI processing (subject to Google's data processing terms)</li>
              <li><strong>Vercel & Railway:</strong> Application hosting and infrastructure</li>
              <li><strong>Payment Processors:</strong> Secure payment processing (we do not store credit card numbers)</li>
              <li><strong>Email Service Providers:</strong> Transactional and marketing emails</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              All service providers are contractually obligated to protect your data and use it only for the purposes we specify.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.3 QuickBooks Integration</h3>
            <p className="text-gray-700 leading-relaxed">
              When you connect your QuickBooks Online account, we access your QuickBooks data through Intuit's official OAuth 2.0 API. We only request the minimum permissions necessary (accounting data read/write) and only access data required to provide our service. Your QuickBooks data is subject to both our Privacy Policy and Intuit's Privacy Policy.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.4 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We may disclose your information if required to do so by law or in response to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Valid legal processes (subpoenas, court orders, search warrants)</li>
              <li>Government or regulatory requests</li>
              <li>Protecting our rights, property, or safety</li>
              <li>Preventing fraud or security threats</li>
              <li>Complying with tax or accounting regulations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.5 Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed">
              If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you via email and/or prominent notice on our website before your information is transferred and becomes subject to a different privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.1 Access and Portability</h3>
            <p className="text-gray-700 leading-relaxed">
              You have the right to access your personal data and request a copy in a portable format. You can export your data at any time from your account dashboard.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.2 Correction and Update</h3>
            <p className="text-gray-700 leading-relaxed">
              You can update your account information, preferences, and settings at any time through your account dashboard.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.3 Deletion</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to request deletion of your data. You can:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Delete individual cheque records from your dashboard</li>
              <li>Disconnect your QuickBooks integration (deletes OAuth tokens)</li>
              <li>Delete your entire account (Settings → Account → Delete Account)</li>
              <li>Contact us at privacy@chequeextractor.com for complete data deletion</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Note: Some data may be retained for legal or legitimate business purposes (e.g., billing records, audit logs) as described in Section 5.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.4 Marketing Communications</h3>
            <p className="text-gray-700 leading-relaxed">
              You can opt out of marketing emails by clicking the "unsubscribe" link in any marketing email or by updating your preferences in account settings. You will still receive transactional emails necessary for the service.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.5 QuickBooks Disconnection</h3>
            <p className="text-gray-700 leading-relaxed">
              You can disconnect your QuickBooks integration at any time from Settings → Integrations. This will immediately revoke our access to your QuickBooks data and delete stored OAuth tokens.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Essential Cookies:</strong> Required for authentication, security, and core functionality</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Understand how you use our service to improve it</li>
              <li><strong>Performance Cookies:</strong> Monitor and improve system performance</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookies through your browser settings. Note that disabling essential cookies may affect service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Third-Party Links</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service may contain links to third-party websites (e.g., QuickBooks Online, Intuit). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place for international data transfers, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
              <li>Standard contractual clauses approved by regulatory authorities</li>
              <li>Data processing agreements with all service providers</li>
              <li>Compliance with applicable data protection laws (GDPR, CCPA, etc.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
              <li>Email notification to your registered email address</li>
              <li>Prominent notice on our website and in the application</li>
              <li>Updating the "Last Updated" date at the top of this policy</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Your continued use of the service after changes become effective constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-700"><strong>Email:</strong> privacy@chequeextractor.com</p>
              <p className="text-gray-700 mt-2"><strong>Data Protection Officer:</strong> dpo@chequeextractor.com</p>
              <p className="text-gray-700 mt-2"><strong>Support:</strong> support@chequeextractor.com</p>
              <p className="text-gray-700 mt-2"><strong>Response Time:</strong> We aim to respond within 48 hours</p>
            </div>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Additional Resources</h2>
            <ul className="space-y-2">
              <li>
                <a href="/legal/terms" className="text-blue-600 hover:underline">Terms of Service</a>
              </li>
              <li>
                <a href="/legal/eula" className="text-blue-600 hover:underline">End User License Agreement</a>
              </li>
              <li>
                <a href="/settings" className="text-blue-600 hover:underline">Account Settings & Data Management</a>
              </li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Summary:</strong> We collect and process financial data to provide our cheque extraction and QuickBooks integration service. We use industry-standard security measures, do not sell your data, and give you full control over your information. You can access, export, or delete your data at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
