// Initialize Supabase
const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

// Handle CV Upload and Extract with Claude
let cvData = null;

async function handleCVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('uploadText').textContent = '⏳ Processing CV with AI...';

  try {
    const text = await extractTextFromFile(file);
    
    // Call Claude to extract structured data from CV
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.claude.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CONFIG.claude.model,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Extract structured information from this CV/Resume. Return ONLY valid JSON with this exact structure:
{
  "name": "full name",
  "skills": ["skill1", "skill2"],
  "experience": "brief summary",
  "education": "education background",
  "interests": "professional interests",
  "location": "city or region if mentioned"
}

CV Content:
${text}`
        }]
      })
    });

    const data = await response.json();
    const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      cvData = JSON.parse(jsonMatch[0]);
      
      // Auto-fill fields from CV
      if (cvData.skills && cvData.skills.length > 0) {
        document.getElementById('skills').value = cvData.skills.join(', ');
      }
      if (cvData.location) {
        document.getElementById('location').value = cvData.location;
      }
      
      document.getElementById('uploadText').textContent = '✅ CV processed! Information extracted.';
    }
  } catch (error) {
    console.error('CV processing error:', error);
    document.getElementById('uploadText').textContent = '❌ Error processing CV. You can still continue manually.';
  }
}

// Extract text from file
async function extractTextFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Save Profile
async function saveProfile() {
  const errorEl = document.getElementById('errorMsg');
  const successEl = document.getElementById('successMsg');
  errorEl.textContent = '';
  successEl.textContent = '';

  // Get Ikigai values
  const ikigai = {
    love: document.getElementById('ikigaiLove').value,
    good_at: document.getElementById('ikigaiGoodAt').value,
    world_needs: document.getElementById('ikigaiWorldNeeds').value,
    paid_for: document.getElementById('ikigaiPaidFor').value
  };

  // Validate
  if (!ikigai.love || !ikigai.good_at || !ikigai.world_needs || !ikigai.paid_for) {
    errorEl.textContent = 'Please complete all Ikigai fields';
    return;
  }

  const intent = document.getElementById('intent').value;
  if (!intent) {
    errorEl.textContent = 'Please select your primary intent';
    return;
  }

  // Get other values
  const skillsInput = document.getElementById('skills').value;
  const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()) : [];
  const location = document.getElementById('location').value;
  const availability = document.getElementById('availability').value;
  const workingStyle = document.getElementById('workingStyle').value;

  const socialProfiles = {
    linkedin: document.getElementById('linkedin').value,
    twitter: document.getElementById('twitter').value,
    github: document.getElementById('github').value
  };

  successEl.textContent = '⏳ Saving profile and generating AI matching criteria...';

  try {
    // Get current user
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return;
    }

    // Call Claude to generate matching criteria
    const criteriaResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.claude.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CONFIG.claude.model,
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Based on this person's profile, suggest ideal matching criteria for finding cofounders, teammates, or clients. Return ONLY valid JSON:
{
  "ideal_skills": ["skill1", "skill2"],
  "ideal_traits": ["trait1", "trait2"],
  "complementary_strengths": ["strength1", "strength2"],
  "matching_preferences": "brief description"
}

Profile:
Ikigai: ${JSON.stringify(ikigai)}
Skills: ${skills.join(', ')}
Intent: ${intent}
Working Style: ${workingStyle}
${cvData ? `CV Data: ${JSON.stringify(cvData)}` : ''}`
        }]
      })
    });

    const criteriaData = await criteriaResponse.json();
    const criteriaMatch = criteriaData.content[0].text.match(/\{[\s\S]*\}/);
    const matchingCriteria = criteriaMatch ? JSON.parse(criteriaMatch[0]) : {};

    // Update profile in Supabase
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        ikigai: ikigai,
        skills: skills,
        intent: intent,
        location: location,
        availability: availability,
        working_style: workingStyle,
        portfolio_url: document.getElementById('portfolioUrl').value,
        social_profiles: socialProfiles,
        cv_data: cvData,
        matching_criteria: matchingCriteria,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id);

    if (updateError) {
      errorEl.textContent = 'Error saving profile: ' + updateError.message;
    } else {
      successEl.textContent = '✅ Profile saved! Redirecting to search...';
      setTimeout(() => {
        window.location.href = 'search.html';
      }, 1500);
    }
  } catch (error) {
    console.error('Save error:', error);
    errorEl.textContent = 'Error: ' + error.message;
  }
}
