-- Enable full replica identity for realtime functionality
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.messages_inbox REPLICA IDENTITY FULL;
ALTER TABLE public.timers REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication for realtime updates
ALTER publication supabase_realtime ADD TABLE public.orders;
ALTER publication supabase_realtime ADD TABLE public.messages_inbox;
ALTER publication supabase_realtime ADD TABLE public.timers;