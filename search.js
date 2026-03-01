let currentUser = null;
let allProfiles = [];
let activeFilters = [];

// Initialize
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  // Get current user profile
  const { data: profile } = await supabase
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
  const { data: { session } } = await supabase.auth.getSession();
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('visibility', 'public')
    .neq('user_id', session.user.id);
  
  allProfiles = profiles || [];
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

    // Call Claude to match and rank profiles
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.claude.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CONFIG.claude.model,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are a professional networking matchmaker. Based on this search query, rank and explain the best matches from the available profiles.

Search Query: "${query}"

Searcher's Profile:
${JSON.stringify(currentUser, null, 2)}

Available Profiles:
${JSON.stringify(filteredProfiles.slice(0, 20), null, 2)}

Return ONLY valid JSON array with this structure (return top 10 matches):
[
  {
    "profile_id": "uuid from profiles",
    "match_score": 95,
    "category": "cofounder" or "client" or "teammate",
    "explanation": "2-3 sentence explanation of why this is a great match, focusing on complementary skills, shared interests, and alignment"
  }
]

Important: 
- match_score should be 0-100 based on relevance to search query
- explanation should be specific and personalized
- Only include matches with score > 60`
        }]
      })
    });

    const data = await response.json();
    const jsonMatch = data.content[0].text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const matches = JSON.parse(jsonMatch[0]);
      displayMatches(matches);
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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.claude.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CONFIG.claude.model,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Suggest the top 6 best matches for this person based on their profile and matching criteria.

User's Profile:
${JSON.stringify(currentUser, null, 2)}

Available Profiles:
${JSON.stringify(allProfiles.slice(0, 30), null, 2)}

Return ONLY valid JSON array:
[
  {
    "profile_id": "uuid",
    "match_score": 90,
    "category": "cofounder" or "client" or "teammate",
    "explanation": "Why this is a great match"
  }
]

Focus on:
- Complementary skills from their Ikigai
- Alignment with their intent
- Matching criteria preferences
- Working style compatibility`
        }]
      })
    });

    const data = await response.json();
    const jsonMatch = data.content[0].text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      displaySuggestions(suggestions);
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

      <div class="match-actions
