-- Migration: Add visual customization fields to actions table
-- Description: Adds icon, color theme, button style, and response handling fields for improved action UX

-- Add icon field for visual representation (emoji or icon name)
ALTER TABLE actions ADD COLUMN icon TEXT DEFAULT '⚡';

-- Add color theme field (preset name like 'ocean', 'forest', etc.)
ALTER TABLE actions ADD COLUMN color_theme TEXT DEFAULT 'slate';

-- Add button style field ('solid' or 'gradient')
ALTER TABLE actions ADD COLUMN button_style TEXT DEFAULT 'solid';

-- Add on_success field for response handling ('silent', 'toast', 'modal', 'navigate', 'refresh')
ALTER TABLE actions ADD COLUMN on_success TEXT DEFAULT 'toast';