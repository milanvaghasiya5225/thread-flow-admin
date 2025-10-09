import { useState } from "react";
import { ContactsList, Contact, ContactStatus } from "@/components/ContactsList";
import { ContactDetail } from "@/components/ContactDetail";

const ContactsPage = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleUpdateStatus = (contactId: string, status: ContactStatus) => {
    // In a real app, this would update the backend
    console.log(`Updating contact ${contactId} status to ${status}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={`${selectedContact ? "hidden lg:block" : "flex-1"} lg:w-96 xl:w-[28rem] border-r`}>
        <ContactsList
          onSelectContact={setSelectedContact}
          selectedContactId={selectedContact?.id}
        />
      </div>
      
      <div className={`${selectedContact ? "flex-1" : "hidden lg:flex"} lg:flex-1`}>
        {selectedContact ? (
          <ContactDetail
            contact={selectedContact}
            onBack={() => setSelectedContact(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/20">
            <div className="text-center">
              <MailIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Select a conversation
              </h2>
              <p className="text-muted-foreground">
                Choose a contact from the list to view the conversation thread
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Import missing icon
import { Mail as MailIcon } from "lucide-react";

export default ContactsPage;
