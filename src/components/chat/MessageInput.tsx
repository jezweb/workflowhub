import { useState, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { ChatAttachment } from '@/types/agent';
import { isSmallFile, formatFileSize, getFileTypeIcon } from '@/types/agent';

interface MessageInputProps {
  onSend: (content: string, attachments?: ChatAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({ onSend, disabled, placeholder = 'Type a message...' }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!content.trim() && attachments.length === 0) return;
    if (disabled) return;

    onSend(content, attachments);
    setContent('');
    setAttachments([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file count
    if (attachments.length + files.length > 10) {
      toast({
        title: 'Too many files',
        description: 'Maximum 10 attachments allowed per message',
        variant: 'destructive',
      });
      return;
    }

    for (const file of files) {
      try {
        // Validate file size (max 4MB per file)
        if (file.size > 4 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 4MB limit`,
            variant: 'destructive',
          });
          continue;
        }

        const attachment: ChatAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        };

        // For small files, encode as Base64
        if (isSmallFile(file.size)) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target?.result as string;
            attachment.data = base64.split(',')[1]; // Remove data:... prefix
            setAttachments(prev => [...prev, attachment]);
          };
          reader.readAsDataURL(file);
        } else {
          // For large files, we would need to upload to R2 first
          // For now, we'll store the file object and handle upload later
          attachment.data = 'LARGE_FILE_PLACEHOLDER'; // Will be handled by upload service
          setAttachments(prev => [...prev, attachment]);
        }
      } catch (error) {
        toast({
          title: 'File error',
          description: `Failed to process ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="space-y-2">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center space-x-2 px-2 py-1 bg-muted rounded border"
            >
              <span className="text-sm">{getFileTypeIcon(attachment.type)}</span>
              <span className="text-xs font-medium truncate max-w-32">
                {attachment.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeAttachment(attachment.id)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,text/*,.pdf,.doc,.docx,.json,.csv"
        />
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || attachments.length >= 10}
          title="Attach files"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-[120px] resize-none pr-12"
            rows={1}
          />
          
          {/* Send Button */}
          <Button
            size="sm"
            className="absolute right-1 bottom-1 h-8 w-8 p-0"
            onClick={handleSubmit}
            disabled={disabled || (!content.trim() && attachments.length === 0)}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
        {attachments.length > 0 && (
          <span className="ml-2">• {attachments.length}/10 files attached</span>
        )}
      </div>
    </div>
  );
}