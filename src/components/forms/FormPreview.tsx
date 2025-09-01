import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FormField, FormSettings } from '@/types/form';

interface FormPreviewProps {
  name: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
}

export function FormPreview({ name, description, fields, settings }: FormPreviewProps) {
  const getWidthClass = (width: string) => {
    switch (width) {
      case '1/2': return 'md:col-span-6';
      case '1/3': return 'md:col-span-4';
      case '1/4': return 'md:col-span-3';
      case 'full':
      default: return 'md:col-span-12';
    }
  };

  const renderField = (field: FormField) => {
    const baseProps = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder,
      required: field.required,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        return (
          <Input
            {...baseProps}
            type={field.type}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
          />
        );

      case 'number':
        return (
          <Input
            {...baseProps}
            type="number"
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            rows={4}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );

      case 'select':
        return (
          <Select name={field.name} required={field.required}>
            <SelectTrigger id={field.name}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        if (field.options && field.options.length > 1) {
          return (
            <div className="space-y-2">
              {field.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox id={`${field.name}_${option.value}`} value={option.value} />
                  <Label htmlFor={`${field.name}_${option.value}`} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          );
        }
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.name} name={field.name} required={field.required} />
            <Label htmlFor={field.name} className="font-normal">
              {field.label}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup name={field.name} required={field.required}>
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.name}_${option.value}`} />
                <Label htmlFor={`${field.name}_${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'date':
        return <Input {...baseProps} type="date" />;

      case 'time':
        return <Input {...baseProps} type="time" />;

      case 'datetime':
        return <Input {...baseProps} type="datetime-local" />;

      case 'file':
        return <Input {...baseProps} type="file" />;

      default:
        return <Input {...baseProps} />;
    }
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Add fields to see the form preview
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {name && <h2 className="text-xl font-semibold">{name}</h2>}
      {description && <p className="text-gray-600">{description}</p>}

      <div className="grid grid-cols-12 gap-4">
        {fields.map((field) => (
          <div key={field.id} className={getWidthClass(field.width)}>
            {field.type !== 'checkbox' || !field.options || field.options.length > 1 ? (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
                {field.validation?.message && (
                  <p className="text-xs text-gray-500">{field.validation.message}</p>
                )}
              </div>
            ) : (
              renderField(field)
            )}
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full sm:w-auto">
          {settings.submitButtonText || 'Submit'}
        </Button>
      </div>

      {settings.successMessage && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{settings.successMessage}</p>
        </div>
      )}
    </form>
  );
}