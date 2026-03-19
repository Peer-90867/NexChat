import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

export const useMessages = (roomId, isDM = false) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId || !user || !supabase) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        if (isDM) {
          const { data, error } = await supabase
            .from('direct_messages')
            .select(`
              *,
              sender:profiles!sender_id(id, full_name, avatar_url),
              receiver:profiles!receiver_id(id, full_name, avatar_url)
            `)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${roomId}),and(sender_id.eq.${roomId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) throw error;
          setMessages(data.reverse());
        } else {
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              user:profiles!user_id(id, full_name, avatar_url)
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) throw error;
          setMessages(data.reverse());
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channelName = isDM ? `dm_${[user.id, roomId].sort().join('_')}` : `room_${roomId}`;
    const table = isDM ? 'direct_messages' : 'messages';
    
    const filter = isDM 
      ? `sender_id=in.(${user.id},${roomId}),receiver_id=in.(${user.id},${roomId})`
      : `room_id=eq.${roomId}`;

    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter }, async (payload) => {
        // Fetch the user profile for the new message
        const newMsg = payload.new;
        
        if (isDM) {
          // Check if the message is actually between these two users
          const isRelevant = (newMsg.sender_id === user.id && newMsg.receiver_id === roomId) ||
                             (newMsg.sender_id === roomId && newMsg.receiver_id === user.id);
          
          if (!isRelevant) return;

          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();
            
          const { data: receiverData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMsg.receiver_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, sender: senderData, receiver: receiverData }]);
        } else {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMsg.user_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, user: userData }]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [roomId, isDM, user]);

  const sendMessage = async (content, fileUrl = null, fileType = null, fileName = null, parentId = null) => {
    if (!content && !fileUrl) return;
    if (!supabase) return;

    try {
      if (isDM) {
        const { error } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            receiver_id: roomId,
            content,
            file_url: fileUrl,
            file_type: fileType,
            file_name: fileName,
            parent_id: parentId,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('messages')
          .insert({
            room_id: roomId,
            user_id: user.id,
            content,
            file_url: fileUrl,
            file_type: fileType,
            file_name: fileName,
            parent_id: parentId,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return { messages, loading, sendMessage };
};
