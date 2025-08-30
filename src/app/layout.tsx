import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { TaskProvider } from "@/contexts/TaskContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Sprint Board Lite",
  description: "A Kanban task management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-bricolage antialiased"
      >
        <ErrorBoundary>
          <AuthProvider>
            <TaskProvider>
              {children}
            </TaskProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
