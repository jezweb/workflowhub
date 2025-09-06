import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { OpenRouterModel } from '@/types/agent';

interface ModelSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  models: OpenRouterModel[];
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export function ModelSelector({
  value,
  onChange,
  models,
  loading = false,
  placeholder = 'Select a model...',
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Group models by provider
  const modelsByProvider = React.useMemo(() => {
    const grouped = new Map<string, OpenRouterModel[]>();
    
    models.forEach(model => {
      const provider = model.provider;
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
      }
      grouped.get(provider)!.push(model);
    });
    
    // Sort providers alphabetically
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [models]);

  // Find selected model
  const selectedModel = models.find(m => m.id === value);

  // Filter models based on search
  const filteredProviders = React.useMemo(() => {
    if (!searchQuery) return modelsByProvider;
    
    const query = searchQuery.toLowerCase();
    const filtered = new Map<string, OpenRouterModel[]>();
    
    modelsByProvider.forEach((providerModels, provider) => {
      const matchingModels = providerModels.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        provider.toLowerCase().includes(query)
      );
      
      if (matchingModels.length > 0) {
        filtered.set(provider, matchingModels);
      }
    });
    
    return filtered;
  }, [modelsByProvider, searchQuery]);

  const formatContextLength = (length: number) => {
    if (length >= 1000000) {
      return `${(length / 1000000).toFixed(1)}M`;
    } else if (length >= 1000) {
      return `${(length / 1000).toFixed(0)}K`;
    }
    return length.toString();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading models...
            </>
          ) : selectedModel ? (
            <span className="truncate">
              {selectedModel.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search models..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty>No models found.</CommandEmpty>
            {Array.from(filteredProviders.entries()).map(([provider, providerModels]) => (
              <CommandGroup key={provider} heading={provider.toUpperCase()}>
                {providerModels.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? '' : currentValue);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === model.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <span className="text-sm">{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Context: {formatContextLength(model.context_length)}
                        {model.max_tokens && ` • Max output: ${formatContextLength(model.max_tokens)}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}