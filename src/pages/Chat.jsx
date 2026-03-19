import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ChatWindow } from '../components/ChatWindow';
import { usePresence } from '../hooks/usePresence';

export const Chat = () => {
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeDM, setActiveDM] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { onlineUsers } = usePresence();

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden relative">
      <Sidebar 
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
      <ChatWindow 
        activeRoom={activeRoom} 
        activeDM={activeDM}
        setMobileOpen={setMobileOpen}
        onlineUsers={onlineUsers}
      />
    </div>
  );
};
