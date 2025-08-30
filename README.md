# Sprint Board Lite

A modern, responsive Kanban task management application built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Live Demo

[Deploy to Vercel](https://vercel.com) - Connect your GitHub repository and deploy instantly.

## ✨ Features

### Core Functionality
- **Kanban Board**: Three-column layout (Todo, In Progress, Done)
- **Task Management**: Create, edit, delete, and move tasks between columns
- **Priority System**: High, Medium, Low priority with visual indicators
- **Drag & Drop**: Intuitive HTML5 drag and drop between columns
- **Keyboard Navigation**: Arrow keys to move tasks between columns

### Authentication & Security
- **Mock Authentication**: Simple login system (accepts any non-empty credentials)
- **Route Protection**: Board route guarded, redirects to login if not authenticated
- **Token Storage**: Uses localStorage for session management

### User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Persistent theme switching with system preference detection
- **Loading States**: Skeleton loaders and loading spinners
- **Error Handling**: Graceful error boundaries and user-friendly error messages
- **Optimistic Updates**: Immediate UI feedback with rollback on API failures

### Advanced Features
- **Undo Functionality**: 5-second undo toast after task moves
- **Search & Filter**: Client-side search by title and filter by priority
- **Priority Sorting**: Tasks automatically sorted by priority (High → Medium → Low)
- **Delete Confirmation**: Confirmation dialog before task deletion

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: React Context API + useReducer
- **HTTP Client**: Axios
- **Mock API**: json-server with simulated 10% failure rate
- **Font**: Bricolage Grotesque Variable

## 📁 Project Structure

```
sprint-board-lite/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── board/          # Protected board route
│   │   ├── login/          # Authentication page
│   │   ├── globals.css     # Global styles and CSS variables
│   │   ├── fonts.css       # Custom font imports
│   │   └── layout.tsx      # Root layout with providers
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── KanbanBoard.tsx # Main board component
│   │   ├── TaskCard.tsx    # Individual task display
│   │   ├── CreateTaskModal.tsx # Task creation modal
│   │   ├── EditTaskModal.tsx   # Task editing modal
│   │   ├── UndoToast.tsx   # Undo notification
│   │   └── DarkModeToggle.tsx # Theme switcher
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── TaskContext.tsx # Task management state
│   ├── lib/                # Utility functions
│   │   └── api.ts         # API client and endpoints
│   └── types/              # TypeScript type definitions
├── db.json                 # Mock API data
├── tailwind.config.ts      # Tailwind configuration
└── package.json            # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sprint-board-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the mock API server**
   ```bash
   npm run mock-api
   ```
   This starts json-server on port 3002 with the mock data.

4. **Start the development server**
   ```bash
   npm run dev
   ```
   This starts Next.js on port 3000.

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run mock-api` - Start mock API server
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Mock API
The application uses `json-server` to simulate a real API:
- **Base URL**: `http://localhost:3002`
- **Endpoints**: 
  - `GET /tasks` - Fetch all tasks
  - `POST /tasks` - Create new task
  - `PATCH /tasks/:id` - Update task
  - `DELETE /tasks/:id` - Delete task
- **Failure Rate**: Simulated 10% failure rate on PATCH/POST operations

### Environment Variables
Create a `.env.local` file for custom configurations:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
```

## 🎯 Variant Implementation: UNDO MOVE

### Features Implemented
- **Undo Toast**: 5-second countdown toast appears after task moves
- **State Rollback**: Clicking "Undo" reverts the task to its previous column
- **API Sync**: Undo operation also updates the server state
- **Keyboard Navigation**: Left/right arrow keys move tasks between columns
- **Visual Feedback**: Clear indicators for drag and drop zones

### Technical Details
- Uses React Context for state management
- Implements optimistic updates with rollback
- Maintains move history for undo operations
- Integrates with Framer Motion for smooth animations

## 🎨 Design Decisions

### UI/UX Choices
- **Color Scheme**: Professional, accessible colors with proper contrast
- **Typography**: Bricolage Grotesque Variable font for modern aesthetics
- **Spacing**: Consistent 4px grid system using Tailwind's spacing scale
- **Animations**: Subtle micro-interactions for better user feedback

### Component Architecture
- **Atomic Design**: Small, focused components with clear responsibilities
- **Composition**: Flexible component composition over inheritance
- **Accessibility**: Proper ARIA labels, keyboard navigation, and focus management
- **Performance**: Optimized re-renders with useMemo and useCallback

### State Management
- **Context API**: Global state for authentication and tasks
- **Local State**: Component-specific state for modals and UI interactions
- **Optimistic Updates**: Immediate feedback with proper error handling
- **Persistence**: Theme preferences saved to localStorage

## 🚧 What Was Omitted

- **Real Authentication**: Using mock auth for demo purposes
- **Database**: Mock API with json-server instead of real database
- **User Management**: Single user system without user registration
- **Advanced Search**: Basic client-side search without server-side pagination
- **File Attachments**: No file upload functionality
- **Notifications**: Basic toast notifications without push notifications
- **Offline Support**: No service worker or offline functionality

## ⏱️ Time Spent

### Development Phases
- **Project Setup**: 30 minutes (Next.js, dependencies, configuration)
- **Core Components**: 2 hours (Kanban board, task cards, modals)
- **State Management**: 1.5 hours (Context setup, API integration)
- **Drag & Drop**: 2 hours (HTML5 implementation, visual feedback)
- **UI Polish**: 1 hour (styling, animations, responsive design)
- **Testing & Debugging**: 1 hour (bug fixes, edge cases)
- **Documentation**: 30 minutes (README, code comments)

**Total Development Time**: ~8.5 hours

## 🐛 Known Issues & Limitations

- **Build Errors**: Occasional Next.js build issues with page data collection
- **Mock API**: json-server process needs manual restart sometimes
- **Theme Persistence**: Dark mode toggle may need refresh on first load
- **Mobile Drag**: Touch drag and drop could be improved for mobile devices

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically on push

### Manual Deployment
1. Build the project: `npm run build`
2. Start production server: `npm run start`
3. Configure reverse proxy (nginx/Apache) if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful, accessible components
- **Framer Motion** for smooth animations
- **Tailwind CSS** for utility-first styling
- **Next.js Team** for the amazing framework

---

Built with ❤️ using modern web technologies
