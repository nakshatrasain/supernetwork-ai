// Configuration - Supabase is safe to expose, Claude API calls moved to backend
const CONFIG = {
  supabase: {
    url: 'https://qerinigfgdrkkzqwuwso.supabase.co',
    anonKey: 'sb_publishable_-m0Zkl-s36Fw6M2qBkB9hQ_ztKn2DDN'
  },
  api: {
    baseUrl: '' // Empty = same domain, Vercel will handle it
  }
};
