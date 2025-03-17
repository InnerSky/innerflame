import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export const AppShell = ({ children, sidebar, header }: AppShellProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {header && <header className="border-b">{header}</header>}
      <div className="flex flex-1">
        {sidebar && (
          <aside className="w-64 border-r">
            {sidebar}
          </aside>
        )}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}; 