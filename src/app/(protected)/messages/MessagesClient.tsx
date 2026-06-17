'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  Sidebar,
  ConversationList,
  Conversation,
  Avatar,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';

interface UserSummary {
  id: string;
  name: string;
  username: string;
  profilePhoto: string | null;
}

interface ConversationData {
  id: number;
  name: string;
  type: string;
  members: UserSummary[];
  lastMessage: {
    content: string;
    senderName: string;
    createdAt: string;
  } | null;
  hasUnread: boolean;
}

interface MessageData {
  id: number;
  content: string;
  createdAt: string;
  senderId: string;
  sender: UserSummary;
}

export function MessagesClient({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: number) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Poll for new messages when a conversation is active
  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv);
      pollRef.current = setInterval(() => {
        loadMessages(activeConv);
        loadConversations();
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConv, loadMessages, loadConversations]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeConv || !text.trim()) return;

      // Optimistic update
      const optimistic: MessageData = {
        id: Date.now(),
        content: text,
        createdAt: new Date().toISOString(),
        senderId: userId,
        sender: { id: userId, name: 'You', username: '', profilePhoto: null },
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await fetch(`/api/conversations/${activeConv}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        });
        if (res.ok) {
          loadMessages(activeConv);
        }
      } catch (e) {
        console.error('Failed to send message', e);
      }
    },
    [activeConv, userId, loadMessages],
  );

  const activeConvData = conversations.find((c) => c.id === activeConv);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-4 text-4xl font-bold">Messages</h1>
      <div
        style={{
          height: 'calc(100vh - 160px)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(0, 230, 150, 0.15)',
        }}
      >
        <MainContainer>
          <Sidebar position="left" style={{ background: '#0e161c', borderRight: '1px solid rgba(0,230,150,0.1)' }}>
            <ConversationList style={{ background: '#0e161c' }}>
              {loading ? (
                <Conversation name="Loading..." />
              ) : conversations.length === 0 ? (
                <Conversation
                  name="No conversations yet"
                  info="Visit a profile and send a message"
                />
              ) : (
                conversations.map((conv) => (
                  <Conversation
                    key={conv.id}
                    name={conv.name}
                    info={conv.lastMessage?.content || 'No messages yet'}
                    lastActivityTime={
                      conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : undefined
                    }
                    unreadCnt={conv.hasUnread ? 1 : 0}
                    active={conv.id === activeConv}
                    onClick={() => setActiveConv(conv.id)}
                    style={{
                      background: conv.id === activeConv ? 'rgba(0,230,150,0.1)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Avatar
                      name={conv.name}
                      style={{
                        background: 'rgba(156, 39, 176, 0.3)',
                        color: '#c084fc',
                      }}
                    />
                  </Conversation>
                ))
              )}
            </ConversationList>
          </Sidebar>

          <ChatContainer
            style={{ background: '#080c10' }}
          >
            {activeConvData ? (
              <>
                <ConversationHeader style={{ background: '#0e161c', borderBottom: '1px solid rgba(0,230,150,0.1)' }}>
                  <Avatar
                    name={activeConvData.name}
                    style={{
                      background: 'rgba(156, 39, 176, 0.3)',
                      color: '#c084fc',
                    }}
                  />
                  <ConversationHeader.Content>
                    <span style={{ color: '#dceae6', fontWeight: 600 }}>
                      {activeConvData.name}
                    </span>
                  </ConversationHeader.Content>
                </ConversationHeader>

                <MessageList
                  style={{ background: '#080c10' }}
                >
                  {messages.map((msg) => (
                    <Message
                      key={msg.id}
                      model={{
                        message: msg.content,
                        sentTime: msg.createdAt,
                        sender: msg.sender.name || 'Unknown',
                        direction: msg.senderId === userId ? 'outgoing' : 'incoming',
                        position: 'single',
                      }}
                    >
                      {msg.senderId !== userId && (
                        <Avatar
                          name={msg.sender.name || '?'}
                          style={{
                            background: 'rgba(0, 230, 150, 0.2)',
                            color: '#00e696',
                          }}
                        />
                      )}
                      <Message.Header
                        sender={msg.senderId === userId ? '' : (msg.sender.name || 'Unknown')}
                        sentTime={timeAgo(msg.createdAt)}
                      />
                    </Message>
                  ))}
                </MessageList>

                <MessageInput
                  placeholder="Type a message..."
                  attachButton={false}
                  onSend={sendMessage}
                  style={{
                    background: '#0e161c',
                    borderTop: '1px solid rgba(0,230,150,0.1)',
                  }}
                />
              </>
            ) : (
              <MessageList style={{ background: '#080c10' }}>
                <MessageList.Content
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: '#8ca59b',
                    fontSize: '1.1rem',
                  }}
                >
                  <p style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</p>
                  <p>Select a conversation or start a new one</p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '4px' }}>
                    Visit someone&apos;s profile to send them a message
                  </p>
                </MessageList.Content>
              </MessageList>
            )}
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}
