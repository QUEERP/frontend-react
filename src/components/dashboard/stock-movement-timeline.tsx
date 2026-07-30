import * as React from 'react'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  Settings2, 
  Undo2, 
  User, 
  Calendar,
  FileText,
  Package,
  History,
  Warehouse as WarehouseIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type MovementType = 'PURCHASE_IN' | 'SALE_OUT' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER'

export interface StockMovement {
  id: string
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  type: MovementType
  quantity: number
  referenceNo?: string
  note?: string
  performedBy: string
  createdAt: string
}

interface StockMovementTimelineProps {
  movements: StockMovement[]
}

const typeConfig = {
  PURCHASE_IN: {
    label: 'Purchase In',
    icon: ArrowDownLeft,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200'
  },
  SALE_OUT: {
    label: 'Sale Out',
    icon: ArrowUpRight,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    badge: 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200'
  },
  ADJUSTMENT: {
    label: 'Adjustment',
    icon: Settings2,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    badge: 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'
  },
  TRANSFER: {
    label: 'Transfer',
    icon: RefreshCcw,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    badge: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
  },
  RETURN: {
    label: 'Return',
    icon: Undo2,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    badge: 'bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200'
  }
}

export function StockMovementTimeline({ movements }: StockMovementTimelineProps) {
  if (!movements.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border">
        <History className="size-10 text-muted-foreground/30" />
        <div>
          <p className="font-semibold text-muted-foreground">No movements found</p>
          <p className="text-xs text-muted-foreground/60">Inventory changes will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {movements.map((movement, index) => {
        const config = typeConfig[movement.type] || typeConfig.ADJUSTMENT
        const Icon = config.icon

        return (
          <div key={movement.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            {/* Icon Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-muted shadow-sm group-hover:scale-110 transition-transform md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 z-10">
              <Icon className={cn("size-5", config.color)} />
            </div>

            {/* Content Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px] uppercase font-black px-2 py-0 h-5", config.badge)}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    {format(new Date(movement.createdAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                {movement.referenceNo && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                    <FileText className="size-3" />
                    {movement.referenceNo}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <Package className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-black leading-tight">{movement.productName}</p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                      <WarehouseIcon className="size-3" />
                      {movement.warehouseName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      <User className="size-3 text-muted-foreground" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{movement.performedBy}</span>
                  </div>
                  <div className={cn(
                    "text-sm font-black flex items-center gap-1",
                    movement.quantity > 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </div>
                </div>

                {movement.note && (
                  <div className="mt-2 text-[11px] text-muted-foreground italic bg-muted/30 p-2 rounded-lg border border-border/30">
                    "{movement.note}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
