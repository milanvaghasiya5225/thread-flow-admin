import { useState } from "react";
import { ArrowLeft, Clock, User, Mail as MailIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contact, ContactStatus } from "./ContactsList";
import { toast } from "sonner";

interface Message {
  id: string;
  from: "customer" | "admin";
  content: string;
  timestamp: string;
  senderName: string;
}

const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      from: "customer",
      content: "I'd like to know more about your enterprise plan features. Specifically, I'm interested in understanding the API rate limits and custom integrations available.",
      timestamp: "2024-01-15T10:30:00",
      senderName: "Sarah Johnson",
    },
  ],
  "2": [
    {
      id: "m1",
      from: "customer",
      content: "We're experiencing some issues with the authentication flow. Users are getting logged out randomly.",
      timestamp: "2024-01-15T08:00:00",
      senderName: "Michael Chen",
    },
    {
      id: "m2",
      from: "admin",
      content: "Thanks for reaching out. Can you provide more details about when this happens? Is it after a specific time period or action?",
      timestamp: "2024-01-15T08:30:00",
      senderName: "Admin Support",
    },
    {
      id: "m3",
      from: "customer",
      content: "It seems to happen after about 30 minutes of inactivity. We expected the session to last longer based on the documentation.",
      timestamp: "2024-01-15T09:00:00",
      senderName: "Michael Chen",
    },
    {
      id: "m4",
      from: "admin",
      content: "I see the issue. You'll need to adjust the session timeout in your configuration. Here's the documentation link: [link]. Let me know if you need help implementing this.",
      timestamp: "2024-01-15T09:10:00",
      senderName: "Admin Support",
    },
  ],
  "3": [
    {
      id: "m1",
      from: "customer",
      content: "It would be great to have a dark mode option in the dashboard.",
      timestamp: "2024-01-14T15:00:00",
      senderName: "Emma Davis",
    },
    {
      id: "m2",
      from: "admin",
      content: "Thanks for the suggestion! We've added this to our feature roadmap and will consider it for the next major release.",
      timestamp: "2024-01-14T16:00:00",
      senderName: "Admin Support",
    },
    {
      id: "m3",
      from: "customer",
      content: "Perfect, thanks for considering this feature!",
      timestamp: "2024-01-14T16:45:00",
      senderName: "Emma Davis",
    },
  ],
};

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onUpdateStatus: (contactId: string, status: ContactStatus) => void;
}

const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const ContactDetail = ({ contact, onBack, onUpdateStatus }: ContactDetailProps) => {
  const [replyText, setReplyText] = useState("");
  const messages = mockMessages[contact.id] || [];

  const handleSendReply = () => {
    if (!replyText.trim()) return;

    toast.success("Reply sent successfully!");
    setReplyText("");
    
    // Update status to in-progress if it was new
    if (contact.status === "new") {
      onUpdateStatus(contact.id, "in-progress");
    }
  };

  const handleStatusChange = (newStatus: ContactStatus) => {
    onUpdateStatus(contact.id, newStatus);
    toast.success(`Status updated to ${newStatus}`);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="mb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{contact.subject}</h1>
          </div>
          <Select value={contact.status} onValueChange={(value) => handleStatusChange(value as ContactStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{contact.name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MailIcon className="h-4 w-4" />
            <span>{contact.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatMessageTime(contact.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.from === "admin" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[70%] p-4 ${
                  message.from === "admin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="font-semibold text-sm">
                    {message.senderName}
                  </span>
                  <span className={`text-xs ${message.from === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Section */}
      <div className="border-t bg-card p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">Reply as Admin</Badge>
          </div>
          <div className="flex gap-3">
            <Textarea
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[100px] flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSendReply();
                }
              }}
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="self-end"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Reply
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to send
          </p>
        </div>
      </div>
    </div>
  );
};
