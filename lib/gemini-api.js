/**
 * Gemini API and Chrome Prompt API integration library.
 */
const GeminiAPI = {
  /**
   * Check if local Prompt API (Gemini Nano) is available in the browser.
   * @returns {Promise<'readily'|'after-download'|'no'>} Availability status
   */
  async checkLocalAvailability() {
    try {
      if (typeof LanguageModel !== 'undefined' && LanguageModel.availability) {
        const availability = await LanguageModel.availability({
          expectedInputs: [{ type: "text", languages: ["en"] }],
          expectedOutputs: [{ type: "text", languages: ["en"] }]
        });
        return availability; // 'readily', 'after-download', or 'unavailable'
      }
      if (typeof ai !== 'undefined' && ai.languageModel && ai.languageModel.capabilities) {
        const caps = await ai.languageModel.capabilities();
        return caps.available; // 'readily', 'after-download', or 'no'
      }
    } catch (e) {
      console.warn("Error checking local Prompt API availability:", e);
    }
    return 'unavailable';
  },

  /**
   * Tailor profile summary and skills based on job description.
   * @param {string} jobDescription The job description text
   * @param {string} profileSummary User's current profile summary
   * @param {Array<string>} profileSkills User's current skills
   * @param {object} config Configuration options
   * @param {string} config.apiMode 'local' or 'cloud'
   * @param {string} [config.apiKey] Gemini Developer API Key (required for 'cloud')
   * @param {function} [onProgress] Optional callback for download progress (local AI)
   * @returns {Promise<{tailoredSummary: string, tailoredSkills: Array<string>}>} Tailored profile details
   */
  async tailorProfile(jobDescription, profileSummary, profileSkills, config, onProgress) {
    const skillsListStr = Array.isArray(profileSkills) ? profileSkills.join(', ') : String(profileSkills);
    
    const promptText = `You are a job application assistant. Your goal is to tailor the applicant's professional summary and select/highlight their most relevant skills to match the job description.

APPLICANT CURRENT SUMMARY:
${profileSummary}

APPLICANT CURRENT SKILLS:
${skillsListStr}

JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. Rewrite the professional summary to highlight the applicant's experience that directly aligns with the job description. Keep it matching the applicant's actual history (do not invent new roles, companies, or achievements). Keep it to 3-4 sentences.
2. Filter and adapt the skills list. Pick 5 to 8 skills that are both present in the applicant's profile and highly requested in the job description. You may rephrase them slightly to match the job keywords (e.g. 'JS' -> 'JavaScript' if the job description stresses 'JavaScript').
3. Respond ONLY with a valid JSON object. The JSON object MUST have the following keys:
   - "tailoredSummary": string (the tailored summary)
   - "tailoredSkills": array of strings (the tailored skills, max 8)

Do not include any extra text, introduction, or markdown formatting tags. Just the raw JSON object.
Example output format:
{
  "tailoredSummary": "Experienced software engineer with a strong background in frontend development...",
  "tailoredSkills": ["React", "JavaScript", "CSS", "HTML"]
}`;

    if (config.apiMode === 'local') {
      return await this._tailorWithLocalAI(promptText, onProgress);
    } else {
      if (!config.apiKey) {
        throw new Error("Gemini API key is required for cloud mode.");
      }
      return await this._tailorWithCloudAI(promptText, config.apiKey);
    }
  },

  /**
   * Internal method for cloud-based Gemini API call.
   */
  async _tailorWithCloudAI(promptText, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error("Empty response received from Gemini API.");
    }

    return this._parseJSONResponse(textResponse);
  },

  /**
   * Internal method for local Chrome Prompt API (Gemini Nano) call.
   */
  async _tailorWithLocalAI(promptText, onProgress) {
    let session = null;
    try {
      if (typeof LanguageModel !== 'undefined') {
        session = await LanguageModel.create({
          expectedInputs: [{ type: "text", languages: ["en"] }],
          expectedOutputs: [{ type: "text", languages: ["en"] }],
          initialPrompts: [{ role: 'system', content: 'You are a professional assistant that outputs strict JSON only.' }],
          monitor(m) {
            if (onProgress) {
              m.addEventListener('downloadprogress', (e) => {
                const pct = e.total ? Math.floor((e.loaded / e.total) * 100) : 0;
                onProgress(pct);
              });
            }
          }
        });
      } else if (typeof ai !== 'undefined' && ai.languageModel) {
        session = await ai.languageModel.create({
          systemPrompt: 'You are a professional assistant that outputs strict JSON only.'
        });
      } else {
        throw new Error("Prompt API is not supported in this browser environment.");
      }

      const responseText = await session.prompt(promptText);
      session.destroy();
      
      return this._parseJSONResponse(responseText);
    } catch (e) {
      if (session && typeof session.destroy === 'function') {
        try { session.destroy(); } catch (_) {}
      }
      throw e;
    }
  },

  /**
   * Helper to parse a JSON response, cleaning up markdown code blocks if necessary.
   */
  _parseJSONResponse(text) {
    let cleanText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanText.startsWith('```')) {
      // Find start of JSON (usually after ```json or ```)
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      } else {
        // Strip markdown lines
        cleanText = cleanText.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```$/, '');
      }
    }
    
    try {
      const parsed = JSON.parse(cleanText);
      if (!parsed.tailoredSummary || !Array.isArray(parsed.tailoredSkills)) {
        throw new Error("Invalid response format from AI.");
      }
      return parsed;
    } catch (e) {
      console.error("AI response failed to parse as JSON. Raw text:", text);
      // Fallback formatting if JSON parsing fails completely
      return {
        tailoredSummary: text.substring(0, 300) + "...",
        tailoredSkills: []
      };
    }
  }
};
