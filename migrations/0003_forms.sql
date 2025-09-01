-- Forms feature tables for WorkflowHub

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  webhook_headers TEXT, -- JSON string
  webhook_method TEXT DEFAULT 'POST',
  redirect_url TEXT,
  success_message TEXT DEFAULT 'Thank you for your submission!',
  allow_file_uploads BOOLEAN DEFAULT 1,
  max_file_size INTEGER DEFAULT 10485760, -- 10MB default
  allowed_file_types TEXT, -- JSON array of mime types
  is_published BOOLEAN DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Form fields table
CREATE TABLE IF NOT EXISTS form_fields (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  form_id TEXT NOT NULL,
  name TEXT NOT NULL, -- Field identifier for form data
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date', 'time', 'tel', 'url')),
  placeholder TEXT,
  help_text TEXT,
  required BOOLEAN DEFAULT 0,
  options TEXT, -- JSON array for select/radio/checkbox options
  validation_pattern TEXT, -- Regex pattern for validation
  validation_message TEXT, -- Custom validation error message
  default_value TEXT,
  position INTEGER DEFAULT 0,
  width TEXT DEFAULT 'full' CHECK(width IN ('full', 'half')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  form_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON object with field values
  files TEXT, -- JSON array of R2 file keys
  ip_address TEXT,
  user_agent TEXT,
  webhook_response TEXT, -- JSON response from webhook
  webhook_status INTEGER,
  webhook_sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_published ON forms(is_published);
CREATE INDEX idx_form_fields_form ON form_fields(form_id);
CREATE INDEX idx_form_fields_position ON form_fields(form_id, position);
CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_created ON form_submissions(created_at);

-- Sample form for testing
INSERT INTO forms (name, description, slug, webhook_url, is_published, position)
VALUES ('Contact Form', 'Get in touch with us', 'contact', 'https://n8n.example.com/webhook/contact-form', 1, 1);

-- Sample fields for the contact form
INSERT INTO form_fields (form_id, name, label, type, required, position, placeholder)
VALUES 
  ((SELECT id FROM forms WHERE slug = 'contact'), 'name', 'Your Name', 'text', 1, 1, 'John Doe'),
  ((SELECT id FROM forms WHERE slug = 'contact'), 'email', 'Email Address', 'email', 1, 2, 'john@example.com'),
  ((SELECT id FROM forms WHERE slug = 'contact'), 'subject', 'Subject', 'text', 1, 3, 'How can we help?'),
  ((SELECT id FROM forms WHERE slug = 'contact'), 'message', 'Message', 'textarea', 1, 4, 'Tell us more...');