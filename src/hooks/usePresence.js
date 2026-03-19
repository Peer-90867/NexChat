import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

export const usePresence = () => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = new Set();
        Object.keys(newState).forEach(key => {
          users.add(key);
        });
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return { onlineUsers };
};
