import { useState } from "react";
import { Search, Mail, Clock, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type ContactStatus = "new" | "in-progress" | "resolved";

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: ContactStatus;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  messageCount: number;
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    subject: "Question about pricing plans",
    status: "new",
    lastMessage: "I'd like to know more about your enterprise plan features...",
    timestamp: "2024-01-15T10:30:00",
    unread: true,
    messageCount: 1,
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "m.chen@company.com",
    subject: "Technical support needed",
    status: "in-progress",
    lastMessage: "Thanks for the quick response! That fixed the issue.",
    timestamp: "2024-01-15T09:15:00",
    unread: false,
    messageCount: 4,
  },
  {
    id: "3",
    name: "Emma Davis",
    email: "emma.davis@email.com",
    subject: "Feature request",
    status: "resolved",
    lastMessage: "Perfect, thanks for considering this feature!",
    timestamp: "2024-01-14T16:45:00",
    unread: false,
    messageCount: 3,
  },
  {
    id: "4",
    name: "James Wilson",
    email: "j.wilson@business.io",
    subject: "Integration support",
    status: "new",
    lastMessage: "We're trying to integrate your API with our system...",
    timestamp: "2024-01-14T14:20:00",
    unread: true,
    messageCount: 1,
  },
  {
    id: "5",
    name: "Lisa Anderson",
    email: "lisa.a@startup.com",
    subject: "Billing inquiry",
    status: "in-progress",
    lastMessage: "Could you please check our recent invoice?",
    timestamp: "2024-01-13T11:30:00",
    unread: false,
    messageCount: 2,
  },
];

interface ContactsListProps {
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: string;
}

const getStatusConfig = (status: ContactStatus) => {
  switch (status) {
    case "new":
      return {
        label: "New",
        icon: Mail,
        className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      };
    case "in-progress":
      return {
        label: "In Progress",
        icon: Clock,
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      };
    case "resolved":
      return {
        label: "Resolved",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      };
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const ContactsList = ({ onSelectContact, selectedContactId }: ContactsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<ContactStatus | "all">("all");

  const filteredContacts = mockContacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === "all" || contact.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="border-b bg-card p-6">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Contact Messages</h1>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Badge
            variant={filterStatus === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterStatus("all")}
          >
            All
          </Badge>
          <Badge
            variant={filterStatus === "new" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterStatus("new")}
          >
            New
          </Badge>
          <Badge
            variant={filterStatus === "in-progress" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterStatus("in-progress")}
          >
            In Progress
          </Badge>
          <Badge
            variant={filterStatus === "resolved" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterStatus("resolved")}
          >
            Resolved
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredContacts.map((contact) => {
            const statusConfig = getStatusConfig(contact.status);
            const StatusIcon = statusConfig.icon;
            const isSelected = contact.id === selectedContactId;

            return (
              <Card
                key={contact.id}
                className={`cursor-pointer p-4 transition-all hover:shadow-md ${
                  isSelected ? "border-primary bg-accent/50" : ""
                } ${contact.unread ? "border-l-4 border-l-primary" : ""}`}
                onClick={() => onSelectContact(contact)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{contact.name}</h3>
                      {contact.unread && (
                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <p className="mb-1 text-sm text-muted-foreground">{contact.email}</p>
                    <p className="mb-2 font-medium text-sm">{contact.subject}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {contact.lastMessage}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(contact.timestamp)}
                    </span>
                    <Badge className={statusConfig.className} variant="secondary">
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {contact.messageCount} {contact.messageCount === 1 ? "message" : "messages"}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
