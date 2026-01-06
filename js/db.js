// Dexie.js Database Initialization
const db = new Dexie("PostcardAddressDB");

db.version(1).stores({
    contacts: '++id, name, zip, address, category',
    settings: 'key, value'
});

db.version(2).stores({
    contacts: '++id, lastName, firstName, zip, address, category',
}).upgrade(async tx => {
    // Migrate existing data
    return await tx.contacts.toCollection().modify(contact => {
        if (contact.name && !contact.lastName) {
            const parts = contact.name.split(/[\s　]+/); // Split by space (half or full width)
            contact.lastName = parts[0] || '';
            contact.firstName = parts.slice(1).join(' ') || '';
            delete contact.name;
        }
    });
});

// Version 3: 敬称、連名（3人まで）、年賀状送受管理
db.version(3).stores({
    contacts: '++id, lastName, firstName, honorific, lastName2, firstName2, honorific2, lastName3, firstName3, honorific3, zip, address, category, sent2025, received2025, sent2026, received2026',
}).upgrade(async tx => {
    return await tx.contacts.toCollection().modify(contact => {
        // Set defaults for new fields
        if (contact.honorific === undefined) contact.honorific = '様';
        if (contact.lastName2 === undefined) contact.lastName2 = '';
        if (contact.firstName2 === undefined) contact.firstName2 = '';
        if (contact.honorific2 === undefined) contact.honorific2 = '';
        if (contact.lastName3 === undefined) contact.lastName3 = '';
        if (contact.firstName3 === undefined) contact.firstName3 = '';
        if (contact.honorific3 === undefined) contact.honorific3 = '';
        if (contact.sent2025 === undefined) contact.sent2025 = false;
        if (contact.received2025 === undefined) contact.received2025 = false;
        if (contact.sent2026 === undefined) contact.sent2026 = false;
        if (contact.received2026 === undefined) contact.received2026 = false;
    });
});

console.log("Database initialized");

async function saveContact(contact) {
    return await db.contacts.put(contact);
}

async function getAllContacts() {
    return await db.contacts.toArray();
}

async function deleteContact(id) {
    return await db.contacts.delete(id);
}

async function getContactById(id) {
    return await db.contacts.get(id);
}
