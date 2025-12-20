import React from 'react';
import { 
  Wallet, 
  LayoutDashboard, 
  ScrollText, 
  Car, 
  PieChart, 
  CreditCard, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  Receipt
} from 'lucide-react';
import NavItem from './NavItem';
import logo from '../logo.png';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeTextClass } from '../utils/getThemeClasses';

const Sidebar = ({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  activeTab, 
  setActiveTab,
  isDarkMode,
  toggleTheme,
  onLogout
}) => {
  const { colorTheme } = useTheme();
  
  const getHoverTextClass = () => {
    if (colorTheme === 'indigo') return 'hover:text-indigo-600 dark:hover:text-indigo-400';
    if (colorTheme === 'blue') return 'hover:text-blue-600 dark:hover:text-blue-400';
    if (colorTheme === 'emerald') return 'hover:text-emerald-600 dark:hover:text-emerald-400';
    if (colorTheme === 'purple') return 'hover:text-purple-600 dark:hover:text-purple-400';
    if (colorTheme === 'rose') return 'hover:text-rose-600 dark:hover:text-rose-400';
    if (colorTheme === 'amber') return 'hover:text-amber-600 dark:hover:text-amber-400';
    return 'hover:text-indigo-600 dark:hover:text-indigo-400';
  };
  
  return (
    <aside 
      className={`${
        isSidebarCollapsed ? 'w-20' : 'w-72'
      } bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 flex flex-col transition-all duration-500 ease-in-out relative z-30`}
    >
      <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-center'} h-20`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <img 
            src={logo} 
            alt="WestBudget" 
            className={`${isSidebarCollapsed ? 'w-8 h-8' : 'w-20 h-20'} object-contain transition-all duration-300`}
          />
        </div>
      </div>

      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={`absolute -right-3 top-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full p-1 text-zinc-500 transition-all shadow-sm z-50 hover:scale-110 ${getHoverTextClass()}`}
      >
        {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      <nav className="flex-1 px-3 space-y-1 mt-4">
        <NavItem collapsed={isSidebarCollapsed} icon={<LayoutDashboard />} label="Översikt" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <NavItem collapsed={isSidebarCollapsed} icon={<ScrollText />} label="Avtal" active={activeTab === 'agreements'} onClick={() => setActiveTab('agreements')} />
        <NavItem collapsed={isSidebarCollapsed} icon={<Car />} label="Fordon" active={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')} />
        <NavItem collapsed={isSidebarCollapsed} icon={<PiggyBank />} label="Sparande" active={activeTab === 'savings'} onClick={() => setActiveTab('savings')} />
        <NavItem collapsed={isSidebarCollapsed} icon={<Receipt />} label="Lån" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />
        <NavItem collapsed={isSidebarCollapsed} icon={<PieChart />} label="Rapporter" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
        <NavItem collapsed={isSidebarCollapsed} icon={<CreditCard />} label="Transaktioner" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
        
        <div className={`pt-4 pb-2 transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <p className="px-3 text-xs font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">System</p>
        </div>
        
        <NavItem collapsed={isSidebarCollapsed} icon={<Settings />} label="Inställningar" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 space-y-2">
        <button 
          onClick={toggleTheme}
          className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
            isSidebarCollapsed ? 'justify-center' : ''
          } text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
            {isDarkMode ? 'Ljust läge' : 'Mörkt läge'}
          </span>
        </button>

        <button 
          onClick={onLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
            isSidebarCollapsed ? 'justify-center' : ''
          } text-zinc-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 dark:hover:text-rose-400`}
        >
          <LogOut className="w-5 h-5" />
          <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
            Logga ut
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

