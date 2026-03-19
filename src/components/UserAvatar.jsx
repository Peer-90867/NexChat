export const UserAvatar = ({ user, size = "md", isOnline = false }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-24 h-24 text-2xl"
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500'
  ];

  // Simple hash to consistently pick a color based on user ID or name
  const getColorIndex = (str) => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % colors.length;
  };

  const bgColor = colors[getColorIndex(user?.id || user?.full_name || 'default')];

  return (
    <div className="relative inline-block">
      {user?.avatar_url ? (
        <img 
          src={user.avatar_url} 
          alt={user.full_name || 'User'} 
          className={`${sizeClasses[size]} rounded-full object-cover border border-white/10`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full ${bgColor} flex items-center justify-center text-white font-bold border border-white/10`}>
          {getInitials(user?.full_name)}
        </div>
      )}
      
      {isOnline && (
        <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-green-500 ring-2 ring-[#111111]" />
      )}
    </div>
  );
};
