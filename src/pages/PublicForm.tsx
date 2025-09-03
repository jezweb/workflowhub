import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { COLOR_THEMES } from '@/lib/appearance';
import { Loader2 } from 'lucide-react';
import type { Form, FormField } from '@/types/form';

// Declare Turnstile types
declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        'error-callback'?: () => void;
      }) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      loadForm(id);
    }
  }, [id]);

  useEffect(() => {
    // Load and initialize Turnstile if enabled
    if (form?.settings?.turnstileEnabled && form?.settings?.turnstileSiteKey && turnstileRef.current) {
      // Load Turnstile script
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Initialize Turnstile widget
        if (window.turnstile && turnstileRef.current) {
          turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
            sitekey: form.settings.turnstileSiteKey!,
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            'error-callback': () => {
              toast({
                title: 'Verification Error',
                description: 'Please refresh and try again',
                variant: 'destructive',
              });
            },
          });
        }
      };
      
      document.head.appendChild(script);
      
      return () => {
        // Cleanup on unmount
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [form, toast]);

  const loadForm = async (formId: string) => {
    try {
      // Try to fetch the form (public endpoint doesn't require auth)
      const response = await fetch(`/api/public/forms/${formId}`);
      if (!response.ok) {
        throw new Error('Form not found');
      }
      const data = await response.json() as { form: Form };
      setForm(data.form);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Form not found or not accessible',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const buildValidationSchema = (fields: FormField[]) => {
    const schemaShape: Record<string, any> = {};
    
    fields.forEach(field => {
      let fieldSchema: any;
      
      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Invalid email address');
          break;
        case 'number':
          fieldSchema = z.number();
          if (field.validation?.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation.min);
          }
          if (field.validation?.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation.max);
          }
          break;
        case 'url':
          fieldSchema = z.string().url('Invalid URL');
          break;
        case 'checkbox':
          fieldSchema = z.boolean();
          break;
        default:
          fieldSchema = z.string();
          if (field.validation?.minLength) {
            fieldSchema = fieldSchema.min(field.validation.minLength);
          }
          if (field.validation?.maxLength) {
            fieldSchema = fieldSchema.max(field.validation.maxLength);
          }
          if (field.validation?.pattern) {
            fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern));
          }
      }
      
      if (!field.required && field.type !== 'checkbox') {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaShape[field.name] = fieldSchema;
    });
    
    return z.object(schemaShape);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: form ? zodResolver(buildValidationSchema(form.fields)) : undefined,
  });

  const onSubmit = async (data: any) => {
    if (!form) return;
    
    // Check if Turnstile is required and token is available
    if (form.settings?.turnstileEnabled && !turnstileToken) {
      toast({
        title: 'Verification Required',
        description: 'Please complete the security verification',
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/forms/${form.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data,
          turnstileToken: form.settings?.turnstileEnabled ? turnstileToken : undefined
        }),
      });
      
      const result = await response.json() as { success?: boolean; error?: string; redirectUrl?: string; html?: string };
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit form');
      }
      
      // Handle response based on response_type
      const responseType = form.response_type || form.settings?.responseType || 'toast';
      
      switch (responseType) {
        case 'toast':
          toast({
            title: 'Success',
            description: form.settings?.successMessage || 'Form submitted successfully!',
          });
          setSubmitted(true);
          break;
          
        case 'modal':
          // TODO: Show modal with response
          toast({
            title: 'Success',
            description: form.settings?.successMessage || 'Form submitted successfully!',
          });
          setSubmitted(true);
          break;
          
        case 'redirect':
          if (form.settings?.redirectUrl) {
            window.location.href = form.settings.redirectUrl;
          } else if (result && result.redirectUrl) {
            window.location.href = result.redirectUrl;
          } else {
            setSubmitted(true);
          }
          break;
          
        case 'html':
          // Handle HTML response from webhook
          if (result && result.html) {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.open();
              newWindow.document.write(result.html);
              newWindow.document.close();
            } else {
              toast({
                title: 'Popup Blocked',
                description: 'Please allow popups to view the response',
                variant: 'destructive',
              });
            }
          }
          setSubmitted(true);
          break;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit form',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const error = errors[field.name];
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        return (
          <div>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              {...register(field.name)}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">
                {field.validation?.message || 'This field is required'}
              </p>
            )}
          </div>
        );
        
      case 'number':
        return (
          <div>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder}
              {...register(field.name, { valueAsNumber: true })}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">
                {field.validation?.message || 'This field is required'}
              </p>
            )}
          </div>
        );
        
      case 'textarea':
        return (
          <div>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              {...register(field.name)}
              className={error ? 'border-red-500' : ''}
              rows={4}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">
                {field.validation?.message || 'This field is required'}
              </p>
            )}
          </div>
        );
        
      case 'select':
        return (
          <div>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select onValueChange={(value) => setValue(field.name, value)}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
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
            {error && (
              <p className="text-sm text-red-500 mt-1">
                {field.validation?.message || 'This field is required'}
              </p>
            )}
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              onCheckedChange={(checked) => setValue(field.name, checked)}
            />
            <Label htmlFor={field.name} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );
        
      case 'radio':
        return (
          <div>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup onValueChange={(value) => setValue(field.name, value)}>
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} />
                  <Label htmlFor={`${field.name}-${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {error && (
              <p className="text-sm text-red-500 mt-1">
                {field.validation?.message || 'This field is required'}
              </p>
            )}
          </div>
        );
        
      case 'date':
      case 'time':
      case 'datetime':
        return (
          <div>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type === 'datetime' ? 'datetime-local' : field.type}
              {...register(field.name)}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">
                {field.validation?.message || 'This field is required'}
              </p>
            )}
          </div>
        );
        
      case 'file':
        // TODO: Implement file upload with R2
        return (
          <div>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="file"
              {...register(field.name)}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">
                {field.validation?.message || 'This field is required'}
              </p>
            )}
          </div>
        );
        
      case 'heading':
        const HeadingTag = field.headingLevel || 'h3';
        return (
          <HeadingTag className={`font-bold ${
            field.headingLevel === 'h1' ? 'text-3xl' :
            field.headingLevel === 'h2' ? 'text-2xl' :
            field.headingLevel === 'h3' ? 'text-xl' :
            field.headingLevel === 'h4' ? 'text-lg' :
            field.headingLevel === 'h5' ? 'text-base' :
            'text-sm'
          }`}>
            {field.label}
          </HeadingTag>
        );
        
      case 'separator':
        return <hr className="border-t border-gray-300 my-2" />;
        
      case 'html':
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: field.htmlContent || '' }}
            className="prose prose-sm max-w-none"
          />
        );
        
      case 'hidden':
        return (
          <input
            type="hidden"
            value={field.defaultValue || ''}
            {...register(field.name)}
          />
        );
        
      default:
        return null;
    }
  };

  const getFieldWidth = (width: string) => {
    switch (width) {
      case '1/4':
        return 'col-span-1';
      case '1/3':
        return 'col-span-1 md:col-span-1';
      case '1/2':
        return 'col-span-1 md:col-span-2';
      case 'full':
      default:
        return 'col-span-1 md:col-span-4';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Form Not Found</CardTitle>
            <CardDescription>
              This form does not exist or is not accessible.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Thank You!</CardTitle>
            <CardDescription>
              {form.settings?.successMessage || 'Your form has been submitted successfully.'}
            </CardDescription>
          </CardHeader>
          {!form.settings?.redirectUrl && (
            <CardContent>
              <Button onClick={() => window.location.reload()} className="w-full">
                Submit Another Response
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Custom CSS if configured */}
      {form.settings?.appearanceSettings?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: form.settings.appearanceSettings.customCss }} />
      )}
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{form.name}</CardTitle>
            {form.description && (
              <CardDescription>{form.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {form.fields.map((field) => (
                  <div key={field.id} className={getFieldWidth(field.width)}>
                    {renderField(field)}
                  </div>
                ))}
              </div>
              
              {form.settings?.turnstileEnabled && (
                <div ref={turnstileRef} className="mb-4"></div>
              )}
              
              <Button 
                type="submit" 
                disabled={submitting} 
                className={`${
                  form.settings?.appearanceSettings?.buttonStyle === 'gradient' && 
                  COLOR_THEMES[form.settings?.appearanceSettings?.colorTheme || 'slate'].gradient
                    ? COLOR_THEMES[form.settings?.appearanceSettings?.colorTheme || 'slate'].gradient
                    : COLOR_THEMES[form.settings?.appearanceSettings?.colorTheme || 'slate']?.background || 'bg-primary'
                } ${
                  COLOR_THEMES[form.settings?.appearanceSettings?.colorTheme || 'slate']?.text || 'text-primary-foreground'
                } ${
                  form.settings?.appearanceSettings?.buttonFullWidth ? 'w-full' : 'w-full md:w-auto'
                }`}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!submitting && form.settings?.appearanceSettings?.buttonIcon && (
                  <span className="mr-2">{form.settings.appearanceSettings.buttonIcon}</span>
                )}
                {form.settings?.submitButtonText || 'Submit'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}