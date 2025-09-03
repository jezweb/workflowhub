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
        "border rounded-lg p-4 cursor-pointer transition-all",
        !execution.is_read ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50",
        "hover:shadow-md"
      )}
      onClick={handleExpand}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button className="mt-0.5 flex-shrink-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          <div className="flex-1 min-w-0">
            {/* First row: Action name and badges */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-medium truncate">{execution.action_name}</span>
                {!execution.is_read && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">New</Badge>
                )}
              </div>
              <Badge className={cn(getStatusColor(), "flex-shrink-0")}>
                {execution.status}
              </Badge>
            </div>
            
            {/* Second row: Metadata */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(execution.created_at), { addSuffix: true })}
              </span>
              {execution.duration_ms && (
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">•</span>
                  Duration: {formatDuration(execution.duration_ms)}
                </span>
              )}
              {execution.response_status && (
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">•</span>
                  HTTP {execution.response_status}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
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
              {execution.request_payload && Object.keys(execution.request_payload).length > 0 ? (
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800 select-none flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                    Payload
                  </summary>
                  <pre className="mt-2 p-2 bg-white rounded border overflow-x-auto text-xs">
                    {JSON.stringify(execution.request_payload, null, 2)}
                  </pre>
                </details>
              ) : (
                <div className="mt-2 text-gray-500 italic">No payload data</div>
              )}
            </div>
          </div>

          {/* Response Details */}
          {execution.status !== 'pending' && (
            <div>
              <h4 className="text-sm font-medium mb-1">Response</h4>
              <div className="bg-gray-50 rounded p-2 text-xs font-mono">
                {execution.error_message ? (
                  <div className="text-red-600 p-1">{execution.error_message}</div>
                ) : execution.response_body && execution.response_body.trim() ? (
                  <details className="group">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800 select-none flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                      Body
                    </summary>
                    <pre className="mt-2 p-2 bg-white rounded border overflow-x-auto max-h-60 overflow-y-auto text-xs">
                      {(() => {
                        try {
                          // Try to parse and pretty-print JSON
                          const parsed = JSON.parse(execution.response_body);
                          return JSON.stringify(parsed, null, 2);
                        } catch {
                          // If not JSON, return as-is
                          return execution.response_body;
                        }
                      })()}
                    </pre>
                  </details>
                ) : (
                  <span className="text-gray-500 italic">No response body</span>
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