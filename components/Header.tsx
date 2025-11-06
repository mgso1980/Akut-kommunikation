import React from 'react';
import { HospitalIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800/50 shadow-md sticky top-0 z-10 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <HospitalIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              Klinisk Simulator
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
