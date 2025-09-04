import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, TestTube, Info } from 'lucide-react';
import type { Action, ActionFormData, HttpMethod, ResponseType, OnSuccessAction } from '@/types/action';
import { HTTP_METHODS, RESPONSE_TYPES, DEFAULT_HEADERS, PAYLOAD_TEMPLATE_VARIABLES, COLOR_THEMES } from '@/types/action';
import type { ColorTheme, ButtonStyle } from '@/lib/appearance';
import { ActionEditor } from './ActionEditor';
import { actionsApi } from '@/lib/api';

interface ActionBuilderProps {
  action?: Action;
  onSave: (action: ActionFormData) => Promise<void>;
  onCancel: () => void;
}

export function ActionBuilder({ action, onSave, onCancel }: ActionBuilderProps) {
  const [formData, setFormData] = useState<ActionFormData>({
    name: action?.name || '',
    description: action?.description || '',
    method: action?.method || 'POST',
    url: action?.url || '',
    headers: action?.headers || DEFAULT_HEADERS,
    payload: action?.payload || {},
    response_type: action?.response_type || 'modal',
    icon: action?.icon || '⚡',
    color_theme: action?.color_theme || 'slate',
    button_style: action?.button_style || 'solid',
    on_success: action?.on_success || 'toast',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const handleSave = async () => {
    if (!formData.name || !formData.url) {
      alert('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save action:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAction = async () => {
    if (!formData.name || !formData.url) {
      alert('Please fill in required fields before testing');
      return;
    }

    try {
      // For new actions, we need to save first
      if (!action) {
        await onSave(formData);
        // TODO: Get the ID from result and test
        alert('Please save the action first before testing');
        return;
      }

      // Test existing action
      const response = await actionsApi.test(action.id);
      
      if (response.success) {
        // Show preview in alert (could be improved to modal)
        const preview = response.preview;
        alert(`Test Preview:\n\nURL: ${preview.url}\nMethod: ${preview.method}\nHeaders: ${JSON.stringify(preview.headers, null, 2)}\nPayload: ${JSON.stringify(preview.payload, null, 2)}`);
      } else {
        alert('Test failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Test failed:', error);
      alert('Failed to test action');
    }
  };

  const updateFormData = (updates: Partial<ActionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const getMethodBadge = (method: HttpMethod) => {
    const methodConfig = HTTP_METHODS.find(m => m.value === method);
    return (
      <Badge className={`${methodConfig?.color} text-white`}>
        {methodConfig?.label}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{action ? 'Edit Action' : 'Create New Action'}</CardTitle>
          <CardDescription>
            Configure a webhook action that can be triggered by buttons or events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="request">Request Config</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Action Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="e.g., Send to Slack"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="What does this action do?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value: HttpMethod) => updateFormData({ method: value })}
                >
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={`${method.color} text-white text-xs`}>
                            {method.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Webhook URL *</Label>
                <div className="flex gap-2">
                  {getMethodBadge(formData.method)}
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => updateFormData({ url: e.target.value })}
                    placeholder="https://api.example.com/webhook"
                    className="flex-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="request" className="space-y-4">
              <ActionEditor
                headers={formData.headers}
                payload={formData.payload}
                method={formData.method}
                onHeadersChange={(headers) => updateFormData({ headers })}
                onPayloadChange={(payload) => updateFormData({ payload })}
              />

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Available Variables</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PAYLOAD_TEMPLATE_VARIABLES.map(variable => (
                    <Badge key={variable} variant="outline" className="font-mono text-xs">
                      {variable}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Use these variables in your payload to inject dynamic data at execution time
                </p>
              </div>
            </TabsContent>

            <TabsContent value="response" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="response_type">Response Display Type</Label>
                <Select
                  value={formData.response_type}
                  onValueChange={(value: ResponseType) => updateFormData({ response_type: value })}
                >
                  <SelectTrigger id="response_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Response Handling</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Modal:</strong> Shows response in a popup dialog</li>
                  <li>• <strong>Toast:</strong> Brief notification in corner of screen</li>
                  <li>• <strong>Page:</strong> Redirects to a new page with response data</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Button Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => updateFormData({ icon: e.target.value })}
                  placeholder="Enter an emoji or leave default ⚡"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500">
                  Use any emoji like 📧, 🚀, 💬, or 🔄
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color_theme">Color Theme</Label>
                <Select
                  value={formData.color_theme || 'default'}
                  onValueChange={(value: ColorTheme) => updateFormData({ color_theme: value })}
                >
                  <SelectTrigger id="color_theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(COLOR_THEMES).map((theme) => {
                      const colors = COLOR_THEMES[theme as ColorTheme];
                      return (
                        <SelectItem key={theme} value={theme}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${colors.background}`} />
                            <span className="capitalize">{theme}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="button_style">Button Style</Label>
                <Select
                  value={formData.button_style}
                  onValueChange={(value: ButtonStyle) => updateFormData({ button_style: value })}
                >
                  <SelectTrigger id="button_style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid Color</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="on_success">Success Action</Label>
                <Select
                  value={formData.on_success}
                  onValueChange={(value: OnSuccessAction) => updateFormData({ on_success: value })}
                >
                  <SelectTrigger id="on_success">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="silent">Silent (no notification)</SelectItem>
                    <SelectItem value="toast">Toast Notification</SelectItem>
                    <SelectItem value="modal">Show Modal</SelectItem>
                    <SelectItem value="refresh">Refresh Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Button Preview</h4>
                <div className="flex gap-4">
                  <Button
                    className={`${
                      formData.button_style === 'gradient' && COLOR_THEMES[formData.color_theme || 'default'].gradient
                        ? COLOR_THEMES[formData.color_theme || 'default'].gradient
                        : COLOR_THEMES[formData.color_theme || 'default'].background
                    } ${COLOR_THEMES[formData.color_theme || 'default'].text}`}
                  >
                    <span className="mr-2">{formData.icon || '⚡'}</span>
                    {formData.name || 'Action Button'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTestAction}>
                <TestTube className="mr-2 h-4 w-4" />
                Test Action
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Action'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}