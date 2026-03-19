import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Hash, Plus, Search, Settings, LogOut, Users, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRooms } from '../hooks/useRooms';
import { supabase } from '../supabaseClient';
import { UserAvatar } from './UserAvatar';
import { ProfileModal } from './ProfileModal';
import { NewDMModal } from './NewDMModal';
import { RoomList } from './RoomList';
import { DMList } from './DMList';

export const Sidebar = ({ activeRoom, setActiveRoom, activeDM, setActiveDM, onlineUsers, mobileOpen, setMobileOpen }) => {
  const { user, profile, signOut } = useAuth();
  const { rooms, createRoom, joinRoomByCode, joinRoomByName, loading: roomsLoading } = useRooms();
  const navigate = useNavigate();
  const [dms, setDms] = useState([]);
  const [dmsLoading, setDmsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isJoiningByName, setIsJoiningByName] = useState(false);

  useEffect(() => {
    if (!profile || !supabase) {
      setDmsLoading(false);
      return;
    }

    const fetchDMs = async () => {
      setDmsLoading(true);
      // Get all unique users we have DMs with
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          sender_id,
          receiver_id,
          created_at,
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

      // Extract unique users
      const uniqueUsers = new Map();
      data.forEach(msg => {
        const otherUser = msg.sender_id === profile.id ? msg.receiver : msg.sender;
        if (otherUser && !uniqueUsers.has(otherUser.id)) {
          uniqueUsers.set(otherUser.id, otherUser);
        }
      });

      setDms(Array.from(uniqueUsers.values()));
      setDmsLoading(false);
    };

    fetchDMs();

    // Subscribe to new DMs
    const subscription = supabase
      .channel('public:direct_messages')
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
      }, async (payload) => {
        fetchDMs();
        
        // Show browser notification if we received a message
        if (Notification.permission === 'granted' && document.hidden) {
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.sender_id)
            .single();
            
          if (sender) {
            new Notification(`New message from ${sender.full_name}`, {
              body: payload.new.content || 'Sent an attachment',
              icon: '/vite.svg'
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const room = await createRoom(newRoomName, profile.id);
    if (room) {
      setActiveRoom(room);
      setActiveDM(null);
    }
    setNewRoomName('');
    setIsCreatingRoom(false);
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const room = await joinRoomByCode(joinCode, profile.id);
    if (room) {
      setActiveRoom(room);
      setActiveDM(null);
      setJoinCode('');
      setIsJoiningRoom(false);
    }
  };

  const handleJoinByName = async (e) => {
    e.preventDefault();
    if (!joinName.trim()) return;
    const room = await joinRoomByName(joinName, profile.id);
    if (room) {
      setActiveRoom(room);
      setActiveDM(null);
      setJoinName('');
      setIsJoiningByName(false);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={false}
        animate={{ 
          x: mobileOpen ? 0 : (window.innerWidth < 1024 ? -320 : 0) 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed lg:relative z-50 w-80 bg-[#1a1a1a] border-r border-white/10 flex flex-col h-full shadow-2xl lg:shadow-none`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-6 h-6 text-purple-500 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-lg text-white block truncate">NexChat</span>
              <span className="text-[10px] text-gray-500 truncate block">{profile?.full_name || 'User'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsNewDMOpen(true)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              title="New Direct Message"
            >
              <Users className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* Rooms Section */}
          <RoomList 
            rooms={rooms}
            roomsLoading={roomsLoading}
            activeRoom={activeRoom}
            setActiveRoom={setActiveRoom}
            setActiveDM={setActiveDM}
            isCreatingRoom={isCreatingRoom}
            setIsCreatingRoom={setIsCreatingRoom}
            newRoomName={newRoomName}
            setNewRoomName={setNewRoomName}
            handleCreateRoom={handleCreateRoom}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            isJoiningRoom={isJoiningRoom}
            setIsJoiningRoom={setIsJoiningRoom}
            handleJoinRoom={handleJoinRoom}
            joinName={joinName}
            setJoinName={setJoinName}
            isJoiningByName={isJoiningByName}
            setIsJoiningByName={setIsJoiningByName}
            handleJoinByName={handleJoinByName}
          />

          {/* Direct Messages Section */}
          <DMList 
            dms={dms}
            dmsLoading={dmsLoading}
            activeDM={activeDM}
            setActiveDM={setActiveDM}
            setActiveRoom={setActiveRoom}
            onlineUsers={onlineUsers}
          />
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10 bg-[#111111]">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 flex-1 min-w-0 hover:bg-white/5 p-1.5 rounded-lg transition-colors"
            >
              <UserAvatar user={profile} size="sm" isOnline={true} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </button>
            
            <div className="flex items-center gap-1">
              {user?.email === 'admin@yourchat.com' && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="Admin Dashboard"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}

              <button 
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
        {isNewDMOpen && <NewDMModal onClose={() => setIsNewDMOpen(false)} onSelect={(dmUser) => {
          setActiveDM(dmUser);
          setActiveRoom(null);
          setIsNewDMOpen(false);
          setMobileOpen(false);
        }} />}
      </motion.div>
    </>
  );
};
