import { useEffect } from 'react';
import { X, Trash2, CheckCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationItem } from './NotificationItem';
import { useNotificationStore } from '@/stores/notificationStore';
import { startAutoRefresh, stopAutoRefresh } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';

export function NotificationPanel() {
  const {
    isOpen,
    executions,
    unreadCount,
    isLoading,
    error,
    filter,
    currentPage,
    totalPages,
    fetchExecutions,
    markAllAsRead,
    clearAll,
    setFilter,
    setPage,
    closePanel,
  } = useNotificationStore();

  useEffect(() => {
    if (isOpen) {
      fetchExecutions();
      startAutoRefresh();
    }
    return () => stopAutoRefresh();
  }, [isOpen, fetchExecutions]);

  if (!isOpen) return null;

  const handleFilterChange = (status?: 'success' | 'error' | 'pending') => {
    setFilter({ status: status || undefined });
  };

  const handleRefresh = () => {
    fetchExecutions();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={closePanel}
      />

      {/* Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-full sm:w-[480px] lg:w-[520px] bg-white shadow-xl z-50",
        "transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} unread</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closePanel}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Select 
                value={filter.status || 'all'} 
                onValueChange={(value) => handleFilterChange(value === 'all' ? undefined : value as any)}
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Errors</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              {executions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAll()}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading && executions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Loading...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error: {error}
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No notifications</p>
                <p className="text-sm mt-2">Action executions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {executions.map(execution => (
                  <NotificationItem key={execution.id} execution={execution} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Auto-refresh indicator */}
          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
            Auto-refreshes every 30 seconds
          </div>
        </div>
      </div>
    </>
  );
}