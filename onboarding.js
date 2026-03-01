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
    
    // Call our API endpoint instead of Claude directly
    const response = await fetch('/api/parse-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cvText: text
      })
    });

    const result = await response.json();
    
    if (result.success && result.data) {
      cvData = result.data;
      
      // Auto-fill fields from CV
      if (cvData.skills && cvData.skills.length > 0) {
        document.getElementById('skills').value = cvData.skills.join(', ');
      }
      if (cvData.location) {
        document.getElementById('location').value = cvData.location;
      }
      
      document.getElementById('uploadText').textContent = '✅ CV processed! Information extracted.';
    } else {
      document.getElementById('uploadText').textContent = '❌ Error processing CV. You can still continue manually.';
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

    // Call our API endpoint for criteria generation
    const criteriaResponse = await fetch('/api/generate-criteria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ikigai: ikigai,
        skills: skills,
        intent: intent,
        workingStyle: workingStyle,
        cvData: cvData
      })
    });

    const criteriaResult = await criteriaResponse.json();
    const matchingCriteria = criteriaResult.success ? criteriaResult.data : {};

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
