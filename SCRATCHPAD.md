# Model Selection Implementation Scratchpad

## Current Status
Working on replacing hardcoded model list with dynamic OpenRouter API integration

## Architecture Notes

### Model ID Format
- Full format: "provider/model-name" (e.g., "openai/gpt-4", "anthropic/claude-3-opus")
- This is what gets stored in database and sent to n8n

### Component Structure
```
AgentEditor
├── Primary Model Selection
│   ├── Provider ComboBox (searchable)
│   └── Model ComboBox (filtered by provider, searchable)
└── Fallback Model Selection (optional)
    ├── Provider ComboBox (searchable)
    └── Model ComboBox (filtered by provider, searchable)
```

### Data Flow
1. AgentEditor mounts → fetch models from `/api/openrouter/models`
2. Parse response to extract unique providers
3. User selects provider → filter models for that provider
4. Store selection as full model ID
5. Same flow for fallback model (independent selection)

### OpenRouter API Response Structure
```json
{
  "data": [
    {
      "id": "openai/gpt-4",
      "name": "OpenAI: GPT-4",
      "created": 1234567890,
      "context_length": 8192,
      ...
    }
  ]
}
```

### Provider Extraction
- Parse model ID before "/" to get provider
- Common providers: openai, anthropic, google, meta, mistral, deepseek, qwen

### UI Components Needed
- Searchable ComboBox (using shadcn/ui Command + Popover pattern)
- Should handle large lists (100+ models)
- Show model name + context length in dropdown

## Implementation Progress

- [x] API endpoint created (/api/agents/openrouter/models)
- [x] Database migration applied (0003_agent_fallback_model.sql)
- [x] Types updated (Agent and CreateAgentRequest interfaces)
- [x] ModelSelector component created (searchable combobox)
- [x] AgentEditor updated (replaced hardcoded select with dynamic models)
- [x] Fallback model selection added
- [x] TypeScript errors fixed
- [x] Testing complete

## What Was Implemented

1. **API Proxy Endpoint**: Added `/agents/openrouter/models` that fetches from OpenRouter API with fallback list
2. **Database**: Added `fallback_model` column to agents table
3. **ModelSelector Component**: Searchable combobox with provider grouping and context length display
4. **AgentEditor Updates**: 
   - Fetches models on mount
   - Two ModelSelector components (primary and fallback)
   - Stores full model IDs (e.g., "openai/gpt-4o")
5. **Fallback Support**: Both backend and frontend support for fallback model selection

## Notes
- Keep it simple - no caching beyond session
- No user preferences needed
- Model list always fresh from API
- Fallback is completely optional