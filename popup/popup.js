/**
 * Popup logic for AutoJobFill AI dashboard.
 * Manages tab switching, profile details rendering/saving, application tracker UI, and settings.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Global State (cached data)
  let appData = {
    profile: {},
    applications: [],
    aiConfig: {}
  };

  // Toast helper
  function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    if (isError) {
      toast.style.background = 'linear-gradient(135deg, #ff4757, #ff6b81)';
      toast.style.color = '#fff';
    } else {
      toast.style.background = 'var(--grad-primary)';
      toast.style.color = '#0b0f19';
    }
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // --- TAB SWAP NAVIGATION ---
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update Nav Buttons
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update Content Panels
      tabPanels.forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-content-${targetTab}`).classList.add('active');

      // Refresh specific tab state if needed
      if (targetTab === 'tracker') {
        renderTrackerList();
      } else if (targetTab === 'dashboard') {
        updateDashboardStats();
        detectActiveSite();
      }
    });
  });

  // --- PROFILE SUB-TAB SWAP ---
  const profileSubTabs = document.querySelectorAll('.profile-sub-tab');
  const subtabContents = document.querySelectorAll('.subtab-content');

  profileSubTabs.forEach(subtab => {
    subtab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSubtab = subtab.getAttribute('data-subtab');

      profileSubTabs.forEach(s => s.classList.remove('active'));
      subtab.classList.add('active');

      subtabContents.forEach(c => c.classList.remove('active'));
      document.getElementById(`subtab-${targetSubtab}`).classList.add('active');
    });
  });

  // --- DATA LOADING & STATE INITS ---
  async function loadData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['profile', 'applications', 'aiConfig'], (result) => {
        appData.profile = result.profile || {};
        appData.applications = result.applications || [];
        appData.aiConfig = result.aiConfig || { apiMode: 'cloud', apiKey: '' };
        resolve();
      });
    });
  }

  // Initial Load trigger is placed at the bottom of the script to prevent TDZ errors

  // --- SITE DETECTION (DASHBOARD) ---
  async function detectActiveSite() {
    const statusBadge = document.getElementById('current-site-status');
    const detailsText = document.getElementById('current-site-details');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        statusBadge.textContent = 'Inactive';
        statusBadge.className = 'status-badge error';
        detailsText.textContent = 'No active webpage detected.';
        return;
      }

      const url = tab.url;
      
      if (url.includes('greenhouse.io')) {
        statusBadge.textContent = 'Greenhouse Detected';
        statusBadge.className = 'status-badge active';
        detailsText.textContent = 'Greenhouse Application Form is active. Click Fill below or on the page widget!';
      } else if (url.includes('lever.co')) {
        statusBadge.textContent = 'Lever Detected';
        statusBadge.className = 'status-badge active';
        detailsText.textContent = 'Lever Job Application is active. Autofill ready!';
      } else if (url.includes('myworkdayjobs.com')) {
        statusBadge.textContent = 'Workday Detected';
        statusBadge.className = 'status-badge active';
        detailsText.textContent = 'Workday Career Portal is active. Auto-fill supported page-by-page!';
      } else if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
        statusBadge.textContent = 'Generic Webpage';
        statusBadge.className = 'status-badge active';
        detailsText.textContent = 'Extension is active. We will attempt generic form autofill.';
      } else {
        statusBadge.textContent = 'Unsupported';
        statusBadge.className = 'status-badge error';
        detailsText.textContent = 'Autofill is disabled on system pages or empty tabs.';
      }
    } catch (err) {
      statusBadge.textContent = 'Error';
      statusBadge.className = 'status-badge error';
      detailsText.textContent = 'Could not detect active browser tab.';
    }
  }

  // --- STATS UPDATE (DASHBOARD) ---
  function updateDashboardStats() {
    const apps = appData.applications || [];
    document.getElementById('stat-total').textContent = apps.length;

    const interviews = apps.filter(a => a.status === 'interviewing').length;
    document.getElementById('stat-interviews').textContent = interviews;

    const offers = apps.filter(a => a.status === 'offer').length;
    document.getElementById('stat-offers').textContent = offers;
  }

  // --- DASHBOARD AUTOFILL TRIGGER ---
  document.getElementById('quick-fill-btn').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://') && !tab.url.startsWith('file://'))) {
        showToast('Please navigate to a job application page first.', true);
        return;
      }

      showToast('Autofilling...');
      chrome.tabs.sendMessage(tab.id, { action: 'AUTOFILL_FORM' }, (response) => {
        if (chrome.runtime.lastError) {
          showToast('Could not reach page content script. Reload the page and try again.', true);
          return;
        }

        if (response && response.success) {
          showToast(`Successfully filled ${response.count} fields!`);
        } else {
          showToast(response?.error || 'No matching input fields found on this page.', true);
        }
      });
    } catch (e) {
      showToast('Autofill request failed.', true);
    }
  });

  // --- PROFILE TAB BUILDER ---
  const experienceList = document.getElementById('experience-list');
  const educationList = document.getElementById('education-list');

  // Populate form with stored data
  function populateProfileForm() {
    const prof = appData.profile;
    
    // Personal Details
    document.getElementById('firstName').value = prof.firstName || '';
    document.getElementById('lastName').value = prof.lastName || '';
    document.getElementById('email').value = prof.email || '';
    document.getElementById('phone').value = prof.phone || '';
    document.getElementById('linkedin').value = prof.linkedin || '';
    document.getElementById('portfolio').value = prof.portfolio || '';

    // Summary & Skills
    document.getElementById('summary').value = prof.summary || '';
    document.getElementById('skills').value = prof.skills || '';

    // Dynamic Lists
    experienceList.innerHTML = '';
    const workHistory = prof.workHistory || [];
    workHistory.forEach(item => addExperienceRow(item));

    educationList.innerHTML = '';
    const education = prof.education || [];
    education.forEach(item => addEducationRow(item));
  }

  // Add Dynamic Experience Row
  function addExperienceRow(item = {}) {
    const row = document.createElement('div');
    row.className = 'dynamic-item';
    row.innerHTML = `
      <button type="button" class="item-delete-btn" title="Delete Experience">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
      <div class="form-grid">
        <div class="form-group">
          <label>Company</label>
          <input type="text" class="exp-company" value="${item.company || ''}" placeholder="Acme Inc." required>
        </div>
        <div class="form-group">
          <label>Role</label>
          <input type="text" class="exp-role" value="${item.role || ''}" placeholder="Software Engineer" required>
        </div>
      </div>
      <div class="form-group">
        <label>Dates (e.g. June 2022 - Present)</label>
        <input type="text" class="exp-dates" value="${item.dates || ''}" placeholder="2022 - 2025">
      </div>
      <div class="form-group">
        <label>Job Description</label>
        <textarea class="exp-desc" rows="2" placeholder="Responsibilities, Achievements, stack details...">${item.description || ''}</textarea>
      </div>
    `;

    // Hook delete button
    row.querySelector('.item-delete-btn').addEventListener('click', () => {
      row.remove();
    });

    experienceList.appendChild(row);
    experienceList.scrollTop = experienceList.scrollHeight;
  }

  // Add Dynamic Education Row
  function addEducationRow(item = {}) {
    const row = document.createElement('div');
    row.className = 'dynamic-item';
    row.innerHTML = `
      <button type="button" class="item-delete-btn" title="Delete Education">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
      <div class="form-grid">
        <div class="form-group" style="flex: 2;">
          <label>School/University</label>
          <input type="text" class="edu-school" value="${item.school || ''}" placeholder="Stanford University" required>
        </div>
        <div class="form-group" style="flex: 1;">
          <label>Grad Year</label>
          <input type="text" class="edu-year" value="${item.year || ''}" placeholder="2024" required>
        </div>
      </div>
      <div class="form-group">
        <label>Degree & Major</label>
        <input type="text" class="edu-degree" value="${item.degree || ''}" placeholder="B.S. in Computer Science" required>
      </div>
    `;

    // Hook delete button
    row.querySelector('.item-delete-btn').addEventListener('click', () => {
      row.remove();
    });

    educationList.appendChild(row);
    educationList.scrollTop = educationList.scrollHeight;
  }

  // Button Listeners for Dynamic Rows
  document.getElementById('add-experience-btn').addEventListener('click', () => addExperienceRow());
  document.getElementById('add-education-btn').addEventListener('click', () => addEducationRow());

  // Save Profile Form Submit
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Construct Profile Object
    const profile = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      fullName: `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      linkedin: document.getElementById('linkedin').value.trim(),
      portfolio: document.getElementById('portfolio').value.trim(),
      summary: document.getElementById('summary').value.trim(),
      skills: document.getElementById('skills').value.trim(),
      workHistory: [],
      education: []
    };

    // Collect experience
    const expItems = experienceList.querySelectorAll('.dynamic-item');
    expItems.forEach(row => {
      profile.workHistory.push({
        company: row.querySelector('.exp-company').value.trim(),
        role: row.querySelector('.exp-role').value.trim(),
        dates: row.querySelector('.exp-dates').value.trim(),
        description: row.querySelector('.exp-desc').value.trim()
      });
    });

    // Collect education
    const eduItems = educationList.querySelectorAll('.dynamic-item');
    eduItems.forEach(row => {
      profile.education.push({
        school: row.querySelector('.edu-school').value.trim(),
        year: row.querySelector('.edu-year').value.trim(),
        degree: row.querySelector('.edu-degree').value.trim()
      });
    });

    // Save to storage
    await chrome.storage.local.set({ profile });
    appData.profile = profile;
    showToast('Profile Saved!');
  });

  // --- TAB: TRACKER DASHBOARD ---
  function renderTrackerList() {
    const listBody = document.getElementById('tracker-list');
    const emptyState = document.getElementById('tracker-empty');
    const apps = appData.applications || [];

    listBody.innerHTML = '';
    
    if (apps.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    apps.forEach(app => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="job-info">
            <span class="job-company" title="${app.company}">${app.company}</span>
            <span class="job-title" title="${app.title}">${app.title}</span>
            <span class="job-date">Added ${app.date}</span>
          </div>
        </td>
        <td>
          <select class="status-select" data-id="${app.id}">
            <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
            <option value="interviewing" ${app.status === 'interviewing' ? 'selected' : ''}>Interviewing</option>
            <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
            <option value="offer" ${app.status === 'offer' ? 'selected' : ''}>Offer</option>
          </select>
        </td>
        <td>
          <button class="tracker-delete-btn" data-id="${app.id}" title="Remove Application">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      `;

      // Status change handler
      row.querySelector('.status-select').addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const newStatus = e.target.value;

        const updated = appData.applications.map(item => {
          if (item.id === id) {
            return { ...item, status: newStatus };
          }
          return item;
        });

        await chrome.storage.local.set({ applications: updated });
        appData.applications = updated;
        updateDashboardStats();
        showToast('Status Updated!');
      });

      // Delete application handler
      row.querySelector('.tracker-delete-btn').addEventListener('click', async () => {
        const id = app.id;
        const filtered = appData.applications.filter(item => item.id !== id);

        await chrome.storage.local.set({ applications: filtered });
        appData.applications = filtered;
        row.remove();
        
        if (filtered.length === 0) {
          emptyState.style.display = 'flex';
        }
        updateDashboardStats();
        showToast('Application Removed!');
      });

      listBody.appendChild(row);
    });
  }

  // Export Tracker CSV
  document.getElementById('export-csv-btn').addEventListener('click', () => {
    const apps = appData.applications || [];
    if (apps.length === 0) {
      showToast('No applications to export.', true);
      return;
    }

    // Generate CSV contents
    const headers = ['Company', 'Job Title', 'Date Added', 'Status', 'URL'];
    const rows = apps.map(app => [
      `"${app.company.replace(/"/g, '""')}"`,
      `"${app.title.replace(/"/g, '""')}"`,
      `"${app.date}"`,
      `"${app.status}"`,
      `"${app.url || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Download triggers
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `autojobfill_tracker_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV Exported!');
  });

  // --- TAB: SETTINGS PANEL ---
  const aiModeSelect = document.getElementById('ai-mode');
  const apiKeyGroup = document.getElementById('api-key-group');
  const localAISatusGroup = document.getElementById('local-ai-status-group');
  const localAIStatusBadge = document.getElementById('local-ai-status');

  function populateSettingsForm() {
    const config = appData.aiConfig;
    aiModeSelect.value = config.apiMode || 'cloud';
    document.getElementById('api-key').value = config.apiKey || '';
    
    handleAIModeUI();
  }

  // Adjust input elements based on Selected AI mode
  function handleAIModeUI() {
    const mode = aiModeSelect.value;
    if (mode === 'local') {
      apiKeyGroup.style.display = 'none';
      localAISatusGroup.style.display = 'block';
      checkLocalAIDiagnostics();
    } else {
      apiKeyGroup.style.display = 'block';
      localAISatusGroup.style.display = 'none';
    }
  }

  aiModeSelect.addEventListener('change', handleAIModeUI);

  // Check availability status of local Gemini Nano
  async function checkLocalAIDiagnostics() {
    localAIStatusBadge.textContent = 'Diagnosing...';
    localAIStatusBadge.className = 'status-badge';
    
    try {
      const status = await GeminiAPI.checkLocalAvailability();
      if (status === 'readily') {
        localAIStatusBadge.textContent = 'Available';
        localAIStatusBadge.className = 'status-badge active';
      } else if (status === 'after-download') {
        localAIStatusBadge.textContent = 'Downloading Model...';
        localAIStatusBadge.className = 'status-badge';
        localAIStatusBadge.style.color = '#ffb300';
        localAIStatusBadge.style.borderColor = '#ffb300';
      } else {
        localAIStatusBadge.textContent = 'Not Supported';
        localAIStatusBadge.className = 'status-badge error';
      }
    } catch (e) {
      localAIStatusBadge.textContent = 'Check Failed';
      localAIStatusBadge.className = 'status-badge error';
    }
  }

  // Save Settings Click
  document.getElementById('save-settings-btn').addEventListener('click', async () => {
    const apiMode = aiModeSelect.value;
    const apiKey = document.getElementById('api-key').value.trim();

    if (apiMode === 'cloud' && !apiKey) {
      showToast('API Key is required for cloud mode.', true);
      return;
    }

    const aiConfig = { apiMode, apiKey };
    await chrome.storage.local.set({ aiConfig });
    appData.aiConfig = aiConfig;
    showToast('Settings Saved!');
  });

  // Reset Extension Data Click
  document.getElementById('reset-data-btn').addEventListener('click', async () => {
    if (confirm('Are you absolutely sure you want to clear all profile information and application history? This action is irreversible.')) {
      await chrome.storage.local.clear();
      showToast('All data cleared!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });

  // --- INITIAL LOAD EXECUTION ---
  // Triggered at the bottom of DOMContentLoaded to ensure all UI elements and variables are initialized.
  await loadData();
  populateProfileForm();
  updateDashboardStats();
  detectActiveSite();
  populateSettingsForm();

});
