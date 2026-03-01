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
      // For simplicity, treating all as text
      // In production, you'd handle different file types properly
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
    // Get current use
