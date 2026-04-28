/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAZKA v4 — chat.js                                        ║
 * ║  Chat system with groups, photos, read receipts              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { KZ } from './db.js';

export const Chat = (() => {

  // ─── STATE ──────────────────────────────────────────────────
  let _currentUser = null;
  let _activeChat = null; // { type: 'direct' | 'group', id: string }
  let _chats = {}; // All chats cache
  let _messages = {}; // Messages cache per chat
  let _onlineUsers = new Set();
  let _typingUsers = new Map(); // userId -> timeout
  let _unreadCounts = new Map(); // chatId -> count

  // ─── INIT ────────────────────────────────────────────────────
  function init(currentUser) {
    _currentUser = currentUser;
    
    // Listen for new messages
    KZ.onChildAdded('chats', onNewChat);
    KZ.onChildAdded('messages', onNewMessage);
    KZ.onChildChanged('messages', onMessageUpdate);
    KZ.onChildRemoved('messages', onMessageDelete);
    
    // Listen for online status
    KZ.onValue('users', onUserStatusChange);
    
    // Mark as online
    if (currentUser) {
      KZ.update(`users/${currentUser.uid}/status`, {
        online: true,
        lastSeen: new Date().toISOString()
      });
    }
    
    // Load existing chats
    loadChats();
  }

  // ─── CHAT MANAGEMENT ───────────────────────────────────────
  async function loadChats() {
    if (!_currentUser) return;
    
    try {
      const snap = await KZ.get(`users/${_currentUser.uid}/chats`);
      _chats = snap.val() || {};
      
      // Load messages for each chat
      for (const chatId of Object.keys(_chats)) {
        await loadMessages(chatId);
      }
      
      updateChatList();
      updateUnreadCounts();
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }

  async function loadMessages(chatId) {
    try {
      const snap = await KZ.get(`chats/${chatId}/messages`);
      const messages = snap.val() || {};
      _messages[chatId] = Object.entries(messages).map(([id, msg]) => ({
        id,
        ...msg
      })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('Error loading messages:', error);
      _messages[chatId] = [];
    }
  }

  async function createDirectChat(otherUserId) {
    if (!_currentUser || otherUserId === _currentUser.uid) return;
    
    // Check if chat already exists
    const existingChat = Object.entries(_chats).find(([id, chat]) => 
      chat.type === 'direct' && 
      (chat.participants.includes(otherUserId) && chat.participants.includes(_currentUser.uid))
    );
    
    if (existingChat) {
      setActiveChat('direct', existingChat[0]);
      return existingChat[0];
    }
    
    // Get other user info
    const otherUserSnap = await KZ.get(`users/${otherUserId}/profile`);
    const otherUser = otherUserSnap.val();
    
    if (!otherUser) {
      throw new Error('Utente non trovato');
    }
    
    // Create new chat
    const chatId = KZ.push('chats').key;
    const chat = {
      id: chatId,
      type: 'direct',
      participants: [_currentUser.uid, otherUserId],
      createdAt: new Date().toISOString(),
      lastMessage: null,
      unreadCounts: {
        [_currentUser.uid]: 0,
        [otherUserId]: 0
      }
    };
    
    await KZ.set(`chats/${chatId}`, chat);
    
    // Add chat to both users
    await KZ.set(`users/${_currentUser.uid}/chats/${chatId}`, {
      type: 'direct',
      otherUserId,
      lastActivity: new Date().toISOString()
    });
    
    await KZ.set(`users/${otherUserId}/chats/${chatId}`, {
      type: 'direct',
      otherUserId: _currentUser.uid,
      lastActivity: new Date().toISOString()
    });
    
    _chats[chatId] = chat;
    _messages[chatId] = [];
    
    updateChatList();
    setActiveChat('direct', chatId);
    
    return chatId;
  }

  async function createGroupChat(name, participantIds) {
    if (!_currentUser || !name || !participantIds.length) return;
    
    // Add current user to participants
    const allParticipants = [_currentUser.uid, ...participantIds];
    
    const chatId = KZ.push('chats').key;
    const chat = {
      id: chatId,
      type: 'group',
      name,
      participants: allParticipants,
      createdBy: _currentUser.uid,
      createdAt: new Date().toISOString(),
      lastMessage: null,
      unreadCounts: {}
    };
    
    // Initialize unread counts
    allParticipants.forEach(uid => {
      chat.unreadCounts[uid] = 0;
    });
    
    await KZ.set(`chats/${chatId}`, chat);
    
    // Add chat to all participants
    for (const userId of allParticipants) {
      await KZ.set(`users/${userId}/chats/${chatId}`, {
        type: 'group',
        lastActivity: new Date().toISOString()
      });
    }
    
    _chats[chatId] = chat;
    _messages[chatId] = [];
    
    updateChatList();
    setActiveChat('group', chatId);
    
    // Send system message
    await sendMessage(chatId, {
      type: 'system',
      content: `${_currentUser.displayName || 'Utente'} ha creato il gruppo "${name}"`
    });
    
    return chatId;
  }

  // ─── MESSAGING ───────────────────────────────────────────────
  async function sendMessage(chatId, content, type = 'text') {
    if (!_currentUser || !content) return;
    
    const message = {
      id: KZ.push(`chats/${chatId}/messages`).key,
      senderId: _currentUser.uid,
      senderName: _currentUser.displayName || 'Utente',
      content,
      type,
      timestamp: new Date().toISOString(),
      read: {},
      edited: false,
      deleted: false
    };
    
    // Initialize read status for all participants
    const chat = _chats[chatId];
    if (chat && chat.participants) {
      chat.participants.forEach(uid => {
        message.read[uid] = uid === _currentUser.uid;
      });
    }
    
    await KZ.set(`chats/${chatId}/messages/${message.id}`, message);
    
    // Update chat last message
    await KZ.update(`chats/${chatId}`, {
      lastMessage: {
        content: type === 'text' ? content : `[${type}]`,
        senderId: _currentUser.uid,
        timestamp: message.timestamp
      }
    });
    
    // Update activity for all participants
    if (chat && chat.participants) {
      for (const userId of chat.participants) {
        if (userId !== _currentUser.uid) {
          KZ.update(`users/${userId}/chats/${chatId}`, {
            lastActivity: new Date().toISOString()
          });
          
          // Increment unread count
          const currentCount = chat.unreadCounts[userId] || 0;
          KZ.update(`chats/${chatId}/unreadCounts`, {
            [userId]: currentCount + 1
          });
        }
      }
    }
    
    return message;
  }

  async function sendPhoto(chatId, file) {
    if (!_currentUser || !file) return;
    
    // Upload to Firebase Storage (simplified for demo)
    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoData = e.target.result;
      await sendMessage(chatId, photoData, 'photo');
    };
    reader.readAsDataURL(file);
  }

  async function markMessageAsRead(chatId, messageId) {
    if (!_currentUser) return;
    
    await KZ.update(`chats/${chatId}/messages/${messageId}/read`, {
      [_currentUser.uid]: true
    });
    
    // Reset unread count for this chat
    await KZ.update(`chats/${chatId}/unreadCounts`, {
      [_currentUser.uid]: 0
    });
  }

  async function markAllAsRead(chatId) {
    if (!_currentUser) return;
    
    const messages = _messages[chatId] || [];
    const unreadMessages = messages.filter(msg => 
      !msg.read[_currentUser.uid] && msg.senderId !== _currentUser.uid
    );
    
    // Mark all as read
    for (const msg of unreadMessages) {
      await KZ.update(`chats/${chatId}/messages/${msg.id}/read`, {
        [_currentUser.uid]: true
      });
    }
    
    // Reset unread count
    await KZ.update(`chats/${chatId}/unreadCounts`, {
      [_currentUser.uid]: 0
    });
  }

  // ─── TYPING INDICATORS ─────────────────────────────────────
  function startTyping(chatId) {
    if (!_currentUser) return;
    
    // Clear existing timeout
    if (_typingUsers.has(_currentUser.uid)) {
      clearTimeout(_typingUsers.get(_currentUser.uid));
    }
    
    // Set typing status
    KZ.set(`chats/${chatId}/typing/${_currentUser.uid}`, {
      userName: _currentUser.displayName || 'Utente',
      timestamp: new Date().toISOString()
    });
    
    // Auto-remove after 3 seconds
    const timeout = setTimeout(() => {
      stopTyping(chatId);
    }, 3000);
    
    _typingUsers.set(_currentUser.uid, timeout);
  }

  function stopTyping(chatId) {
    if (!_currentUser) return;
    
    KZ.remove(`chats/${chatId}/typing/${_currentUser.uid}`);
    _typingUsers.delete(_currentUser.uid);
  }

  // ─── REALTIME LISTENERS ───────────────────────────────────
  function onNewChat(snap) {
    const chat = snap.val();
    if (chat && chat.participants && chat.participants.includes(_currentUser.uid)) {
      _chats[snap.key] = chat;
      loadMessages(snap.key);
      updateChatList();
    }
  }

  function onNewMessage(snap) {
    const [chatId, messageId] = snap.key.split('/').slice(-2);
    const message = snap.val();
    
    if (!_messages[chatId]) {
      _messages[chatId] = [];
    }
    
    _messages[chatId].push(message);
    _messages[chatId].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Update UI if this is the active chat
    if (_activeChat && _activeChat.id === chatId) {
      updateMessageList();
      
      // Auto-mark as read if message is from someone else
      if (message.senderId !== _currentUser.uid) {
        markMessageAsRead(chatId, messageId);
      }
    } else {
      // Update unread count
      updateUnreadCounts();
    }
    
    updateChatList();
  }

  function onMessageUpdate(snap) {
    const [chatId, messageId] = snap.key.split('/').slice(-2);
    const message = snap.val();
    
    if (_messages[chatId]) {
      const index = _messages[chatId].findIndex(msg => msg.id === messageId);
      if (index !== -1) {
        _messages[chatId][index] = message;
        
        if (_activeChat && _activeChat.id === chatId) {
          updateMessageList();
        }
      }
    }
  }

  function onMessageDelete(snap) {
    const [chatId, messageId] = snap.key.split('/').slice(-2);
    
    if (_messages[chatId]) {
      _messages[chatId] = _messages[chatId].filter(msg => msg.id !== messageId);
      
      if (_activeChat && _activeChat.id === chatId) {
        updateMessageList();
      }
    }
  }

  function onUserStatusChange(snap) {
    const userId = snap.key.split('/')[1];
    const status = snap.val();
    
    if (status && status.online !== undefined) {
      if (status.online) {
        _onlineUsers.add(userId);
      } else {
        _onlineUsers.delete(userId);
      }
      
      updateOnlineStatus();
    }
  }

  // ─── UI UPDATES ────────────────────────────────────────────
  function setActiveChat(type, chatId) {
    _activeChat = { type, id: chatId };
    
    // Mark all as read
    markAllAsRead(chatId);
    
    // Update UI
    updateMessageList();
    updateChatHeader();
    highlightActiveChat();
  }

  function updateChatList() {
    const chatListEl = document.getElementById('chatList');
    if (!chatListEl) return;
    
    const chats = Object.entries(_chats)
      .filter(([id, chat]) => chat.participants && chat.participants.includes(_currentUser.uid))
      .sort((a, b) => {
        const aTime = a[1].lastMessage?.timestamp || a[1].createdAt;
        const bTime = b[1].lastMessage?.timestamp || b[1].createdAt;
        return new Date(bTime) - new Date(aTime);
      });
    
    chatListEl.innerHTML = chats.map(([id, chat]) => {
      const unreadCount = chat.unreadCounts?.[_currentUser.uid] || 0;
      const isActive = _activeChat?.id === id;
      
      let displayName, avatar;
      
      if (chat.type === 'direct') {
        const otherUserId = chat.participants.find(uid => uid !== _currentUser.uid);
        // This would need to be loaded from user profiles
        displayName = otherUserId;
        avatar = '👤';
      } else {
        displayName = chat.name;
        avatar = '👥';
      }
      
      const lastMsg = chat.lastMessage;
      const lastMsgText = lastMsg ? 
        (lastMsg.senderId === _currentUser.uid ? 'Tu: ' : '') + lastMsg.content : 
        'Nessun messaggio';
      
      return `
        <div class="chat-item ${isActive ? 'active' : ''}" onclick="Chat.setActiveChat('${chat.type}', '${id}')">
          <div class="chat-avatar">${avatar}</div>
          <div class="chat-info">
            <div class="chat-name">${displayName}</div>
            <div class="chat-last-message">${lastMsgText}</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">${formatTime(lastMsg?.timestamp || chat.createdAt)}</div>
            ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function updateMessageList() {
    const messageListEl = document.getElementById('messageList');
    if (!messageListEl || !_activeChat) return;
    
    const messages = _messages[_activeChat.id] || [];
    
    messageListEl.innerHTML = messages.map(msg => {
      const isOwn = msg.senderId === _currentUser.uid;
      const isRead = msg.read[_currentUser.uid];
      
      let messageContent;
      
      if (msg.type === 'text') {
        messageContent = `<div class="message-text">${escapeHtml(msg.content)}</div>`;
      } else if (msg.type === 'photo') {
        messageContent = `<img src="${msg.content}" alt="Photo" class="message-photo" onclick="Chat.viewPhoto('${msg.content}')">`;
      } else if (msg.type === 'system') {
        return `
          <div class="message-system">
            <div class="message-content">${msg.content}</div>
            <div class="message-time">${formatTime(msg.timestamp)}</div>
          </div>
        `;
      }
      
      return `
        <div class="message ${isOwn ? 'own' : 'other'}" data-message-id="${msg.id}">
          <div class="message-content-wrapper">
            ${!isOwn ? `<div class="message-sender">${msg.senderName}</div>` : ''}
            ${messageContent}
            <div class="message-meta">
              <span class="message-time">${formatTime(msg.timestamp)}</span>
              ${isOwn ? `
                <span class="message-status ${isRead ? 'read' : 'sent'}">
                  ${isRead ? '✓✓' : '✓'}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Scroll to bottom
    messageListEl.scrollTop = messageListEl.scrollHeight;
  }

  function updateChatHeader() {
    const headerEl = document.getElementById('chatHeader');
    if (!headerEl || !_activeChat) return;
    
    const chat = _chats[_activeChat.id];
    if (!chat) return;
    
    let title, subtitle;
    
    if (chat.type === 'direct') {
      const otherUserId = chat.participants.find(uid => uid !== _currentUser.uid);
      title = otherUserId; // Would load from user profile
      subtitle = _onlineUsers.has(otherUserId) ? 'Online' : 'Offline';
    } else {
      title = chat.name;
      subtitle = `${chat.participants.length} partecipanti`;
    }
    
    headerEl.innerHTML = `
      <div class="chat-header-info">
        <h3>${title}</h3>
        <p>${subtitle}</p>
      </div>
      <div class="chat-header-actions">
        <button onclick="Chat.showChatInfo()">ℹ️</button>
      </div>
    `;
  }

  function highlightActiveChat() {
    document.querySelectorAll('.chat-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.chat-item[onclick*="${_activeChat.id}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }

  function updateOnlineStatus() {
    // Update online indicators in chat list
    document.querySelectorAll('.chat-item').forEach(item => {
      const userId = item.dataset.userId;
      if (userId && _onlineUsers.has(userId)) {
        item.classList.add('online');
      } else {
        item.classList.remove('online');
      }
    });
  }

  function updateUnreadCounts() {
    let totalUnread = 0;
    
    Object.values(_chats).forEach(chat => {
      if (chat.participants && chat.participants.includes(_currentUser.uid)) {
        const count = chat.unreadCounts?.[_currentUser.uid] || 0;
        totalUnread += count;
      }
    });
    
    // Update badge in navigation
    const badgeEl = document.querySelector('[data-page="chat"] .nav-badge');
    if (badgeEl) {
      badgeEl.textContent = totalUnread > 0 ? totalUnread : '';
      badgeEl.style.display = totalUnread > 0 ? 'flex' : 'none';
    }
  }

  // ─── UTILITIES ───────────────────────────────────────────────
  function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'ora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} g`;
    
    return date.toLocaleDateString('it-IT');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function viewPhoto(photoSrc) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="photo-viewer">
        <img src="${photoSrc}" alt="Photo" style="max-width:90vw; max-height:90vh; object-fit:contain;">
        <button class="photo-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
  }

  function showChatInfo() {
    if (!_activeChat) return;
    
    const chat = _chats[_activeChat.id];
    if (!chat) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal">
        <h3>Informazioni Chat</h3>
        <div class="modal-body">
          <div class="fg">
            <label>Tipo</label>
            <input type="text" class="fc" value="${chat.type === 'direct' ? 'Chat diretta' : 'Gruppo'}" readonly>
          </div>
          ${chat.type === 'group' ? `
            <div class="fg">
              <label>Nome</label>
              <input type="text" class="fc" value="${chat.name}" readonly>
            </div>
            <div class="fg">
              <label>Partecipanti</label>
              <div class="participant-list">
                ${chat.participants.map(uid => `<div class="participant">${uid}</div>`).join('')}
              </div>
            </div>
          ` : ''}
          <div class="fg">
            <label>Creato il</label>
            <input type="text" class="fc" value="${new Date(chat.createdAt).toLocaleString('it-IT')}" readonly>
          </div>
        </div>
        <div class="modal-btns">
          <button class="btn-a btn-d" onclick="this.closest('.modal-overlay').remove()">Chiudi</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
  }

  // ─── CLEANUP ───────────────────────────────────────────────
  function cleanup() {
    if (_currentUser) {
      KZ.update(`users/${_currentUser.uid}/status`, {
        online: false,
        lastSeen: new Date().toISOString()
      });
    }
    
    // Clear typing timeouts
    _typingUsers.forEach(timeout => clearTimeout(timeout));
    _typingUsers.clear();
  }

  return {
    init,
    createDirectChat,
    createGroupChat,
    sendMessage,
    sendPhoto,
    markMessageAsRead,
    markAllAsRead,
    startTyping,
    stopTyping,
    setActiveChat,
    viewPhoto,
    showChatInfo,
    cleanup
  };

})();
