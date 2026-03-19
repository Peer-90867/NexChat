import { Hash, Plus } from 'lucide-react';

export const RoomList = ({ rooms, roomsLoading, activeRoom, setActiveRoom, setActiveDM, isCreatingRoom, setIsCreatingRoom, newRoomName, setNewRoomName, handleCreateRoom }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2 group">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <Hash className="w-3 h-3" /> Rooms
        </h3>
        <button 
          onClick={() => setIsCreatingRoom(!isCreatingRoom)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
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
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              activeRoom?.id === room.id 
                ? 'bg-purple-600/20 text-purple-400 font-medium' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <Hash className="w-4 h-4 opacity-50" />
            <span className="truncate">{room.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
