const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const PORT = process.env.PORT || 3000;

// ===== CORRECT STATIC SERVE =====
// Remove: app.use(express.static(__dirname));
// Remove: app.use(express.static('Public'));

app.use(express.static(path.join(__dirname, 'Public')));

// Root route → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const SALONS_FILE = path.join(DATA_DIR, 'salons.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const QUEUE_FILE = path.join(DATA_DIR, 'queue.json');

// In-memory cache (loaded from files)
let salons = [];
let users = [];
let queue = [];
let sessions = {};
let ownerSessions = {};

// Helper function: Read JSON file
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    console.log(`Creating new file: ${filePath}`);
    await fs.writeFile(filePath, JSON.stringify([], null, 2));
    return [];
  }
}

// Helper function: Write JSON file
async function writeJSON(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Data saved to ${filePath}`);
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

// Initialize: Load data from files on server start
async function initializeData() {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Load data from files
    salons = await readJSON(SALONS_FILE);
    users = await readJSON(USERS_FILE);
    queue = await readJSON(QUEUE_FILE);
    
    console.log('✅ Data loaded from files:');
    console.log(`   - ${salons.length} salons`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${queue.length} queue entries`);
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Customer registration
// Customer registration
app.post('/register', async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  
  console.log('Registration attempt:', email); // NEW LINE
  
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered" });
  }
  
  const user = {
    id: Date.now(),
    fullName,
    email,
    phone,
    password,
    joinedQueues: []
  };
  
  users.push(user);
  await writeJSON(USERS_FILE, users); // Save to file
  
  console.log('Users array after registration:', users.length); // NEW LINE
  console.log('New user added:', user.email); // NEW LINE
  
  res.json({ message: "Registration successful", userId: user.id });
});


// Customer login
// Customer login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email, password); // ADD THIS LINE
  console.log('Available users:', users); // ADD THIS LINE
  
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const sessionId = Date.now().toString();
  sessions[sessionId] = user.id;
  
  res.json({ 
    message: "Login successful", 
    sessionId, 
    userName: user.fullName 
  });
});

// Join queue
app.post('/join', async (req, res) => {
  const { name, service, sessionId, salonId } = req.body;
  
  if (!salonId) {
    return res.status(400).json({ error: "Salon selection required" });
  }
  
  let customer;
  if (sessionId && sessions[sessionId]) {
    const userId = sessions[sessionId];
    const user = users.find(u => u.id === userId);
    customer = {
      id: Date.now(),
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      service,
      userId: user.id,
      salonId: parseInt(salonId),
      joinedAt: new Date()
    };
  } else {
    customer = {
      id: Date.now(),
      name,
      service,
      salonId: parseInt(salonId),
      joinedAt: new Date()
    };
  }
  
  queue.push(customer);
  await writeJSON(QUEUE_FILE, queue);
  
  const salonQueue = queue.filter(c => c.salonId === parseInt(salonId));
  res.json({ position: salonQueue.length });
});


// Get queue (for customer view)
app.get('/queue', (req, res) => {
  res.json(queue);
});

// Salon registration
app.post('/register-salon', async (req, res) => {
  const { salonName, ownerName, email, phone, address, password } = req.body;
  
  const existingSalon = salons.find(s => s.email === email);
  if (existingSalon) {
    return res.status(400).json({ error: "Business email already registered" });
  }
  
  // Generate unique salon code
  const salonCode = 'SALON' + String(Date.now()).slice(-6);
  
  
  const salon = {
    id: Date.now(),
    salonName,
    ownerName,
    email,
    phone,
    address,
    password,
    salonCode,
    createdAt: new Date(),
    isActive: true
  };
  
  salons.push(salon);
  await writeJSON(SALONS_FILE, salons); // Save salon to file
  
  res.json({ 
    message: "Salon registered successfully", 
    salonCode,
    salonId: salon.id 
  });
});

// Owner login
app.post('/owner-login', (req, res) => {
  const { email, password, salonCode } = req.body;
  
  const salon = salons.find(s => 
    s.email === email && 
    s.password === password && 
    s.salonCode === salonCode &&
    s.isActive
  );
  
  if (!salon) {
    return res.status(401).json({ error: "Invalid credentials or salon code" });
  }
  
  const ownerSessionId = 'OWNER_' + Date.now().toString();
  ownerSessions[ownerSessionId] = {
    salonId: salon.id,
    salonCode: salon.salonCode,
    salonName: salon.salonName,
    ownerName: salon.ownerName
  };
  
  res.json({ 
    message: "Login successful", 
    ownerSessionId, 
    salonName: salon.salonName,
    ownerName: salon.ownerName
  });
});

// Middleware to verify owner session
function verifyOwnerSession(req, res, next) {
  const ownerSessionId = req.headers['owner-session-id'];
  
  if (!ownerSessionId || !ownerSessions[ownerSessionId]) {
    return res.status(401).json({ error: "Unauthorized access" });
  }
  
  req.ownerSession = ownerSessions[ownerSessionId];
  next();
}

// Get queue for owner
// Get queue for owner
app.get('/owner/queue', verifyOwnerSession, (req, res) => {
  const salonId = req.ownerSession.salonId;
  
  console.log('🔵 Owner requesting queue for salon ID:', salonId);
  console.log('📋 All queue entries:', queue);
  
  const salonQueue = queue.filter(c => c.salonId === salonId);
  
  console.log('✅ Filtered queue for this salon:', salonQueue);
  console.log('🔢 Number of customers:', salonQueue.length);
  
  const ownerQueue = salonQueue.map(customer => ({
    ...customer,
    waitTime: Math.floor((new Date() - new Date(customer.joinedAt)) / 60000) + ' min'
  }));
  
  res.json({
    salonInfo: req.ownerSession,
    queue: ownerQueue,
    totalCustomers: ownerQueue.length
  });
});


// Serve next customer
app.post('/owner/serve', verifyOwnerSession, async (req, res) => {
  const salonId = req.ownerSession.salonId;
  
  const customerIndex = queue.findIndex(c => c.salonId === salonId);
  
  if (customerIndex === -1) {
    return res.json({ message: "No customers in your salon's queue" });
  }
  
  const served = queue.splice(customerIndex, 1)[0];
  await writeJSON(QUEUE_FILE, queue);
  
  const remainingSalonQueue = queue.filter(c => c.salonId === salonId);
  
  res.json({ 
    message: "Customer served successfully", 
    served,
    remainingQueue: remainingSalonQueue.length 
  });
});

// Owner logout
app.post('/owner-logout', (req, res) => {
  const ownerSessionId = req.headers['owner-session-id'];
  
  if (ownerSessionId && ownerSessions[ownerSessionId]) {
    delete ownerSessions[ownerSessionId];
  }
  
  res.json({ message: "Logged out successfully" });
});

// Get all active salons (for customer to choose)
app.get('/salons', (req, res) => {
  const activeSalons = salons
    .filter(s => s.isActive)
    .map(s => ({ id: s.id, name: s.salonName, code: s.salonCode }));
  res.json(activeSalons);
});

// Get customer's current position in queue
app.get('/my-position', (req, res) => {
  const sessionId = req.headers['session-id'];
  
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const userId = sessions[sessionId];
  const customer = queue.find(c => c.userId === userId);
  
  if (!customer) {
    return res.json({ inQueue: false });
  }
  
  const salonQueue = queue.filter(c => c.salonId === customer.salonId);
  const customerIndex = salonQueue.findIndex(c => c.userId === userId);
  const position = customerIndex + 1;
  const estimatedWait = position * 15;
  
  const salon = salons.find(s => s.id === customer.salonId);
  
  res.json({
    inQueue: true,
    position,
    estimatedWait,
    service: customer.service,
    salonName: salon ? salon.salonName : 'Unknown Salon',
    joinedAt: customer.joinedAt
  });
});

// Leave queue
app.post('/leave-queue', async (req, res) => {
  const sessionId = req.headers['session-id'];
  
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const userId = sessions[sessionId];
  const initialLength = queue.length;
  queue = queue.filter(c => c.userId !== userId);
  
  if (queue.length < initialLength) {
    await writeJSON(QUEUE_FILE, queue);
    return res.json({ message: "Left queue successfully" });
  }
  
  res.status(404).json({ error: "Not in queue" });
});

// Get customer info
app.get('/customer-info', (req, res) => {
  const sessionId = req.headers['session-id'];
  
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const userId = sessions[sessionId];
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  res.json({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone
  });
});

// Start server and load data
app.listen(PORT, async () => {
  await initializeData(); // Load data on startup
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
