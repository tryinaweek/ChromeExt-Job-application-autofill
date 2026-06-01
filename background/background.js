/**
 * Service worker for the AutoJobFill AI extension.
 * Handles storage operations and background AI processing.
 */

// Import Gemini API helpers
importScripts('/lib/gemini-api.js');

chrome.runtime.onInstalled.addListener(async () => {
  console.log("AutoJobFill AI Extension installed!");
  
  // Set default configurations if not set
  const defaults = {
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      linkedin: '',
      portfolio: '',
      summary: '',
      skills: '',
      workHistory: [],
      education: []
    },
    applications: [],
    aiConfig: {
      apiMode: 'cloud', // 'local' or 'cloud'
      apiKey: ''
    }
  };

  const current = await chrome.storage.local.get(['profile', 'applications', 'aiConfig']);
  
  const toSet = {};
  if (!current.profile) toSet.profile = defaults.profile;
  if (!current.applications) toSet.applications = defaults.applications;
  if (!current.aiConfig) toSet.aiConfig = defaults.aiConfig;
  
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }
});

// Listener for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Wrap async operations in an IIFE to keep the message channel open
  (async () => {
    try {
      switch (message.action) {
        case 'CHECK_LOCAL_AI': {
          const status = await GeminiAPI.checkLocalAvailability();
          sendResponse({ success: true, status });
          break;
        }

        case 'TAILOR_PROFILE': {
          const { jobDescription, profileSummary, profileSkills, config } = message.payload;
          const result = await GeminiAPI.tailorProfile(
            jobDescription, 
            profileSummary, 
            profileSkills, 
            config
          );
          sendResponse({ success: true, data: result });
          break;
        }

        case 'TRACK_APPLICATION': {
          const { job } = message.payload; // { company, title, url, status }
          const { applications = [] } = await chrome.storage.local.get('applications');
          
          const newApp = {
            id: crypto.randomUUID(),
            company: job.company || 'Unknown Company',
            title: job.title || 'Unknown Role',
            url: job.url || '',
            status: job.status || 'applied', // 'applied', 'interviewing', 'rejected', 'offer'
            date: new Date().toISOString().split('T')[0]
          };
          
          applications.unshift(newApp); // Add to the top
          await chrome.storage.local.set({ applications });
          
          sendResponse({ success: true, data: newApp });
          break;
        }

        case 'GET_DATA': {
          const data = await chrome.storage.local.get(['profile', 'applications', 'aiConfig']);
          sendResponse({ success: true, data });
          break;
        }

        case 'SAVE_PROFILE': {
          const { profile } = message.payload;
          await chrome.storage.local.set({ profile });
          sendResponse({ success: true });
          break;
        }

        case 'SAVE_AI_CONFIG': {
          const { aiConfig } = message.payload;
          await chrome.storage.local.set({ aiConfig });
          sendResponse({ success: true });
          break;
        }

        case 'UPDATE_APP_STATUS': {
          const { id, status } = message.payload;
          const { applications = [] } = await chrome.storage.local.get('applications');
          const updated = applications.map(app => {
            if (app.id === id) {
              return { ...app, status };
            }
            return app;
          });
          await chrome.storage.local.set({ applications: updated });
          sendResponse({ success: true, data: updated });
          break;
        }

        case 'DELETE_APPLICATION': {
          const { id } = message.payload;
          const { applications = [] } = await chrome.storage.local.get('applications');
          const filtered = applications.filter(app => app.id !== id);
          await chrome.storage.local.set({ applications: filtered });
          sendResponse({ success: true, data: filtered });
          break;
        }

        default:
          sendResponse({ success: false, error: `Unknown action: ${message.action}` });
      }
    } catch (error) {
      console.error(`Error handling action ${message.action}:`, error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep message channel open for asynchronous sendResponse
});
