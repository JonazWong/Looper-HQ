/**
 * New Case Creation Page
 * Client component with form for creating new cases
 */

'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Briefcase, 
  ArrowLeft, 
  Save,
  Loader2,
  Plus,
  Search
} from "lucide-react"
import { PremierButton } from "@/components/ui/premier-button"
import { 
  GlassCard, 
  GlassCardHeader, 
  GlassCardTitle, 
  GlassCardDescription, 
  GlassCardContent 
} from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CaseCategory, Priority } from "@looper-hq/database"

interface Client {
  id: string
  name: string | null
  email: string
}

interface Lawyer {
  id: string
  name: string | null
  email: string
}

export default function NewCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [titleZh, setTitleZh] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [descriptionZh, setDescriptionZh] = useState("")
  const [descriptionEn, setDescriptionEn] = useState("")
  const [category, setCategory] = useState<CaseCategory>("CIVIL")
  const [priority, setPriority] = useState<Priority>("MEDIUM")
  const [clientId, setClientId] = useState("")
  const [lawyerId, setLawyerId] = useState("")
  const [courtDate, setCourtDate] = useState("")
  const [estimatedValue, setEstimatedValue] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [publicNoteZh, setPublicNoteZh] = useState("")
  const [publicNoteEn, setPublicNoteEn] = useState("")

  // Search states
  const [clientSearch, setClientSearch] = useState("")
  const [lawyerSearch, setLawyerSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [searchingClients, setSearchingClients] = useState(false)
  const [searchingLawyers, setSearchingLawyers] = useState(false)

  // Search for clients
  const searchClients = async () => {
    if (!clientSearch.trim()) return
    
    setSearchingClients(true)
    try {
      const response = await fetch(`/api/clients?search=${encodeURIComponent(clientSearch)}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Error searching clients:', err)
    } finally {
      setSearchingClients(false)
    }
  }

  // Search for lawyers
  const searchLawyers = async () => {
    if (!lawyerSearch.trim()) return
    
    setSearchingLawyers(true)
    try {
      const response = await fetch(`/api/users?role=LAWYER&search=${encodeURIComponent(lawyerSearch)}`)
      if (response.ok) {
        const data = await response.json()
        setLawyers(data.users || [])
      }
    } catch (err) {
      console.error('Error searching lawyers:', err)
    } finally {
      setSearchingLawyers(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!titleZh.trim() || !titleEn.trim()) {
        throw new Error('Both Chinese and English titles are required')
      }
      if (!clientId) {
        throw new Error('Client is required')
      }

      const caseData = {
        title_zh: titleZh.trim(),
        title_en: titleEn.trim(),
        description_zh: descriptionZh.trim() || undefined,
        description_en: descriptionEn.trim() || undefined,
        publicNote_zh: publicNoteZh.trim() || undefined,
        publicNote_en: publicNoteEn.trim() || undefined,
        category,
        priority,
        clientId,
        lawyerId: lawyerId || undefined,
        courtDate: courtDate ? new Date(courtDate).toISOString() : undefined,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        isPublic,
      }

      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create case')
      }

      const result = await response.json()
      
      // Redirect to the new case
      router.push(`/cases/${result.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/cases">
          <PremierButton variant="ghost" icon={ArrowLeft} size="icon" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
            Create New Case
          </h1>
          <p className="text-premier-pearl-gray">
            Fill in the details to create a new legal case
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <GlassCard variant="gold" glow>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Basic Information
            </GlassCardTitle>
            <GlassCardDescription>
              Enter the case details
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            {/* Bilingual Title Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title_zh" className="text-premier-pearl">
                  Title (中文) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title_zh"
                  value={titleZh}
                  onChange={(e) => setTitleZh(e.target.value)}
                  placeholder="例如：物業糾紛 - 皇后大道中123號"
                  required
                  className="bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title_en" className="text-premier-pearl">
                  Title (English) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title_en"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g., Property Dispute - 123 Queen's Road Central"
                  required
                  className="bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl"
                />
              </div>
            </div>

            {/* Bilingual Description Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description_zh" className="text-premier-pearl">
                  Description (中文)
                </Label>
                <textarea
                  id="description_zh"
                  value={descriptionZh}
                  onChange={(e) => setDescriptionZh(e.target.value)}
                  placeholder="提供案件的詳細描述..."
                  rows={4}
                  className="w-full px-3 py-2 bg-premier-charcoal/50 border border-premier-gold/30 rounded-md text-premier-pearl placeholder:text-premier-pearl-gray focus:outline-none focus:ring-2 focus:ring-premier-gold"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description_en" className="text-premier-pearl">
                  Description (English)
                </Label>
                <textarea
                  id="description_en"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Provide a detailed description of the case..."
                  rows={4}
                  className="w-full px-3 py-2 bg-premier-charcoal/50 border border-premier-gold/30 rounded-md text-premier-pearl placeholder:text-premier-pearl-gray focus:outline-none focus:ring-2 focus:ring-premier-gold"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-premier-pearl">
                  Category <span className="text-red-400">*</span>
                </Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CaseCategory)}
                  required
                  className="w-full px-3 py-2 bg-premier-charcoal/50 border border-premier-gold/30 rounded-md text-premier-pearl focus:outline-none focus:ring-2 focus:ring-premier-gold"
                >
                  {Object.values(CaseCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-premier-pearl">
                  Priority <span className="text-red-400">*</span>
                </Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  required
                  className="w-full px-3 py-2 bg-premier-charcoal/50 border border-premier-gold/30 rounded-md text-premier-pearl focus:outline-none focus:ring-2 focus:ring-premier-gold"
                >
                  {Object.values(Priority).map((pri) => (
                    <option key={pri} value={pri}>
                      {pri}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Client and Lawyer Assignment */}
        <GlassCard variant="default">
          <GlassCardHeader>
            <GlassCardTitle>Client & Lawyer</GlassCardTitle>
            <GlassCardDescription>
              Assign client and lawyer to this case
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client" className="text-premier-pearl">
                Client <span className="text-red-400">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="client-search"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search for client by name or email..."
                  className="bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl flex-1"
                />
                <PremierButton
                  type="button"
                  variant="primary"
                  icon={searchingClients ? Loader2 : Search}
                  onClick={searchClients}
                  disabled={searchingClients}
                >
                  Search
                </PremierButton>
              </div>
              
              {clientId && (
                <div className="mt-2">
                  <Badge className="bg-premier-gold/20 text-premier-gold border-premier-gold/30">
                    Selected: {clients.find(c => c.id === clientId)?.name || 'Client'}
                  </Badge>
                </div>
              )}

              {clients.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2 border border-premier-gold/20 rounded-lg p-2">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setClientId(client.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        clientId === client.id
                          ? 'bg-premier-gold/20 border border-premier-gold/40'
                          : 'bg-premier-charcoal/30 hover:bg-premier-gold/10 border border-premier-gold/20'
                      }`}
                    >
                      <p className="text-premier-pearl font-medium">{client.name || 'Unnamed'}</p>
                      <p className="text-sm text-premier-pearl-gray">{client.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lawyer Selection */}
            <div className="space-y-2">
              <Label htmlFor="lawyer" className="text-premier-pearl">
                Assigned Lawyer (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="lawyer-search"
                  value={lawyerSearch}
                  onChange={(e) => setLawyerSearch(e.target.value)}
                  placeholder="Search for lawyer by name or email..."
                  className="bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl flex-1"
                />
                <PremierButton
                  type="button"
                  variant="primary"
                  icon={searchingLawyers ? Loader2 : Search}
                  onClick={searchLawyers}
                  disabled={searchingLawyers}
                >
                  Search
                </PremierButton>
              </div>

              {lawyerId && (
                <div className="mt-2">
                  <Badge className="bg-premier-mystery-violet/20 text-premier-mystery-violet border-premier-mystery-violet/30">
                    Selected: {lawyers.find(l => l.id === lawyerId)?.name || 'Lawyer'}
                  </Badge>
                </div>
              )}

              {lawyers.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2 border border-premier-gold/20 rounded-lg p-2">
                  {lawyers.map((lawyer) => (
                    <button
                      key={lawyer.id}
                      type="button"
                      onClick={() => setLawyerId(lawyer.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        lawyerId === lawyer.id
                          ? 'bg-premier-mystery-violet/20 border border-premier-mystery-violet/40'
                          : 'bg-premier-charcoal/30 hover:bg-premier-mystery-violet/10 border border-premier-gold/20'
                      }`}
                    >
                      <p className="text-premier-pearl font-medium">{lawyer.name || 'Unnamed'}</p>
                      <p className="text-sm text-premier-pearl-gray">{lawyer.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Additional Details */}
        <GlassCard variant="default">
          <GlassCardHeader>
            <GlassCardTitle>Additional Details</GlassCardTitle>
            <GlassCardDescription>
              Optional information
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courtDate" className="text-premier-pearl">
                  Court Date
                </Label>
                <Input
                  id="courtDate"
                  type="date"
                  value={courtDate}
                  onChange={(e) => setCourtDate(e.target.value)}
                  className="bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedValue" className="text-premier-pearl">
                  Estimated Value (HKD)
                </Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  step="0.01"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="0.00"
                  className="bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-premier-gold/30 bg-premier-charcoal/50 text-premier-gold focus:ring-premier-gold"
              />
              <Label htmlFor="isPublic" className="text-premier-pearl cursor-pointer">
                Make this case publicly visible
              </Label>
            </div>
            
            {/* Bilingual Public Note Fields - shown when case is public */}
            {isPublic && (
              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-premier-gold/20">
                <div className="space-y-2">
                  <Label htmlFor="publicNote_zh" className="text-premier-pearl">
                    Public Note (中文)
                  </Label>
                  <textarea
                    id="publicNote_zh"
                    value={publicNoteZh}
                    onChange={(e) => setPublicNoteZh(e.target.value)}
                    placeholder="公開顯示的備註..."
                    rows={2}
                    className="w-full px-3 py-2 bg-premier-charcoal/50 border border-premier-gold/30 rounded-md text-premier-pearl placeholder:text-premier-pearl-gray focus:outline-none focus:ring-2 focus:ring-premier-gold"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="publicNote_en" className="text-premier-pearl">
                    Public Note (English)
                  </Label>
                  <textarea
                    id="publicNote_en"
                    value={publicNoteEn}
                    onChange={(e) => setPublicNoteEn(e.target.value)}
                    placeholder="Public note for display..."
                    rows={2}
                    className="w-full px-3 py-2 bg-premier-charcoal/50 border border-premier-gold/30 rounded-md text-premier-pearl placeholder:text-premier-pearl-gray focus:outline-none focus:ring-2 focus:ring-premier-gold"
                  />
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/cases">
            <PremierButton variant="ghost" type="button">
              Cancel
            </PremierButton>
          </Link>
          <PremierButton 
            variant="primary" 
            type="submit" 
            icon={loading ? Loader2 : Save}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Case'}
          </PremierButton>
        </div>
      </form>
    </div>
  )
}
