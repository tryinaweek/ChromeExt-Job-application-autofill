# Chrome Web Store Listing — AutoJobFill AI

> Last Updated: 2026-06-01

## Store Listing

**Extension Name** [REQUIRED]
AutoJobFill AI — Job Application Auto-Filler

**Short Description** [REQUIRED]
Auto-fill job applications on Greenhouse, Lever, Workday in a single click, and use AI to tailor summaries to the job.

**Detailed Description** [REQUIRED]
AutoJobFill AI is a modern productivity assistant that simplifies the job application process by autofilling forms in a single click and leveraging artificial intelligence to tailor your profile to matching job descriptions.

Tired of copying and pasting your work history, education, and social links onto Greenhouse, Lever, Workday, or corporate job boards? Set up your profile details once in the extension dashboard and let AutoJobFill AI handle the repetitive forms. When you visit a job board, a sleek floating control panel appears on the screen, letting you autofill the form instantly.

Key Features:
- Intelligent Form Autofill: Automatically maps and fills standard fields (name, email, phone, links, resume, etc.) on major ATS systems and generic application forms.
- Dynamic AI Customization: Instantly tailors your professional summary and skills to match the job description using Google Gemini (local Gemini Nano on-device or cloud API), helping your application stand out.
- Automatic Application Tracker: Save and track all applied jobs directly inside the extension. Monitor status changes (Applied, Interviewing, Rejected, Offer).
- CSV Export: Export your complete application history as a spreadsheet format (CSV) with one click for easy spreadsheet tracking.
- Local First: Your profile, history, and keys are stored directly inside Chrome's local storage. Your data never leaves your device except when sent to the official Gemini API for tailoring.

How to use:
1. Click the extension icon to open the popup dashboard.
2. Complete your details in the "Profile" tab (including optional experience and education items).
3. (Optional) Set up AI mode in Settings: choose local Gemini Nano or cloud Gemini (with your free Google AI Studio key).
4. Navigate to any job application page (like Lever or Greenhouse).
5. Click "⚡ Auto-fill Form" on the floating side widget or popup.
6. Click "✨ Customize for This Job" to let AI automatically optimize your summary/skills, and track it with "📂 Track Application".

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Auto-fills job application forms and tracks application history locally.

**Primary Language** [REQUIRED]
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ⬜ Not created | |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |

### Screenshot Notes
- Screenshot 1: Injected floating action widget in action on a mock job board showing autofilled and highlighted inputs.
- Screenshot 2: Profile builder screen in popup showing detailed form sections (experience list, education list, links).
- Screenshot 3: Tracker tab showing table of tracked applications with status change options and CSV download.

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Required to save the applicant's profile details (experience, skills, contact info) and track application history locally on their machine. |
| `tabs` | permissions | Required to detect the active tab's URL to check if the user is visiting a job application website, and to auto-extract the company and title details for the tracker. |
| `https://*/*` and `http://*/*` | host_permissions | Required to run content scripts on diverse company application boards (Lever, Greenhouse, Workday) which host application forms under custom enterprise domains. |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

All profile information, application trackers, and API credentials are kept locally within Chrome's local storage (`chrome.storage.local`). The application transmits text to the Google Gemini API solely for the "Customize for This Job" feature if activated, and no details are logged, collected, or sold by this extension.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy

**Privacy Policy URL** [RECOMMENDED]
*Local file included or published on a static hosting domain*

---

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.1 | 2026-06-03 | Removed unused 'scripting' permission to comply with narrowest permissions policy. | Draft |
| 1.0 | 2026-06-01 | Initial release with profile builder, form autofill, AI tailoring (nano/cloud), tracker, and CSV export. | Rejected |

---

## Review Notes

### Known Issues / Limitations
- Security limits prevent programmatically setting local file paths for resume file uploads. The extension identifies and highlights file input elements to prompt manual file upload.

### Rejection History
| Date | Reason | Fix Applied | Resubmitted |
|------|--------|-------------|-------------|
| 2026-06-02 | Requested but did not use the 'scripting' permission. | Removed 'scripting' from manifest.json. | 2026-06-03 |

