import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';

const menuItems = [
  { label: 'Dashboard', icon: '📊', href: '#' },
  { label: 'Transactions', icon: '💳', href: '#' },
  { label: 'Invoices', icon: '📄', href: '#' },
  { label: 'Reports', icon: '📈', href: '#' },
  { label: 'Settings', icon: '⚙️', href: '#' },
];

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen bg-primary text-primary-foreground transition-all duration-300 pt-20 border-r border-primary-foreground/10"
      style={{ width: isOpen ? 250 : 80 }}
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-20 -right-3 bg-primary text-primary-foreground border border-primary-foreground/20 rounded-full w-6 h-6 flex items-center justify-center hover:bg-primary-foreground/10 transition-all"
      >
        {isOpen ? '←' : '→'}
      </button>

      {/* Menu Items */}
      <nav className="px-4 py-6 space-y-2">
        {menuItems.map((item, idx) => (
          <motion.a
            key={item.label}
            href={item.href}
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-primary-foreground/10 transition-colors group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            title={!isOpen ? item.label : ''}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            {isOpen && (
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {item.label}
              </span>
            )}
          </motion.a>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-foreground/10">
        <motion.button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-foreground/10 transition-colors text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
            U
          </div>
          {isOpen && (
            <span className="text-xs font-medium text-primary-foreground/80 truncate">
              Profile
            </span>
          )}
        </motion.button>
      </div>
    </motion.aside>
  );
}
