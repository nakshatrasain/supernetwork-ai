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
    const { query, currentUser, profiles, type } = req.body;
    // type can be 'search' or 'suggestions'

    let prompt = '';
    
    if (type === 'search') {
      prompt = `You are a professional networking matchmaker. Based on this search query, rank and explain the best matches from the available profiles.

Search Query: "${query}"

Searcher's Profile:
${JSON.stringify(currentUser, null, 2)}

Available Profiles:
${JSON.stringify(profiles, null, 2)}

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
- Only include matches with score > 30`;
    } else {
      // suggestions
      prompt = `Suggest the top 6 best matches for this person based on their profile and matching criteria.

User's Profile:
${JSON.stringify(currentUser, null, 2)}

Available Profiles:
${JSON.stringify(profiles, null, 2)}

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
- Working style compatibility`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const data = await response.json();
    const jsonMatch = data.content[0].text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const matches = JSON.parse(jsonMatch[0]);
      return res.status(200).json({ success: true, data: matches });
    } else {
      return res.status(200).json({ success: false, data: [] });
    }
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
