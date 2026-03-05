'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Conversation = {
  id: string;
  subject: string;
  last_message_at: string;
  unread_count_pilot: number;
  unread_count_provider: number;
  pilot_id: string;
  provider_id: string;
  provider_type: string;
  messages: Array<{
    message_text: string;
    created_at: string;
  }>;
};

export default function MessagesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      console.log('Current user ID:', user.id);
      setCurrentUserId(user.id);

      // Get conversations where user is either pilot or provider
      const { data: convData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            message_text,
            created_at
          )
        `)
        .or(`pilot_id.eq.${user.id},provider_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      console.log('Query result - conversations:', convData);
      console.log('Query error:', error);

      if (error) {
        console.error('Error loading conversations:', error);
      } else {
        console.log('Loaded conversations:', convData);
        setConversations(convData || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  function getUnreadCount(conv: Conversation) {
    return conv.pilot_id === currentUserId 
      ? conv.unread_count_pilot 
      : conv.unread_count_provider;
  }

  function getLastMessage(conv: Conversation) {
    if (!conv.messages || conv.messages.length === 0) return 'No messages yet';
    const sorted = [...conv.messages].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].message_text;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center text-neutral-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
        <p className="text-neutral-400">
          Chat with training centers, examiners, and AMEs
        </p>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
            <p className="text-neutral-400 mb-4">
              Start by requesting a booking. After confirmation, you can chat with providers here.
            </p>
            <Button onClick={() => router.push('/simulators')}>
              Browse Simulators
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const unreadCount = getUnreadCount(conv);
            const lastMessage = getLastMessage(conv);
            
            return (
              <Card
                key={conv.id}
                className="hover:border-primary-500/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/messages/${conv.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Subject */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {conv.subject}
                        </h3>
                        {unreadCount > 0 && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-medium">
                            {unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Last Message Preview */}
                      <p className="text-sm text-neutral-400 truncate mb-2">
                        {lastMessage}
                      </p>

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(conv.last_message_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="ml-4 flex-shrink-0">
                      <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
