import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Hash, Plus, Search, Settings, LogOut, Users, X, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRooms } from '../hooks/useRooms';
import { supabase } from '../supabaseClient';
import { UserAvatar } from './UserAvatar';
import { ProfileModal } from './ProfileModal';
import { NewDMModal } from './NewDMModal';
import { RoomList } from './RoomList';
import { DMList } from './DMList';
import { ActiveNow } from './ActiveNow';

export const Sidebar = ({ 
  activeRoom, 
  setActiveRoom, 
  activeDM, 
  setActiveDM, 
  onlineUsers, 
  mobileOpen, 
  setMobileOpen,
  rooms,
  roomsLoading,
  createRoom,
  joinRoomByCode,
  joinRoomByName,
  dms,
  dmsLoading
}) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isJoiningByName, setIsJoiningByName] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Removed local fetching logic, now handled in Chat.jsx

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const room = await createRoom(newRoomName, profile.id, newRoomCode);
    if (room) {
      setActiveRoom(room);
      setActiveDM(null);
      setNewRoomName('');
      setNewRoomCode('');
      setIsCreatingRoom(false);
    }
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

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(globalSearch.toLowerCase()));
  const filteredDMs = dms.filter(dm => dm.full_name.toLowerCase().includes(globalSearch.toLowerCase()));

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
        className={`fixed lg:relative z-50 w-80 bg-sidebar-bg border-r border-white/10 flex flex-col h-full shadow-2xl lg:shadow-none`}
      >
        {/* Header */}
        <div className="h-16 flex flex-col justify-center px-4 border-b border-white/10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="w-6 h-6 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-lg text-white block truncate">NexChat</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setActiveRoom(null);
                  setActiveDM(null);
                  setMobileOpen(false);
                }}
                className={`p-2 rounded-lg transition-colors ${!activeRoom && !activeDM ? 'bg-primary-purple/10 text-primary-purple' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title="Home Dashboard"
              >
                <Home className="w-5 h-5" />
              </button>
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
        </div>

        {/* Global Search */}
        <div className="px-4 py-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            <input 
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* Active Now Horizontal */}
          <ActiveNow 
            onlineUsers={onlineUsers}
            profile={profile}
            setActiveDM={setActiveDM}
            setActiveRoom={setActiveRoom}
          />

          {/* Rooms Section */}
          <RoomList 
            rooms={filteredRooms}
            roomsLoading={roomsLoading}
            activeRoom={activeRoom}
            setActiveRoom={setActiveRoom}
            setActiveDM={setActiveDM}
            isCreatingRoom={isCreatingRoom}
            setIsCreatingRoom={setIsCreatingRoom}
            newRoomName={newRoomName}
            setNewRoomName={setNewRoomName}
            newRoomCode={newRoomCode}
            setNewRoomCode={setNewRoomCode}
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
            dms={filteredDMs}
            dmsLoading={dmsLoading}
            activeDM={activeDM}
            setActiveDM={setActiveDM}
            setActiveRoom={setActiveRoom}
            onlineUsers={onlineUsers}
            profile={profile}
          />
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10 bg-sidebar-bg/50">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 flex-1 min-w-0 hover:bg-white/5 p-1.5 rounded-lg transition-colors"
            >
              <UserAvatar user={profile} size="sm" isOnline={true} status={profile?.status} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
                <p className={`text-xs ${
                  profile?.status === 'busy' ? 'text-red-500' :
                  profile?.status === 'away' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {profile?.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : 'Online'}
                </p>
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
        {isNewDMOpen && <NewDMModal 
          onlineUsers={onlineUsers}
          onClose={() => setIsNewDMOpen(false)} 
          onSelect={(dmUser) => {
            setActiveDM(dmUser);
            setActiveRoom(null);
            setIsNewDMOpen(false);
            setMobileOpen(false);
          }} 
        />}
      </motion.div>
    </>
  );
};
