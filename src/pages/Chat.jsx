import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ChatWindow } from '../components/ChatWindow';
import { HomeDashboard } from '../components/HomeDashboard';
import { usePresence } from '../hooks/usePresence';
import { useRooms } from '../hooks/useRooms';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';

export const Chat = () => {
  const { profile } = useAuth();
  const { rooms, createRoom, joinRoomByCode, joinRoomByName, loading: roomsLoading } = useRooms();
  const [dms, setDms] = useState([]);
  const [dmsLoading, setDmsLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeDM, setActiveDM] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { onlineUsers } = usePresence();

  useEffect(() => {
    if (!profile || !supabase) {
      setDmsLoading(false);
      return;
    }

    const fetchDMs = async () => {
      setDmsLoading(true);
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          sender_id,
          receiver_id,
          created_at,
          content,
          sender:profiles!sender_id(id, full_name, avatar_url),
          receiver:profiles!receiver_id(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching DMs:', error);
        setDmsLoading(false);
        return;
      }

      const uniqueUsers = new Map();
      data.forEach(msg => {
        const otherUser = msg.sender_id === profile.id ? msg.receiver : msg.sender;
        if (otherUser && !uniqueUsers.has(otherUser.id)) {
          uniqueUsers.set(otherUser.id, {
            ...otherUser,
            lastMessage: msg.content || 'Attachment',
            lastMessageTime: msg.created_at
          });
        }
      });

      setDms(Array.from(uniqueUsers.values()));
      setDmsLoading(false);
    };

    fetchDMs();

    const subscription = supabase
      .channel('public:direct_messages_chat')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'direct_messages',
        filter: `sender_id=eq.${profile.id}`
      }, fetchDMs)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'direct_messages',
        filter: `receiver_id=eq.${profile.id}`
      }, fetchDMs)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden relative">
      <Sidebar 
        rooms={rooms}
        roomsLoading={roomsLoading}
        createRoom={createRoom}
        joinRoomByCode={joinRoomByCode}
        joinRoomByName={joinRoomByName}
        dms={dms}
        dmsLoading={dmsLoading}
        activeRoom={activeRoom} 
        setActiveRoom={(room) => {
          setActiveRoom(room);
          setActiveDM(null);
          setMobileOpen(false);
        }}
        activeDM={activeDM}
        setActiveDM={(dm) => {
          setActiveDM(dm);
          setActiveRoom(null);
          setMobileOpen(false);
        }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onlineUsers={onlineUsers}
      />
      {activeRoom || activeDM ? (
        <ChatWindow 
          activeRoom={activeRoom} 
          activeDM={activeDM}
          setMobileOpen={setMobileOpen}
          onlineUsers={onlineUsers}
          rooms={rooms}
          dms={dms}
        />
      ) : (
        <HomeDashboard 
          rooms={rooms}
          dms={dms}
          onlineUsers={onlineUsers}
          setActiveRoom={setActiveRoom}
          setActiveDM={setActiveDM}
        />
      )}
    </div>
  );
};
