-- Add tag fields to organization_context table
ALTER TABLE organization_context 
ADD COLUMN keywords TEXT;

ALTER TABLE organization_context 
ADD COLUMN products TEXT;

ALTER TABLE organization_context 
ADD COLUMN services TEXT;