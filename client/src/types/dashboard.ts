export interface DashboardStats {
  totalRevenueThisMonth: number
  revenueLastMonth: number
  ordersThisMonth: number
  ordersLastMonth: number
  lowStockCount: number
  outstandingInvoicesAmount: number
  outstandingInvoicesCount: number
  overdueInvoicesCount: number
}

export interface RevenueByMonth {
  month: string
  revenue: number
}

export interface TopClient {
  clientId: number
  clientName: string
  totalSpend: number
  orderCount: number
}

export interface TopProduct {
  productId: number
  productName: string
  sku: string
  totalQuantity: number
  totalRevenue: number
}

export interface ActivityItem {
  id: number
  type:
    | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_FULFILLED'
    | 'INVOICE_SENT'    | 'INVOICE_PAID'  | 'INVOICE_OVERDUE'
    | 'LOW_STOCK'       | 'CLIENT_ADDED'
  description: string
  subtext: string
  createdAt: string
}

export interface DashboardData {
  stats: DashboardStats
  revenueByMonth: RevenueByMonth[]
  recentActivity: ActivityItem[]
}

export interface ReportsData {
  revenueByMonth: RevenueByMonth[]
  topClients: TopClient[]
  topProducts: TopProduct[]
  orderVolumeByMonth: { month: string; count: number }[]
}
