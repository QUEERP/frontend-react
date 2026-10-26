import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { useLocation } from 'react-router-dom';

export function SmoothScrolling({ children }: { children: React.ReactNode }) {
  let isDashboard = false;
  try {
    const location = useLocation();
    isDashboard = Boolean(location?.pathname?.startsWith('/dashboard'));
  } catch {
    if (typeof window !== 'undefined') {
      isDashboard = window.location.pathname.startsWith('/dashboard');
    }
  }

  // Disable Lenis completely in the dashboard so all tables, workspaces, sidebars, and nested scrolls work natively
  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.5,
        smoothWheel: true,
        prevent: (node) => {
          if (!node || !(node instanceof HTMLElement)) return false;
          return (
            typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard') ||
            node.hasAttribute('data-lenis-prevent') ||
            Boolean(
              node.closest(
                '[data-lenis-prevent], [data-slot="sidebar-inset"], [data-slot="sidebar"], [role="dialog"], [role="alertdialog"], [data-slot="dialog-content"], [data-slot="dialog-overlay"], [data-slot="sheet-content"], [data-radix-portal], [data-radix-popper-content-wrapper]'
              )
            )
          );
        },
      }}
    >
      {children}
    </ReactLenis>
  );
}
