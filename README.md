⚡ Affan's Bookmark Vault
A lightweight, privacy-focused bookmarking system designed for developers and power users to manage URLs and local HTML files. This application functions as a self-contained, client-side tool that runs entirely in the browser, ensuring total data ownership.

🚀 Key Features
Dual-Mode Saving: Store standard web links or upload entire .html files directly into your vault.

Client-Side Privacy: All data is persisted via the browser's localStorage. No external databases, no tracking, and no accounts required.

Advanced Organization: Categorize entries and assign searchable tags to keep your digital library structured.

Integrated HTML Previewer: Safely view uploaded HTML content within a sandboxed environment.

Smart UI/UX:

Dynamic Dark Mode support.

Interactive Canvas-based cursor trail for a modern aesthetic.

Responsive design for various screen sizes.

Data Portability: Full JSON import/export functionality to move your vault between different browsers or devices.

🛠️ Technical Stack
This project is built with a focus on high performance and zero external dependencies:

Frontend: Semantic HTML5 & Modern CSS3 (utilizing CSS variables for theming).

Logic: Vanilla JavaScript (ES6+).

Storage: LocalStorage API for persistent data.

File I/O: FileReader and Blob APIs for managing HTML uploads and JSON portability.

📂 Project Architecture
The system follows a modular "Model-View-Controller" inspired structure for clean separation of concerns:

Plaintext
├── index.html          # Entry point & layout structure
├── css/
│   └── style.css       # Theming, animations, and responsive layout
└── js/
    ├── app.js          # Main orchestrator; wires DOM events to logic
    ├── storage.js      # Low-level LocalStorage interface
    ├── bookmarkModel.js# Business logic, search, and data normalization
    ├── ui.js           # Component rendering and modal management
    └── fileHandler.js  # File reading logic and JSON processing
🏁 Getting Started
Clone the Repository:

Bash
git clone https://github.com/affan675/03_bookmark_manager.git
Launch:
Open index.html in any modern web browser. No local server or environment setup is required.

🛡️ Security & Privacy
No Data Leaks: Your bookmarks and uploaded files never touch a server.

Iframe Sandboxing: Local HTML previews are rendered using the sandbox attribute to prevent script execution from interfering with the main application state.

Efficiency: Designed to be lightweight (~2MB safety cap on HTML files to stay within browser storage limits).

📄 License
This project is open-source and available under the MIT License.