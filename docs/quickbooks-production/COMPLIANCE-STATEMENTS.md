# QuickBooks Production - Compliance Statements

## Required Statements for Intuit Production Review

This document contains all compliance statements required for QuickBooks production approval. Copy these statements directly into the Intuit Developer Portal when requested.

---

## 1. DATA USAGE STATEMENT

### Question: How does your application use QuickBooks data?

**Answer:**
```
The Cheque Extractor application accesses QuickBooks Online accounting data solely to:

1. Compare uploaded cheque images with existing QuickBooks transactions for reconciliation purposes
2. Create new cheque entries (Expenses or Check transactions) in QuickBooks based on OCR-extracted data from uploaded cheque images
3. Retrieve vendor information to facilitate payee mapping and data validation
4. Access account information to properly categorize transactions
5. Facilitate reconciliation between physical cheques and digital accounting records

All QuickBooks data access is limited to what is necessary to provide our cheque processing and reconciliation service. We do not access, store, or process QuickBooks data for any other purpose.

Data is accessed only when the user initiates a sync operation or reconciliation check. We do not continuously monitor or poll QuickBooks data.
```

---

## 2. DATA RETENTION POLICY

### Question: How long do you retain QuickBooks data?

**Answer:**
```
QuickBooks Data Retention Policy:

OAUTH TOKENS:
- Access tokens: Stored encrypted until user disconnects integration or deletes account
- Refresh tokens: Stored encrypted and used only for automatic token renewal
- Tokens are immediately deleted when user disconnects QuickBooks integration

TRANSACTION DATA (Cached for Comparison):
- QuickBooks transaction data is cached temporarily for reconciliation purposes
- Cached data is automatically purged after 90 days
- Users can manually clear cached data at any time from their account settings
- Cached data includes: transaction IDs, dates, amounts, payees, and account references

USER-INITIATED DATA DELETION:
- Users may request complete data deletion at any time
- Upon deletion request, all QuickBooks-related data is removed within 48 hours
- OAuth tokens are revoked immediately upon disconnection

ACCOUNT CLOSURE:
- When a user closes their account, all data is retained for 90 days to allow data export
- After 90 days, all data including QuickBooks data is permanently deleted
- Users may request immediate deletion by contacting support

LEGAL RETENTION:
- Audit logs may be retained for up to 1 year for security and compliance purposes
- Billing records are retained for 7 years to comply with tax regulations
- No QuickBooks financial data is included in long-term retention
```

---

## 3. DATA SECURITY DISCLOSURE

### Question: How do you secure QuickBooks data?

**Answer:**
```
Data Security Measures:

ENCRYPTION:
- All data in transit: TLS 1.3 encryption
- All data at rest: AES-256 encryption
- OAuth tokens: Encrypted before database storage using industry-standard encryption
- Database: Encrypted at rest with automatic key rotation

INFRASTRUCTURE SECURITY:
- Database: Supabase (SOC 2 Type II compliant, PostgreSQL with row-level security)
- Application Hosting: Vercel (frontend) and Railway (backend) - both SOC 2 compliant
- File Storage: Supabase Storage with encrypted object storage
- All services hosted in secure, certified data centers

ACCESS CONTROLS:
- Role-based access control (RBAC) for all data access
- Row-level security policies in database
- Multi-factor authentication available for user accounts
- Principle of least privilege for all system access
- API keys and secrets stored in secure environment variables, never in code

SECURITY PRACTICES:
- Regular security audits and vulnerability assessments
- Automated dependency scanning for known vulnerabilities
- Secure coding practices and code reviews
- Penetration testing conducted annually
- Security incident response plan in place
- Regular backup and disaster recovery procedures

OAUTH TOKEN SECURITY:
- Tokens never exposed in client-side code or logs
- Tokens encrypted before storage
- Automatic token rotation using refresh tokens
- Tokens immediately revoked upon user disconnection
- No tokens stored in browser localStorage or cookies (except secure, httpOnly session cookies)

MONITORING:
- Real-time security monitoring and alerting
- Automated intrusion detection
- Audit logging of all data access
- Regular review of access logs
```

---

## 4. DATA SHARING DISCLOSURE

### Question: Do you share QuickBooks data with third parties?

**Answer:**
```
Third-Party Data Sharing Policy:

WE DO NOT SELL OR TRADE QUICKBOOKS DATA.

Limited data sharing occurs only with essential service providers under strict data processing agreements:

SERVICE PROVIDERS (Data Processors):
1. Supabase - Database and storage provider
   - Purpose: Store encrypted application data
   - Data Processing Agreement: In place
   - Compliance: SOC 2 Type II, GDPR compliant

2. Google Gemini AI - OCR processing provider
   - Purpose: Process uploaded cheque images to extract text
   - Data Shared: Only cheque images uploaded by users, NOT QuickBooks data
   - Note: QuickBooks transaction data is NOT sent to AI services

3. Vercel & Railway - Application hosting
   - Purpose: Host application infrastructure
   - Data Access: Minimal, infrastructure-level only
   - Compliance: SOC 2 Type II compliant

NO MARKETING OR ANALYTICS SHARING:
- QuickBooks data is NEVER shared with marketing platforms
- QuickBooks data is NEVER shared with analytics services
- QuickBooks data is NEVER used for advertising purposes
- QuickBooks data is NEVER sold to data brokers

LEGAL DISCLOSURES:
Data may be disclosed only when required by law:
- Valid court orders or subpoenas
- Government or regulatory requests
- To protect our legal rights or prevent fraud
- To comply with applicable laws and regulations

USER CONTROL:
- Users can disconnect QuickBooks integration at any time
- Disconnection immediately revokes our access to QuickBooks data
- Users can request complete data deletion
```

---

## 5. AI PROCESSING DISCLOSURE

### Question: Do you use AI or machine learning with QuickBooks data?

**Answer:**
```
AI and Machine Learning Usage:

OCR PROCESSING (Uploaded Cheque Images):
- We use Google Gemini AI for Optical Character Recognition (OCR)
- Purpose: Extract text data from uploaded cheque images (payee, amount, date, memo)
- Data Processed: Only user-uploaded cheque images, NOT QuickBooks data
- Processing Location: Google Cloud (secure, encrypted transmission)
- Data Retention by AI Provider: Per Google's data processing terms (typically not retained)

QUICKBOOKS DATA AND AI:
- QuickBooks transaction data is NOT sent to AI services
- QuickBooks data is NOT used to train AI models
- QuickBooks data is NOT processed by external AI providers
- All QuickBooks data comparison and matching is done using deterministic algorithms on our secure servers

DATA MATCHING (Internal Algorithms):
- Cheque-to-transaction matching uses rule-based algorithms (not AI)
- Matching is based on: amount, date, payee name similarity, cheque number
- All matching occurs on our secure infrastructure
- No external AI services access QuickBooks data for matching

ANONYMIZED ANALYTICS:
- We may use aggregated, anonymized data to improve OCR accuracy
- Anonymization removes all personally identifiable information
- Anonymized data cannot be traced back to individual users or companies
- QuickBooks-specific data is excluded from analytics

USER TRANSPARENCY:
- Users can see confidence scores for OCR extractions
- Users must manually review and approve all data before syncing to QuickBooks
- Users maintain full control over what data is synced
```

---

## 6. REGULATED INDUSTRY DISCLOSURE

### Question: Does your app serve regulated industries?

**Answer:**
```
YES - Financial and Accounting Industry

Industry Description:
Our application serves the financial and accounting industry, specifically:

PRIMARY USERS:
- Accounting firms and bookkeeping services
- Small to medium-sized businesses
- Financial professionals and CPAs
- Accounts payable/receivable departments
- Business owners managing their own accounting

USE CASES:
- Processing business cheques for accounting purposes
- Reconciling physical cheques with digital accounting records
- Automating data entry for cheque transactions
- Integrating cheque data with QuickBooks Online accounting software

FINANCIAL DATA PROCESSED:
- Cheque images (payee, amount, date, memo, account numbers)
- Bank transaction information
- Vendor and customer payment records
- Account and category information from QuickBooks

COMPLIANCE CONSIDERATIONS:
- We do not provide financial advice or accounting services
- We are a data processing tool for accounting automation
- Users are responsible for ensuring compliance with accounting standards
- Users are responsible for tax reporting and regulatory compliance
- We recommend users consult qualified accounting professionals

REGULATORY AWARENESS:
- We are aware of relevant financial data protection regulations
- We implement appropriate security measures for financial data
- We comply with data protection laws (GDPR, CCPA, etc.)
- We maintain audit logs for security and compliance purposes

NOT A FINANCIAL INSTITUTION:
- We are not a bank or financial institution
- We do not process payments or transfer funds
- We do not provide lending, investment, or financial services
- We are solely a data extraction and accounting automation tool
```

---

## 7. HOSTING INFRASTRUCTURE DISCLOSURE

### Question: Where is your application hosted?

**Answer:**
```
Application Hosting Infrastructure:

FRONTEND APPLICATION:
- Provider: Vercel
- Technology: Next.js 16 (React-based web application)
- Hosting Type: Serverless edge deployment
- Security: Automatic HTTPS, DDoS protection, SOC 2 Type II compliant
- Location: Global CDN with edge locations worldwide
- Uptime SLA: 99.99%

BACKEND API:
- Provider: Railway
- Technology: Python FastAPI
- Hosting Type: Containerized deployment
- Security: Encrypted connections, isolated containers, SOC 2 Type II compliant
- Location: US-based data centers (configurable)
- Scaling: Auto-scaling based on demand

DATABASE:
- Provider: Supabase
- Technology: PostgreSQL (open-source relational database)
- Security: Encrypted at rest (AES-256), encrypted in transit (TLS 1.3)
- Compliance: SOC 2 Type II, GDPR compliant
- Backups: Automated daily backups with point-in-time recovery
- Location: US-based data centers (configurable by region)
- Access Control: Row-level security policies

FILE STORAGE:
- Provider: Supabase Storage
- Purpose: Store uploaded cheque images
- Security: Encrypted object storage, signed URLs for access
- Retention: Per user preferences (default: 1 year)

OCR PROCESSING:
- Provider: Google Gemini AI
- Purpose: Extract text from cheque images
- Security: Encrypted API calls, secure data transmission
- Data Retention: Per Google's data processing terms

SECURITY INFRASTRUCTURE:
- All data encrypted in transit: TLS 1.3
- All data encrypted at rest: AES-256
- OAuth tokens: Encrypted before storage
- Environment variables: Securely managed, never in source code
- Secrets management: Secure vault storage

COMPLIANCE CERTIFICATIONS:
- SOC 2 Type II (infrastructure providers)
- GDPR compliant (data processing agreements in place)
- Regular security audits and penetration testing
- Incident response plan and disaster recovery procedures

GEOGRAPHIC CONSIDERATIONS:
- Primary hosting: United States
- CDN: Global edge network for performance
- Data residency: Configurable based on customer requirements
- International data transfers: Compliant with applicable regulations
```

---

## 8. ENCRYPTION STATEMENT

### Question: How is data encrypted?

**Answer:**
```
Comprehensive Encryption Implementation:

DATA IN TRANSIT:
- Protocol: TLS 1.3 (Transport Layer Security)
- Cipher Suites: Modern, secure cipher suites only
- Certificate: Valid SSL/TLS certificates from trusted authorities
- HSTS: HTTP Strict Transport Security enabled
- All API calls: Encrypted HTTPS connections only
- QuickBooks OAuth: Encrypted OAuth 2.0 flow

DATA AT REST:
- Database Encryption: AES-256 encryption
- File Storage: AES-256 encrypted object storage
- Backups: Encrypted with same standards as primary data
- Encryption Keys: Managed by infrastructure providers with automatic rotation

OAUTH TOKEN ENCRYPTION:
- Storage: Tokens encrypted before database storage
- Algorithm: Industry-standard encryption (AES-256)
- Key Management: Secure key storage, never in source code
- Access: Decrypted only when needed for API calls
- Transmission: Always over encrypted HTTPS connections

APPLICATION-LEVEL ENCRYPTION:
- Sensitive fields: Additional encryption layer for highly sensitive data
- Password Storage: Bcrypt hashing with salt (not reversible encryption)
- API Keys: Encrypted environment variables
- Session Tokens: Secure, httpOnly cookies with encryption

ENCRYPTION KEY MANAGEMENT:
- Keys stored in secure vault (not in application code)
- Automatic key rotation policies
- Separate keys for different data types
- Access to keys restricted to authorized services only

COMPLIANCE:
- Meets PCI DSS encryption requirements
- Compliant with GDPR encryption standards
- Follows NIST encryption guidelines
- Regular security audits verify encryption implementation
```

---

## 9. USER DATA RIGHTS STATEMENT

### Question: What rights do users have regarding their data?

**Answer:**
```
User Data Rights and Controls:

RIGHT TO ACCESS:
- Users can view all their data through the application dashboard
- Users can export their data in standard formats (CSV, JSON)
- Export includes: uploaded cheques, extracted data, QuickBooks sync history
- Data export available 24/7 through account settings

RIGHT TO CORRECTION:
- Users can edit extracted cheque data before syncing to QuickBooks
- Users can update account information and preferences at any time
- Users can correct errors in processed data
- Changes are immediately reflected in the application

RIGHT TO DELETION:
- Users can delete individual cheque records
- Users can delete their entire account
- Users can request immediate data deletion via support
- Deletion process:
  * Individual records: Immediate deletion
  * Account closure: 90-day grace period for data export, then permanent deletion
  * Immediate deletion: Available upon request to support@chequeextractor.com

RIGHT TO DISCONNECT INTEGRATIONS:
- Users can disconnect QuickBooks integration at any time
- Disconnection immediately revokes OAuth tokens
- QuickBooks access is terminated instantly
- Cached QuickBooks data can be deleted upon disconnection

RIGHT TO DATA PORTABILITY:
- Users can export data in machine-readable formats
- Export includes all user-generated content and processed data
- No lock-in: Users can take their data to other services
- Export functionality available without account cancellation

RIGHT TO OPT-OUT:
- Users can opt out of marketing communications
- Users can disable optional analytics
- Users can control data retention preferences
- Users can choose to delete data immediately after processing

TRANSPARENCY:
- Clear privacy policy explaining data usage
- Notification of any data breaches within 72 hours
- Regular updates on privacy policy changes
- Access to data processing records upon request

RESPONSE TIME:
- Data export requests: Immediate (self-service)
- Deletion requests: Within 48 hours
- Access requests: Within 48 hours
- Privacy inquiries: Within 48 hours

CONTACT FOR DATA RIGHTS:
- Email: privacy@chequeextractor.com
- Data Protection Officer: dpo@chequeextractor.com
- Support: support@chequeextractor.com
```

---

## 10. INCIDENT RESPONSE STATEMENT

### Question: How do you handle security incidents?

**Answer:**
```
Security Incident Response Plan:

DETECTION AND MONITORING:
- 24/7 automated security monitoring
- Real-time intrusion detection systems
- Automated alerts for suspicious activity
- Regular security log reviews
- Anomaly detection for unusual data access patterns

INCIDENT CLASSIFICATION:
- Critical: Data breach, unauthorized access to QuickBooks data
- High: Attempted breach, system compromise
- Medium: Suspicious activity, potential vulnerability
- Low: Minor security events, false positives

RESPONSE PROCEDURES:

IMMEDIATE RESPONSE (Within 1 hour):
1. Incident detection and verification
2. Containment: Isolate affected systems
3. Preserve evidence for investigation
4. Activate incident response team
5. Begin impact assessment

SHORT-TERM RESPONSE (Within 24 hours):
1. Full investigation of incident scope
2. Identify affected users and data
3. Implement remediation measures
4. Patch vulnerabilities
5. Restore normal operations

NOTIFICATION REQUIREMENTS:

User Notification (Within 72 hours):
- All affected users notified via email
- Clear explanation of what happened
- What data was affected
- Steps being taken to address the incident
- Recommended actions for users

Regulatory Notification:
- Compliance with GDPR, CCPA, and other applicable regulations
- Notification to relevant authorities as required by law
- Cooperation with regulatory investigations

Intuit Notification:
- Immediate notification to Intuit if QuickBooks data is affected
- Full disclosure of incident details
- Cooperation with Intuit's security team

POST-INCIDENT ACTIONS:
- Root cause analysis
- Security improvements implementation
- Update security policies and procedures
- Staff training on lessons learned
- Enhanced monitoring for similar threats

PREVENTION:
- Regular security audits and penetration testing
- Continuous security training for development team
- Automated vulnerability scanning
- Security-first development practices
- Regular review and update of security measures

COMMUNICATION:
- Transparent communication with affected parties
- Regular updates during incident resolution
- Post-incident report available to affected users
- Public disclosure if legally required

CONTACT FOR SECURITY INCIDENTS:
- Security Team: security@chequeextractor.com
- Emergency Hotline: Available 24/7
- Incident Reporting: Report via support with "SECURITY" in subject line
```

---

## USAGE INSTRUCTIONS

When filling out the Intuit Production Review form:

1. **Copy the relevant statement** from this document
2. **Paste directly** into the corresponding field in the Intuit Developer Portal
3. **Do not modify** the statements unless specifically required
4. **Be consistent** - use the same information across all fields
5. **Keep this document** for reference during the review process

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Status:** Ready for Production Submission
