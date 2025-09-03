import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ActionExecution } from '@/types/execution';
import { useNotificationStore } from '@/stores/notificationStore';

interface NotificationItemProps {
  execution: ActionExecution;
}

export function NotificationItem({ execution }: NotificationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { markAsRead, deleteExecution } = useNotificationStore();

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!execution.is_read) {
      markAsRead(execution.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteExecution(execution.id);
  };

  const getStatusIcon = () => {
    switch (execution.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (execution.status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-3 cursor-pointer transition-all",
        !execution.is_read ? "bg-blue-50 border-blue-200" : "bg-white",
        "hover:shadow-md"
      )}
      onClick={handleExpand}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <button className="mt-0.5">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{execution.action_name}</span>
              {!execution.is_read && (
                <Badge variant="secondary" className="text-xs">New</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span>{formatDistanceToNow(new Date(execution.created_at), { addSuffix: true })}</span>
              {execution.duration_ms && (
                <span>• {formatDuration(execution.duration_ms)}</span>
              )}
              {execution.response_status && (
                <span>• Status {execution.response_status}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          <Badge className={getStatusColor()}>
            {execution.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          {/* Request Details */}
          <div>
            <h4 className="text-sm font-medium mb-1">Request</h4>
            <div className="bg-gray-50 rounded p-2 text-xs font-mono">
              <div className="flex gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {execution.request_method}
                </Badge>
                <span className="text-gray-600 truncate">{execution.request_url}</span>
              </div>
              {execution.request_payload && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-600">Payload</summary>
                  <pre className="mt-1 overflow-x-auto">
                    {JSON.stringify(execution.request_payload, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>

          {/* Response Details */}
          {execution.status !== 'pending' && (
            <div>
              <h4 className="text-sm font-medium mb-1">Response</h4>
              <div className="bg-gray-50 rounded p-2 text-xs font-mono">
                {execution.error_message ? (
                  <div className="text-red-600">{execution.error_message}</div>
                ) : execution.response_body ? (
                  <details>
                    <summary className="cursor-pointer text-gray-600">Body</summary>
                    <pre className="mt-1 overflow-x-auto max-h-40 overflow-y-auto">
                      {execution.response_body}
                    </pre>
                  </details>
                ) : (
                  <span className="text-gray-500">No response body</span>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-gray-500">
            Executed at {format(new Date(execution.created_at), 'PPpp')}
          </div>
        </div>
      )}
    </div>
  );
}