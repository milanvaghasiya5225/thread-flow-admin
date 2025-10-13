import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Filter, ArrowLeft, Send, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { format } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  status: 'new' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';
  communication_method: 'email' | 'phone' | 'both';
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'admin';
  created_at: string;
  is_read: boolean;
}

const ContactsManager = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [statusCommentDialog, setStatusCommentDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = roles.some((r) => r.role === 'admin' || r.role === 'super_admin');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isAdmin) {
      toast.error('Access Denied. Only admins can access this page.');
      navigate('/dashboard');
      return;
    }

    fetchContacts();
  }, [user, isAdmin, navigate, statusFilter]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  const fetchContacts = async () => {
    let query = supabase
      .from('contacts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as Contact['status']);
    }

    const { data } = await query;
    if (data) setContacts(data as Contact[]);
  };

  const fetchMessages = async (contactId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as Message[]);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedContact) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('messages').insert({
        contact_id: selectedContact.id,
        content: replyText,
        sender_type: 'admin',
        sender_id: user?.id,
      });

      if (error) throw error;

      // TODO: Implement email/SMS sending via edge function based on communication_method
      
      setReplyText('');
      fetchMessages(selectedContact.id);
      toast.success('Reply sent successfully');
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    if (['on_hold', 'resolved', 'closed'].includes(status)) {
      setNewStatus(status);
      setStatusCommentDialog(true);
    } else {
      updateStatus(status, '');
    }
  };

  const updateStatus = async (status: string, comment: string) => {
    if (!selectedContact) return;

    setLoading(true);
    try {
      const typedStatus = status as Contact['status'];
      const { error } = await supabase
        .from('contacts')
        .update({ status: typedStatus })
        .eq('id', selectedContact.id);

      if (error) throw error;

      await supabase.from('status_history').insert({
        contact_id: selectedContact.id,
        old_status: selectedContact.status,
        new_status: typedStatus,
        comment,
        changed_by: user?.id,
      } as any);

      setSelectedContact({ ...selectedContact, status: status as Contact['status'] });
      fetchContacts();
      setStatusCommentDialog(false);
      setStatusComment('');
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const softDeleteContact = async () => {
    if (!selectedContact) return;

    if (!confirm('Are you sure you want to delete this contact? This action can be reversed.')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id })
        .eq('id', selectedContact.id);

      if (error) throw error;

      setSelectedContact(null);
      fetchContacts();
      toast.success('Contact deleted successfully');
    } catch (error) {
      toast.error('Failed to delete contact');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-500/10 text-blue-500',
      in_progress: 'bg-yellow-500/10 text-yellow-500',
      on_hold: 'bg-orange-500/10 text-orange-500',
      resolved: 'bg-green-500/10 text-green-500',
      closed: 'bg-gray-500/10 text-gray-500',
    };
    return colors[status as keyof typeof colors] || '';
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Contacts List */}
        <div className={`${selectedContact ? 'hidden lg:block' : 'flex-1'} lg:w-96 xl:w-[28rem]`}>
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b space-y-4">
              <h2 className="text-2xl font-bold">Contacts</h2>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {['all', 'new', 'in_progress', 'on_hold', 'resolved', 'closed'].map((status) => (
                  <Badge
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                    selectedContact?.id === contact.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{contact.name}</h3>
                    <Badge className={getStatusColor(contact.status)}>
                      {contact.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{contact.email}</p>
                  <p className="text-sm font-medium truncate">{contact.subject}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(contact.created_at), 'MMM d, yyyy')}
                  </p>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        {/* Contact Detail */}
        <div className={`${selectedContact ? 'flex-1' : 'hidden lg:flex'} lg:flex-1`}>
          {selectedContact ? (
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedContact(null)}
                    className="lg:hidden"
                  >
                    <ArrowLeft />
                  </Button>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{selectedContact.subject}</h2>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>{selectedContact.name}</span>
                      <span>{selectedContact.email}</span>
                    </div>
                  </div>
                  <Select value={selectedContact.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="icon" onClick={softDeleteContact}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_type === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button onClick={sendReply} disabled={loading || !replyText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a contact to view conversation</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Status Comment Dialog */}
      <Dialog open={statusCommentDialog} onOpenChange={setStatusCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Status Change Comment</DialogTitle>
            <DialogDescription>
              Please provide a comment for this status change (required for on hold, resolved, or closed).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your comment..."
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusCommentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateStatus(newStatus, statusComment)}
              disabled={!statusComment.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ContactsManager;
