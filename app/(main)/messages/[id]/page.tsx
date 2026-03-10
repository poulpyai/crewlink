'use client';

import { useEffect, useState, useRef, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Message = {
  id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type Conversation = {
  id: string;
  subject: string;
  pilot_id: string;
  provider_id: string;
  provider_type: string;
};

export default function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the async params (Next.js 16 requirement)
  const { id: conversationId } = use(params);
  const supabase = createClient();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    loadConversation();
    loadMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          // Only add if not already in the list (avoid duplicates from optimistic updates)
          setMessages((current) => {
            if (current.find(m => m.id === newMessage.id)) {
              return current; // Already exists
            }
            // Replace temp message if exists
            const tempMsgIndex = current.findIndex(m => m.id.toString().startsWith('temp-'));
            if (tempMsgIndex !== -1 && 
                current[tempMsgIndex].content === newMessage.content &&
                current[tempMsgIndex].sender_id === newMessage.sender_id) {
              // Replace temp with real message
              const updated = [...current];
              updated[tempMsgIndex] = newMessage;
              return updated;
            }
            return [...current, newMessage];
          });
          
          // Mark as read when new messages arrive (from other person)
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when conversation is loaded
  useEffect(() => {
    if (conversation && currentUserId && messages.length > 0) {
      markAsRead();
    }
  }, [conversation, currentUserId]);

  async function loadConversation() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      // Get user role
      const { data: userData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData) {
        setCurrentUserRole(userData.role);
      }

      const { data: convData, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error loading conversation:', error);
        return;
      }

      // Check if user is part of this conversation
      if (convData.pilot_id !== user.id && convData.provider_id !== user.id) {
        console.error('User not authorized for this conversation');
        router.push('/messages');
        return;
      }

      setConversation(convData);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function loadMessages() {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
      } else {
        setMessages(messagesData || []);
        // markAsRead is now called via useEffect when conversation is loaded
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead() {
    try {
      if (!conversation || !currentUserId) {
        console.log('Cannot mark as read: conversation or userId not loaded');
        return;
      }

      const isPilot = conversation.pilot_id === currentUserId;
      const updateField = isPilot ? 'unread_count_pilot' : 'unread_count_provider';

      console.log('Marking as read:', updateField, 'for conversation', conversationId);

      const { error } = await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversationId);

      if (error) {
        console.error('Error marking as read:', error);
      } else {
        console.log('Marked as read successfully');
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage.trim();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Optimistic UI update - add message immediately
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        sender_type: currentUserRole,
        content: messageText,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: currentUserRole,
          content: messageText,
        });

      if (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        alert('Failed to send message: ' + error.message);
        setNewMessage(messageText); // Restore message
      }
    } catch (err: any) {
      console.error('Error:', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function isMyMessage(message: Message) {
    return message.sender_id === currentUserId;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center text-neutral-400">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center text-neutral-400">Conversation not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/messages')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold text-white">{conversation.subject}</h1>
          <p className="text-sm text-neutral-400 capitalize">{conversation.provider_type}</p>
        </div>
      </div>

      {/* Messages Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMyMessage(message)
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-800 text-neutral-100'
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isMyMessage(message) ? 'text-primary-100' : 'text-neutral-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Message Input */}
        <div className="border-t border-neutral-800 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
              maxLength={1000}
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
