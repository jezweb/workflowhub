import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { FormField, FieldWidth, FieldOption } from '@/types/form';

interface FieldEditorProps {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
}

export function FieldEditor({ field, onChange }: FieldEditorProps) {
  const widthOptions: { value: FieldWidth; label: string }[] = [
    { value: 'full', label: 'Full Width' },
    { value: '1/2', label: 'Half Width' },
    { value: '1/3', label: 'Third Width' },
    { value: '1/4', label: 'Quarter Width' }
  ];

  const needsOptions = ['select', 'radio', 'checkbox'].includes(field.type);

  const addOption = () => {
    const newOption: FieldOption = {
      label: `Option ${(field.options?.length || 0) + 1}`,
      value: `option_${Date.now()}`
    };
    onChange({ options: [...(field.options || []), newOption] });
  };

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const options = [...(field.options || [])];
    options[index] = { ...options[index], ...updates };
    onChange({ options });
  };

  const deleteOption = (index: number) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    onChange({ options });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Field label"
        />
      </div>

      <div>
        <Label htmlFor="name">Field Name</Label>
        <Input
          id="name"
          value={field.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="field_name"
          pattern="[a-z0-9_]+"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use lowercase letters, numbers, and underscores only
        </p>
      </div>

      <div>
        <Label htmlFor="width">Field Width</Label>
        <Select
          value={field.width}
          onValueChange={(value: FieldWidth) => onChange({ width: value })}
        >
          <SelectTrigger id="width">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {widthOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          value={field.placeholder || ''}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder="Enter placeholder text"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="required"
          checked={field.required || false}
          onCheckedChange={(checked: boolean) => onChange({ required: checked })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      {needsOptions && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Options</Label>
            <Button size="sm" onClick={addOption}>
              <Plus className="h-3 w-3 mr-1" />
              Add Option
            </Button>
          </div>
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(index, { label: e.target.value })}
                  placeholder="Label"
                />
                <Input
                  value={option.value}
                  onChange={(e) => updateOption(index, { value: e.target.value })}
                  placeholder="Value"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {field.type === 'text' && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Validation</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="minLength">Min Length</Label>
              <Input
                id="minLength"
                type="number"
                value={field.validation?.minLength || ''}
                onChange={(e) => onChange({
                  validation: { ...field.validation, minLength: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label htmlFor="maxLength">Max Length</Label>
              <Input
                id="maxLength"
                type="number"
                value={field.validation?.maxLength || ''}
                onChange={(e) => onChange({
                  validation: { ...field.validation, maxLength: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pattern">Pattern (RegEx)</Label>
            <Input
              id="pattern"
              value={field.validation?.pattern || ''}
              onChange={(e) => onChange({
                validation: { ...field.validation, pattern: e.target.value }
              })}
              placeholder="[A-Za-z0-9]+"
            />
          </div>
        </div>
      )}

      {field.type === 'number' && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Validation</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="min">Min Value</Label>
              <Input
                id="min"
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => onChange({
                  validation: { ...field.validation, min: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label htmlFor="max">Max Value</Label>
              <Input
                id="max"
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => onChange({
                  validation: { ...field.validation, max: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        </div>
      )}

      {field.validation && (
        <div>
          <Label htmlFor="message">Validation Message</Label>
          <Textarea
            id="message"
            value={field.validation.message || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({
              validation: { ...field.validation, message: e.target.value }
            })}
            placeholder="Custom error message"
            rows={2}
          />
        </div>
      )}
    </div>
  );
}