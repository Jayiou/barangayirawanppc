# Document PDF Generation & Email Delivery - Implementation Complete ✅

## Feature Overview
Residents can request documents (Barangay Clearance, Certificate of Residency, Certificate of Indigency) which admins can approve, auto-generate as PDFs, and email to residents.

## Workflow
1. **Resident submits document request** → Saved with `status: 'pending'`
2. **Admin approves request** → `status: 'approved'` + PDF automatically generated
3. **Admin moves to ready for pickup** → `status: 'ready_for_pickup'`
4. **Admin clicks "Send to Resident"** → PDF emailed to resident's email address
5. **Document tracking fields updated** → `documentSentAt`, `generatedDocumentPath`, `documentGeneratedAt`

## Backend Implementation

### 1. **DocumentRequest Model** (models/DocumentRequest.js)
- Added three new fields for PDF tracking:
  - `generatedDocumentPath` (String): Relative path to generated PDF
  - `documentSentAt` (Date): Timestamp when PDF was emailed
  - `documentGeneratedAt` (Date): Timestamp when PDF was generated

### 2. **Document Generator Utility** (utils/documentGenerator.js)
**Core Function:** `generateDocumentPDF(documentRequest, documentType)`

**Features:**
- Loads a document-specific template fragment from `Certification/`
- Inlines shared PDF styles from `Certification/barangay_documents_styles.css`
- Auto-fills form fields with resident & official data
- Converts to PDF via Puppeteer with A4 format, no margins, print background enabled
- Fetches official names (Punong Barangay, Secretary) from Official model with fallback
- Saves PDF to `private/uploads/documents/{requestId}-{documentType}-{YYYY-MM-DD}.pdf`
- Non-blocking error handling (logs warning, doesn't crash request)

**Field Mappings:**
- **certificate_of_residency**: cert_name, cert_purok, cert_record, cert_since, cert_day, cert_month, cert_year, cert_punong_barangay, cert_secretary
- **certificate_of_indigency**: ind_name, ind_residence, ind_status, ind_income, ind_dependents, date_issued_ind, ind_punong_barangay, ind_secretary
- **barangay_clearance**: clr_name, clr_residence, clr_purpose, clr_ctc, date_issued_clr, clr_punong_barangay, clr_secretary

### 3. **PDF Email Delivery** (utils/mailer.js)
**New Function:** `sendGeneratedDocumentEmail(toEmail, name, documentType, filePath)`

**Features:**
- Sends professional HTML email with PDF attachment
- Includes document type, issue date, sender footer
- Attachment filename: `{documentType}.pdf`
- Error handling: Logs to console, throws for caller handling

### 4. **Document Request Controller** (controllers/documentRequestController.js)

**Modified:**
- `updateDocumentRequestStatus()` - Auto-generates PDF when status → 'approved'
  - Calls `generateDocumentPDF()` on approval
  - Updates `generatedDocumentPath` and `documentGeneratedAt`
  - Continues status update even if PDF generation fails (non-blocking)

**New Endpoint:**
- `POST /:id/send-to-resident` - Admin-only document email delivery
  - Validates status === 'ready_for_pickup' (400 if not)
  - Validates `generatedDocumentPath` exists (400 if missing)
  - Validates `documentSentAt` is null, prevents double-sending (400 if already sent)
  - Validates email address exists (400 if missing)
  - Calls `sendGeneratedDocumentEmail()` with file path
  - Updates `documentSentAt` to current timestamp
  - Returns updated populated document with resident/official data

### 5. **API Routes** (routes/documentRequestRoutes.js)
- Registered: `POST /:id/send-to-resident`
- Middleware: `authMiddleware` (require login) → `roleMiddleware('admin')` (admin only)
- Handler: `sendDocumentToResident` from controller

## Frontend Implementation

### AdminApp.vue Document Modal
**Location:** Document request detail modal (lines 520-555)

**New Button - "Send to Resident":**
- **Visibility:** Only shown when `status === 'ready_for_pickup'`
- **Disabled State:** If document already sent (`documentSentAt !== null`)
- **UI States:**
  - Default: "Send to Resident" with paper-plane icon
  - Sending: "Sending..." with spinner icon
  - Sent: "Sent on [date]" with check-circle icon, disabled button
- **Full Width Button** with centered text and icon

**Handler Function:** `sendDocumentToResident()`
- Validates document ID exists
- Checks if already sent, shows error if true
- Calls POST `/api/document-requests/{id}/send-to-resident`
- Updates `selectedItem.documentSentAt` with response
- Shows success toast on completion
- Shows error toast on failure
- Reloads all data to refresh tables

## Environment Setup
Required in `.env`:
- `EMAIL_USER`: Gmail address for sending PDFs
- `EMAIL_PASS`: Gmail app-specific password
- Puppeteer will run headless in sandbox-free mode for Linux/Docker compatibility

## File Structure
```
private/uploads/documents/        # PDF storage (security: private)
  {requestId}-{documentType}-{YYYY-MM-DD}.pdf

Certification/
  barangay_documents_styles.css
  certificate_of_residency_template.html
  certificate_of_indigency_template.html
  barangay_clearance_template.html
```

## Deployment Checklist
- [x] Puppeteer dependency installed (`npm install puppeteer`)
- [x] MongoDB DocumentRequest schema updated
- [x] PDF generator utility created and tested
- [x] Email delivery utility extended
- [x] Controller endpoint implemented
- [x] API route registered with auth/role middleware
- [x] Frontend button added to admin modal
- [x] Frontend handler function created
- [x] Build successful (Vite compiled 50 modules)

## Testing Workflow
1. Create document request as resident → status: pending
2. Admin approves → status: approved, PDF auto-generates
3. Admin updates to ready_for_pickup → status: ready_for_pickup
4. Admin clicks "Send to Resident" button → PDF emailed
5. Check resident's email for PDF attachment
6. Verify `generatedDocumentPath`, `documentSentAt`, `documentGeneratedAt` updated in DB
7. Verify button shows "Sent on [date]" and is disabled

## Known Limitations
- PDF generation happens on approval (non-blocking if it fails)
- Email delivery requires valid Gmail credentials in .env
- Residents cannot download PDFs (email-only delivery as requested)
- PDFs stored in filesystem for audit trail and re-sending capability

## Success Metrics
✅ All 8 implementation tasks completed
✅ Frontend build successful
✅ No compilation errors
✅ Database schema updated
✅ API endpoint functional
✅ Admin button fully integrated
✅ Email delivery configured
✅ PDF generation automated
