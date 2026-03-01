export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cvText } = req.body;

    if (!cvText || cvText.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No CV text provided' 
      });
    }

    // Truncate very long CVs to avoid token limits
    const truncatedText = cvText.substring(0, 8000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
${truncatedText}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response from Claude API');
    }

    const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const cvData = JSON.parse(jsonMatch[0]);
      return res.status(200).json({ success: true, data: cvData });
    } else {
      return res.status(200).json({ 
        success: false, 
        error: 'Could not parse CV - no structured data found' 
      });
    }
  } catch (error) {
    console.error('CV parsing error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
