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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table, filter }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [roomId, isDM, user]);

  useEffect(() => {
    if (!messages.length || !user || !roomId) return;
    
    const markAsRead = async () => {
      const table = isDM ? 'direct_messages' : 'messages';
      const unread = messages.filter(m => {
        const senderId = isDM ? m.sender_id : m.user_id;
        return senderId !== user.id && (!m.read_by || !m.read_by.includes(user.id));
      });
      
      if (unread.length === 0) return;
      
      // Mark all unread messages as read in one go if possible, or iterate
      for (const msg of unread) {
        const newReadBy = [...(msg.read_by || []), user.id];
        await supabase
          .from(table)
          .update({ read_by: newReadBy })
          .eq('id', msg.id);
      }
    };
    
    markAsRead();
  }, [messages, user, isDM, roomId]);

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

  const deleteMessage = async (messageId) => {
    const table = isDM ? 'direct_messages' : 'messages';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', messageId);
    if (error) throw error;
  };

  const editMessage = async (messageId, newContent) => {
    const table = isDM ? 'direct_messages' : 'messages';
    const { error } = await supabase
      .from(table)
      .update({ content: newContent, is_edited: true })
      .eq('id', messageId);
    if (error) throw error;
  };

  const addReaction = async (messageId, emoji) => {
    if (!user) return;
    const table = isDM ? 'direct_messages' : 'messages';
    const { data: msg } = await supabase
      .from(table)
      .select('reactions')
      .eq('id', messageId)
      .single();

    const reactions = msg?.reactions || {};
    if (!reactions[emoji]) reactions[emoji] = [];
    if (!reactions[emoji].includes(user.id)) {
      reactions[emoji].push(user.id);
      await supabase
        .from(table)
        .update({ reactions })
        .eq('id', messageId);
    }
  };

  const removeReaction = async (messageId, emoji) => {
    if (!user) return;
    const table = isDM ? 'direct_messages' : 'messages';
    const { data: msg } = await supabase
      .from(table)
      .select('reactions')
      .eq('id', messageId)
      .single();

    const reactions = msg?.reactions || {};
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
      await supabase
        .from(table)
        .update({ reactions })
        .eq('id', messageId);
    }
  };

  const togglePin = async (messageId, isPinned) => {
    const table = isDM ? 'direct_messages' : 'messages';
    await supabase
      .from(table)
      .update({ is_pinned: !isPinned })
      .eq('id', messageId);
  };

  return { 
    messages, 
    loading, 
    sendMessage, 
    deleteMessage, 
    editMessage,
    addReaction,
    removeReaction,
    togglePin
  };
};
