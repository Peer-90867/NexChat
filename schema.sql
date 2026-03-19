-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Rooms Table
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Messages Table (Group Chat)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  file_url text,
  file_type text,
  file_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Direct Messages Table
create table public.direct_messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  file_url text,
  file_type text,
  file_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Conversations View (Optional, for easier DM listing)
create or replace view public.conversations as
select distinct
  least(sender_id, receiver_id) as user1_id,
  greatest(sender_id, receiver_id) as user2_id,
  max(created_at) as last_message_at,
  (select content from public.direct_messages dm2 
   where least(dm2.sender_id, dm2.receiver_id) = least(dm.sender_id, dm.receiver_id)
     and greatest(dm2.sender_id, dm2.receiver_id) = greatest(dm.sender_id, dm.receiver_id)
   order by created_at desc limit 1) as last_message
from public.direct_messages dm
group by least(sender_id, receiver_id), greatest(sender_id, receiver_id);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.messages enable row level security;
alter table public.direct_messages enable row level security;

-- RLS Policies

-- Profiles: Anyone can read profiles, users can update their own profile
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Rooms: Anyone can read rooms, authenticated users can create rooms, admin can delete
create policy "Rooms are viewable by everyone." on public.rooms for select using (true);
create policy "Authenticated users can create rooms." on public.rooms for insert with check (auth.role() = 'authenticated');
create policy "Admin can delete rooms." on public.rooms for delete using (
  exists (
    select 1 from auth.users 
    where auth.users.id = auth.uid() 
    and auth.users.email = 'admin@yourchat.com'
  )
);

-- Messages: Anyone can read messages, authenticated users can insert messages
create policy "Messages are viewable by everyone." on public.messages for select using (true);
create policy "Authenticated users can insert messages." on public.messages for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);
create policy "Admin can delete messages." on public.messages for delete using (
  exists (
    select 1 from auth.users 
    where auth.users.id = auth.uid() 
    and auth.users.email = 'admin@yourchat.com'
  )
);

-- Direct Messages: Users can only read and insert their own DMs
create policy "Users can view their own DMs." on public.direct_messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can insert their own DMs." on public.direct_messages for insert with check (auth.uid() = sender_id);

-- Storage Buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('chat-files', 'chat-files', true);

-- Storage Policies
create policy "Avatar images are publicly accessible." on storage.objects for select using (bucket_id = 'avatars');
create policy "Anyone can upload an avatar." on storage.objects for insert with check (bucket_id = 'avatars');
create policy "Anyone can update their avatar." on storage.objects for update using (bucket_id = 'avatars');

create policy "Chat files are publicly accessible." on storage.objects for select using (bucket_id = 'chat-files');
create policy "Authenticated users can upload chat files." on storage.objects for insert with check (bucket_id = 'chat-files' and auth.role() = 'authenticated');

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
