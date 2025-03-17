import React from 'react';

interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

const SidebarItem = ({ icon, label, onClick, isActive }: SidebarItemProps) => {
  return (
    <div 
      className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </div>
  );
};

interface SidebarProps {
  items: SidebarItemProps[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Sidebar = ({ items, header, footer }: SidebarProps) => {
  return (
    <div className="h-full flex flex-col">
      {header && <div className="p-4">{header}</div>}
      <div className="flex-1 overflow-y-auto">
        {items.map((item, index) => (
          <SidebarItem key={index} {...item} />
        ))}
      </div>
      {footer && <div className="p-4 border-t">{footer}</div>}
    </div>
  );
}; 