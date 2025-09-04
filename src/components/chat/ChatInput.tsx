import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import useChatStore from '@/stores/chatStore';
import type { ChatAttachment } from '@/types/chat';

interface ChatInputProps {
  conversationId: string;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const { sendMessage, sendingMessage } = useChatStore();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId]);
  
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;
    
    // Send message
    await sendMessage(conversationId, trimmedMessage, attachments);
    
    // Clear input
    setMessage('');
    setAttachments([]);
    
    // Refocus textarea
    textareaRef.current?.focus();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Convert files to attachments (simplified - in production, you'd upload them)
    const newAttachments: ChatAttachment[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      // In production, you'd upload and get a URL
      // For now, we'll just store the file reference
    }));
    
    setAttachments([...attachments, ...newAttachments]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };
  
  return (
    <div className="space-y-2">
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <Badge key={attachment.id} variant="secondary" className="pr-1">
              <Paperclip className="h-3 w-3 mr-1" />
              <span className="text-xs">{attachment.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => removeAttachment(attachment.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sendingMessage}
            className="min-h-[80px] max-h-[200px] pr-10 resize-none"
          />
          
          {/* Attachment Button */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="absolute bottom-2 right-2 h-8 w-8 p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendingMessage}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
        
        {/* Send Button */}
        <Button
          type="submit"
          disabled={sendingMessage || (!message.trim() && attachments.length === 0)}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      
      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}