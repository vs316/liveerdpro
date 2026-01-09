# LiveERD Pro - Collaborative Entity Relationship Diagram Tool

Welcome to **LiveERD Pro**, a real-time collaborative workspace for designing database schemas with your team.

## Getting Started

1.  **Sign Up / Login**: Create an account or log in to access your diagrams.
2.  **Dashboard**: Manage your projects. Create a new diagram or select an existing one to enter the workspace.

## Navigation & Features

### The Workspace
- **Canvas**: The central area where you visualize your database tables (entities) and relationships.
- **Pan & Zoom**: Use your mouse wheel or trackpad to zoom. Click and drag on the background to pan around the diagram.
- **Select**: Click on a table node to select it. Click on the background to deshflect.

### Sidebar Tools (Left Panel)
- **Team**: See who is currently online in this room.
- **Data Operations**:
    - **Export JSON**: Save a backup of your diagram layout.
    ZX- **Import JSON**: Restore a diagram from a backup file.
    - **Download MySQL**: Get the SQL code to create your tables.
    - **View Code Panel**: Open a side-by-side view of the live MySQL code generated from your diagram.

### Editing Tables (Right Panel)
When you select a table, the **Property Editor** opens on the right:
- **Details Tab**:
    - **Name**: Rename your table.
    - **Description**: Add documentation for your team.
    - **Columns**: Fully editable column management.
        - **Add Column**: Click to add a new field.
        - **Edit**: Change names, data types, set Primary Keys (PK), Nullable, or Auto Increment (AI).
        - **Remove**: Hover over a column row to see the trash icon.
- **Relations Tab**: View a list of tables connected to the selected one.
- **Comments Tab**: Chat with your team about specific tables.

### Multiplayer Features
- **Live Cursors**: See where your teammates are pointing in real-time.
- **Instant Sync**: All changes to tables, columns, and layout are instantly visible to everyone.
- **Presence**: The "Team" section shows active users with their color codes.

### Shortcuts
- **Undo**: `Ctrl + Z`
- **Redo**: `Ctrl + Y` or `Ctrl + Shift + Z`

## Tech Stack
- React + Vite
- React Flow
- Supabase (Realtime & Auth)
- Tailwind CSS
