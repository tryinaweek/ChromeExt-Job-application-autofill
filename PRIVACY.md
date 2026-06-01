# Privacy Policy for AutoJobFill AI

**Last Updated:** June 1, 2026

AutoJobFill AI ("we", "our", or "the extension") values your privacy. This Privacy Policy describes how we handle information in the AutoJobFill AI Chrome extension.

## 1. Information Collection and Storage
AutoJobFill AI does **not** collect, store, or transmit your personally identifiable information, application tracking details, or API credentials to any third-party servers or to us. 

* **Local Storage:** All profile information (name, email, phone, links, experience, education, and skills) and job tracking history are stored directly inside your browser using Google Chrome's secure local storage API (`chrome.storage.local`).
* **API Keys:** If you choose to configure a Gemini API key in the settings, the key is saved locally on your device and is never shared with us or any third party other than Google's official API servers during processing.

## 2. Information Processing (AI Tailoring)
When you use the "Customize for This Job" feature, the extension sends the active job description along with your profile summary and skills directly to the Google Gemini API to generate a tailored summary. This transaction occurs client-side (directly from your browser to Google's API server). We do not intercept, view, or log this data.

## 3. Permissions Used
The extension requests the following permissions for the sole purpose of enabling its features:
* `storage`: To save your profile information and application history locally.
* `tabs`: To read the active tab's URL and title to identify job board websites and automatically populate job details (company, role) in your tracking tab.
* `scripting`: To safely inject the autofill script into active forms.
* `host_permissions` (`http://*/*` and `https://*/*`): To inject form-filling widgets on job application portals across various company-specific domains.

## 4. Changes to This Policy
We may update this Privacy Policy from time to time. Any changes will be reflected in this document and updated with a new revision date.

## 5. Contact
If you have any questions or feedback, please contact us at your support email or via our repository.
