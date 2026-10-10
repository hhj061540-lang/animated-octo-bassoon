const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const CONTACTS_FILE = path.join(__dirname, 'contacts.json');
const PHONES_FILE = path.join(__dirname, 'phones.json');

// --- Helper Functions for JSON Storage ---
function getData(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
}

function saveData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// --- Data Generators ---
const firstNames = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Aiden', 'Ethan', 'Lucas', 'Mason'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor'];
const streetNames = ['Station Street', 'Main Street', 'Broadway', 'Oak Lane', 'Pine Road', 'Maple Avenue', 'Cedar Court'];
const citiesByState = {
  'OH': { city: 'Andover', zip: '44003' },
  'CA': { city: 'Los Angeles', zip: '90001' },
  'NY': { city: 'New York', zip: '10001' },
  'TX': { city: 'Houston', zip: '77002' },
  'FL': { city: 'Miami', zip: '33101' }
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUsPhoneData() {
  const areaCode = Math.floor(Math.random() * 800) + 200;
  const centralOffice = Math.floor(Math.random() * 800) + 200;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;

  return {
    id: Date.now(),
    country: "United States",
    countryCode: "US",
    phoneCode: "1",
    nationalNumber: `${areaCode}${centralOffice}${lineNumber}`,
    formatted: `+1 (${areaCode}) ${centralOffice}-${lineNumber}`
  };
}

function generateUsContactData() {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const streetNum = Math.floor(Math.random() * 900) + 100;
  const street = getRandomElement(streetNames);
  
  const states = Object.keys(citiesByState);
  const state = getRandomElement(states);
  const location = citiesByState[state];
  const phoneObj = generateUsPhoneData();

  return {
    id: Date.now(),
    name: `${firstName} ${lastName}`,
    phone: phoneObj.formatted,
    phoneCode: phoneObj.phoneCode,
    line1: `${streetNum} ${street}`,
    line2: "N/A",
    city: location.city,
    state: state,
    postalCode: location.zip,
    country: "United States",
    countryCode: "US"
  };
}

// --- API Endpoints: Contacts ---

app.post('/api/generate-contact', (req, res) => {
  const contacts = getData(CONTACTS_FILE);
  const newContact = generateUsContactData();
  contacts.unshift(newContact);
  saveData(CONTACTS_FILE, contacts);
  res.json({ success: true, contact: newContact });
});

app.get('/api/contact', (req, res) => {
  res.json(getData(CONTACTS_FILE));
});

app.delete('/api/contact', (req, res) => {
  const { id } = req.query;
  let contacts = getData(CONTACTS_FILE);
  if (id) {
    contacts = contacts.filter(c => c.id !== Number(id));
    saveData(CONTACTS_FILE, contacts);
    res.json({ success: true, deletedId: id });
  } else {
    saveData(CONTACTS_FILE, []);
    res.json({ success: true, message: 'All contacts cleared' });
  }
});

// --- API Endpoints: Phones (`/api/generate-phone`, `/api/phone`) ---

// POST /api/generate-phone: Generate and save a new US phone number
app.post('/api/generate-phone', (req, res) => {
  const phones = getData(PHONES_FILE);
  const newPhone = generateUsPhoneData();
  phones.unshift(newPhone);
  saveData(PHONES_FILE, phones);
  res.json({ success: true, phone_number: newPhone });
});

// GET /api/phone: List all generated US phone numbers
app.get('/api/phone', (req, res) => {
  res.json(getData(PHONES_FILE));
});

// DELETE /api/phone: Delete a phone number by ID or clear all
app.delete('/api/phone', (req, res) => {
  const { id } = req.query;
  let phones = getData(PHONES_FILE);
  if (id) {
    phones = phones.filter(p => p.id !== Number(id));
    saveData(PHONES_FILE, phones);
    res.json({ success: true, deletedId: id });
  } else {
    saveData(PHONES_FILE, []);
    res.json({ success: true, message: 'All phone numbers cleared' });
  }
});

// --- HTML Frontend Dashboard ---
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>US Contact & Phone Manager</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen p-6">
  <div class="max-w-4xl mx-auto space-y-8">
    <header class="text-center">
      <h1 class="text-3xl font-bold text-indigo-400">US Contact & Phone Manager</h1>
      <p class="text-gray-400 text-sm mt-1">Manage US registrant profiles and phone numbers for domain automation</p>
    </header>

    <!-- Phone Generator Section -->
    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-indigo-300">Phone Numbers (/api/phone)</h2>
        <div class="space-x-2">
          <button onclick="generatePhone()" class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition">
            Generate Phone (POST)
          </button>
          <button onclick="clearPhones()" class="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition">
            Clear Phones
          </button>
        </div>
      </div>
      <div id="phone-list" class="space-y-2">
        <p class="text-gray-500 text-center py-2">Loading phone numbers...</p>
      </div>
    </div>

    <!-- Contact Generator Section -->
    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-indigo-300">Contact Profiles (/api/contact)</h2>
        <div class="space-x-2">
          <button onclick="generateContact()" class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition">
            Generate Contact (POST)
          </button>
          <button onclick="clearContacts()" class="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition">
            Clear Contacts
          </button>
        </div>
      </div>
      <div id="contact-list" class="space-y-2">
        <p class="text-gray-500 text-center py-2">Loading contacts...</p>
      </div>
    </div>
  </div>

  <script>
    async function fetchData() {
      // Fetch Phones
      const phoneRes = await fetch('/api/phone');
      const phones = await phoneRes.json();
      const phoneContainer = document.getElementById('phone-list');
      if (phones.length === 0) {
        phoneContainer.innerHTML = '<p class="text-gray-500 text-center py-2">No phone numbers saved.</p>';
      } else {
        phoneContainer.innerHTML = phones.map(p => \`
          <div class="bg-gray-900 p-3 rounded-lg border border-gray-700 flex justify-between items-center font-mono text-sm">
            <span>\${p.formatted} (Country: \${p.country}, Code: +\${p.phoneCode})</span>
            <button onclick="deletePhone(\${p.id})" class="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2.5 py-1 rounded text-xs">Delete</button>
          </div>
        \`).join('');
      }

      // Fetch Contacts
      const contactRes = await fetch('/api/contact');
      const contacts = await contactRes.json();
      const contactContainer = document.getElementById('contact-list');
      if (contacts.length === 0) {
        contactContainer.innerHTML = '<p class="text-gray-500 text-center py-2">No contacts saved.</p>';
      } else {
        contactContainer.innerHTML = contacts.map(c => \`
          <div class="bg-gray-900 p-3 rounded-lg border border-gray-700 flex justify-between items-center font-mono text-sm">
            <div>
              <p><span class="text-indigo-400">Name:</span> \${c.name} | <span class="text-indigo-400">Phone:</span> \${c.phone}</p>
              <p><span class="text-indigo-400">Address:</span> \${c.line1}, \${c.city}, \${c.state} \${c.postalCode}</p>
            </div>
            <button onclick="deleteContact(\${c.id})" class="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2.5 py-1 rounded text-xs">Delete</button>
          </div>
        \`).join('');
      }
    }

    async function generatePhone() {
      await fetch('/api/generate-phone', { method: 'POST' });
      fetchData();
    }

    async function deletePhone(id) {
      await fetch(\'/api/phone?id=\${id}\`, { method: 'DELETE' });
      fetchData();
    }

    async function clearPhones() {
      await fetch('/api/phone', { method: 'DELETE' });
      fetchData();
    }

    async function generateContact() {
      await fetch('/api/generate-contact', { method: 'POST' });
      fetchData();
    }

    async function deleteContact(id) {
      await fetch(\'/api/contact?id=\${id}\`, { method: 'DELETE' });
      fetchData();
    }

    async function clearContacts() {
      await fetch('/api/contact', { method: 'DELETE' });
      fetchData();
    }

    fetchData();
  </script>
</body>
</html>
`;

app.get('/', (req, res) => {
  res.send(htmlContent);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
