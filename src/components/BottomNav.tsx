import React from 'react';
import { NavTab } from '../types';
import { KeyRound, ShieldAlert, Building2, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: NavTab | null;
  setActiveTab: (tab: NavTab) => void;
  activationLabel?: string;
  approvedPlan?: 'tenant' | 'user' | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  activationLabel = 'Activation',
  approvedPlan = null,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 z-50">
      <div className="max-w-md mx-auto grid grid-cols-2 h-16">
        <button
          type="button"
          onClick={() => setActiveTab('activation')}
          className="flex flex-col items-center justify-center text-black focus:outline-none"
        >
          {approvedPlan === 'tenant' ? (
            <Building2 className="w-5 h-5 mb-1 text-black" />
          ) : approvedPlan === 'user' ? (
            <User className="w-5 h-5 mb-1 text-black" />
          ) : (
            <KeyRound className="w-5 h-5 mb-1 text-black" />
          )}
          <span className="text-xs text-black font-normal">
            {activationLabel}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className="flex flex-col items-center justify-center text-black focus:outline-none"
        >
          <ShieldAlert className="w-5 h-5 mb-1 text-black" />
          <span className="text-xs text-black font-normal">
            Admin
          </span>
        </button>
      </div>
    </nav>
  );
};
