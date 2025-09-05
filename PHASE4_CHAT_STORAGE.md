# Phase 4: Chat Storage Feature - Implementation Scratchpad

## Overview
Add "Attach from Storage" functionality to chat, allowing users to browse and attach files from their storage buckets without re-uploading.

## Core Components

### 1. FileBrowserModal Component
**Location:** `src/components/chat/FileBrowserModal.tsx`

**Structure:**
```tsx
interface FileBrowserModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (files: StorageFile[]) => void;
  defaultBucketId?: string;  // From chat group settings
  multiple?: boolean;
}

interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  bucket_id: string;
  storage_key: string;
  created_at: string;
}
```

**Features:**
- Bucket selector dropdown (uses BucketSelector component)
- File list with thumbnails for images
- Search/filter by name
- Multi-select checkboxes
- File preview on hover/click
- Loading states
- Empty states

### 2. ChatInput Updates
**Location:** `src/components/chat/ChatInput.tsx`

**New Elements:**
```tsx
// New button next to existing attachment
<Button onClick={() => setShowFileBrowser(true)}>
  <FolderOpen className="h-4 w-4" />
</Button>

// Storage attachments state
const [storageAttachments, setStorageAttachments] = useState<StorageAttachment[]>([]);

interface StorageAttachment extends ChatAttachment {
  storage_file_id: string;
  bucket_id: string;
  storage_key: string;
  is_storage_ref: true;  // Flag to distinguish from uploads
}
```

**Flow:**
1. User clicks "Attach from Storage"
2. FileBrowserModal opens
3. User selects files
4. Selected files added as storage attachments
5. On send, merge with uploaded attachments
6. Backend handles storage references

### 3. Backend Updates
**Location:** `src/worker/routes/chat.ts`

**Message Processing:**
```typescript
// In sendMessage endpoint
const processedAttachments = await processAttachments(body.attachments);

async function processAttachments(attachments: any[]) {
  return Promise.all(attachments.map(async (att) => {
    if (att.is_storage_ref) {
      // Get file info from database
      const file = await getFileById(att.storage_file_id);
      
      // Generate signed URL if needed
      const url = await generateSignedUrl(file);
      
      return {
        ...att,
        url,
        // Include in webhook payload
      };
    }
    return att;
  }));
}
```

### 4. Type Updates
**Location:** `src/types/chat.ts`

```typescript
export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: string;
  
  // New fields for storage references
  storage_file_id?: string;
  bucket_id?: string;
  storage_key?: string;
  is_storage_ref?: boolean;
}
```

## API Integration

### Files API Usage
```typescript
// List files in selected bucket
const response = await filesApi.list({ bucket_id: selectedBucketId });

// Get file URL (new endpoint needed)
const url = await filesApi.getUrl(fileId);
```

### New Endpoint Needed
```typescript
// GET /api/files/:id/url
// Returns signed URL for file access
app.get('/files/:id/url', async (c) => {
  const fileId = c.req.param('id');
  const file = await getFile(fileId);
  const url = await StorageFactory.getProvider(file.bucket_id).getSignedUrl(file.storage_key);
  return c.json({ url });
});
```

## UI/UX Flow

### Attachment Flow
1. **Initial State**
   - Paperclip icon for upload
   - Folder icon for storage browse

2. **Browse Storage**
   - Modal opens with file list
   - Default to group's bucket if set
   - Allow bucket switching
   - Show file previews

3. **Selection**
   - Checkboxes for multi-select
   - "Attach Selected" button
   - Show count of selected

4. **Display Attachments**
   - Show badge with filename
   - Different icon for storage vs upload
   - Remove button

5. **Send Message**
   - Include all attachments
   - Backend processes appropriately

## Implementation Steps

### Step 1: Create FileBrowserModal
- [ ] Create component structure
- [ ] Add bucket selector
- [ ] Implement file listing
- [ ] Add search/filter
- [ ] Add multi-select
- [ ] Add preview capability

### Step 2: Update ChatInput
- [ ] Add storage button
- [ ] Add modal state
- [ ] Handle storage attachments
- [ ] Merge attachments on send
- [ ] Update UI to show both types

### Step 3: Update Backend
- [ ] Add file URL endpoint
- [ ] Update message processing
- [ ] Handle storage references
- [ ] Generate signed URLs

### Step 4: Update Types
- [ ] Extend ChatAttachment interface
- [ ] Add storage-specific fields
- [ ] Update related types

### Step 5: Test Integration
- [ ] Test file browsing
- [ ] Test attachment flow
- [ ] Test message sending
- [ ] Test file access
- [ ] Test with different buckets

## Component Dependencies

```
FileBrowserModal
├── uses BucketSelector
├── uses filesApi
├── uses Card, Dialog components
└── returns StorageFile[]

ChatInput
├── uses FileBrowserModal
├── manages storageAttachments state
├── merges with uploadedAttachments
└── sends to chatStore

chatStore
├── processes attachments
├── sends to API
└── handles responses

Backend
├── processes storage refs
├── generates URLs
├── forwards to webhook
└── stores message
```

## State Management

### ChatInput State
```typescript
// Existing
const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

// New
const [storageAttachments, setStorageAttachments] = useState<StorageAttachment[]>([]);
const [showFileBrowser, setShowFileBrowser] = useState(false);

// Merged for sending
const allAttachments = [...attachments, ...storageAttachments];
```

### FileBrowserModal State
```typescript
const [selectedBucket, setSelectedBucket] = useState(defaultBucketId);
const [files, setFiles] = useState<StorageFile[]>([]);
const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
const [searchQuery, setSearchQuery] = useState('');
const [loading, setLoading] = useState(false);
```

## Error Handling

1. **Bucket Access Errors**
   - Show toast if bucket unavailable
   - Fall back to default bucket

2. **File Access Errors**
   - Handle expired URLs
   - Retry with new URL
   - Show error message

3. **Selection Limits**
   - Max 10 files at once
   - Max 50MB total size
   - Show warning messages

## Performance Considerations

1. **File List**
   - Paginate large lists
   - Virtual scroll for many items
   - Lazy load thumbnails

2. **Preview Generation**
   - Cache thumbnails
   - Load on demand
   - Use placeholder images

3. **URL Generation**
   - Generate on send, not select
   - Cache for duration
   - Refresh if expired

## Security Considerations

1. **Access Control**
   - Verify user owns files
   - Check bucket permissions
   - Validate file IDs

2. **URL Security**
   - Short expiration times
   - Single-use tokens optional
   - Audit access logs

3. **Size Limits**
   - Client-side validation
   - Server-side enforcement
   - Clear error messages

## Testing Checklist

- [ ] Browse files in different buckets
- [ ] Select single file
- [ ] Select multiple files
- [ ] Remove selected files
- [ ] Send message with storage attachments
- [ ] Send with mixed attachments (storage + upload)
- [ ] View attached files in message
- [ ] Access files via generated URLs
- [ ] Handle expired URLs
- [ ] Test with no buckets configured
- [ ] Test with empty buckets
- [ ] Test with large file lists
- [ ] Test search and filter
- [ ] Test with different file types
- [ ] Verify webhook receives correct data

## Future Enhancements

1. **Drag & Drop**
   - Drag files from modal to chat
   - Visual drop zones

2. **Recent Files**
   - Show recently used files
   - Quick access section

3. **File Collections**
   - Save file sets
   - Quick attach collections

4. **Preview Improvements**
   - Full-size preview modal
   - Document preview (PDF)
   - Video thumbnails

5. **Smart Suggestions**
   - Suggest relevant files
   - Based on conversation context
   - ML-powered recommendations