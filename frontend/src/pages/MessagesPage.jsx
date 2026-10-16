import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Building,
  User,
  Clock,
  CheckCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

const MessagesPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryConversationId = searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileViewChat, setMobileViewChat] = useState(false);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // 1. Fetch user conversations
  const fetchConversations = async (selectId = null) => {
    try {
      const res = await api.get('/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);

        // Determine which conversation to select
        const targetId = selectId || queryConversationId;
        if (targetId) {
          const found = res.data.conversations.find((c) => c._id === targetId);
          if (found) {
            setActiveConversation(found);
            setMobileViewChat(true);
          } else if (res.data.conversations.length > 0) {
            setActiveConversation(res.data.conversations[0]);
          }
        } else if (res.data.conversations.length > 0 && !activeConversation) {
          setActiveConversation(res.data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations(queryConversationId);
  }, [queryConversationId]);

  // 2. Fetch messages for the active conversation
  const fetchMessages = async (convId, isPolling = false) => {
    if (!convId) return;
    if (!isPolling) setLoadingMessages(true);
    try {
      const res = await api.get(`/conversations/${convId}/messages`);
      if (res.data.success) {
        setMessages((prev) => {
          // Only scroll if count changed or initial load
          if (prev.length !== res.data.messages.length) {
            setTimeout(() => scrollToBottom(!isPolling), 50);
          }
          return res.data.messages;
        });

        // Also update unread count in conversations state
        setConversations((prev) =>
          prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      if (!isPolling) {
        showToast(err.response?.data?.message || 'Error loading messages', 'error');
      }
    } finally {
      if (!isPolling) setLoadingMessages(false);
    }
  };

  // Trigger message load and setup 4s polling when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    fetchMessages(activeConversation._id, false);

    // Setup polling for near real-time updates
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(activeConversation._id, true);
    }, 4000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeConversation?._id]);

  // 3. Handle sending a message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() || !activeConversation || sending) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');
    setSending(true);

    try {
      const res = await api.post(`/conversations/${activeConversation._id}/messages`, {
        text: textToSend
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setTimeout(() => scrollToBottom(true), 50);

        // Update last message in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? {
                  ...c,
                  lastMessage: textToSend,
                  lastMessageAt: new Date().toISOString()
                }
              : c
          )
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send message', 'error');
      setNewMessageText(textToSend); // Restore text on failure
    } finally {
      setSending(false);
    }
  };

  // Helper to determine the other participant in conversation
  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    const isCurrentUserTenant = conv.tenant?._id === user?._id;
    return isCurrentUserTenant ? conv.owner : conv.tenant;
  };

  const filteredConversations = conversations.filter((c) => {
    const other = getOtherParticipant(c);
    const title = c.property?.title || '';
    const otherName = other?.name || '';
    const q = searchTerm.toLowerCase();
    return title.toLowerCase().includes(q) || otherName.toLowerCase().includes(q);
  });

  const otherParticipant = getOtherParticipant(activeConversation);

  return (
    <div className="container" style={{ padding: '24px 1.5rem 60px' }}>
      {/* Page Title & Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
          Messages & Conversations
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Direct communication between property owners and prospective guests / tenants.
        </p>
      </div>

      {/* Main Chat Layout Container */}
      <div
        className="card chat-container-card"
        style={{
          height: 'calc(100vh - 210px)',
          minHeight: '560px',
          overflow: 'hidden',
          padding: 0,
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {/* LEFT COLUMN: Conversation List */}
        <div
          style={{
            borderRight: '1px solid var(--border-color)',
            flexDirection: 'column',
            background: '#ffffff',
            height: '100%',
            overflow: 'hidden'
          }}
          className={`chat-sidebar ${mobileViewChat ? 'mobile-hide' : ''}`}
        >
          {/* Search Bar */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '0.85rem', height: '38px', borderRadius: '20px' }}
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConversations ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <MessageSquare size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#64748b' }}>No conversations found</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  When you inquire about a property, your chats will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isSelected = activeConversation?._id === conv._id;
                const propertyImg =
                  conv.property?.images && conv.property.images.length > 0
                    ? conv.property.images[0]
                    : '/datasets-images/image_0.jpg';

                return (
                  <div
                    key={conv._id}
                    onClick={() => {
                      setActiveConversation(conv);
                      setSearchParams({ conversationId: conv._id });
                      setMobileViewChat(true);
                    }}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: other?.role === 'owner' ? '#3b82f6' : '#10b981',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '1rem',
                          flexShrink: 0
                        }}
                      >
                        {other?.name ? other.name.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {other?.name || 'User'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2563eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.property?.title || 'Property Listing'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.775rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                            {conv.lastMessage || 'No messages yet'}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span
                              style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                padding: '2px 6px',
                                borderRadius: '10px'
                              }}
                            >
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Window */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#f8fafc',
            height: '100%',
            overflow: 'hidden'
          }}
          className={`chat-main ${!mobileViewChat ? 'mobile-hide' : ''}`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '12px 20px',
                  background: '#ffffff',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileViewChat(false)}
                    className="mobile-back-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#475569',
                      display: 'none'
                    }}
                    title="Back to conversations"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: otherParticipant?.role === 'owner' ? '#3b82f6' : '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      flexShrink: 0
                    }}
                  >
                    {otherParticipant?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
                        {otherParticipant?.name}
                      </span>
                      <span
                        className={`badge ${otherParticipant?.role === 'owner' ? 'badge-primary' : 'badge-success'}`}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {otherParticipant?.role === 'owner' ? 'Host' : 'Guest'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Re: {activeConversation.property?.title}</span>
                      {activeConversation.property?.price && (
                        <span style={{ fontWeight: '700', color: '#2563eb' }}>
                          (${Number(activeConversation.property.price).toLocaleString()}/night)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Property Link */}
                {activeConversation.property?._id && (
                  <Link
                    to={`/properties/${activeConversation.property._id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0, gap: '6px' }}
                  >
                    <Building size={14} /> View Listing <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              {/* Message Stream */}
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {loadingMessages ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
                    Loading message history...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8', maxWidth: '320px' }}>
                    <MessageSquare size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ color: '#475569', fontWeight: '700', marginBottom: '6px' }}>No messages yet</h4>
                    <p style={{ fontSize: '0.85rem' }}>
                      Say hello to {otherParticipant?.name || 'the host'} to ask about dates, pricing, or property details!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.sender?._id === user?._id || msg.sender === user?._id;
                    const timeString = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={msg._id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isSelf ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          alignSelf: isSelf ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            background: isSelf ? '#2563eb' : '#ffffff',
                            color: isSelf ? '#ffffff' : '#0f172a',
                            padding: '10px 16px',
                            borderRadius: isSelf ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            border: isSelf ? 'none' : '1px solid #e2e8f0',
                            boxShadow: 'var(--shadow-xs)',
                            fontSize: '0.9rem',
                            lineHeight: '1.45',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {msg.text}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#94a3b8',
                            marginTop: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0 4px'
                          }}
                        >
                          <span>{timeString}</span>
                          {isSelf && <CheckCheck size={13} color="#94a3b8" />}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '14px 20px',
                  background: '#ffffff',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <input
                  type="text"
                  placeholder={`Write a message to ${otherParticipant?.name || 'host'}...`}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="form-input"
                  style={{ flex: 1, fontSize: '0.9rem', height: '44px', borderRadius: '22px', paddingLeft: '18px' }}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim() || sending}
                  className="btn btn-primary"
                  style={{
                    borderRadius: '22px',
                    height: '44px',
                    padding: '0 20px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={16} />
                  <span>{sending ? 'Sending...' : 'Send'}</span>
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
              <MessageSquare size={48} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#475569', fontWeight: '700' }}>Select a conversation</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                Choose an existing chat from the list or message a property host from any property listing page.
              </p>
              <Link to="/properties" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
                Browse Properties
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
