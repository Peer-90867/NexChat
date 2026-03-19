import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

export const usePresence = () => {
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const { user, profile } = useAuth();

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
        const users = new Map();
        Object.keys(newState).forEach(key => {
          // Presence state returns an array of presences for each key
          // We just take the first one
          users.set(key, newState[key][0]);
        });
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => {
          const next = new Map(prev);
          next.set(key, newPresences[0]);
          return next;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            online_at: new Date().toISOString(),
            status: profile?.status || 'online'
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, profile?.status]);

  return { onlineUsers };
};
