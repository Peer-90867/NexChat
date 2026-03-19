import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

export const useTyping = (channelId) => {
  const [typingUsers, setTypingUsers] = useState(new Set());
  const { user, profile } = useAuth();
  const channelRef = useRef(null);

  useEffect(() => {
    if (!user || !supabase || !channelId) {
      setTypingUsers(new Set());
      return;
    }

    const channel = supabase.channel(`typing:${channelId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const typing = new Set();
        Object.keys(newState).forEach(key => {
          if (key !== user.id && newState[key][0]?.isTyping) {
            typing.add(newState[key][0].full_name || 'Someone');
          }
        });
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, channelId]);

  const setTyping = async (isTyping) => {
    if (channelRef.current) {
      await channelRef.current.track({
        isTyping,
        full_name: profile?.full_name,
        userId: user.id
      });
    }
  };

  return { typingUsers, setTyping };
};
