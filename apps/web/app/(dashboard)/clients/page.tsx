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
import { Plus, Mail, Phone } from "lucide-react"

// Mock data
const clients = [
  {
    id: "1",
    name: "Mr. Wong Tai Ming",
    email: "wong.tm@example.com",
    phone: "+852 9123 4567",
    company: "Wong Holdings Ltd",
    activeCases: 2,
    status: "active",
  },
  {
    id: "2",
    name: "Li Family Trust",
    email: "contact@lifamily.hk",
    phone: "+852 9234 5678",
    company: "Li Family Office",
    activeCases: 1,
    status: "active",
  },
  {
    id: "3",
    name: "ABC Limited",
    email: "legal@abcltd.com.hk",
    phone: "+852 2345 6789",
    company: "ABC Limited",
    activeCases: 3,
    status: "active",
  },
  {
    id: "4",
    name: "Ms. Cheung Siu Fong",
    email: "cheung.sf@example.com",
    phone: "+852 9456 7890",
    company: null,
    activeCases: 0,
    status: "inactive",
  },
]

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client relationships
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            A list of all clients in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Active Cases</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{client.company || "-"}</TableCell>
                  <TableCell>{client.activeCases}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "active" ? "default" : "secondary"
                      }
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
