/**
 * floating action widget injected into job pages.
 * Fully styled inside Shadow DOM to avoid leakage.
 */

(function () {
  // Guard against double injection
  if (document.getElementById('autojobfill-widget-root')) return;

  // Wait for document to load before scanning
  function initWidget() {
    // Only inject if job-related form fields are detected
    const fields = window.ContentScript ? window.ContentScript.detectFormFields() : [];
    if (fields.length === 0) {
      // Re-run checking in a few seconds in case fields are rendered dynamically (SPAs)
      setTimeout(checkAndInject, 2000);
      return;
    }
    injectWidget();
  }

  function checkAndInject() {
    if (document.getElementById('autojobfill-widget-root')) return;
    const fields = window.ContentScript ? window.ContentScript.detectFormFields() : [];
    if (fields.length > 0) {
      injectWidget();
    }
  }

  function injectWidget() {
    const root = document.createElement('div');
    root.id = 'autojobfill-widget-root';
    document.body.appendChild(root);

    const shadow = root.attachShadow({ mode: 'open' });

    // CSS Styling for the Widget (Isolated in Shadow DOM)
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647; /* Maximum possible z-index */
        pointer-events: none;
      }

      * {
        box-sizing: border-box;
      }

      .widget-container {
        pointer-events: auto;
        width: 320px;
        background: rgba(15, 15, 22, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 
                    0 0 20px rgba(76, 201, 240, 0.15);
        padding: 16px;
        color: #f8f9fa;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transform: translateY(100px);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), 
                    opacity 0.4s ease;
      }

      .widget-container.show {
        transform: translateY(0);
        opacity: 1;
      }

      .widget-container.collapsed {
        width: 60px;
        height: 60px;
        border-radius: 30px;
        padding: 0;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        cursor: pointer;
        background: linear-gradient(135deg, rgba(76, 201, 240, 0.9), rgba(114, 9, 183, 0.9));
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 
                    0 0 15px rgba(76, 201, 240, 0.3);
      }

      .widget-container.collapsed .expanded-content {
        display: none;
      }

      .widget-container.collapsed .collapsed-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        color: #fff;
        font-weight: bold;
        font-size: 24px;
        animation: pulse 2s infinite;
      }

      .collapsed-icon {
        display: none;
      }

      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(76, 201, 240, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(76, 201, 240, 0); }
        100% { box-shadow: 0 0 0 0 rgba(76, 201, 240, 0); }
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 8px;
      }

      .title-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .logo-icon {
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #4cc9f0, #7209b7);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 14px;
        color: #fff;
      }

      .title {
        font-weight: 700;
        font-size: 15px;
        letter-spacing: 0.5px;
        background: linear-gradient(to right, #4cc9f0, #b5179e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .close-btn {
        background: none;
        border: none;
        color: #a0a0b0;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s, color 0.2s;
      }

      .close-btn:hover {
        background-color: rgba(255, 255, 255, 0.08);
        color: #fff;
      }

      .body {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .btn {
        width: 100%;
        padding: 11px 16px;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }

      .btn-primary {
        background: linear-gradient(135deg, #4cc9f0, #4895ef);
        color: #0b0f19;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(76, 201, 240, 0.4);
      }

      .btn-secondary {
        background: linear-gradient(135deg, #7209b7, #b5179e);
        color: #fff;
      }

      .btn-secondary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(181, 23, 158, 0.4);
      }

      .btn-outline {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
      }

      .btn-outline:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }

      .status-text {
        font-size: 11px;
        color: #a0a0b0;
        text-align: center;
        margin-top: 4px;
        min-height: 14px;
        transition: color 0.2s;
      }

      .status-text.success {
        color: #4caf50;
      }

      .status-text.error {
        color: #f44336;
      }

      /* Spinner animation */
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 0.8s linear infinite;
        display: none;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .btn.loading .spinner {
        display: block;
      }
      .btn.loading .btn-text {
        display: none;
      }
    `;

    shadow.appendChild(style);

    // Widget HTML Structure
    const container = document.createElement('div');
    container.className = 'widget-container';

    // Collapsed Icon
    const collapsedIcon = document.createElement('div');
    collapsedIcon.className = 'collapsed-icon';
    collapsedIcon.textContent = '⚡';
    collapsedIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.remove('collapsed');
    });
    container.appendChild(collapsedIcon);

    // Expanded Content Wrapper
    const expandedContent = document.createElement('div');
    expandedContent.className = 'expanded-content';
    expandedContent.style.display = 'flex';
    expandedContent.style.flexDirection = 'column';
    expandedContent.style.gap = '12px';

    // Header
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
      <div class="title-group">
        <div class="logo-icon">⚡</div>
        <div class="title">AutoJobFill AI</div>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.add('collapsed');
    });
    header.appendChild(closeBtn);
    expandedContent.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'body';

    // Button 1: Autofill
    const fillBtn = document.createElement('button');
    fillBtn.className = 'btn btn-primary';
    fillBtn.innerHTML = '<span class="btn-text">⚡ Auto-fill Form</span>';
    fillBtn.addEventListener('click', async () => {
      setStatus('Fetching profile data...');
      chrome.runtime.sendMessage({ action: 'GET_DATA' }, (response) => {
        if (response && response.success && response.data.profile) {
          const profile = response.data.profile;
          if (!profile.firstName && !profile.lastName && !profile.email) {
            setStatus('Please set up your profile in the extension popup!', 'error');
            return;
          }
          const filled = window.ContentScript.autofill(profile);
          if (filled > 0) {
            setStatus(`Successfully autofilled ${filled} fields!`, 'success');
          } else {
            setStatus('No matching form fields found.', 'error');
          }
        } else {
          setStatus('Failed to read profile details.', 'error');
        }
      });
    });
    body.appendChild(fillBtn);

    // Button 2: Tailor with AI
    const tailorBtn = document.createElement('button');
    tailorBtn.className = 'btn btn-secondary';
    tailorBtn.innerHTML = `
      <div class="spinner"></div>
      <span class="btn-text">✨ Customize for This Job</span>
    `;
    tailorBtn.addEventListener('click', async () => {
      if (tailorBtn.classList.contains('loading')) return;

      tailorBtn.classList.add('loading');
      tailorBtn.disabled = true;
      setStatus('Parsing job description...');

      try {
        const details = window.ContentScript.extractJobDetails();
        if (!details.description) {
          throw new Error("Could not extract job description from the page.");
        }

        setStatus('Retrieving profile...');
        chrome.runtime.sendMessage({ action: 'GET_DATA' }, async (response) => {
          if (!response || !response.success) {
            finishTailor('Failed to load settings.', 'error');
            return;
          }

          const { profile, aiConfig } = response.data;
          if (!profile.summary) {
            finishTailor('Please add a profile summary first.', 'error');
            return;
          }

          if (aiConfig.apiMode === 'cloud' && !aiConfig.apiKey) {
            finishTailor('Add a Gemini API key in settings.', 'error');
            return;
          }

          setStatus('Generating tailored profile (AI)...');
          
          chrome.runtime.sendMessage({
            action: 'TAILOR_PROFILE',
            payload: {
              jobDescription: details.description,
              profileSummary: profile.summary,
              profileSkills: profile.skills,
              config: aiConfig
            }
          }, (aiResponse) => {
            if (aiResponse && aiResponse.success && aiResponse.data) {
              const { tailoredSummary, tailoredSkills } = aiResponse.data;
              

              
              // Let's call the script directly since we are on the page!
              const filled = window.ContentScript.autofill(profile); // Refills normal profile first
              
              // Now fill specifically tailored summary & skills
              let tailoredFilled = 0;
              const fields = window.ContentScript.detectFormFields();
              fields.forEach(({ element, fieldName }) => {
                if (fieldName === 'summary' && tailoredSummary) {
                  window.ContentScript.fillValue(element, tailoredSummary);
                  element.style.outline = '2px dashed #b5179e';
                  tailoredFilled++;
                } else if (fieldName === 'skills' && tailoredSkills) {
                  window.ContentScript.fillValue(element, tailoredSkills.join(', '));
                  element.style.outline = '2px dashed #b5179e';
                  tailoredFilled++;
                }
              });

              finishTailor(`AI customized summary & skills successfully!`, 'success');
            } else {
              finishTailor(aiResponse?.error || 'AI tailoring failed.', 'error');
            }
          });
        });
      } catch (err) {
        finishTailor(err.message, 'error');
      }

      function finishTailor(msg, type) {
        tailorBtn.classList.remove('loading');
        tailorBtn.disabled = false;
        setStatus(msg, type);
      }
    });
    body.appendChild(tailorBtn);

    // Button 3: Track Application
    const trackBtn = document.createElement('button');
    trackBtn.className = 'btn btn-outline';
    trackBtn.innerHTML = '📂 Track Application';
    trackBtn.addEventListener('click', () => {
      try {
        const details = window.ContentScript.extractJobDetails();
        
        setStatus('Tracking application...');
        
        chrome.runtime.sendMessage({
          action: 'TRACK_APPLICATION',
          payload: {
            job: {
              company: details.company,
              title: details.title,
              url: details.url,
              status: 'applied'
            }
          }
        }, (response) => {
          if (response && response.success) {
            setStatus(`Tracked at ${response.data.company}!`, 'success');
            trackBtn.disabled = true;
            trackBtn.innerHTML = '✓ Tracked';
            trackBtn.style.borderColor = '#4caf50';
            trackBtn.style.color = '#4caf50';
          } else {
            setStatus('Failed to track application.', 'error');
          }
        });
      } catch (err) {
        setStatus(err.message, 'error');
      }
    });
    body.appendChild(trackBtn);

    // Status Label
    const statusText = document.createElement('div');
    statusText.className = 'status-text';
    body.appendChild(statusText);

    expandedContent.appendChild(body);
    container.appendChild(expandedContent);
    shadow.appendChild(container);

    function setStatus(text, type = '') {
      statusText.textContent = text;
      statusText.className = 'status-text';
      if (type) {
        statusText.classList.add(type);
      }
    }

    // Slide-in effect
    setTimeout(() => {
      container.classList.add('show');
    }, 200);
  }

  // Run on start
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initWidget();
  } else {
    window.addEventListener('DOMContentLoaded', initWidget);
  }
})();
