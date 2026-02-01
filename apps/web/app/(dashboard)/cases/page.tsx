import Link from "next/link"
import { Button } from "@/components/ui/button"
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
import { Plus } from "lucide-react"

// Mock data
const cases = [
  {
    id: "1",
    caseNumber: "HCA 1234/2024",
    title: "Wong v. Chan Property Dispute",
    client: "Mr. Wong",
    type: "Property",
    status: "in-progress",
    priority: "high",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    caseNumber: "HCA 5678/2024",
    title: "Li Family Trust Administration",
    client: "Li Family",
    type: "Family",
    status: "open",
    priority: "medium",
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    caseNumber: "HCA 9012/2024",
    title: "Corporate Merger - ABC Ltd",
    client: "ABC Limited",
    type: "Corporate",
    status: "in-progress",
    priority: "urgent",
    createdAt: "2024-01-25",
  },
  {
    id: "4",
    caseNumber: "HCA 3456/2024",
    title: "Employment Termination Dispute",
    client: "Ms. Cheung",
    type: "Employment",
    status: "closed",
    priority: "low",
    createdAt: "2024-01-10",
  },
]

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground">
            Manage and track all your legal cases
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cases</CardTitle>
          <CardDescription>
            A list of all cases in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((case_) => (
                <TableRow key={case_.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/cases/${case_.id}`}
                      className="hover:underline"
                    >
                      {case_.caseNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{case_.title}</TableCell>
                  <TableCell>{case_.client}</TableCell>
                  <TableCell>{case_.type}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        case_.status === "in-progress"
                          ? "case-status-in-progress"
                          : case_.status === "open"
                          ? "case-status-open"
                          : case_.status === "closed"
                          ? "case-status-closed"
                          : ""
                      }
                    >
                      {case_.status.replace("-", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{case_.priority}</Badge>
                  </TableCell>
                  <TableCell>{case_.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
