/**
 * Clients Page - Server Component
 * Fetches and displays all clients from the database
 */

import Link from "next/link"
import { 
  Users, 
  Plus,
  Eye,
  Edit,
  Mail,
  Phone,
  Building2,
  User
} from "lucide-react"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { PremierButton } from "@/components/ui/premier-button"
import { StatCard } from "@/components/ui/stat-card"
import { 
  GlassCard, 
  GlassCardHeader, 
  GlassCardTitle, 
  GlassCardDescription, 
  GlassCardContent 
} from "@/components/ui/glass-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClientsFilters } from "@/components/clients/clients-filters"
import { ClientsPagination } from "@/components/clients/clients-pagination"
import { MembershipTier, ClientType } from "@looper-hq/database"

interface SearchParams {
  search?: string
  tier?: string
  page?: string
}

interface ClientsPageProps {
  searchParams: Promise<SearchParams>
}

// Constants
const CLIENTS_PER_PAGE = 10

// Fetch clients from database
async function getClients(params: SearchParams) {
  try {
    const page = parseInt(params.page || '1')
    const skip = (page - 1) * CLIENTS_PER_PAGE

    // Build where clause
    const where: any = {}

    // Search filter
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { companyName: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    // Tier filter
    if (params.tier && Object.values(MembershipTier).includes(params.tier as MembershipTier)) {
      where.membershipTier = params.tier as MembershipTier
    }

    // Fetch clients with pagination
    const [clients, totalClients] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: CLIENTS_PER_PAGE,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.client.count({ where }),
    ])

    return {
      clients,
      totalClients,
      currentPage: page,
      totalPages: Math.ceil(totalClients / CLIENTS_PER_PAGE),
    }
  } catch (error) {
    console.error('Error fetching clients:', error)
    return {
      clients: [],
      totalClients: 0,
      currentPage: 1,
      totalPages: 0,
    }
  }
}

// Fetch client statistics
async function getClientStats() {
  try {
    const [totalClients, basicTier, standardTier, premiumTier, premierTier] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { membershipTier: MembershipTier.BASIC } }),
      prisma.client.count({ where: { membershipTier: MembershipTier.STANDARD } }),
      prisma.client.count({ where: { membershipTier: MembershipTier.PREMIUM } }),
      prisma.client.count({ where: { membershipTier: MembershipTier.PREMIER } }),
    ])

    return {
      totalClients,
      basicTier,
      standardTier,
      premiumTier,
      premierTier,
    }
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return {
      totalClients: 0,
      basicTier: 0,
      standardTier: 0,
      premiumTier: 0,
      premierTier: 0,
    }
  }
}

// Get membership tier badge color
function getTierColor(tier: MembershipTier): string {
  const colors: Record<MembershipTier, string> = {
    BASIC: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    STANDARD: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PREMIUM: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    PREMIER: 'bg-gradient-to-r from-premier-gold to-premier-gold-light text-premier-charcoal border-premier-gold',
  }
  return colors[tier] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

// Get client type badge color
function getTypeColor(type: ClientType): string {
  return type === 'INDIVIDUAL' 
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const resolvedSearchParams = await searchParams
  
  // Fetch data in parallel
  const [{ clients, totalClients, currentPage, totalPages }, stats] = await Promise.all([
    getClients(resolvedSearchParams),
    getClientStats(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
            Clients
          </h1>
          <p className="text-premier-pearl-gray">
            Manage and track all your clients
          </p>
        </div>
        <Link href="/clients/new">
          <PremierButton variant="primary" icon={Plus}>
            New Client
          </PremierButton>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
        />
        <StatCard
          title="Basic Tier"
          value={stats.basicTier}
          icon={User}
        />
        <StatCard
          title="Premium Tier"
          value={stats.premiumTier}
          icon={Building2}
        />
        <StatCard
          title="Premier Tier"
          value={stats.premierTier}
          icon={Building2}
        />
      </div>

      {/* Filters */}
      <GlassCard>
        <GlassCardContent className="pt-6">
          <ClientsFilters
            initialSearch={resolvedSearchParams.search}
            initialTier={resolvedSearchParams.tier}
          />
        </GlassCardContent>
      </GlassCard>

      {/* Clients Table */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>All Clients</GlassCardTitle>
          <GlassCardDescription>
            Showing {clients.length} of {totalClients} client{totalClients !== 1 ? 's' : ''}
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-premier-pearl-gray opacity-50" />
              <h3 className="mt-4 text-lg font-semibold text-premier-pearl">No clients found</h3>
              <p className="mt-2 text-sm text-premier-pearl-gray">
                {resolvedSearchParams.search || resolvedSearchParams.tier
                  ? 'Try adjusting your filters'
                  : 'Get started by adding a new client'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-premier-gold/20 hover:bg-transparent">
                    <TableHead className="text-premier-pearl">Name</TableHead>
                    <TableHead className="text-premier-pearl">Contact</TableHead>
                    <TableHead className="text-premier-pearl">Company/Type</TableHead>
                    <TableHead className="text-premier-pearl">Membership</TableHead>
                    <TableHead className="text-premier-pearl text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow 
                      key={client.id}
                      className="border-premier-gold/10 hover:bg-premier-gold/5"
                    >
                      <TableCell className="font-medium text-premier-pearl">
                        {client.fullName}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1.5 text-premier-pearl-gray">
                            <Mail className="h-3.5 w-3.5" />
                            {client.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-premier-pearl-gray">
                            <Phone className="h-3.5 w-3.5" />
                            {client.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.companyName && (
                            <p className="text-sm text-premier-pearl">{client.companyName}</p>
                          )}
                          <Badge 
                            variant="outline" 
                            className={getTypeColor(client.type)}
                          >
                            {client.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getTierColor(client.membershipTier)}
                        >
                          {client.membershipTier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/clients/${client.id}`}>
                            <PremierButton variant="ghost" size="sm" icon={Eye}>
                              View
                            </PremierButton>
                          </Link>
                          <Link href={`/clients/${client.id}/edit`}>
                            <PremierButton variant="secondary" size="sm" icon={Edit}>
                              Edit
                            </PremierButton>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <GlassCard>
          <GlassCardContent className="py-4">
            <ClientsPagination
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}
