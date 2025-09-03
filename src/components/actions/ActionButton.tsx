import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { actionsApi } from '@/lib/api';
import type { Action } from '@/types/action';
import { COLOR_THEMES } from '@/types/action';

interface ActionButtonProps {
  action: Action;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function ActionButton({ 
  action, 
  className = '', 
  showLabel = true,
  size = 'default',
  onSuccess,
  onError 
}: ActionButtonProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setIsExecuting(true);
    
    try {
      const response = await actionsApi.execute(action.id);
      
      // Handle response based on on_success setting
      const successType = action.on_success || 'toast';
      
      if (successType === 'toast') {
        toast({
          title: response.success ? 'Success' : 'Failed',
          description: response.success 
            ? `${action.name} executed successfully` 
            : 'Action failed to execute',
          variant: response.success ? 'default' : 'destructive',
        });
      } else if (successType === 'modal') {
        // TODO: Implement modal display
        toast({
          title: 'Response',
          description: response.data || 'Action completed',
        });
      } else if (successType === 'refresh') {
        if (response.success) {
          window.location.reload();
        }
      }
      // 'silent' does nothing
      
      if (response.success && onSuccess) {
        onSuccess();
      } else if (!response.success && onError) {
        onError(response);
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute action',
        variant: 'destructive',
      });
      if (onError) {
        onError(error);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Get color theme
  const colorTheme = COLOR_THEMES[action.color_theme || 'slate'];
  const buttonClass = action.button_style === 'gradient' && colorTheme.gradient
    ? colorTheme.gradient
    : colorTheme.background;

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    default: 'px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isExecuting}
      className={`${buttonClass} ${colorTheme.text} ${sizeClasses[size]} ${className}`}
      variant="default"
    >
      {isExecuting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <span className={showLabel ? "mr-2" : ""}>{action.icon || '⚡'}</span>
          {showLabel && action.name}
        </>
      )}
    </Button>
  );
}