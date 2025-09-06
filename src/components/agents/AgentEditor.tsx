import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ModelSelector } from '@/components/ui/model-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { Agent, AgentConfiguration, CreateAgentRequest, OpenRouterModel, ModelsResponse } from '@/types/agent';

interface AgentEditorProps {
  agent: Agent | null;
  onClose: () => void;
  onSave: () => void;
}

export default function AgentEditor({ agent, onClose, onSave }: AgentEditorProps) {
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    description: '',
    avatar_url: '',
    system_prompt: '',
    webhook_url: '',
    webhook_method: 'POST',
    model: 'openai/gpt-4o',
    fallback_model: '',
    temperature: 0.7,
    max_tokens: 2000,
    is_active: true,
    is_public: false,
    configurations: [],
  });

  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (agent) {
      // Load existing agent data
      setFormData({
        name: agent.name,
        description: agent.description || '',
        avatar_url: agent.avatar_url || '',
        system_prompt: agent.system_prompt || '',
        webhook_url: agent.webhook_url,
        webhook_method: agent.webhook_method,
        model: agent.model,
        fallback_model: agent.fallback_model || '',
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        is_active: agent.is_active,
        is_public: agent.is_public,
        configurations: [],
      });

      // Load configurations
      loadConfigurations(agent.id);
    }
  }, [agent]);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setModelsLoading(true);
    try {
      const response = await api.get('/agents/openrouter/models') as ModelsResponse;
      if (response.success && response.models) {
        setModels(response.models);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      toast({
        title: 'Warning',
        description: 'Failed to load models. Using fallback list.',
        variant: 'default',
      });
    } finally {
      setModelsLoading(false);
    }
  };

  const loadConfigurations = async (agentId: string) => {
    try {
      const response = await api.get(`/agents/${agentId}`);
      if (response.success && response.configurations) {
        setFormData(prev => ({
          ...prev,
          configurations: response.configurations.map((c: AgentConfiguration) => ({
            config_key: c.config_key,
            config_value: c.config_value,
            config_type: c.config_type,
          })),
        }));
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Agent name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.webhook_url.trim()) {
      toast({
        title: 'Error',
        description: 'Webhook URL is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (agent) {
        // Update existing agent
        await api.put(`/agents/${agent.id}`, formData);
        toast({
          title: 'Success',
          description: 'Agent updated successfully',
        });
      } else {
        // Create new agent
        await api.post('/agents', formData);
        toast({
          title: 'Success',
          description: 'Agent created successfully',
        });
      }
      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: agent ? 'Failed to update agent' : 'Failed to create agent',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addConfiguration = () => {
    setFormData(prev => ({
      ...prev,
      configurations: [
        ...(prev.configurations || []),
        { config_key: '', config_value: '', config_type: 'header' as const },
      ],
    }));
  };

  const updateConfiguration = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      configurations: prev.configurations?.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ) || [],
    }));
  };

  const removeConfiguration = (index: number) => {
    setFormData(prev => ({
      ...prev,
      configurations: prev.configurations?.filter((_, i) => i !== index) || [],
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
          <DialogDescription>
            Configure your AI agent with webhook endpoints and parameters
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My AI Assistant"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A helpful AI assistant for..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div>
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="You are a helpful assistant..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <Label htmlFor="is_public">Public (allow others to use)</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <div>
              <Label htmlFor="webhook_url">Chat Webhook URL *</Label>
              <Input
                id="webhook_url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                placeholder="https://your-n8n-instance.com/webhook/chat-agent"
              />
            </div>

            <div>
              <Label htmlFor="webhook_method">HTTP Method</Label>
              <Select
                value={formData.webhook_method}
                onValueChange={(value: any) => setFormData({ ...formData, webhook_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Headers & Parameters</Label>
                <Button type="button" size="sm" variant="outline" onClick={addConfiguration}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {formData.configurations?.map((config, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={config.config_type}
                    onValueChange={(value) => updateConfiguration(index, 'config_type', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="parameter">Parameter</SelectItem>
                      <SelectItem value="secret">Secret</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Key"
                    value={config.config_key}
                    onChange={(e) => updateConfiguration(index, 'config_key', e.target.value)}
                  />
                  <Input
                    placeholder="Value"
                    type={config.config_type === 'secret' ? 'password' : 'text'}
                    value={config.config_value}
                    onChange={(e) => updateConfiguration(index, 'config_value', e.target.value)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeConfiguration(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="model">Primary Model</Label>
                <ModelSelector
                  value={formData.model}
                  onChange={(value) => setFormData({ ...formData, model: value })}
                  models={models}
                  loading={modelsLoading}
                  placeholder="Select primary model..."
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The main model to use for this agent
                </p>
              </div>

              <div>
                <Label htmlFor="fallback_model">Fallback Model (Optional)</Label>
                <ModelSelector
                  value={formData.fallback_model}
                  onChange={(value) => setFormData({ ...formData, fallback_model: value })}
                  models={models}
                  loading={modelsLoading}
                  placeholder="Select fallback model (optional)..."
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Optional fallback model if the primary model fails
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="temperature">
                Temperature: {formData.temperature}
              </Label>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={[formData.temperature || 0.7]}
                onValueChange={([value]) => setFormData({ ...formData, temperature: value || 0.7 })}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Controls randomness: 0 = focused, 2 = creative
              </p>
            </div>

            <div>
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) || 2000 })}
                min={1}
                max={8000}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum length of the response
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}