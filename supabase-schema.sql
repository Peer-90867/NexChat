-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_members table
CREATE TABLE room_members (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create direct_messages table
CREATE TABLE direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Rooms policies
CREATE POLICY "Rooms are viewable by members" ON rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_members 
      WHERE room_members.room_id = rooms.id 
      AND room_members.user_id = auth.uid()
    ) OR 
    -- Allow viewing rooms by name/code for joining
    true
  );

-- Note: The above 'true' for select is a bit loose but necessary for 'joinRoomByName' and 'joinRoomByCode' 
-- unless we use a separate RPC or public view. 
-- Let's refine it: allow select if member OR if searching by code/name specifically.
-- Actually, for 'joinRoomByName', we need to be able to find the room.
-- A better way is to allow anyone to select rooms, but restrict messages.

CREATE POLICY "Authenticated users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete rooms" ON rooms
  FOR DELETE USING (auth.jwt() ->> 'email' = 'admin@yourchat.com');

-- Room Members policies
CREATE POLICY "Users can view their own room memberships" ON room_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join rooms" ON room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Messages are viewable by room members" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_members 
      WHERE room_members.room_id = messages.room_id 
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM room_members 
      WHERE room_members.room_id = messages.room_id 
      AND room_members.user_id = auth.uid()
    )
  );

-- Direct Messages policies
CREATE POLICY "Users can view their own DMs" ON direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own DMs" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a view for conversations (unique pairs of users who have DM'd)
CREATE OR REPLACE VIEW conversations AS
SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
  id,
  sender_id,
  receiver_id,
  content,
  created_at
FROM direct_messages
ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC;
