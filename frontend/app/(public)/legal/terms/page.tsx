export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: March 2, 2026</p>

        <div className="prose prose-blue max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Cheque Extractor ("Company," "we," "us," or "our") governing your access to and use of the Cheque Extractor service, including our website, application, and all related services (collectively, the "Service").
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cheque Extractor is an accounting automation tool that provides:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>OCR Processing:</strong> Optical Character Recognition technology to extract data from cheque images and financial documents</li>
              <li><strong>AI-Powered Extraction:</strong> Artificial intelligence to identify and structure financial information (payee, amount, date, memo, etc.)</li>
              <li><strong>QuickBooks Integration:</strong> Direct integration with QuickBooks Online to sync extracted data</li>
              <li><strong>Reconciliation Tools:</strong> Features to compare and match cheques with QuickBooks transactions</li>
              <li><strong>Batch Processing:</strong> Ability to process multiple cheques simultaneously</li>
              <li><strong>Data Management:</strong> Storage and organization of processed cheque data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Eligibility and Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1 Eligibility</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use the Service, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Service under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.2 Account Security</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
              <li>Using a strong, unique password and enabling two-factor authentication when available</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.3 Business Use</h3>
            <p className="text-gray-700 leading-relaxed">
              If you are using the Service on behalf of a business or organization, you represent that you have the authority to bind that entity to these Terms, and "you" refers to both you individually and the entity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Acceptable Use Policy</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1 Permitted Uses</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may use the Service to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Process legitimate cheques and financial documents for accounting purposes</li>
              <li>Integrate with your authorized QuickBooks Online account</li>
              <li>Store and manage your financial data within the Service</li>
              <li>Export data for your business records</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.2 Prohibited Uses</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Upload fraudulent, counterfeit, or stolen cheques or financial documents</li>
              <li>Process documents you do not have legal authorization to access</li>
              <li>Use the Service for money laundering or other illegal financial activities</li>
              <li>Attempt to reverse engineer, decompile, or extract source code from the Service</li>
              <li>Use automated tools (bots, scrapers) to access the Service without permission</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Access another user's account without authorization</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Resell or redistribute the Service without written permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. QuickBooks Integration</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.1 Authorization</h3>
            <p className="text-gray-700 leading-relaxed">
              By connecting your QuickBooks Online account, you authorize us to access your QuickBooks data through Intuit's official OAuth 2.0 API. We will only access data necessary to provide the Service, including transaction data, vendor information, and account details.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.2 QuickBooks Terms</h3>
            <p className="text-gray-700 leading-relaxed">
              Your use of QuickBooks Online is subject to Intuit's Terms of Service and Privacy Policy. We are not responsible for QuickBooks service availability, data integrity, or any issues arising from your QuickBooks account.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.3 Data Synchronization</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Data synced to QuickBooks becomes part of your QuickBooks records</li>
              <li>You are responsible for reviewing and verifying all data before syncing</li>
              <li>We are not liable for errors in OCR extraction or data synchronization</li>
              <li>You should maintain backups of your QuickBooks data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.4 Disconnection</h3>
            <p className="text-gray-700 leading-relaxed">
              You may disconnect your QuickBooks integration at any time. Disconnection will revoke our access to your QuickBooks data but will not delete data already synced to QuickBooks.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. OCR and AI Processing</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.1 Accuracy Disclaimer</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>IMPORTANT:</strong> OCR and AI technology are not 100% accurate. While we strive for high accuracy, errors may occur in data extraction. You are responsible for reviewing and verifying all extracted data before using it for accounting or financial purposes.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.2 User Responsibility</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You will review all OCR-extracted data for accuracy before use</li>
              <li>You are solely responsible for the accuracy of data synced to QuickBooks</li>
              <li>We are not liable for financial losses resulting from OCR errors</li>
              <li>You will not rely solely on automated extraction without human review</li>
              <li>Final accounting decisions are your responsibility</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.3 Image Quality</h3>
            <p className="text-gray-700 leading-relaxed">
              OCR accuracy depends on image quality. For best results, upload clear, high-resolution images with good lighting and minimal distortion. We cannot guarantee accurate extraction from poor-quality images.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Subscription and Payment</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.1 Subscription Plans</h3>
            <p className="text-gray-700 leading-relaxed">
              The Service is offered on a subscription basis with various pricing tiers. Current pricing and plan details are available on our website and may be changed with 30 days' notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.2 Billing</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Subscriptions are billed in advance on a monthly or annual basis</li>
              <li>Payment is due at the start of each billing period</li>
              <li>You authorize us to charge your payment method automatically</li>
              <li>You must keep your payment information current</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.3 Refunds</h3>
            <p className="text-gray-700 leading-relaxed">
              We offer a 14-day money-back guarantee for new subscriptions. Refund requests must be submitted within 14 days of initial purchase. Renewals are non-refundable except as required by law.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.4 Cancellation</h3>
            <p className="text-gray-700 leading-relaxed">
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. You will retain access to the Service until the end of the paid period. No partial refunds for unused time.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.5 Free Trial</h3>
            <p className="text-gray-700 leading-relaxed">
              Free trials may be offered at our discretion. Trial terms will be specified at signup. Your payment method will be charged automatically when the trial ends unless you cancel before the trial period expires.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">8.1 Our Intellectual Property</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service, including all software, algorithms, designs, text, graphics, logos, and other content, is owned by us or our licensors and is protected by copyright, trademark, and other intellectual property laws. You may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Copy, modify, or create derivative works of the Service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Remove or alter any copyright, trademark, or proprietary notices</li>
              <li>Use our trademarks or branding without written permission</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">8.2 Your Content</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain ownership of all cheque images, financial documents, and data you upload ("Your Content"). By uploading Your Content, you grant us a limited license to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Process Your Content using OCR and AI technology</li>
              <li>Store Your Content on our servers</li>
              <li>Display Your Content back to you in the Service</li>
              <li>Use anonymized, aggregated data to improve our algorithms</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              This license ends when you delete Your Content or terminate your account.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">8.3 Feedback</h3>
            <p className="text-gray-700 leading-relaxed">
              If you provide feedback, suggestions, or ideas about the Service, we may use them without obligation or compensation to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.1 Service "As Is"</h3>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
              <p className="text-gray-700 leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.2 No Guarantee of Accuracy</h3>
            <p className="text-gray-700 leading-relaxed">
              We do not guarantee that OCR extraction will be 100% accurate or that the Service will be error-free, uninterrupted, or secure. You use the Service at your own risk.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.3 Limitation of Liability</h3>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
              <p className="text-gray-700 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
                <li>LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES</li>
                <li>ERRORS IN OCR EXTRACTION OR DATA SYNCHRONIZATION</li>
                <li>FINANCIAL LOSSES RESULTING FROM USE OF THE SERVICE</li>
                <li>THIRD-PARTY SERVICES (INCLUDING QUICKBOOKS)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.4 Professional Advice</h3>
            <p className="text-gray-700 leading-relaxed">
              The Service is a tool to assist with data entry and is not a substitute for professional accounting, tax, or financial advice. Consult qualified professionals for accounting decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify, defend, and hold harmless Cheque Extractor, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>Your Content or data you upload</li>
              <li>Unauthorized access to your account due to your negligence</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">11.1 Termination by You</h3>
            <p className="text-gray-700 leading-relaxed">
              You may terminate your account at any time from account settings or by contacting support. Termination takes effect immediately, but you remain responsible for charges incurred before termination.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">11.2 Termination by Us</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may suspend or terminate your account immediately if:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You violate these Terms</li>
              <li>Your payment fails or account is past due</li>
              <li>We suspect fraudulent or illegal activity</li>
              <li>Required by law or legal process</li>
              <li>We discontinue the Service (with 30 days' notice)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">11.3 Effect of Termination</h3>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, your access to the Service ends immediately. We will retain your data for 90 days to allow data export, then delete it unless legally required to retain it. Provisions regarding intellectual property, disclaimers, and limitations of liability survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these Terms at any time. Material changes will be notified via email and/or prominent notice in the Service at least 30 days before taking effect. Continued use after changes become effective constitutes acceptance. If you don't agree, you must stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">13.1 Informal Resolution</h3>
            <p className="text-gray-700 leading-relaxed">
              Before filing a legal claim, you agree to contact us at support@chequeextractor.com to attempt informal resolution. We will work in good faith to resolve disputes.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">13.2 Arbitration</h3>
            <p className="text-gray-700 leading-relaxed">
              Any disputes not resolved informally shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. Arbitration will be conducted in English and take place remotely or in a mutually agreed location.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">13.3 Class Action Waiver</h3>
            <p className="text-gray-700 leading-relaxed">
              You agree to resolve disputes on an individual basis only. You waive any right to participate in class actions, class arbitrations, or representative actions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. General Provisions</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.1 Governing Law</h3>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.2 Entire Agreement</h3>
            <p className="text-gray-700 leading-relaxed">
              These Terms, together with our Privacy Policy and EULA, constitute the entire agreement between you and us regarding the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.3 Severability</h3>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found invalid or unenforceable, the remaining provisions continue in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.4 No Waiver</h3>
            <p className="text-gray-700 leading-relaxed">
              Our failure to enforce any right or provision does not constitute a waiver of that right or provision.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.5 Assignment</h3>
            <p className="text-gray-700 leading-relaxed">
              You may not assign or transfer these Terms without our written consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.6 Force Majeure</h3>
            <p className="text-gray-700 leading-relaxed">
              We are not liable for delays or failures due to circumstances beyond our reasonable control, including natural disasters, war, terrorism, pandemics, or infrastructure failures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-700"><strong>Email:</strong> legal@chequeextractor.com</p>
              <p className="text-gray-700 mt-2"><strong>Support:</strong> support@chequeextractor.com</p>
              <p className="text-gray-700 mt-2"><strong>Response Time:</strong> Within 48 hours</p>
            </div>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Related Documents</h2>
            <ul className="space-y-2">
              <li>
                <a href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
              </li>
              <li>
                <a href="/legal/eula" className="text-blue-600 hover:underline">End User License Agreement</a>
              </li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Summary:</strong> By using Cheque Extractor, you agree to use the Service responsibly, verify all OCR-extracted data before use, maintain account security, and comply with all applicable laws. We provide the Service "as is" and are not liable for OCR errors or financial losses. You may cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
