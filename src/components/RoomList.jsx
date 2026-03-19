import { Hash, Plus, Key, Search } from 'lucide-react';

export const RoomList = ({ 
  rooms, 
  roomsLoading, 
  activeRoom, 
  setActiveRoom, 
  setActiveDM, 
  isCreatingRoom, 
  setIsCreatingRoom, 
  newRoomName, 
  setNewRoomName, 
  handleCreateRoom,
  joinCode,
  setJoinCode,
  isJoiningRoom,
  setIsJoiningRoom,
  handleJoinRoom,
  joinName,
  setJoinName,
  isJoiningByName,
  setIsJoiningByName,
  handleJoinByName
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2 group">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <Hash className="w-3 h-3" /> Rooms
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => { setIsJoiningByName(!isJoiningByName); setIsJoiningRoom(false); setIsCreatingRoom(false); }}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all"
            title="Join Room by Name"
          >
            <Search className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setIsJoiningRoom(!isJoiningRoom); setIsJoiningByName(false); setIsCreatingRoom(false); }}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all"
            title="Join Room by Code"
          >
            <Key className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setIsCreatingRoom(!isCreatingRoom); setIsJoiningRoom(false); setIsJoiningByName(false); }}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all"
            title="Create New Room"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isCreatingRoom && (
        <form onSubmit={handleCreateRoom} className="mb-2">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Room name..."
            className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
            autoFocus
          />
        </form>
      )}

      {isJoiningRoom && (
        <form onSubmit={handleJoinRoom} className="mb-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code..."
            className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
            autoFocus
          />
        </form>
      )}

      {isJoiningByName && (
        <form onSubmit={handleJoinByName} className="mb-2">
          <input
            type="text"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder="Enter room name..."
            className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
            autoFocus
          />
        </form>
      )}

      <div className="space-y-1">
        {roomsLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg">
              <div className="w-4 h-4 rounded bg-white/5 animate-pulse shrink-0" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-24" />
            </div>
          ))
        ) : rooms.map(room => (
          <button
            key={room.id}
            onClick={() => { setActiveRoom(room); setActiveDM(null); }}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-all ${
              activeRoom?.id === room.id 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Hash className={`w-4 h-4 ${activeRoom?.id === room.id ? 'text-white' : 'opacity-50'}`} />
              <span className="truncate">{room.name}</span>
            </div>
            {room.code && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                activeRoom?.id === room.id ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'
              }`}>
                {room.code}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
