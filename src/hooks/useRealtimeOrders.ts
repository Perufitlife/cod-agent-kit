import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeOrders = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up real-time subscription for orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected:', payload);
          
          // Invalidate orders query to refetch data
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          
          // You could also update the cache directly for better UX
          // but invalidating ensures consistency
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

export default useRealtimeOrders;