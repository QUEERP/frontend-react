import { MenuIcon } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

export function MobileNavTrigger() {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden size-8 shrink-0"
      onClick={toggleSidebar}
      aria-label="Toggle navigation menu"
    >
      <MenuIcon className="size-5" />
    </Button>
  )
}
