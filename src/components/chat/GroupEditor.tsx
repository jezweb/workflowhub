import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { BucketSelector } from '@/components/storage/BucketSelector';
import useChatStore from '@/stores/chatStore';
import { GROUP_COLORS, GROUP_ICONS } from '@/types/chat';
import type { Agent } from '@/types/agent';
import type { ConversationGroup } from '@/types/chat';

interface GroupEditorProps {
  group?: ConversationGroup | null;
  agents: Agent[];
  onClose: () => void;
  onSave: () => void;
}

export default function GroupEditor({ group, agents, onClose, onSave }: GroupEditorProps) {
  const { createGroup, updateGroup } = useChatStore();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    agent_id: group?.agent_id || agents[0]?.id || '',
    icon: group?.icon || '💬',
    color: group?.color || '#6b7280',
    shared_context: group?.shared_context || '',
    bucket_id: group?.bucket_id || '',
    is_pinned: group?.is_pinned || false,
  });
  
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.agent_id) return;
    
    setSaving(true);
    try {
      if (group) {
        await updateGroup(group.id, formData);
      } else {
        await createGroup(formData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save group:', error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? 'Edit Group' : 'Create Group'}</DialogTitle>
          <DialogDescription>
            {group 
              ? 'Edit your conversation group settings and shared context.'
              : 'Create a new group to organize your conversations with a specific agent and shared context.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Work Projects"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
            />
          </div>
          
          {/* Agent */}
          <div>
            <Label htmlFor="agent">Default Agent</Label>
            <Select
              value={formData.agent_id}
              onValueChange={(value) => setFormData({ ...formData, agent_id: value })}
            >
              <SelectTrigger id="agent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Appearance */}
          <div className="grid grid-cols-2 gap-4">
            {/* Icon */}
            <div>
              <Label>Icon</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                >
                  <span className="text-lg mr-2">{formData.icon}</span>
                  <span className="text-sm">Choose icon</span>
                </Button>
                
                {showIconPicker && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-md shadow-lg z-10 grid grid-cols-5 gap-1 max-w-[200px]">
                    {GROUP_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className="p-2 hover:bg-accent rounded text-lg"
                        onClick={() => {
                          setFormData({ ...formData, icon });
                          setShowIconPicker(false);
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Color */}
            <div>
              <Label htmlFor="color">Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger id="color">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 w-4 rounded-full" 
                      style={{ backgroundColor: formData.color }}
                    />
                    <span>
                      {GROUP_COLORS.find(c => c.value === formData.color)?.label}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {GROUP_COLORS.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-4 w-4 rounded-full" 
                          style={{ backgroundColor: color.value }}
                        />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Shared Context */}
          <div>
            <Label htmlFor="context">Shared Context (Optional)</Label>
            <Textarea
              id="context"
              value={formData.shared_context}
              onChange={(e) => setFormData({ ...formData, shared_context: e.target.value })}
              placeholder="Instructions that apply to all conversations in this group..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This context will be included with every message in this group
            </p>
          </div>
          
          {/* Storage Bucket */}
          <BucketSelector
            value={formData.bucket_id}
            onChange={(bucketId) => setFormData({ ...formData, bucket_id: bucketId })}
            context="chat"
            label="Storage Bucket for Attachments"
            description="Files attached to conversations in this group will be stored in the selected bucket"
          />
          
          {/* Pin Group */}
          <div className="flex items-center justify-between">
            <Label htmlFor="pin" className="flex-1">
              Pin to top
            </Label>
            <Switch
              id="pin"
              checked={formData.is_pinned}
              onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.name || !formData.agent_id}>
              {saving ? 'Saving...' : (group ? 'Save' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}