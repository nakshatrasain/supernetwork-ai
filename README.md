# SuperNetworkAI - AI-Powered Networking Platform

Find your perfect cofounder, teammate, or client using AI-powered matching based on Ikigai, skills, and natural language search.

## Features

✅ **Ikigai-Based Onboarding** - Deep understanding of user's passions and purpose  
✅ **CV/Portfolio Import** - AI extracts information from uploaded documents  
✅ **Natural Language Search** - Search for matches using plain English  
✅ **AI-Powered Matching** - Claude AI ranks and explains match compatibility  
✅ **Smart Categorization** - Automatically categorizes matches (Cofounder/Client/Teammate)  
✅ **AI Pre-fill Criteria** - Automatically generates matching preferences  
✅ **Built-in Messaging** - Connect and communicate directly  
✅ **Visibility Controls** - Public/Private profile options  
✅ **Real-time Updates** - Live message notifications  

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI**: Claude API (Sonnet 4)
- **Deployment**: Vercel

## Project Structure
```
supernetwork-ai/
├── index.html          - Landing page with auth
├── onboarding.html     - Ikigai form + CV upload
├── search.html         - Natural language search
├── messages.html       - Messaging interface
├── profile.html        - User profile & settings
├── styles.css          - All styling
├── config.js           - API configuration
├── auth.js             - Authentication logic
├── onboarding.js       - Onboarding + CV parsing
├── search.js           - AI matching engine
├── messages.js         - Messaging logic
├── profile.js          - Profile management
└── vercel.json         - Deployment config
```

## How It Works

### 1. User Onboarding
- Complete Ikigai questionnaire (4 questions about purpose & passion)
- Upload CV (optional) - Claude extracts structured data
- Add skills, location, availability
- AI generates personalized matching criteria

### 2. Natural Language Search
- Search using plain English: "AI engineer who loves startups in Bangalore"
- Claude analyzes search query + user profiles
- Returns ranked matches with explanations
- Categorizes as Cofounder/Client/Teammate

### 3. AI Matching Engine
- Compares Ikigai alignment
- Analyzes complementary skills
- Considers working style compatibility
- Generates match scores (0-100)
- Provides personalized explanations

### 4. Messaging
- Direct in-app messaging
- Real-time updates via Supabase
- Connection requests
- Read receipts

## Scope Coverage

### ✅ Implemented Features

1. **Concise Onboarding** - Ikigai, portfolio, social profiles, intent
2. **Import from CV** - Claude AI parses uploaded documents
3. **AI Pre-fill Criteria** - Automated matching preference generation
4. **Natural Language Search** - Semantic search using Claude
5. **Ranked Matches** - AI-scored and categorized results
6. **AI Explanations** - Personalized match reasoning
7. **Built-in Messaging** - Full chat functionality
8. **Visibility Controls** - Public/Private toggle
9. **Block Users** - Privacy controls (database ready)
10. **Web-only** - Single-page application
11. **Minimalistic UI** - Clean, modern design
12. **Open Access** - No vetting required

## AI Capabilities

### CV Parsing
```javascript
Uploads PDF/DOC → Claude extracts:
- Name, skills, experience
- Education, interests
- Location (if mentioned)
```

### Matching Criteria Generation
```javascript
Profile → Claude generates:
- Ideal skills to look for
- Desired personality traits
- Complementary strengths
- Matching preferences
```

### Search Matching
```javascript
Query + Profiles → Claude returns:
- Ranked matches (0-100 score)
- Category (cofounder/client/teammate)
- Personalized explanation
```

## Deployment

### Option 1: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Click "Deploy"
5. Done! You get a live URL

### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## Database Schema

### profiles
- Basic info (name, email, location)
- Ikigai (4-part purpose framework)
- Skills, intent, availability
- Social profiles (LinkedIn, Twitter, GitHub)
- CV data (AI-extracted)
- Matching criteria (AI-generated)
- Visibility settings

### messages
- Sender/receiver IDs
- Message content
- Read status
- Timestamps

### blocked_users
- User blocking relationships

### connection_requests
- Pending/accepted connection states

## Innovation Highlights

- Ikigai-based matching goes beyond skills to understand purpose and passion
- Claude AI provides human-like explanations for why matches work
- Natural language search removes complexity - just describe who you need
- Auto-generated criteria saves time while being customizable
- Built entirely with Claude + Supabase

## Use Cases

- Startup founders finding complementary cofounders based on Ikigai alignment
- Freelancers discovering ideal clients matching their skills and passion
- Companies finding contractors/teammates with specific expertise
- Community members networking based on shared interests and working styles

## Credits

Built by Nakshatra Sain for 100x GenAI Cohort  
Powered by Claude AI & Supabase
