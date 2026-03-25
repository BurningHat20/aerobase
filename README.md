# AeroBase

AeroBase is a professional-grade MySQL desktop client developed with Tauri, React, and Rust. It provides a native experience for managing MySQL databases with an emphasis on speed, efficiency, and a refined interface.

## Core Features

### Data Exploration

- **Paginated Data Grid**: Powered by TanStack Table and Virtualizer for efficient rendering of large datasets.
- **Table Interaction**: Integrated views for data browsing, schema structure (indexes, constraints), and DDL generation.
- **Filtering & Search**: Server-side sorting for performance and optimized client-side filtering.

### SQL Development

- **Integrated Editor**: High-performance SQL editing using CodeMirror 6 with syntax highlighting and code completion.
- **Multi-Statement Processing**: Support for executing multiple SQL statements with quote-aware splitting.
- **Dynamic Result Sets**: Flexible display of query results directly within the workspace.

### Operations & Security

- **Profile Management**: Secure storage of connection profiles in the local application data directory.
- **Memory Safety**: Connection passwords are handled in memory and are never persisted to disk.
- **Native Experience**: Global command palette (`Ctrl+K`), tab-based navigation, and customizable dark/light themes.

## Technical Stack

### Frontend

- **Framework**: React 19
- **Bundler**: Vite
- **Styling**: Tailwind CSS v4 and Radix UI
- **Editor**: CodeMirror 6
- **Table Management**: TanStack Table v8 and Virtualizer v3

### Backend

- **Runtime**: Tauri v2
- **Language**: Rust
- **Database Layer**: SQLx (MySQL/MariaDB)

## Project Structure

```text
├── src/                      # Frontend Application (React)
│   ├── components/
│   │   ├── editor/           # SQL Editor integration
│   │   ├── layout/           # Application layout and shell
│   │   ├── sidebar/          # Database and table navigation
│   │   ├── table-view/       # Data grids and schema metadata
│   │   └── ui/               # Base UI components
│   ├── hooks/                # Business logic and custom hooks
│   ├── pages/                # Main application views
│   └── lib/                  # Utilities and core libraries
├── src-tauri/                # Backend Application (Rust)
│   ├── src/
│   │   ├── commands/         # Tauri bridge and API handlers
│   │   ├── db/               # Database utilities and conversion
│   │   ├── models.rs         # Shared data structures
│   │   ├── state.rs          # Managed connection pooling
│   │   └── lib.rs            # Application entry and registration
│   └── tauri.conf.json       # App configuration and permissions
└── package.json              # Build scripts and dependencies
```

## Getting Started

### Prerequisites

- **Rust**: Latest stable version
- **Node.js**: v18 or later
- **System Dependencies**: Refer to the [Tauri setup guide](https://tauri.app/v2/guides/getting-started/prerequisites/) for your operating system.

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/BurningHat20/aerobase.git
   cd aerobase
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Development mode**:

   ```bash
   npm run tauri dev
   ```

4. **Production build**:
   ```bash
   npm run tauri build
   ```

## Standard Shortcuts

| Shortcut       | Action                    |
| :------------- | :------------------------ |
| `Ctrl + K`     | Global Command Palette    |
| `Ctrl + T`     | Open New SQL Query Tab    |
| `Ctrl + W`     | Close Active Tab          |
| `Ctrl + B`     | Toggle Navigation Sidebar |
| `Ctrl + Enter` | Execute Current SQL       |

## License

Distributed under the MIT License.
