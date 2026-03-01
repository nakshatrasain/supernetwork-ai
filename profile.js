// Initialize Supabase
const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

let currentUser = null;

// Initialize
async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  // Get current user profile
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
  
  if (!profile) {
    window.location.href = 'onboarding.html';
    return;
  }

  currentUser = profile;
  loadProfileData();
}

// Load Profile Data
function loadProfileData() {
  // Basic info
  document.getElementById('name').value = currentUser.name || '';
  document.getElementById('email').value = currentUser.email || '';
  document.getElementById('location').value = currentUser.location || '';

  // Ikigai
  if (currentUser.ikigai) {
    document.getElementById('ikigaiLove').value = currentUser.ikigai.love || '';
    document.getElementById('ikigaiGoodAt').value = currentUser.ikigai.good_at || '';
    document.getElementById('ikigaiWorldNeeds').value = currentUser.ikigai.world_needs || '';
    document.getElementById('ikigaiPaidFor').value = currentUser.ikigai.paid_for || '';
  }

  // Professional info
  document.getElementById('intent').value = currentUser.intent || 'seeking_cofounder';
  document.getElementById('skills').value = currentUser.skills ? currentUser.skills.join(', ') : '';
  document.getElementById('availability').value = currentUser.availability || 'flexible';
  document.getElementById('workingStyle').value = currentUser.working_style || 'remote';

  // Social profiles
  if (currentUser.social_profiles) {
    document.getElementById('portfolioUrl').value = currentUser.portfolio_url || '';
    document.getElementById('linkedin').value = currentUser.social_profiles.linkedin || '';
    document.getElementById('twitter').value = currentUser.social_profiles.twitter || '';
    document.getElementById('github').value = currentUser.social_profiles.github || '';
  }

  // Visibility
  document.getElementById('visibilityToggle').value = currentUser.visibility || 'public';

  // Display matching criteria
  displayMatchingCriteria();
}

// Display Matching Criteria
function displayMatchingCriteria() {
  const container = document.getElementById('matchingCriteria');
  
  if (!currentUser.matching_criteria || Object.keys(currentUser.matching_criteria).length === 0) {
    container.innerHTML = '<p style="color: #666;">No AI criteria generated yet. Click "Regenerate AI Criteria" to create personalized matching preferences.</p>';
    return;
  }

  const criteria = currentUser.matching_criteria;
  
  container.innerHTML = `
    <div style="margin-bottom: 15px;">
      <strong style="color: #667eea;">Ideal Skills:</strong>
      <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
        ${criteria.ideal_skills ? criteria.ideal_skills.map(skill => 
          `<span class="skill-tag">${skill}</span>`
        ).join('') : 'Not set'}
      </div>
    </div>
    
    <div style="margin-bottom: 15px;">
      <strong style="color: #667eea;">Ideal Traits:</strong>
      <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
        ${criteria.ideal_traits ? criteria.ideal_traits.map(trait => 
          `<span class="skill-tag">${trait}</span>`
        ).join('') : 'Not set'}
      </div>
    </div>
    
    <div style="margin-bottom: 15px;">
      <strong style="color: #667eea;">Complementary Strengths:</strong>
      <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
        ${criteria.complementary_strengths ? criteria.complementary_strengths.map(strength => 
          `<span class="skill-tag">${strength}</span>`
        ).join('') : 'Not set'}
      </div>
    </div>
    
    ${criteria.matching_preferences ? `
      <div>
        <strong style="color: #667eea;">Matching Preferences:</strong>
        <p style="margin-top: 8px; color: #666;">${criteria.matching_preferences}</p>
      </div>
    ` : ''}
  `;
}

// Update Visibility
async function updateVisibility() {
  const visibility = document.getElementById('visibilityToggle').value;
  
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .update({ visibility: visibility })
      .eq('id', currentUser.id);

    if (error) throw error;
    
    currentUser.visibility = visibility;
    
    const msg = visibility === 'public' 
      ? '✅ Profile is now visible to everyone' 
      : '🔒 Profile is now hidden from search';
    
    document.getElementById('successMsg').textContent = msg;
    setTimeout(() => {
      document.getElementById('successMsg').textContent = '';
    }, 3000);
  } catch (error) {
    console.error('Visibility update error:', error);
    document.getElementById('errorMsg').textContent = 'Error updating visibility';
  }
}

// Regenerate AI Criteria
async function regenerateCriteria() {
  const container = document.getElementById('matchingCriteria');
  container.innerHTML = '<p style="color: #667eea;">🤖 AI is analyzing your profile and generating personalized matching criteria...</p>';

  try {
    // Get current form values
    const ikigai = {
      love: document.getElementById('ikigaiLove').value,
      good_at: document.getElementById('ikigaiGoodAt').value,
      world_needs: document.getElementById('ikigaiWorldNeeds').value,
      paid_for: document.getElementById('ikigaiPaidFor').value
    };

    const skills = document.getElementById('skills').value.split(',').map(s => s.trim());
    const intent = document.getElementById('intent').value;
    const workingStyle = document.getElementById('workingStyle').value;

    // Call our API endpoint
    const response = await fetch('/api/generate-criteria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ikigai: ikigai,
        skills: skills,
        intent: intent,
        workingStyle: workingStyle
      })
    });

    const result = await response.json();
    
    if (result.success && result.data) {
      currentUser.matching_criteria = result.data;
      
      // Save to database
      await supabaseClient
        .from('profiles')
        .update({ matching_criteria: result.data })
        .eq('id', currentUser.id);
      
      displayMatchingCriteria();
      
      document.getElementById('successMsg').textContent = '✅ AI criteria regenerated successfully!';
      setTimeout(() => {
        document.getElementById('successMsg').textContent = '';
      }, 3000);
    } else {
      container.innerHTML = '<p style="color: #e74c3c;">Error generating criteria. Please try again.</p>';
    }
  } catch (error) {
    console.error('Criteria regeneration error:', error);
    container.innerHTML = '<p style="color: #e74c3c;">Error generating criteria. Please try again.</p>';
  }
}

// Save Profile
async function saveProfile() {
  const errorEl = document.getElementById('errorMsg');
  const successEl = document.getElementById('successMsg');
  errorEl.textContent = '';
  successEl.textContent = '';

  try {
    // Get values
    const ikigai = {
      love: document.getElementById('ikigaiLove').value,
      good_at: document.getElementById('ikigaiGoodAt').value,
      world_needs: document.getElementById('ikigaiWorldNeeds').value,
      paid_for: document.getElementById('ikigaiPaidFor').value
    };

    const skillsInput = document.getElementById('skills').value;
    const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()) : [];

    const socialProfiles = {
      linkedin: document.getElementById('linkedin').value,
      twitter: document.getElementById('twitter').value,
      github: document.getElementById('github').value
    };

    // Update profile
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        name: document.getElementById('name').value,
        location: document.getElementById('location').value,
        ikigai: ikigai,
        skills: skills,
        intent: document.getElementById('intent').value,
        availability: document.getElementById('availability').value,
        working_style: document.getElementById('workingStyle').value,
        portfolio_url: document.getElementById('portfolioUrl').value,
        social_profiles: socialProfiles,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id);

    if (error) throw error;

    successEl.textContent = '✅ Profile saved successfully!';
    
    setTimeout(() => {
      window.location.href = 'search.html';
    }, 1500);
  } catch (error) {
    console.error('Save error:', error);
    errorEl.textContent = 'Error saving profile: ' + error.message;
  }
}

// Initialize on page load
init();
