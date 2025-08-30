# AI Prompts Used in Development

This document showcases the AI prompts and interactions that were used to build Sprint Board Lite. These prompts demonstrate effective AI collaboration techniques and problem-solving approaches.

## 🎯 Project Initialization

### Initial Project Setup
```
Build "Sprint Board Lite," a Kanban task management application with the following requirements:

Tech Stack:
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- State Management
- Axios (initially fetch)

Core Features:
1. Auth (mocked): /login route that accepts any non-empty email/password, stores token in localStorage, redirects to /board. /board route must be guarded, redirecting to /login if no token present. Logout should clear token.

2. Board: Kanban board with three columns: "Todo," "In Progress," and "Done." Must load tasks from mock API, support drag & drop between columns, implement optimistic updates with rollback on API failures, include "Create task" modal (title, description, priority: low/medium/high) where new tasks start in "Todo."

3. Search & Filter: Client-side search by title and filter by priority.

4. UX Essentials: Mobile-first responsive design, loading skeletons, error/empty states, and persisted dark mode.

5. Variant Implementation: UNDO MOVE - After moving a task, a 5-second "Undo" toast should appear. Clicking "Undo" should revert the state and PATCH the server. Keyboard moves (left/right arrows on a focused card) should also be supported.

Scoring Rubric Focus: Data & API flow, State & components, UI/UX, Code quality, and AI usage maturity.

Deliverables: A deployed demo (Vercel), a public repository with README.md and AI_PROMPTS.md, and clean, incremental commits.
```

**Result**: Successfully created the initial project structure with Next.js 15, TypeScript, and all required dependencies.

## 🔧 Technical Problem Solving

### CORS and Port Configuration Issues
```
The error indicates that the mock API server is not running. Let me start both the mock API server and the Next.js development server for you.

The error indicates that the mock API server is not running. Let me start both the mock API server and the Next.js development server for you.
```

**Result**: Identified and resolved CORS issues by configuring proper ports and starting json-server.

### Dark Mode Implementation Issues
```
User feedback: "dark mode lightmode is not worig" (repeated several times with specific feedback)

User feedback: "dark mode and light mode not wokring alo when there are hard and low priority issue are there then show hard first medium second and low third that measn high will be get fixed early"

User feedback: "lightmode isnot wokring can you use shadcn and tailwind for better ui"
```

**Result**: Successfully implemented persistent dark mode using CSS variables, Tailwind dark: classes, and localStorage persistence.

## 🎨 UI/UX Improvements

### Professional Color Scheme
```
User feedback: "make the ui profeional not o many colour"

User feedback: "create a whole UI colours again there are many isue in dark mode and light mode in dark mode make it black bg with white font colour and for todo gray light for in progress yellow light and for done green light"
```

**Result**: Implemented professional, accessible color scheme with proper contrast ratios and semantic color usage.

### Custom Font Integration
```
User feedback: "Bricolage Grotesque Variable use this font"
```

**Result**: Successfully integrated Bricolage Grotesque Variable font using Google Fonts and Tailwind configuration.

### shadcn/ui Integration
```
User feedback: "lightmode isnot wokring can you use shadcn and tailwind for better ui"
```

**Result**: Installed and configured shadcn/ui components, refactored all UI components to use professional design system.

## 🖱️ Drag and Drop Functionality

### HTML5 Drag and Drop Implementation
```
User feedback: "allow user to drag and throw to other box too and that time you can show hand"

User feedback: "change the bg colour in dark mode to dark black grey but not coompletely black and one more issue : the drag functionalityis not wokring properly"

User feedback: "remove this button and show if the user hold the box then show in the other boxes that drag here thats it"
```

**Result**: Implemented robust HTML5 drag and drop with visual feedback, proper state management, and intuitive user experience.

## 🗑️ Delete Confirmation

### User Safety Features
```
User feedback: "add confirm you want to delte ?"
```

**Result**: Added confirmation dialog before task deletion to prevent accidental data loss.

## 📝 Documentation and Repository Setup

### Repository Requirements
```
They need this

[Image showing requirements for public repo including README.md, AI_PROMPTS.md, and clear incremental commits]
```

**Result**: Created comprehensive README.md and AI_PROMPTS.md files, and prepared for clean commit history.

## 🚀 Effective Prompting Techniques Used

### 1. **Specific Requirements**
- Clear tech stack specifications
- Detailed feature requirements
- Explicit scoring criteria

### 2. **User Feedback Integration**
- Directly addressing user concerns
- Iterative problem solving
- User experience focus

### 3. **Technical Problem Solving**
- Error analysis and debugging
- Step-by-step resolution
- Verification of fixes

### 4. **Code Quality Focus**
- TypeScript error resolution
- ESLint warning fixes
- Build error troubleshooting

### 5. **Documentation Standards**
- Comprehensive README creation
- AI prompt documentation
- Clear project structure

## 💡 Key Learning Outcomes

### AI Collaboration Best Practices
1. **Clear Communication**: Specific, detailed requirements lead to better results
2. **Iterative Development**: Address user feedback systematically
3. **Problem Analysis**: Understand errors before implementing fixes
4. **Quality Assurance**: Test builds and verify functionality
5. **Documentation**: Maintain clear records of AI interactions

### Technical Skills Demonstrated
- Next.js 15 App Router implementation
- TypeScript configuration and error handling
- Tailwind CSS with custom design systems
- shadcn/ui component integration
- HTML5 drag and drop implementation
- React Context API state management
- Mock API development with json-server
- Responsive design and dark mode
- Error boundaries and loading states

## 🔄 Development Workflow

### AI-Assisted Development Process
1. **Requirement Analysis**: Break down complex requirements into manageable tasks
2. **Implementation**: Use AI for code generation and problem solving
3. **Testing**: Verify functionality and fix issues iteratively
4. **Refinement**: Address user feedback and improve UX
5. **Documentation**: Maintain clear records and prepare for deployment

### Version Control Strategy
- **Incremental Commits**: Small, focused changes with clear commit messages
- **Feature Branches**: Separate development for major features
- **Code Review**: Self-review before committing
- **Clean History**: Maintain professional commit history

---

This document demonstrates effective AI collaboration in modern web development, showcasing how AI can be used as a powerful development partner while maintaining code quality and user experience standards.
