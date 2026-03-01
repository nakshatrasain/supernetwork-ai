# SuperNetworkAI 🧠

**Intelligence Meets Connection**

An AI-powered networking platform that uses psychology and Claude Sonnet 4 to match you with the perfect cofounders, teammates, and clients based on your purpose, passion, and complementary skills—not just keywords.

🔗 **Live Demo**: [supernetwork-ai.vercel.app](https://supernetwork-ai.vercel.app)

---

## 🎯 The Problem

Traditional networking platforms like LinkedIn match people based on surface-level keywords. You search "JavaScript developer" and get 10,000 results. But finding someone who:
- Shares your mission and values
- Has complementary (not identical) skills
- Actually wants to build what you're building
- Fits your working style and availability

...is like finding a needle in a haystack.

**Result:** Time wasted, poor matches, failed partnerships.

---

## 💡 Our Solution

SuperNetworkAI uses **Ikigai** (Japanese concept of "reason for being") + **Claude AI** to understand your PURPOSE and match you with people who genuinely complement what you're building.

### Why This Works (Psychology-Backed):

1. **🧩 Ikigai Framework**: Matches based on 4 dimensions (what you love, what you're good at, what the world needs, what you can be paid for) instead of just job titles
2. **🎯 Homophily Principle**: Finds people with similar values BUT complementary skills (productive collaboration, not redundancy)
3. **🧠 Reduced Cognitive Load**: Shows 6-10 highly compatible matches instead of 600 strangers (reduces decision paralysis)
4. **🤝 Dunbar's Number**: Focuses on quality relationships (~150 meaningful connections) over quantity

---

## ✨ Features

### 🎨 Core Features
- **Ikigai-Based Onboarding**: 4-question framework to understand your purpose
- **PDF CV Upload**: AI extracts skills, experience, and location automatically using PDF.js + Claude
- **AI Matching Criteria**: Claude generates personalized preferences based on your profile
- **Natural Language Search**: "AI engineer who loves startups in Bangalore" - Claude understands context
- **Smart Match Scores**: Ranked results (45%, 85%, 92%) with AI-generated explanations
- **Role Filtering**: Filter by Cofounder, Client, or Teammate
- **Real-time Messaging**: Built-in chat with instant notifications
- **Continuous Learning**: AI auto-updates your matching criteria when you edit your profile

### 🔒 Privacy & Control
- **Public/Private Profiles**: Toggle visibility anytime
- **Block Users**: Remove unwanted connections from all search results
- **Secure Authentication**: Supabase Auth with row-level security

---

## 🏗️ Tech Stack

### Frontend
- **HTML/CSS/JavaScript** (Vanilla - no frameworks for speed)
- **PDF.js** for client-side PDF parsing
- **Supabase JS Client** for real-time features

### Backend
- **Vercel Serverless Functions** (3 API endpoints)
  - `/api/parse-cv` - CV text extraction and parsing
  - `/api/generate-criteria` - AI matching criteria generation
  - `/api/search-matches` - Search and suggestions ranking

### Database
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Row-Level Security (RLS)** policies for data protection

### AI
- **Claude Sonnet 4** (via Anthropic API)
- **Semantic matching** with multi-dimensional analysis

### Deployment
- **Vercel** (auto-deploy from GitHub)
- **Environment Variables** for API key security

---

## 🗄️ Database Schema

### Tables

**profiles**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- email (text)
- name (text)
- location (text)
- ikigai (jsonb) - {love, good_at, world_needs, paid_for}
- skills (text[])
- intent (text) - seeking_cofounder | seeking_client | seeking_teammate
- availability (text)
- working_style (text)
- portfolio_url (text)
- social_profiles (jsonb)
- cv_data (jsonb)
- matching_criteria (jsonb)
- visibility (text) - public | private
- created_at (timestamp)
- updated_at (timestamp)
```

**messages**
```sql
- id (uuid, primary key)
- from_user_id (uuid, foreign key to profiles.id)
- to_user_id (uuid, foreign key to profiles.id)
- message (text)
- read (boolean)
- created_at (timestamp)
```

**connection_requests**
```sql
- id (uuid, primary key)
- from_user_id (uuid, foreign key to profiles.id)
- to_user_id (uuid, foreign key to profiles.id)
- status (text) - pending | accepted | rejected
- created_at (timestamp)
```

**blocked_users**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles.id)
- blocked_user_id (uuid, foreign key to profiles.id)
- created_at (timestamp)
```

---

## 🤖 How AI Matching Works

### Step 1: Profile Analysis
User completes Ikigai + uploads CV → Claude extracts:
- Skills and experience
- Professional interests
- Location and availability
- Working style preferences

### Step 2: Criteria Generation
Claude analyzes your complete profile and generates:
```json
{
  "ideal_skills": ["backend engineering", "product design"],
  "ideal_traits": ["detail-oriented", "startup experience"],
  "complementary_strengths": ["sales", "marketing"],
  "matching_preferences": "Looking for someone technical with product sense..."
}
```

### Step 3: Intelligent Matching
When you search or view suggestions:
1. Fetch all public profiles (excluding blocked users)
2. Apply filters (cofounder/client/teammate if selected)
3. Send to Claude with your profile + their profiles + search query
4. Claude performs multi-dimensional analysis:
   - **Ikigai alignment** (30%): Shared mission and values
   - **Skill complementarity** (25%): Different but compatible skills
   - **Intent match** (20%): Both seeking same relationship type
   - **Location/availability** (15%): Practical compatibility
   - **Working style** (10%): Remote/hybrid/in-person fit
5. Returns ranked results with scores and explanations

**Example Output:**
```json
[
  {
    "profile_id": "abc123",
    "match_score": 85,
    "category": "cofounder",
    "explanation": "Excellent match - Anjali brings Design/Sales expertise. Both passionate about education, complementary skills (you: technical, her: business), remote-compatible, full-time availability."
  }
]
```

### Why This Beats Traditional Platforms:
- **Not keyword matching**: Understands semantic meaning and context
- **Explains reasoning**: Shows WHY someone is a good match
- **Multi-dimensional**: Evaluates compatibility across 5+ factors
- **Purpose-driven**: Matches mission alignment, not just job titles

---

## 🚧 Technical Challenges & Solutions

### Challenge 1: CORS Error - Claude API Blocked from Frontend
**Problem:** Browser security blocks direct API calls to Anthropic  
**Error:** `Access to 'https://api.anthropic.com' blocked by CORS policy`  
**Solution:** Built Vercel serverless functions as middleware. Frontend → Our backend → Claude API. API key secured in environment variables.

### Challenge 2: Supabase Variable Naming Conflict
**Problem:** `const supabase = supabase.createClient()` causes "already declared" error  
**Solution:** Destructure first: `const { createClient } = supabase; const supabaseClient = createClient(...)`. Initialize once in `auth.js`, reuse globally.

### Challenge 3: Row Level Security Blocking Database Writes
**Problem:** "violates row-level security policy" on connection requests and messages  
**Solution:** Created explicit RLS policies:
```sql
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = from_user_id));
```

### Challenge 4: Profile Data Not Persisting
**Problem:** Save profile → refresh → data gone  
**Root Cause:** Supabase UPDATE missing fields (portfolio_url, social_profiles)  
**Solution:** Rewrote `saveProfile()` to explicitly include all fields. Added `.filter(s => s.length > 0)` for skills array.

### Challenge 5: CurrentUser NULL Error
**Problem:** Click Connect → "Cannot read property 'id' of null"  
**Root Cause:** Profile query returning 0 rows (profile record missing)  
**Solution:** Added `if (!currentUser?.id)` safety checks. Auto-create profile if missing during init.

### Challenge 6: PDF Upload Failing
**Problem:** Upload PDF → Error 500  
**Root Cause:** PDFs are binary files, can't use `FileReader.readAsText()`  
**Solution:** Integrated PDF.js for client-side parsing. Extract text in browser before sending to API. Truncate to 8000 chars to avoid token limits.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Anthropic API key (Claude)
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/nakshatrasain/supernetwork-ai.git
cd supernetwork-ai
```

2. **Set up Supabase**
- Create a new Supabase project
- Run the SQL schema (found in `/database/schema.sql`)
- Copy your project URL and anon key

3. **Configure environment variables**
Create `.env` file:
```env
CLAUDE_API_KEY=your_anthropic_api_key
```

Update `config.js`:
```javascript
const CONFIG = {
  supabase: {
    url: 'your_supabase_url',
    anonKey: 'your_supabase_anon_key'
  }
}
```

4. **Deploy to Vercel**
```bash
vercel
```

Set environment variable in Vercel dashboard:
- `CLAUDE_API_KEY` = your Anthropic API key

---

## 📁 Project Structure
```
supernetwork-ai/
├── api/
│   ├── parse-cv.js           # CV parsing endpoint
│   ├── generate-criteria.js  # Matching criteria generation
│   └── search-matches.js     # Search and suggestions
├── index.html                # Landing page
├── auth.js                   # Authentication logic
├── onboarding.html           # Ikigai onboarding
├── onboarding.js             # Onboarding logic
├── search.html               # Search and matches
├── search.js                 # Search logic
├── messages.html             # Real-time chat
├── messages.js               # Messaging logic
├── profile.html              # User profile
├── profile.js                # Profile management
├── styles.css                # Global styles
├── config.js                 # Supabase configuration
└── vercel.json               # Vercel deployment config
```

---

## 🎥 Demo Video

Watch the full walkthrough: https://youtu.be/TVM0XpNhue0

---

## 🧪 Testing

### Tested Scenarios
✅ Empty form submission validation  
✅ Invalid email format handling  
✅ Weak password enforcement  
✅ Profile data persistence across sessions  
✅ Blocked users filtered from all views  
✅ Real-time message delivery  
✅ PDF upload with various file sizes  
✅ AI error handling (malformed JSON, token limits)  
✅ Database RLS policies (unauthorized access blocked)  
✅ Null/undefined safety checks throughout

---

## 🤝 Contributing

This was built for the 100x GenAI Cohort hackathon. Contributions welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - feel free to use this project for learning or building your own tools!

---

## 👨‍💻 Author

**Nakshatra Sain**
- Location: Jaipur, India


---

## 🙏 Acknowledgments

- **Anthropic** for Claude Sonnet 4 API
- **Supabase** for the amazing backend platform
- **100x GenAI Cohort** for the hackathon opportunity
- **PDF.js** by Mozilla for PDF parsing
- **Vercel** for seamless deployment

---

## 📊 Stats

- **Build Time**: ~12 hours
- **Lines of Code**: ~2,500
- **Features**: 16 core features
- **Technical Challenges Solved**: 6
- **AI API Calls**: 3 serverless endpoints
- **Database Tables**: 4 with RLS policies

---

**SuperNetworkAI - Where Intelligence Meets Connection** 🧠✨

Built with ❤️ and Claude AI
