import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';


export default function DashboardNavbar() {
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('businessName') || 'Your Business';
    setBusinessName(name);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-border flex items-center px-8 z-40"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left side - Logo and Business Name */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <img src="/logo-light.png" alt="QueErp" width={660} height={180} className="h-14 md:h-16 w-auto"  />
          </Link>
          <div className="hidden md:block">
            <p className="text-sm text-muted-foreground">Welcome to</p>
            <h2 className="text-lg font-bold text-foreground">{businessName}</h2>
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <motion.button
            className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
          </motion.button>

          {/* Help */}
          <motion.button
            className="p-2 hover:bg-secondary rounded-lg transition-colors hidden md:block"
            whileHover={{ scale: 1.05 }}
            title="Help"
          >
            <span className="text-xl">❓</span>
          </motion.button>

          {/* User Profile */}
          <motion.button
            className="flex items-center gap-3 pl-4 pr-2 py-2 hover:bg-secondary rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-foreground">User</p>
              <p className="text-xs text-muted-foreground">Account</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-sm">
              U
            </div>
          </motion.button>

          {/* Logout */}
          <Link to="/">
            <motion.button
              className="text-xl hover:bg-destructive/10 p-2 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              title="Logout"
            >
              🚪
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
