import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

export function SmoothScrolling({ children }: { children: React.ReactNode }) {
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
            node.hasAttribute('data-lenis-prevent') ||
            Boolean(
              node.closest(
                '[data-lenis-prevent], [role="dialog"], [role="alertdialog"], [data-slot="dialog-content"], [data-slot="dialog-overlay"], [data-slot="sheet-content"], [data-radix-portal], [data-radix-popper-content-wrapper]'
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
