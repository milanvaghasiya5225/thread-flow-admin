import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import type { ContactMessage } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft, Trash2, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { format } from 'date-fns';

// Note: This page uses the Contact Us API from your .NET backend
// Missing features that need to be added to your API:
// - Message/conversation endpoints for replies
// - Status history tracking
// - Advanced filtering and status management

const ContactsManager = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const isAdmin = true; // TODO: Get from API when role endpoints are added

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/dotnet-login');
      return;
    }

    fetchContacts();
  }, [isAuthenticated, navigate, statusFilter]);

  const fetchContacts = async () => {
    try {
      const result = await apiClient.getContactMessages({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: 1,
        pageSize: 100
      });
      
      if (result.isSuccess && result.value) {
        setContacts(result.value);
      }
    } catch (error) {
      toast.error('Failed to fetch contacts');
    }
  };

  const updateContactStatus = async (isResolved: boolean) => {
    if (!selectedContact) return;

    setLoading(true);
    try {
      const result = await apiClient.updateContactMessage(selectedContact.id, {
        status: isResolved ? 'resolved' : 'pending'
      });

      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'Update failed');
      }

      setSelectedContact({ ...selectedContact, isResolved });
      fetchContacts();
      toast.success('Status updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async () => {
    if (!selectedContact) return;

    if (!confirm('Are you sure you want to delete this contact?')) return;

    setLoading(true);
    try {
      const result = await apiClient.deleteContactMessage(selectedContact.id);

      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'Delete failed');
      }

      setSelectedContact(null);
      fetchContacts();
      toast.success('Contact deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contact');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (isResolved: boolean) => {
    return isResolved 
      ? 'bg-green-500/10 text-green-500' 
      : 'bg-yellow-500/10 text-yellow-500';
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Contacts List */}
        <div className={`${selectedContact ? 'hidden lg:block' : 'flex-1'} lg:w-96 xl:w-[28rem]`}>
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b space-y-4">
              <h2 className="text-2xl font-bold">Contact Messages</h2>
              
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
                {['all', 'unresolved', 'resolved'].map((status) => (
                  <Badge
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
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
                    <Badge className={getStatusColor(contact.isResolved)}>
                      {contact.isResolved ? 'Resolved' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{contact.email}</p>
                  {contact.phone && (
                    <p className="text-sm text-muted-foreground mb-1">{contact.phone}</p>
                  )}
                  <p className="text-sm font-medium truncate">{contact.subject}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(contact.createdAtUtc), 'MMM d, yyyy')}
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
              <div className="p-4 border-b space-y-4">
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
                  <div className="flex gap-2">
                    {!selectedContact.isResolved && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateContactStatus(true)}
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Resolved
                      </Button>
                    )}
                    {selectedContact.isResolved && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateContactStatus(false)}
                        disabled={loading}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Mark Pending
                      </Button>
                    )}
                    <Button variant="destructive" size="icon" onClick={deleteContact} disabled={loading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Message:</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{selectedContact.message}</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm">
                      <strong>Note:</strong> Conversation/messaging features need to be added to your .NET API. 
                      Currently showing the initial contact message only.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a contact to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContactsManager;
