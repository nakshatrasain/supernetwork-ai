let currentUser = null;
let allProfiles = [];
let activeFilters = [];

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
  
  currentUser = profile;

  // Load all profiles
  await loadAllProfiles();
  
  // Show AI suggestions based on user's profile
  await showAISuggestions();
}

// Load all profiles
async function loadAllProfiles() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  // Get blocked users
  const { data: blockedUsers } = await supabaseClient
    .from('blocked_users')
    .select('blocked_user_id')
    .eq('user_id', currentUser.id);
  
  const blockedIds = blockedUsers ? blockedUsers.map(b => b.blocked_user_id) : [];
  
  const { data: profiles } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('visibility', 'public')
    .neq('user_id', session.user.id);
  
  // Filter out blocked users
  allProfiles = profiles ? profiles.filter(p => !blockedIds.includes(p.id)) : [];
}

// Toggle Filter
function toggleFilter(filterType) {
  const filterEl = document.querySelector(`[data-filter="seeking_${filterType}"]`);
  
  if (activeFilters.includes(`seeking_${filterType}`)) {
    activeFilters = activeFilters.filter(f => f !== `seeking_${filterType}`);
    filterEl.classList.remove('active');
  } else {
    activeFilters.push(`seeking_${filterType}`);
    filterEl.classList.add('active');
  }
}

// Clear Filters
function clearFilters() {
  activeFilters = [];
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.classList.remove('active');
  });
}

// Search Matches
async function searchMatches() {
  const query = document.getElementById('searchQuery').value.trim();
  
  if (!query && activeFilters.length === 0) {
    alert('Please enter a search query or select a filter');
    return;
  }

  document.getElementById('loadingState').style.display = 'block';
  document.getElementById('matchesGrid').innerHTML = '';
  document.getElementById('noResults').style.display = 'none';
  document.getElementById('initialSuggestions').style.display = 'none';

  try {
    // Filter profiles based on filters first
    let filteredProfiles = allProfiles;
    if (activeFilters.length > 0) {
      filteredProfiles = allProfiles.filter(p => activeFilters.includes(p.intent));
    }

    // Call our API endpoint
    const response = await fetch('/api/search-matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        currentUser: currentUser,
        profiles: filteredProfiles.slice(0, 20),
        type: 'search'
      })
    });

    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      displayMatches(result.data);
    } else {
      document.getElementById('noResults').style.display = 'block';
    }
  } catch (error) {
    console.error('Search error:', error);
    alert('Error performing search. Please try again.');
  }

  document.getElementById('loadingState').style.display = 'none';
}

// Show AI Suggestions
async function showAISuggestions() {
  document.getElementById('loadingState').style.display = 'block';

  try {
    // Call our API endpoint
    const response = await fetch('/api/search-matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentUser: currentUser,
        profiles: allProfiles.slice(0, 30),
        type: 'suggestions'
      })
    });

    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      displaySuggestions(result.data);
    }
  } catch (error) {
    console.error('Suggestions error:', error);
  }

  document.getElementById('loadingState').style.display = 'none';
}

// Display Matches
function displayMatches(matches) {
  const grid = document.getElementById('matchesGrid');
  grid.innerHTML = '';

  if (matches.length === 0) {
    document.getElementById('noResults').style.display = 'block';
    return;
  }

  matches.forEach(match => {
    const profile = allProfiles.find(p => p.id === match.profile_id);
    if (profile) {
      grid.innerHTML += createMatchCard(profile, match);
    }
  });
}

// Display Suggestions
function displaySuggestions(suggestions) {
  const grid = document.getElementById('suggestionsGrid');
  grid.innerHTML = '';

  suggestions.forEach(suggestion => {
    const profile = allProfiles.find(p => p.id === suggestion.profile_id);
    if (profile) {
      grid.innerHTML += createMatchCard(profile, suggestion);
    }
  });
}

// Create Match Card HTML
function createMatchCard(profile, match) {
  const categoryEmoji = {
    'cofounder': '🤝',
    'client': '💼',
    'teammate': '👥'
  };

  return `
    <div class="match-card">
      <div class="match-header">
        <div class="match-name">${profile.name}</div>
        <div class="match-score">${match.match_score}% Match</div>
      </div>
      
      <div class="match-category">
        ${categoryEmoji[match.category]} ${match.category.charAt(0).toUpperCase() + match.category.slice(1)}
      </div>

      ${profile.location ? `<p style="color: #666; font-size: 0.9em;">📍 ${profile.location}</p>` : ''}
      
      <div class="match-skills">
        ${profile.skills ? profile.skills.slice(0, 5).map(skill => 
          `<span class="skill-tag">${skill}</span>`
        ).join('') : ''}
      </div>

      <div class="match-explanation">
        💡 ${match.explanation}
      </div>

      <div class="match-actions">
        <button class="btn-connect" onclick="connectWithUser('${profile.id}', '${profile.name}')">
          Connect
        </button>
        <button class="btn-secondary" onclick="viewProfile('${profile.id}')">
          View Profile
        </button>
        <button class="btn-secondary" onclick="blockUser('${profile.id}', '${profile.name}')" style="background: #e74c3c; color: white;">
          🚫 Block
        </button>
      </div>
    </div>
  `;
}

// Connect with user
async function connectWithUser(profileId, name) {
  const message = prompt(`Send a connection request to ${name}:`, `Hi ${name}, I'd love to connect!`);
  
  if (!message) return;

  try {
    // Make sure we have current user loaded
    if (!currentUser || !currentUser.id) {
      alert('Error: User profile not loaded. Please refresh the page.');
      return;
    }

    // Create connection request
    const { error } = await supabaseClient
      .from('connection_requests')
      .insert([{
        from_user_id: currentUser.id,
        to_user_id: profileId,
        status: 'pending'
      }]);

    if (error) {
      console.error('Connection request error:', error);
      throw error;
    }

    // Send initial message
    const { error: msgError } = await supabaseClient
      .from('messages')
      .insert([{
        from_user_id: currentUser.id,
        to_user_id: profileId,
        message: message
      }]);

    if (msgError) {
      console.error('Message error:', msgError);
      throw msgError;
    }

    alert('Connection request sent! Check Messages to continue the conversation.');
    window.location.href = 'messages.html';
  } catch (error) {
    console.error('Connect error:', error);
    alert('Error sending connection request: ' + error.message);
  }
}

// View Profile
function viewProfile(profileId) {
  const profile = allProfiles.find(p => p.id === profileId);
  if (!profile) return;

  const info = `
Name: ${profile.name}
Location: ${profile.location || 'Not specified'}
Intent: ${profile.intent}
Skills: ${profile.skills ? profile.skills.join(', ') : 'Not specified'}
Availability: ${profile.availability || 'Not specified'}

Ikigai:
- Loves: ${profile.ikigai?.love || 'N/A'}
- Good at: ${profile.ikigai?.good_at || 'N/A'}
- World needs: ${profile.ikigai?.world_needs || 'N/A'}
- Paid for: ${profile.ikigai?.paid_for || 'N/A'}
  `;
  
  alert(info);
}

// Block User
async function blockUser(profileId, name) {
  if (!confirm(`Are you sure you want to block ${name}? You won't see their profile or receive messages from them.`)) {
    return;
  }

  try {
    if (!currentUser || !currentUser.id) {
      alert('Error: User profile not loaded. Please refresh the page.');
      return;
    }

    // Insert into blocked_users table
    const { error } = await supabaseClient
      .from('blocked_users')
      .insert([{
        user_id: currentUser.id,
        blocked_user_id: profileId
      }]);

    if (error) {
      console.error('Block error:', error);
      throw error;
    }

    alert(`${name} has been blocked. Refreshing matches...`);
    
    // Reload page to remove blocked user from results
    window.location.reload();
  } catch (error) {
    console.error('Block error:', error);
    alert('Error blocking user: ' + error.message);
  }
}

// Initialize on page load
init();
