import React from 'react';
import type { Theme, Channel } from '../types';
import { AllIcon, BusinessIcon, PersonalIcon, MoonIcon, SunIcon, LogoIcon, ComposeIcon } from './icons';

interface SidebarProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  selectedChannel: Channel;
  setSelectedChannel: (channel: Channel) => void;
  unreadCounts: {
    all: number;
    personal: number;
    business: number;
  };
  onStartCompose: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: Channel;
  isSelected: boolean;
  onClick: () => void;
  count: number;
}> = ({ icon, label, isSelected, onClick, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
      isSelected
        ? 'bg-primary-500 text-white shadow-md'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
    aria-label={`${label} messages, ${count} unread`}
  >
    {icon}
    <span className="ml-4 font-semibold flex-1 text-left">{label}</span>
    {count > 0 && (
      <span className={`text-xs font-bold rounded-full px-2 py-0.5 transition-colors ${
        isSelected ? 'bg-white text-primary-600' : 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300'
      }`}>
        {count}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ theme, setTheme, selectedChannel, setSelectedChannel, unreadCounts, onStartCompose }) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 p-4 flex flex-col border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-6 px-2">
        <LogoIcon className="w-8 h-8 text-primary-500" />
        <h1 className="text-xl font-bold ml-2">Unified Hub</h1>
      </div>
      <div className="px-2 mb-6">
        <button
          onClick={onStartCompose}
          className="flex items-center justify-center w-full px-4 py-3 rounded-lg transition-colors duration-200 bg-primary-500 text-white hover:bg-primary-600 shadow-md"
        >
          <ComposeIcon className="w-6 h-6" />
          <span className="ml-3 font-semibold">Compose</span>
        </button>
      </div>
      <nav className="flex-grow space-y-2">
        <NavItem 
          icon={<AllIcon className="w-6 h-6" />}
          label="All"
          isSelected={selectedChannel === 'All'}
          onClick={() => setSelectedChannel('All')}
          count={unreadCounts.all}
        />
        <NavItem 
          icon={<PersonalIcon className="w-6 h-6" />}
          label="Personal"
          isSelected={selectedChannel === 'Personal'}
          onClick={() => setSelectedChannel('Personal')}
          count={unreadCounts.personal}
        />
        <NavItem 
          icon={<BusinessIcon className="w-6 h-6" />}
          label="Business"
          isSelected={selectedChannel === 'Business'}
          onClick={() => setSelectedChannel('Business')}
          count={unreadCounts.business}
        />
      </nav>
      <div className="mt-auto">
        <button
          onClick={toggleTheme}
          className="flex items-center w-full px-4 py-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
          <span className="ml-4 font-semibold">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
      </div>
    </aside>
  );
};