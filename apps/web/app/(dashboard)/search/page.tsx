"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search } from "lucide-react"

// Mock search results
const mockResults = [
  {
    id: "1",
    caseNumber: "HCA 1234/2024",
    title: "Wong v. Chan",
    type: "Property",
    court: "High Court",
    status: "in-progress",
    filingDate: "2024-01-15",
  },
  {
    id: "2",
    caseNumber: "HCMP 5678/2024",
    title: "Re: Li Family Trust",
    type: "Family",
    court: "High Court",
    status: "closed",
    filingDate: "2024-01-20",
  },
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("caseNumber")
  const [results, setResults] = useState<typeof mockResults>([])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual search
    if (searchQuery) {
      setResults(mockResults)
    } else {
      setResults([])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Public Case Search</h1>
        <p className="text-muted-foreground">
          Search for cases in the Hong Kong legal system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Cases</CardTitle>
          <CardDescription>
            Enter case number, party names, or keywords to search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="search">Search Query</Label>
                <Input
                  id="search"
                  placeholder="Enter case number, party name, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {results.length} case(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Filing Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.caseNumber}
                    </TableCell>
                    <TableCell>{result.title}</TableCell>
                    <TableCell>{result.type}</TableCell>
                    <TableCell>{result.court}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          result.status === "in-progress"
                            ? "case-status-in-progress"
                            : "case-status-closed"
                        }
                      >
                        {result.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.filingDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {searchQuery && results.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No results found. Try a different search query.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
