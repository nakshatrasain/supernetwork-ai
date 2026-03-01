// Initialize Supabase
const { createClient } = supabase;
const supabaseClient = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

let currentUser = null;
let conversations = [];
let activeConversation = null;
let allProfiles = [];

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

  // Load all profiles for lookup
  const { data: profiles } = await supabaseClient
    .from('profiles')
    .select('*');
  
  allProfiles = profiles || [];

  // Load conversations
  await loadConversations();

  // Set up real-time message updates
  setupRealtimeSubscription();
}

// Load Conversations
async function loadConversations() {
  // Get all messages where user is sender or receiver
  const { data: messages } = await supabaseClient
    .from('messages')
    .select('*')
    .or(`from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id}`)
    .order('created_at', { ascending: false });

  if (!messages || messages.length === 0) {
    document.getElementById('noConversations').style.display = 'block';
    return;
  }

  // Group messages by conversation partner
  const conversationMap = new Map();

  messages.forEach(msg => {
    const partnerId = msg.from_user_id === currentUser.id ? msg.to_user_id : msg.from_user_id;
    
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partnerId: partnerId,
        lastMessage: msg.message,
        lastMessageTime: msg.created_at,
        unread: msg.to_user_id === currentUser.id && !msg.read
      });
    }
  });

  conversations = Array.from(conversationMap.values());
  displayConversations();
}

// Display Conversations List
function displayConversations() {
  const list = document.getElementById('conversationsList');
  list.innerHTML = '';

  conversations.forEach(conv => {
    const partner = allProfiles.find(p => p.id === conv.partnerId);
    if (!partner) return;

    const timeAgo = getTimeAgo(conv.lastMessageTime);

    list.innerHTML += `
      <div class="conversation-item ${activeConversation === conv.partnerId ? 'active' : ''}" 
           onclick="selectConversation('${conv.partnerId}', '${partner.name}')">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 5px;">
          <strong>${partner.name}</strong>
          <span style="font-size: 0.8em; color: #999;">${timeAgo}</span>
        </div>
        <div style="color: #666; font-size: 0.9em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${conv.lastMessage}
        </div>
        ${conv.unread ? '<div style="width: 8px; height: 8px; background: #667eea; border-radius: 50%; margin-top: 5px;"></div>' : ''}
      </div>
    `;
  });
}

// Select Conversation
async function selectConversation(partnerId, partnerName) {
  activeConversation = partnerId;
  
  document.getElementById('noChatSelected').style.display = 'none';
  document.getElementById('chatArea').style.display = 'flex';
  document.getElementById('chatWithName').textContent = partnerName;

  // Update active state in UI
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget?.classList.add('active');

  // Load messages
  await loadMessages(partnerId);

  // Mark messages as read
  await supabaseClient
    .from('messages')
    .update({ read: true })
    .eq('from_user_id', partnerId)
    .eq('to_user_id', currentUser.id);
}

// Load Messages
async function loadMessages(partnerId) {
  const { data: messages } = await supabaseClient
    .from('messages')
    .select('*')
    .or(`and(from_user_id.eq.${currentUser.id},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${currentUser.id})`)
    .order('created_at', { ascending: true });

  const messagesList = document.getElementById('messagesList');
  messagesList.innerHTML = '';

  if (!messages || messages.length === 0) {
    messagesList.innerHTML = '<p style="text-align: center; color: #666;">No messages yet. Start the conversation!</p>';
    return;
  }

  messages.forEach(msg => {
    const isSent = msg.from_user_id === currentUser.id;
    const time = new Date(msg.created_at).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    messagesList.innerHTML += `
      <div class="message ${isSent ? 'sent' : 'received'}">
        ${msg.message}
        <div style="font-size: 0.75em; opacity: 0.7; margin-top: 5px;">${time}</div>
      </div>
    `;
  });

  // Scroll to bottom
  messagesList.scrollTop = messagesList.scrollHeight;
}

// Send Message
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message || !activeConversation) return;

  try {
    const { error } = await supabaseClient
      .from('messages')
      .insert([{
        from_user_id: currentUser.id,
        to_user_id: activeConversation,
        message: message,
        read: false
      }]);

    if (error) throw error;

    input.value = '';
    
    // Reload messages
    await loadMessages(activeConversation);
    
    // Update conversations list
    await loadConversations();
  } catch (error) {
    console.error('Send message error:', error);
    alert('Error sending message');
  }
}

// Setup Realtime Subscription
function setupRealtimeSubscription() {
  supabaseClient
    .channel('messages')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `to_user_id=eq.${currentUser.id}`
      }, 
      (payload) => {
        // New message received
        if (payload.new.from_user_id === activeConversation) {
          loadMessages(activeConversation);
        }
        loadConversations();
      }
    )
    .subscribe();
}

// Get Time Ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Initialize on page load
init();
