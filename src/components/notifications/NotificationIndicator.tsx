import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/stores/notificationStore';
import { useEffect } from 'react';

export function NotificationIndicator() {
  const { unreadCount, fetchUnreadCount, openPanel } = useNotificationStore();

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={openPanel}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}