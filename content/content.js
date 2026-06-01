/**
 * Content script for AutoJobFill AI.
 * Handles DOM analysis, form field mapping, autofill execution, and job detail extraction.
 */

const ContentScript = {
  // Field mappings definition with regex patterns for matching labels, placeholders, and names
  fieldDefinitions: {
    firstName: {
      keywords: ['first name', 'firstname', 'given name', 'first_name', 'first-name'],
      type: 'text'
    },
    lastName: {
      keywords: ['last name', 'lastname', 'family name', 'last_name', 'last-name'],
      type: 'text'
    },
    fullName: {
      keywords: ['full name', 'fullname', 'name', 'full_name', 'full-name', 'your name'],
      type: 'text'
    },
    email: {
      keywords: ['email', 'e-mail', 'email address', 'email_address', 'mail'],
      type: 'email'
    },
    phone: {
      keywords: ['phone', 'telephone', 'mobile', 'cell', 'contact number', 'phone number', 'phone_number'],
      type: 'tel'
    },
    linkedin: {
      keywords: ['linkedin', 'linkedin profile', 'linkedin url', 'linkedin_profile'],
      type: 'text'
    },
    portfolio: {
      keywords: ['portfolio', 'website', 'personal website', 'portfolio url', 'github', 'personal_website', 'homepage', 'other website'],
      type: 'text'
    },
    summary: {
      keywords: ['summary', 'about you', 'professional summary', 'cover letter', 'additional information', 'anything else', 'comments', 'letter', 'pitch'],
      type: 'textarea'
    },
    skills: {
      keywords: ['skills', 'technologies', 'languages', 'keywords', 'programming languages'],
      type: 'textarea'
    }
  },

  /**
   * Helper to normalize text for keyword matching.
   */
  normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
      .replace(/[*:]/g, '') // remove asterisks and colons
      .trim()
      .replace(/\s+/g, ' '); // collapse spaces
  },

  /**
   * Find label text associated with an input element.
   */
  getLabelForInput(element) {
    // 1. Check for explicit label with 'for' attribute
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label && label.innerText) return label.innerText;
    }

    // 2. Check if element is wrapped in a label
    const parentLabel = element.closest('label');
    if (parentLabel && parentLabel.innerText) return parentLabel.innerText;

    // 3. Check for aria-labelledby
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const label = document.getElementById(ariaLabelledBy);
      if (label && label.innerText) return label.innerText;
    }

    // 4. Check for aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // 5. Check placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    // 6. Check name attribute
    const name = element.getAttribute('name');
    if (name) return name;

    // 7. Check ID attribute
    if (element.id) return element.id;

    // 8. Find preceding text sibling/element (useful for Workday or custom forms)
    // Walk back up to 3 siblings to find text
    let sibling = element.previousElementSibling;
    for (let i = 0; i < 3 && sibling; i++) {
      if (sibling.tagName === 'LABEL' || sibling.innerText) {
        return sibling.innerText;
      }
      sibling = sibling.previousElementSibling;
    }

    // 9. Check parent element container headings or strong text
    const container = element.closest('div, td, tr, li, p');
    if (container) {
      const header = container.querySelector('strong, span, h3, h4, h5, .label');
      if (header && header.innerText) {
        return header.innerText;
      }
    }

    return '';
  },

  /**
   * Match label text against field keywords.
   */
  matchFieldType(labelText) {
    const norm = this.normalizeText(labelText);
    if (!norm) return null;

    // Direct mapping checks
    for (const [fieldName, definition] of Object.entries(this.fieldDefinitions)) {
      for (const keyword of definition.keywords) {
        // Strict match or partial word boundary match
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(norm)) {
          return fieldName;
        }
      }
    }
    
    // Fallback checks for common URL labels containing specific words
    if (norm.includes('linkedin')) return 'linkedin';
    if (norm.includes('github') || norm.includes('portfolio') || norm.includes('website')) return 'portfolio';

    return null;
  },

  /**
   * Scan page and detect all inputs and match them to profile keys.
   * @returns {Array<{element: HTMLElement, fieldName: string}>} Array of detected fields
   */
  detectFormFields() {
    const inputs = document.querySelectorAll('input, textarea, select');
    const detected = [];

    inputs.forEach(input => {
      // Skip hidden, submit, button inputs, or fields that are not visible
      if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button' || input.type === 'checkbox' || input.type === 'radio') {
        return;
      }
      
      const rect = input.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return; // Skip hidden elements
      }

      const labelText = this.getLabelForInput(input);
      const fieldName = this.matchFieldType(labelText);

      if (fieldName) {
        detected.push({
          element: input,
          fieldName,
          labelText: labelText.trim()
        });
      }
    });

    return detected;
  },

  /**
   * Fill a single input element and dispatch events for modern frameworks (React, Angular).
   */
  fillValue(element, value) {
    if (!element || value === undefined || value === null) return;
    
    // Keep track of original value for verification
    const oldValue = element.value;
    
    // Use native setter for input elements to bypass React custom value setters
    const nativeValueSetter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(element),
      'value'
    )?.set;

    if (nativeValueSetter) {
      nativeValueSetter.call(element, value);
    } else {
      element.value = value;
    }

    // Fire events to notify listeners (essential for React, Vue, Angular)
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  },

  /**
   * Auto-fill detected fields using user profile data.
   * @param {object} profile User profile details from storage
   * @returns {number} Count of filled fields
   */
  autofill(profile) {
    if (!profile) return 0;

    const detected = this.detectFormFields();
    let fillCount = 0;

    detected.forEach(({ element, fieldName }) => {
      let value = '';

      switch (fieldName) {
        case 'firstName':
          value = profile.firstName;
          break;
        case 'lastName':
          value = profile.lastName;
          break;
        case 'fullName':
          value = profile.fullName || `${profile.firstName} ${profile.lastName}`.trim();
          break;
        case 'email':
          value = profile.email;
          break;
        case 'phone':
          value = profile.phone;
          break;
        case 'linkedin':
          value = profile.linkedin;
          break;
        case 'portfolio':
          value = profile.portfolio;
          break;
        case 'summary':
          value = profile.summary;
          break;
        case 'skills':
          value = profile.skills;
          break;
      }

      if (value) {
        this.fillValue(element, value);
        
        // Highlight field briefly to show it was autofilled
        const originalBg = element.style.backgroundColor;
        const originalTransition = element.style.transition;
        
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = 'rgba(76, 201, 240, 0.2)'; // Sleek light blue
        
        setTimeout(() => {
          element.style.backgroundColor = originalBg;
          setTimeout(() => {
            element.style.transition = originalTransition;
          }, 300);
        }, 1500);

        fillCount++;
      }
    });

    return fillCount;
  },

  /**
   * Extract job title, company, and full text description from current page.
   */
  extractJobDetails() {
    let company = 'Unknown Company';
    let title = 'Unknown Role';
    let description = '';

    const url = window.location.href;

    if (url.includes('greenhouse.io')) {
      const header = document.querySelector('.app-title');
      if (header) title = header.innerText.trim();

      const companyEl = document.querySelector('.company-name');
      if (companyEl) {
        company = companyEl.innerText.trim().replace(/^at\s+/i, '');
      } else {
        // Fallback parse Greenhouse title "Company Name - Job Title"
        const pageTitle = document.title;
        const parts = pageTitle.split('-');
        if (parts.length > 1) {
          company = parts[0].trim();
          title = parts[1].trim();
        }
      }

      // Greenhouse job description
      const descEl = document.getElementById('content');
      if (descEl) description = descEl.innerText;

    } else if (url.includes('lever.co')) {
      const header = document.querySelector('.posting-header h2');
      if (header) title = header.innerText.trim();

      // Lever page title is usually "Company Name - Role - Location"
      const pageTitle = document.title;
      const parts = pageTitle.split('-');
      if (parts.length > 0) {
        company = parts[0].trim();
      }

      const descEl = document.querySelector('.section.page-centered');
      if (descEl) description = descEl.innerText;

    } else if (url.includes('myworkdayjobs.com') || document.querySelector('[data-automation-id="jobPostingHeader"]')) {
      const header = document.querySelector('[data-automation-id="jobPostingHeader"] h2') || 
                     document.querySelector('h1, h2');
      if (header) title = header.innerText.trim();

      // Parse company name from logo or URL
      const host = window.location.hostname;
      // workday subdomains are often companyName.myworkdayjobs.com
      const sub = host.split('.')[0];
      company = sub.charAt(0).toUpperCase() + sub.slice(1);

      const descEl = document.querySelector('[data-automation-id="jobDescription"]') || 
                     document.querySelector('.job-description');
      if (descEl) description = descEl.innerText;

    } else {
      // Generic parser
      // Try to find the title from H1 tags
      const h1s = Array.from(document.querySelectorAll('h1'));
      const visibleH1 = h1s.find(h => {
        const rect = h.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && h.innerText.trim().length > 3;
      });
      
      if (visibleH1) {
        title = visibleH1.innerText.trim();
      } else {
        title = document.title.split('|')[0].split('-')[0].trim();
      }

      // Parse company from title tags (often "Role | Company" or "Role at Company" or "Company - Role")
      const pageTitle = document.title;
      if (pageTitle.includes(' at ')) {
        const parts = pageTitle.split(' at ');
        company = parts[1].split('|')[0].split('-')[0].trim();
      } else if (pageTitle.includes(' | ')) {
        const parts = pageTitle.split(' | ');
        company = parts[1].trim();
      } else if (pageTitle.includes(' - ')) {
        const parts = pageTitle.split(' - ');
        company = parts[0].trim();
      }

      // Generic job description text extraction
      // Get readable content, ignore nav, footer, script, styles
      const bodyClone = document.body.cloneNode(true);
      bodyClone.querySelectorAll('script, style, nav, footer, header, svg, noscript, iframe, .nav, .footer, .menu').forEach(el => el.remove());
      
      // Look for elements with class/id containing job, description, details, about
      const contentSelectors = [
        '.job-description', '.description', '#job-desc', '#description', 
        '.job-details', '[itemprop="description"]', 'main'
      ];
      
      let foundDesc = false;
      for (const selector of contentSelectors) {
        const el = bodyClone.querySelector(selector);
        if (el && el.innerText.trim().length > 100) {
          description = el.innerText;
          foundDesc = true;
          break;
        }
      }

      if (!foundDesc) {
        // Fallback to text inside main containers or body text
        description = bodyClone.innerText.substring(0, 5000);
      }
    }

    // Clean up title and company
    company = company.replace(/careers/gi, '').replace(/jobs/gi, '').replace(/-/, '').trim();
    
    // Limit description size
    if (description.length > 8000) {
      description = description.substring(0, 8000) + "...";
    }

    return {
      company,
      title,
      description: description.trim(),
      url
    };
  }
};

// Expose on window object for widget to interact with
window.ContentScript = ContentScript;

// Listen for messages from the background service worker or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'AUTOFILL_FORM') {
    chrome.storage.local.get('profile', (res) => {
      if (res.profile) {
        const count = ContentScript.autofill(res.profile);
        sendResponse({ success: true, count });
      } else {
        sendResponse({ success: false, error: 'No profile configured.' });
      }
    });
    return true; // Keep channel open
  }

  if (message.action === 'EXTRACT_JOB_DETAILS') {
    try {
      const details = ContentScript.extractJobDetails();
      sendResponse({ success: true, details });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true; // Keep channel open
  }

  if (message.action === 'FILL_TAILORED_DATA') {
    const { summary, skills } = message.payload;
    let count = 0;
    
    const fields = ContentScript.detectFormFields();
    fields.forEach(({ element, fieldName }) => {
      if (fieldName === 'summary' && summary) {
        ContentScript.fillValue(element, summary);
        count++;
      } else if (fieldName === 'skills' && skills) {
        ContentScript.fillValue(element, Array.isArray(skills) ? skills.join(', ') : skills);
        count++;
      }
    });
    
    sendResponse({ success: true, count });
    return true; // Keep channel open
  }
});
