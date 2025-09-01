Create a comprehensive web application dashboard for business workflow management with the following specific requirements:

Core Application Structure:
Build a multi-page web dashboard that serves as a central hub for business operations and automation.

Required Pages and Features:

AI Chat Interface:

Implement a ChatGPT-style conversational interface
Connect to n8n workflows via webhooks for chat processing
Include message history and real-time responses
Support file attachments in chat conversations
File Management System:

Create a file browser interface for Cloudflare R2 (S3-compatible) storage
Display files in a grid/list view with thumbnails where applicable
Implement upload functionality with drag-and-drop support
Add delete/remove file capabilities
Show file metadata (size, upload date, type)
Include search and filtering options
Dynamic Landing Page:

Design a customizable landing page with action buttons
Allow users to add/edit/remove action buttons through the interface
Each button should trigger specific n8n workflows via webhooks
Include button customization options (text, color, icon)
Database Table Viewer:

Create a data table component that displays Cloudflare D1 database contents
Include pagination, sorting, and filtering capabilities
Make it responsive and easy to navigate
Allow users to select which database tables to view
Settings/Variables Manager:

Build a key-value pair management interface
Allow users to add, edit, and delete configuration variables
Organize settings into categories or groups
Include data validation and type specification
Dynamic Form Builder:

Create a system for adding custom form pages
Forms should collect user input and files
Submit form data to n8n workflows via webhooks
Display workflow responses back to users
Include various input types (text, file upload, dropdown, etc.)
Technical Requirements:

All backend interactions must use n8n webhooks
Ensure responsive design for mobile and desktop
Implement proper error handling and loading states
Include user authentication and authorization
Use modern web technologies and frameworks
Ensure secure file handling and data transmission
User Experience Considerations:

Intuitive navigation between all sections
Consistent UI/UX design across all pages
Real-time updates where applicable
Clear feedback for all user actions
Accessible design following web standards
Provide a detailed implementation plan including recommended technology stack, database schema suggestions, and API endpoint structure for the n8n webhook integrations.
