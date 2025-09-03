import { useState } from 'react';
import { Plus, Trash2, GripVertical, Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLOR_THEMES, ColorTheme, ButtonStyle } from '@/lib/appearance';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FormField, FieldType, Form, FormSettings } from '@/types/form';
import { FieldEditor } from './FieldEditor';
import { FormPreview } from './FormPreview';

interface FormBuilderProps {
  form?: Form;
  onSave: (form: Partial<Form>) => void;
}

export function FormBuilder({ form, onSave }: FormBuilderProps) {
  const [name, setName] = useState(form?.name || '');
  const [description, setDescription] = useState(form?.description || '');
  const [fields, setFields] = useState<FormField[]>(form?.fields || []);
  const [settings, setSettings] = useState<FormSettings>(form?.settings || {});
  const [isPublic, setIsPublic] = useState(form?.is_public || false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('build');

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: `New ${type} field`,
      name: `field_${Date.now()}`,
      width: 'full',
      required: false
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
    if (selectedField === id) {
      setSelectedField(null);
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      setFields(newFields);
    }
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      fields,
      settings,
      is_public: isPublic
    });
  };

  const fieldTypes: { type: FieldType; label: string }[] = [
    { type: 'text', label: 'Text' },
    { type: 'email', label: 'Email' },
    { type: 'number', label: 'Number' },
    { type: 'textarea', label: 'Text Area' },
    { type: 'select', label: 'Dropdown' },
    { type: 'checkbox', label: 'Checkbox' },
    { type: 'radio', label: 'Radio' },
    { type: 'date', label: 'Date' },
    { type: 'time', label: 'Time' },
    { type: 'file', label: 'File Upload' },
    { type: 'url', label: 'URL' },
    { type: 'tel', label: 'Phone' },
    { type: 'heading', label: 'Heading' },
    { type: 'separator', label: 'Separator' },
    { type: 'html', label: 'HTML Block' },
    { type: 'hidden', label: 'Hidden Field' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Form Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact Form"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Optional form description"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">Make form public</Label>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="build">Build</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="build" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {fieldTypes.map(({ type, label }) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addField(type)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No fields added yet. Click a field type above to add.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedField === field.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedField(field.id)}
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-gray-500">
                            {field.type} · {field.width} width {field.required && '· Required'}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveField(index, 'up');
                            }}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveField(index, 'down');
                            }}
                            disabled={index === fields.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteField(field.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Field Properties</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedField ? (
                  <FieldEditor
                    field={fields.find(f => f.id === selectedField)!}
                    onChange={(updates) => updateField(selectedField, updates)}
                  />
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Select a field to edit its properties
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <FormPreview
                name={name}
                description={description}
                fields={fields}
                settings={settings}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submission Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="responseType">Response Type</Label>
                <Select
                  value={settings.responseType || 'toast'}
                  onValueChange={(value: 'toast' | 'modal' | 'redirect' | 'html') => 
                    setSettings({ ...settings, responseType: value })
                  }
                >
                  <SelectTrigger id="responseType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toast">Toast - Quick notification</SelectItem>
                    <SelectItem value="modal">Modal - Show response in dialog</SelectItem>
                    <SelectItem value="redirect">Redirect - Go to URL after submission</SelectItem>
                    <SelectItem value="html">HTML - Display dynamic content from webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="submitButton">Submit Button Text</Label>
                <Input
                  id="submitButton"
                  value={settings.submitButtonText || ''}
                  onChange={(e) => setSettings({ ...settings, submitButtonText: e.target.value })}
                  placeholder="Submit"
                />
              </div>
              <div>
                <Label htmlFor="successMessage">Success Message</Label>
                <Textarea
                  id="successMessage"
                  value={settings.successMessage || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({ ...settings, successMessage: e.target.value })}
                  placeholder="Thank you for your submission!"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="redirectUrl">Redirect URL (for redirect response type)</Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  value={settings.redirectUrl || ''}
                  onChange={(e) => setSettings({ ...settings, redirectUrl: e.target.value })}
                  placeholder="https://example.com/thank-you"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhookUrl">Webhook URL (n8n, Make, Zapier, etc.)</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={settings.webhookUrl || ''}
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  placeholder="https://example.com/webhook"
                />
              </div>
              {settings.webhookUrl && (
                <div>
                  <Label htmlFor="webhookMethod">Webhook Method</Label>
                  <Select
                    value={settings.webhookMethod || 'POST'}
                    onValueChange={(value: 'GET' | 'POST' | 'PUT') => 
                      setSettings({ ...settings, webhookMethod: value })
                    }
                  >
                    <SelectTrigger id="webhookMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="embedAllowed"
                  checked={settings.embedAllowed !== false}
                  onCheckedChange={(checked) => setSettings({ ...settings, embedAllowed: checked })}
                />
                <Label htmlFor="embedAllowed">Allow embedding this form</Label>
              </div>
              {settings.embedAllowed && (
                <div>
                  <Label htmlFor="allowedDomains">Allowed Domains (comma-separated)</Label>
                  <Input
                    id="allowedDomains"
                    value={settings.allowedDomains || ''}
                    onChange={(e) => setSettings({ ...settings, allowedDomains: e.target.value })}
                    placeholder="example.com, app.example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to allow all domains. Specify domains to restrict embedding.
                  </p>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="turnstileEnabled"
                  checked={settings.turnstileEnabled === true}
                  onCheckedChange={(checked) => setSettings({ ...settings, turnstileEnabled: checked })}
                />
                <Label htmlFor="turnstileEnabled">Enable Cloudflare Turnstile</Label>
              </div>
              {settings.turnstileEnabled && (
                <div>
                  <Label htmlFor="turnstileSiteKey">Turnstile Site Key</Label>
                  <Input
                    id="turnstileSiteKey"
                    value={settings.turnstileSiteKey || ''}
                    onChange={(e) => setSettings({ ...settings, turnstileSiteKey: e.target.value })}
                    placeholder="0x4AAAAAAA..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get your site key from the Cloudflare Turnstile dashboard.
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="r2Bucket">R2 Bucket for file uploads (optional)</Label>
                <Input
                  id="r2Bucket"
                  value={settings.r2Bucket || ''}
                  onChange={(e) => setSettings({ ...settings, r2Bucket: e.target.value })}
                  placeholder="my-bucket-name"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="buttonIcon">Button Icon</Label>
              <Input
                id="buttonIcon"
                value={settings.appearanceSettings?.buttonIcon || ''}
                onChange={(e) => 
                  setSettings({ 
                    ...settings, 
                    appearanceSettings: { 
                      ...settings.appearanceSettings, 
                      buttonIcon: e.target.value 
                    } 
                  })
                }
                placeholder="📝"
                className="max-w-[100px]"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use any emoji like 📝, 📧, ✉️, or 📋
              </p>
            </div>

            <div>
              <Label htmlFor="colorTheme">Color Theme</Label>
              <Select
                value={settings.appearanceSettings?.colorTheme || 'slate'}
                onValueChange={(value: ColorTheme) => 
                  setSettings({ 
                    ...settings, 
                    appearanceSettings: { 
                      ...settings.appearanceSettings, 
                      colorTheme: value 
                    } 
                  })
                }
              >
                <SelectTrigger id="colorTheme">
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

            <div>
              <Label htmlFor="buttonStyle">Button Style</Label>
              <Select
                value={settings.appearanceSettings?.buttonStyle || 'solid'}
                onValueChange={(value: ButtonStyle) => 
                  setSettings({ 
                    ...settings, 
                    appearanceSettings: { 
                      ...settings.appearanceSettings, 
                      buttonStyle: value 
                    } 
                  })
                }
              >
                <SelectTrigger id="buttonStyle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="buttonFullWidth"
                checked={settings.appearanceSettings?.buttonFullWidth === true}
                onCheckedChange={(checked) => 
                  setSettings({ 
                    ...settings, 
                    appearanceSettings: { 
                      ...settings.appearanceSettings, 
                      buttonFullWidth: checked 
                    } 
                  })
                }
              />
              <Label htmlFor="buttonFullWidth">Full width button</Label>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Button Preview</h4>
              <div className="flex justify-center">
                <Button
                  className={`${
                    settings.appearanceSettings?.buttonStyle === 'gradient' && 
                    COLOR_THEMES[settings.appearanceSettings?.colorTheme || 'slate'].gradient
                      ? COLOR_THEMES[settings.appearanceSettings?.colorTheme || 'slate'].gradient
                      : COLOR_THEMES[settings.appearanceSettings?.colorTheme || 'slate'].background
                  } ${
                    COLOR_THEMES[settings.appearanceSettings?.colorTheme || 'slate'].text
                  } ${
                    settings.appearanceSettings?.buttonFullWidth ? 'w-full' : ''
                  } pointer-events-none`}
                >
                  <span className="mr-2">{settings.appearanceSettings?.buttonIcon || '📝'}</span>
                  {settings.submitButtonText || 'Submit'}
                </Button>
              </div>
            </div>

            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer font-medium">Advanced Settings</summary>
              <div className="mt-4">
                <Label htmlFor="customCss">Custom CSS (Optional)</Label>
                <Textarea
                  id="customCss"
                  value={settings.appearanceSettings?.customCss || ''}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      appearanceSettings: { 
                        ...settings.appearanceSettings, 
                        customCss: e.target.value 
                      } 
                    })
                  }
                  placeholder=".form-container { }\n.submit-button { }"
                  rows={4}
                  className="font-mono text-sm mt-2"
                />
              </div>
            </details>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setActiveTab('preview')}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Form
        </Button>
      </div>
    </div>
  );
}