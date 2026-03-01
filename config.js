// Configuration - API keys will be set in Vercel environment variables
const CONFIG = {
  supabase: {
    url: window.SUPABASE_URL || 'https://qerinigfgdrkkzqwuwso.supabase.co',
    anonKey: window.SUPABASE_ANON_KEY || 'sb_publishable_-m0Zkl-s36Fw6M2qBkB9hQ_ztKn2DDN'
  },
  claude: {
    apiKey: window.CLAUDE_API_KEY || 'your-key-here',
    model: 'claude-sonnet-4-20250514'
  }
};
