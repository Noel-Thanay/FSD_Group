import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, 'data.json')
const port = Number(process.env.PORT || 4000)
const mongoUri = process.env.MONGODB_URI
const databaseName = process.env.MONGODB_DB || 'campusloop'
const jwtSecret = process.env.JWT_SECRET
const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const adminSetupKey = process.env.ADMIN_SETUP_KEY || ''
const collectionNames = [
  'users',
  'listings',
  'events',
  'registrations',
  'requests',
  'offers',
  'clubs',
  'announcements',
  'lostFound',
  'maintenanceRequests',
  'reviews',
]
const snapshotRevisions = new WeakMap()
let database
let stateCollection
let mongoClient
let databaseReady = false

const clubs = [
  { id: 'yrc', name: 'Youth Red Cross (YRC)' },
  { id: 'painting-animation', name: 'Painting and Animation' },
  { id: 'student-council', name: 'Student Council' },
  { id: 'athletics', name: 'Athletics' },
]

const seed = {
  users: [],
  listings: [
    { id: 'listing-1', title: 'Casio fx-991EX Calculator', category: 'Study gear', condition: 'Like new', mode: 'Borrow', price: 'Free', owner: 'Nisha Rao', initials: 'NR', color: 'coral', image: 'https://images.unsplash.com/photo-1616628182503-47a55d7f2d91?auto=format&fit=crop&w=900&q=80', savedBy: [] },
    { id: 'listing-2', title: 'Introduction to Algorithms', category: 'Books', condition: 'Good', mode: 'Exchange', price: 'For a book', owner: 'Arjun Mehta', initials: 'AM', color: 'blue', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80', savedBy: ['user-maya'] },
    { id: 'listing-3', title: 'Sony WH-1000XM4 Headphones', category: 'Electronics', condition: 'Excellent', mode: 'Borrow', price: 'Free', owner: 'Diya Shah', initials: 'DS', color: 'green', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80', savedBy: [] },
    { id: 'listing-4', title: 'IKEA Desk Lamp', category: 'Room & living', condition: 'Good', mode: 'Give away', price: 'Free', owner: 'Kabir Singh', initials: 'KS', color: 'yellow', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80', savedBy: [] },
  ],
  events: [
    { id: 'event-yrc-blood-donation', title: 'Blood Donation Camp', type: 'Community service', time: 'To be announced', place: 'Student Activity Centre', host: 'Youth Red Cross (YRC)', clubId: 'yrc', color: 'mint', spots: 0, image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=80', description: 'A campus blood donation drive organized by YRC. Event date and registration details will be announced by the club.', date: null },
    { id: 'event-painting-face-painting', title: 'Face Painting', type: 'Arts & culture', time: 'To be announced', place: 'Student Activity Centre', host: 'Painting and Animation', clubId: 'painting-animation', color: 'purple', spots: 0, image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=80', description: 'A creative face-painting session hosted by Painting and Animation. Event date and registration details will be announced by the club.', date: null },
    { id: 'event-student-council-diwali', title: 'Diwali Celebration', type: 'Festival', time: 'To be announced', place: 'NIT Warangal Stadium', host: 'Student Council', clubId: 'student-council', color: 'orange', spots: 0, image: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1000&q=80', description: 'A campus Diwali celebration organized by the Student Council at the stadium. Event date and registration details will be announced.', date: null },
    { id: 'event-athletics-badminton', title: 'Intramural Badminton', type: 'Sports', time: 'To be announced', place: 'Indoor Badminton Courts', host: 'Athletics', clubId: 'athletics', color: 'blue', spots: 0, image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1000&q=80', description: 'An Athletics-organized intramural badminton event for students. Event date and registration details will be announced by the club.', date: null },
  ],
  registrations: [],
  requests: [],
  offers: [],
  clubs,
  announcements: [{
    id: 'announcement-welcome',
    title: 'CampusLoop launch week',
    category: 'General',
    content: 'Welcome to CampusLoop. Check the student notice board for updates on club activities, faculty announcements, and local events this week.',
    pinned: true,
    author: 'Campus admin',
    createdAt: new Date().toISOString(),
  }],
  lostFound: [],
  maintenanceRequests: [],
  reviews: [],
}

function normalizeData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Legacy campus data must be a JSON object.')
  let migrated = false
  for (const collectionName of collectionNames) {
    if (!Array.isArray(data[collectionName])) {
      data[collectionName] = []
      migrated = true
    }
  }
  const seenEmails = new Set()
  for (const user of data.users) {
    if (!user || typeof user !== 'object' || typeof user.email !== 'string') throw new Error('Every imported user must have a valid email address.')
    if (typeof user.passwordHash !== 'string' || !user.passwordHash || typeof user.name !== 'string' || !user.id) throw new Error(`Imported user ${user.email} is missing required account data.`)
    if (user.role === 'student' && !/^[^\s@]+@student\.nitw\.ac\.in$/i.test(user.email)) {
      user.email = `${user.email.split('@')[0]}@student.nitw.ac.in`.toLowerCase()
      migrated = true
    }
    if (seenEmails.has(user.email.toLowerCase())) throw new Error(`Duplicate student email after domain migration: ${user.email}`)
    seenEmails.add(user.email.toLowerCase())
    if (!user.branch) {
      user.branch = String(user.course || '').replace(/\s*[·-]\s*Year\s*\d+/i, '')
      if (!user.year && user.course) user.year = String(user.course.match(/(?:Year\s*)(\d+)/i)?.[1] || '')
      delete user.course
      migrated = true
    }
    if (user.year !== undefined) user.year = String(user.year)
    if (!user.createdAt) {
      user.createdAt = new Date().toISOString()
      migrated = true
    }
    if (!user.hostel) {
      user.hostel = ''
      migrated = true
    }
    if (typeof user.phone !== 'string') {
      user.phone = ''
      migrated = true
    }
  }
  if (!Array.isArray(data.registrations)) {
    data.registrations = []
    migrated = true
  } else if (data.registrations.some(registration => typeof registration === 'string' || !registration?.eventId || !registration?.userId)) {
    data.registrations = data.registrations.filter(registration => registration && typeof registration === 'object' && registration.eventId && registration.userId)
    migrated = true
  }
  if (!data.eventSchemaVersion) {
    data.events = seed.events.map(event => ({ ...event }))
    data.registrations = []
    data.eventSchemaVersion = 1
    migrated = true
  }
  if (!Array.isArray(data.clubs)) {
    data.clubs = clubs.map(club => ({ ...club }))
    migrated = true
  }
  if (!Array.isArray(data.announcements)) {
    data.announcements = []
    migrated = true
  }
  if (!Array.isArray(data.lostFound)) {
    data.lostFound = []
    migrated = true
  }
  if (!Array.isArray(data.maintenanceRequests)) {
    data.maintenanceRequests = []
    migrated = true
  }
  if (!Array.isArray(data.reviews)) {
    data.reviews = []
    migrated = true
  }
  return { data, migrated }
}

function localDataForMigration() {
  if (fs.existsSync(dataPath)) {
    const parsed = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    return normalizeData(parsed).data
  }
  const initialData = structuredClone(seed)
  initialData.users = []
  return normalizeData(initialData).data
}

function mongoDocument(collectionName, item, index) {
  let id = item.id
  if (!id && collectionName === 'registrations') id = `${item.eventId}:${item.userId}`
  return { ...item, _id: String(id || `${collectionName}:${index}`) }
}

async function persistData(data, expectedRevision, { initialize = false } = {}) {
  const session = mongoClient.startSession()
  try {
    await session.withTransaction(async () => {
      if (initialize) {
        await stateCollection.insertOne({
          _id: 'state',
          revision: 0,
          eventSchemaVersion: data.eventSchemaVersion || 0,
        }, { session })
      } else {
        const result = await stateCollection.updateOne(
          { _id: 'state', revision: expectedRevision },
          { $inc: { revision: 1 }, $set: { eventSchemaVersion: data.eventSchemaVersion || 0 } },
          { session },
        )
        if (result.modifiedCount !== 1) {
          const error = new Error('Campus data changed in another session. Reload and try again.')
          error.status = 409
          throw error
        }
      }

      for (const collectionName of collectionNames) {
        const collection = database.collection(collectionName)
        await collection.deleteMany({}, { session })
        const items = Array.isArray(data[collectionName]) ? data[collectionName] : []
        if (items.length) {
          await collection.insertMany(items.map((item, index) => mongoDocument(collectionName, item, index)), { session })
        }
      }
    }, { readPreference: 'primary', readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } })
  } finally {
    await session.endSession()
  }
}

async function readData() {
  if (!databaseReady || !database || !stateCollection) {
    const error = new Error('Campus database is starting or unavailable. Retry shortly.')
    error.status = 503
    throw error
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await stateCollection.findOne({ _id: 'state' })
    if (!state) throw new Error('CampusLoop database has not been initialized.')
    const collections = await Promise.all(collectionNames.map(async name => {
      const documents = await database.collection(name).find({}).toArray()
      return [name, documents.map(({ _id, ...item }) => item)]
    }))
    const confirmedState = await stateCollection.findOne({ _id: 'state' })
    if (state.revision !== confirmedState?.revision) continue
    const data = Object.fromEntries(collections)
    data.eventSchemaVersion = state.eventSchemaVersion || 0
    snapshotRevisions.set(data, state.revision)
    return data
  }
  const error = new Error('Campus data is changing too quickly. Please retry the request.')
  error.status = 503
  throw error
}

async function writeData(data) {
  const expectedRevision = snapshotRevisions.get(data)
  if (expectedRevision === undefined) throw new Error('Cannot save a database snapshot without its revision.')
  await persistData(data, expectedRevision)
}

async function initializeDatabase() {
  const existingState = await stateCollection.findOne({ _id: 'state' })
  if (existingState) return

  const { data, migrated } = normalizeData(localDataForMigration())
  try {
    await persistData(data, 0, { initialize: true })
    console.log(fs.existsSync(dataPath)
      ? `Imported existing data from ${path.relative(process.cwd(), dataPath)} into MongoDB Atlas.`
      : 'Initialized MongoDB Atlas with the starter campus content.')
    if (migrated) console.log('Applied legacy data migrations during database initialization.')
  } catch (error) {
    if (error.code !== 11000) throw error
    const state = await stateCollection.findOne({ _id: 'state' })
    if (!state) throw error
  }
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user
  return safeUser
}

function tokenFor(user) {
  return jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: '7d' })
}

async function requireAuth(request, response, next) {
  const header = request.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return response.status(401).json({ message: 'Authentication required.' })
  let payload
  try {
    payload = jwt.verify(token, jwtSecret)
  } catch {
    return response.status(401).json({ message: 'Session is no longer valid.' })
  }
  try {
    request.data = await readData()
    const user = request.data.users.find(item => item.id === payload.sub)
    if (!user) return response.status(401).json({ message: 'Session is no longer valid.' })
    if (user.suspendedAt) return response.status(403).json({ message: 'This account has been suspended. Contact a campus administrator.' })
    request.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}

function requireAdmin(request, response, next) {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ message: 'Administrator access is required.' })
  }
  return next()
}

function isValidImage(image) {
  if (typeof image !== 'string') return false
  if (!image) return true
  if (image.length <= 2048 && /^https?:\/\/\S+$/i.test(image)) return true
  const match = image.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/)
  if (!match || image.length > 3 * 1024 * 1024) return false
  const bytes = Buffer.from(match[1], 'base64')
  return bytes.length <= 2.25 * 1024 * 1024 && bytes.toString('base64') === match[1]
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '4mb', strict: true }))
app.use((request, response, next) => {
  if (request.body === undefined) request.body = {}
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    return response.status(400).json({ message: 'Request body must be a JSON object.' })
  }
  return next()
})

app.get('/api/health', async (_request, response) => {
  if (!databaseReady || !database) return response.status(503).json({ status: 'unavailable', service: 'campusloop-api', database: 'connecting' })
  try {
    await database.command({ ping: 1 })
    response.json({ status: 'ok', service: 'campusloop-api', database: 'connected' })
  } catch {
    response.status(503).json({ status: 'unavailable', service: 'campusloop-api', database: 'disconnected' })
  }
})

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body
  if (typeof password !== 'string' || password.length > 128 || Buffer.byteLength(password, 'utf8') > 72) return response.status(401).json({ message: 'Email or password is incorrect.' })
  const data = await readData()
  const user = data.users.find(item => item.email.toLowerCase() === String(email || '').toLowerCase())
  if (!user || !await bcrypt.compare(password, user.passwordHash)) return response.status(401).json({ message: 'Email or password is incorrect.' })
  if (user.suspendedAt) return response.status(403).json({ message: 'This account has been suspended. Contact a campus administrator.' })
  response.json({ token: tokenFor(user), user: publicUser(user) })
})

app.post('/api/auth/register', async (request, response) => {
  const { name, branch, year, hostel = '', phone, email, password } = request.body
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : ''
  const phoneDigits = normalizedPhone.replace(/\D/g, '')
  if (typeof name !== 'string' || !name.trim() || typeof branch !== 'string' || !branch.trim() || (typeof year !== 'string' && typeof year !== 'number') || !String(year).trim() || !normalizedEmail || typeof password !== 'string' || password.length < 6 || password.length > 128 || Buffer.byteLength(password, 'utf8') > 72 || !normalizedPhone) return response.status(400).json({ message: 'Name, branch, year, phone number, email, and a password of 6 to 72 UTF-8 bytes are required.' })
  if (typeof hostel !== 'string') return response.status(400).json({ message: 'Hostel must be text.' })
  const isConfiguredAdmin = Boolean(adminEmail) && normalizedEmail === adminEmail
  if (!isConfiguredAdmin && !/^[^\s@]+@student\.nitw\.ac\.in$/.test(normalizedEmail)) {
    return response.status(400).json({ message: 'Use your @student.nitw.ac.in student email address or the configured administrator email.' })
  }
  if (!/^\+?[0-9().\-\s]+$/.test(normalizedPhone) || phoneDigits.length < 7 || phoneDigits.length > 15) return response.status(400).json({ message: 'Enter a valid phone number with 7 to 15 digits.' })
  if (String(name).trim().length > 100 || String(branch).trim().length > 100 || String(year).trim().length > 20 || String(hostel).trim().length > 100 || normalizedPhone.length > 25) return response.status(400).json({ message: 'Name, branch, year, hostel, or phone number is too long.' })
  const role = isConfiguredAdmin
    ? request.body.adminSetupKey === adminSetupKey && adminSetupKey.length >= 24 ? 'admin' : null
    : 'student'
  if (!role) return response.status(403).json({ message: 'A valid administrator setup key is required for this account.' })
  const data = await readData()
  if (data.users.some(user => user.email.toLowerCase() === normalizedEmail)) return response.status(409).json({ message: 'An account with this email already exists.' })
  const user = { id: `user-${randomUUID()}`, name: name.trim(), branch: branch.trim(), year: String(year).trim(), hostel: hostel.trim(), phone: normalizedPhone, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), role, createdAt: new Date().toISOString() }
  data.users.push(user)
  await writeData(data)
  response.status(201).json({ token: tokenFor(user), user: publicUser(user) })
})

app.get('/api/auth/me', requireAuth, (request, response) => response.json({ user: publicUser(request.user) }))

app.get('/api/admin/dashboard', requireAuth, requireAdmin, (request, response) => {
  const data = request.data
  response.json({
    stats: {
      students: data.users.filter(user => user.role === 'student' && !user.suspendedAt).length,
      suspendedUsers: data.users.filter(user => user.role === 'student' && user.suspendedAt).length,
      resources: data.listings.filter(item => item.postType === 'resource' && item.status !== 'Removed').length,
      openWantedRequests: data.listings.filter(item => item.postType === 'wanted' && item.status === 'Open').length,
      pendingResourceRequests: data.requests.filter(item => item.status === 'Pending').length,
      announcements: data.announcements.length,
      openLostFound: data.lostFound.filter(item => item.status !== 'resolved').length,
      upcomingEvents: data.events.filter(item => !item.date || item.date >= new Date().toISOString().slice(0, 10)).length,
      unresolvedMaintenance: data.maintenanceRequests.filter(item => item.status !== 'Resolved').length,
    },
  })
})

app.get('/api/admin/users', requireAuth, requireAdmin, (request, response) => {
  const users = request.data.users
    .map(publicUser)
    .sort((first, second) => first.name.localeCompare(second.name))
  response.json({ users })
})

app.patch('/api/admin/users/:id/status', requireAuth, requireAdmin, async (request, response) => {
  const { suspended } = request.body
  if (typeof suspended !== 'boolean') return response.status(400).json({ message: 'Choose whether to suspend or restore the account.' })
  const data = request.data
  const user = data.users.find(item => item.id === request.params.id)
  if (!user) return response.status(404).json({ message: 'Student account not found.' })
  if (user.role === 'admin' || user.id === request.user.id) return response.status(403).json({ message: 'Administrator accounts cannot be suspended here.' })
  if (suspended) user.suspendedAt ||= new Date().toISOString()
  else delete user.suspendedAt
  await writeData(data)
  response.json({ user: publicUser(user) })
})

app.get('/api/listings', requireAuth, (request, response) => {
  const data = request.data
  const listings = data.listings
    .filter(item => item.postType === 'resource'
      ? item.status !== 'Removed'
      : item.postType === 'wanted' && (item.status === 'Open' || item.ownerId === request.user.id || request.user.role === 'admin'))
    .map(item => ({ ...item, saved: (item.savedBy || []).includes(request.user.id) }))
  response.json({ listings })
})

app.post('/api/listings', requireAuth, async (request, response) => {
  const { title, category, description = '', image = '', postType = 'wanted', condition = 'Good', mode = 'Borrow' } = request.body
  const categories = ['Books', 'Electronics', 'Study gear', 'Room & living']
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120 || !categories.includes(category)) {
    return response.status(400).json({ message: 'A title (up to 120 characters) and a valid category are required.' })
  }
  if (!['wanted', 'resource'].includes(postType)) return response.status(400).json({ message: 'Choose a valid resource listing type.' })
  if (postType === 'resource' && (!['Borrow', 'Exchange', 'Give away'].includes(mode) || !['New', 'Like new', 'Good', 'Fair'].includes(condition))) {
    return response.status(400).json({ message: 'Choose a valid exchange type and item condition.' })
  }
  if (typeof description !== 'string' || description.length > 500) return response.status(400).json({ message: 'The description must be 500 characters or fewer.' })
  if (typeof image !== 'string' || (image && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(image) || image.length > 3 * 1024 * 1024))) {
    return response.status(400).json({ message: 'Choose a JPEG image smaller than 2 MB after resizing.' })
  }
  const data = request.data
  const listing = {
    id: `listing-${randomUUID()}`,
    postType,
    status: postType === 'wanted' ? 'Open' : 'Available',
    title: title.trim(),
    category,
    description: description.trim(),
    image,
    ...(postType === 'resource' ? { condition, mode, availabilityStatus: 'Available' } : {}),
    ownerId: request.user.id,
    owner: request.user.name,
    initials: request.user.name.split(' ').map(part => part[0]).join(''),
    color: 'blue',
    createdAt: new Date().toISOString(),
    savedBy: [],
  }
  data.listings.unshift(listing)
  await writeData(data)
  response.status(201).json({ listing: { ...listing, saved: false } })
})

app.put('/api/listings/:id', requireAuth, async (request, response) => {
  const data = request.data
  const listing = data.listings.find(item => item.id === request.params.id && ['wanted', 'resource'].includes(item.postType))
  if (!listing) return response.status(404).json({ message: 'Resource listing not found.' })
  if (listing.ownerId !== request.user.id && request.user.role !== 'admin') return response.status(403).json({ message: 'Only the owner or an administrator can edit this listing.' })
  const { title, category, description = '', image = '', condition = listing.condition, mode = listing.mode } = request.body
  const categories = ['Books', 'Electronics', 'Study gear', 'Room & living']
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120 || !categories.includes(category)) {
    return response.status(400).json({ message: 'A title (up to 120 characters) and a valid category are required.' })
  }
  if (typeof description !== 'string' || description.length > 500) return response.status(400).json({ message: 'The description must be 500 characters or fewer.' })
  if (typeof image !== 'string' || image.length > 3 * 1024 * 1024 || (image && !(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(image) || /^https?:\/\/\S+$/i.test(image)))) {
    return response.status(400).json({ message: 'Choose a resized JPEG image or a valid HTTP or HTTPS image URL.' })
  }
  if (listing.postType === 'resource' && (!['Borrow', 'Exchange', 'Give away'].includes(mode) || !['New', 'Like new', 'Good', 'Fair'].includes(condition))) {
    return response.status(400).json({ message: 'Choose a valid exchange type and item condition.' })
  }
  Object.assign(listing, {
    title: title.trim(),
    category,
    description: description.trim(),
    image: image.trim(),
    ...(listing.postType === 'resource' ? { condition, mode } : {}),
  })
  await writeData(data)
  response.json({ listing: { ...listing, saved: (listing.savedBy || []).includes(request.user.id) } })
})

app.delete('/api/listings/:id', requireAuth, async (request, response) => {
  const data = request.data
  const index = data.listings.findIndex(item => item.id === request.params.id && ['wanted', 'resource'].includes(item.postType))
  if (index < 0) return response.status(404).json({ message: 'Resource listing not found.' })
  if (data.listings[index].ownerId !== request.user.id && request.user.role !== 'admin') return response.status(403).json({ message: 'You can only delete your own resource listing.' })
  if (data.listings[index].postType === 'resource' && data.requests.some(item => item.listingId === request.params.id && ['Pending', 'Approved'].includes(item.status))) {
    return response.status(409).json({ message: 'Cancel or complete active resource requests before deleting this listing.' })
  }
  const [listing] = data.listings.splice(index, 1)
  if (listing.postType === 'wanted') {
    data.offers = (data.offers || []).filter(offer => offer.listingId !== listing.id)
    data.requests = (data.requests || []).filter(exchangeRequest => exchangeRequest.listingId !== listing.id)
  }
  await writeData(data)
  response.json({ removed: true })
})

app.patch('/api/listings/:id/save', requireAuth, async (request, response) => {
  const data = request.data
  const listing = data.listings.find(item => item.id === request.params.id)
  if (!listing) return response.status(404).json({ message: 'Listing not found.' })
  listing.savedBy ||= []
  const saved = listing.savedBy.includes(request.user.id)
  listing.savedBy = saved ? listing.savedBy.filter(id => id !== request.user.id) : [...listing.savedBy, request.user.id]
  await writeData(data)
  response.json({ saved: !saved })
})

app.post('/api/listings/:id/requests', requireAuth, async (request, response) => {
  const data = request.data
  const listing = data.listings.find(item => item.id === request.params.id)
  if (!listing) return response.status(404).json({ message: 'Listing not found.' })
  if (listing.postType !== 'resource' || listing.status !== 'Available' || listing.availabilityStatus === 'Borrowed') return response.status(409).json({ message: 'This resource is not currently available.' })
  if (listing.ownerId === request.user.id) return response.status(403).json({ message: 'You cannot request your own resource.' })
  if ((data.requests || []).some(item => item.listingId === listing.id && item.requesterId === request.user.id && ['Pending', 'Approved'].includes(item.status))) {
    return response.status(409).json({ message: 'You already have an active request for this resource.' })
  }
  const message = typeof request.body.message === 'string' ? request.body.message.trim() : ''
  if (message.length > 500) return response.status(400).json({ message: 'The request message must be 500 characters or fewer.' })
  const exchangeRequest = {
    id: `request-${randomUUID()}`,
    listingId: listing.id,
    requesterId: request.user.id,
    ownerId: listing.ownerId,
    message,
    status: 'Pending',
    requestedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
  data.requests.push(exchangeRequest)
  await writeData(data)
  response.status(201).json({ request: exchangeRequest })
})

app.post('/api/listings/:id/offers', requireAuth, async (request, response) => {
  const data = request.data
  const listing = data.listings.find(item => item.id === request.params.id && item.postType === 'wanted')
  if (!listing) return response.status(404).json({ message: 'Resource request not found.' })
  if (listing.status !== 'Open') return response.status(409).json({ message: 'This resource request is already closed.' })
  if (listing.ownerId === request.user.id) return response.status(403).json({ message: 'You cannot send an offer to your own request.' })
  const message = typeof request.body.message === 'string' ? request.body.message.trim() : ''
  if (!message || message.length > 1000) return response.status(400).json({ message: 'Write a message of up to 1,000 characters.' })
  data.offers ||= []
  const offer = {
    id: `offer-${randomUUID()}`,
    listingId: listing.id,
    senderId: request.user.id,
    recipientId: listing.ownerId,
    message,
    createdAt: new Date().toISOString(),
  }
  data.offers.push(offer)
  await writeData(data)
  response.status(201).json({ offer })
})

app.get('/api/offers/my', requireAuth, (request, response) => {
  const data = request.data
  const offers = (data.offers || [])
    .filter(offer => offer.recipientId === request.user.id)
    .map(offer => ({
      ...offer,
      senderName: data.users.find(user => user.id === offer.senderId)?.name || 'Campus student',
      senderEmail: data.users.find(user => user.id === offer.senderId)?.email || '',
      senderPhone: data.users.find(user => user.id === offer.senderId)?.phone || '',
      listing: data.listings.find(item => item.id === offer.listingId),
    }))
  response.json({ offers })
})

app.patch('/api/listings/:id/close', requireAuth, async (request, response) => {
  const data = request.data
  const listing = data.listings.find(item => item.id === request.params.id && item.postType === 'wanted')
  if (!listing) return response.status(404).json({ message: 'Resource request not found.' })
  if (listing.ownerId !== request.user.id) return response.status(403).json({ message: 'Only the student who posted this request can close it.' })
  if (listing.status !== 'Open') return response.status(409).json({ message: 'This resource request is already closed.' })
  listing.status = 'Fulfilled'
  listing.closedAt = new Date().toISOString()
  await writeData(data)
  response.json({ listing })
})

app.get('/api/requests/my', requireAuth, (request, response) => {
  const data = request.data
  const requests = data.requests
    .filter(item => item.requesterId === request.user.id || item.ownerId === request.user.id || data.listings.find(listing => listing.id === item.listingId)?.ownerId === request.user.id)
    .map(item => ({
      ...item,
      ownerId: item.ownerId || data.listings.find(listing => listing.id === item.listingId)?.ownerId,
      listing: data.listings.find(listing => listing.id === item.listingId),
      requesterName: data.users.find(user => user.id === item.requesterId)?.name || 'Campus student',
      requesterEmail: data.users.find(user => user.id === item.requesterId)?.email || '',
      reviewed: data.reviews.some(review => review.requestId === item.id && review.reviewerId === request.user.id),
    }))
  response.json({ requests })
})

app.put('/api/requests/:id/approve', requireAuth, async (request, response) => {
  const data = request.data
  const exchangeRequest = data.requests.find(item => item.id === request.params.id)
  if (!exchangeRequest) return response.status(404).json({ message: 'Resource request not found.' })
  const listing = data.listings.find(item => item.id === exchangeRequest.listingId)
  if (!listing || listing.ownerId !== request.user.id) return response.status(403).json({ message: 'Only the resource owner can approve this request.' })
  if (exchangeRequest.status !== 'Pending' || listing.availabilityStatus === 'Borrowed') return response.status(409).json({ message: 'This request is no longer pending or the resource is already in use.' })
  exchangeRequest.status = 'Approved'
  exchangeRequest.approvedAt = new Date().toISOString()
  listing.availabilityStatus = 'Borrowed'
  await writeData(data)
  response.json({ request: exchangeRequest, listing })
})

app.put('/api/requests/:id/reject', requireAuth, async (request, response) => {
  const data = request.data
  const exchangeRequest = data.requests.find(item => item.id === request.params.id)
  if (!exchangeRequest) return response.status(404).json({ message: 'Resource request not found.' })
  const listing = data.listings.find(item => item.id === exchangeRequest.listingId)
  if (!listing || listing.ownerId !== request.user.id) return response.status(403).json({ message: 'Only the resource owner can reject this request.' })
  if (exchangeRequest.status !== 'Pending') return response.status(409).json({ message: 'Only a pending request can be rejected.' })
  exchangeRequest.status = 'Rejected'
  exchangeRequest.rejectedAt = new Date().toISOString()
  await writeData(data)
  response.json({ request: exchangeRequest })
})

app.put('/api/requests/:id/cancel', requireAuth, async (request, response) => {
  const data = request.data
  const exchangeRequest = data.requests.find(item => item.id === request.params.id)
  if (!exchangeRequest) return response.status(404).json({ message: 'Resource request not found.' })
  if (exchangeRequest.requesterId !== request.user.id) return response.status(403).json({ message: 'Only the student who made this request can cancel it.' })
  if (exchangeRequest.status !== 'Pending') return response.status(409).json({ message: 'Only a pending request can be cancelled.' })
  exchangeRequest.status = 'Cancelled'
  exchangeRequest.cancelledAt = new Date().toISOString()
  await writeData(data)
  response.json({ request: exchangeRequest })
})

app.put('/api/requests/:id/return', requireAuth, async (request, response) => {
  const data = request.data
  const exchangeRequest = data.requests.find(item => item.id === request.params.id)
  if (!exchangeRequest) return response.status(404).json({ message: 'Resource request not found.' })
  const listing = data.listings.find(item => item.id === exchangeRequest.listingId)
  if (!listing || listing.ownerId !== request.user.id) return response.status(403).json({ message: 'Only the resource owner can mark it returned.' })
  if (exchangeRequest.status !== 'Approved') return response.status(409).json({ message: 'Only an approved resource request can be marked returned.' })
  exchangeRequest.status = 'Returned'
  exchangeRequest.returnedAt = new Date().toISOString()
  listing.availabilityStatus = 'Available'
  await writeData(data)
  response.json({ request: exchangeRequest, listing })
})

app.get('/api/events', requireAuth, (request, response) => {
  const data = request.data
  const visibleCount = new Map()
  const events = request.user.role === 'admin' ? data.events : data.events.filter(event => {
    const count = visibleCount.get(event.clubId) || 0
    if (count >= 2) return false
    visibleCount.set(event.clubId, count + 1)
    return true
  })
  response.json({ events: events.map(event => {
    const registrationCount = data.registrations.filter(registration => registration.eventId === event.id).length
    return {
      ...event,
      registrationCount,
      spots: event.capacity ? Math.max(0, event.capacity - registrationCount) : null,
      registered: data.registrations.some(registration => registration.eventId === event.id && registration.userId === request.user.id),
    }
  }) })
})

app.get('/api/clubs', requireAuth, (request, response) => {
  response.json({ clubs: request.data.clubs })
})

app.post('/api/events', requireAuth, requireAdmin, async (request, response) => {
  const { title, type, date, time, place, description = '', clubId, capacity = 0 } = request.body
  const data = request.data
  const club = data.clubs.find(item => item.id === clubId)
  if (!club) return response.status(400).json({ message: 'Choose a valid organizing club.' })
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 100 || typeof type !== 'string' || !type.trim() || type.trim().length > 60) return response.status(400).json({ message: 'Event name and type are required and must be within 100 and 60 characters.' })
  const parsedDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00.000Z`) : null
  const today = new Date().toISOString().slice(0, 10)
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date || date < today) return response.status(400).json({ message: 'Choose a valid date today or later.' })
  if (typeof time !== 'string' || !time.trim() || time.trim().length > 80 || typeof place !== 'string' || !place.trim() || place.trim().length > 120) return response.status(400).json({ message: 'Event time and location are required.' })
  if (typeof description !== 'string' || description.length > 500) return response.status(400).json({ message: 'Event details must be 500 characters or fewer.' })
  const eventCapacity = capacity === '' || capacity === null ? 0 : Number(capacity)
  if (!Number.isInteger(eventCapacity) || eventCapacity < 0 || eventCapacity > 5000) return response.status(400).json({ message: 'Capacity must be a whole number from 1 to 5,000, or left empty for unlimited registration.' })
  const upcomingCount = data.events.filter(event => event.clubId === club.id && (!event.date || event.date >= today)).length
  if (upcomingCount >= 2) return response.status(409).json({ message: 'This club already has two upcoming events listed.' })
  const event = {
    id: `event-${randomUUID()}`,
    title: title.trim(),
    type: type.trim(),
    date,
    day: String(Number(date.slice(8, 10))),
    month: new Date(`${date}T00:00:00`).toLocaleString('en', { month: 'short' }).toUpperCase(),
    time: time.trim(),
    place: place.trim(),
    description: description.trim(),
    host: club.name,
    clubId: club.id,
    color: ['mint', 'purple', 'orange', 'blue'][data.events.length % 4],
    spots: eventCapacity || null,
    capacity: eventCapacity || null,
    image: '',
    createdBy: request.user.id,
  }
  data.events.push(event)
  await writeData(data)
  response.status(201).json({ event: { ...event, registered: false } })
})

app.delete('/api/events/:id', requireAuth, requireAdmin, async (request, response) => {
  const data = request.data
  const eventIndex = data.events.findIndex(item => item.id === request.params.id)
  if (eventIndex < 0) return response.status(404).json({ message: 'Event not found.' })
  const event = data.events[eventIndex]
  data.events.splice(eventIndex, 1)
  data.registrations = data.registrations.filter(registration => registration.eventId !== event.id)
  await writeData(data)
  response.json({ removed: true })
})

app.post('/api/events/:id/registration', requireAuth, async (request, response) => {
  const data = request.data
  const event = data.events.find(item => item.id === request.params.id)
  if (!event) return response.status(404).json({ message: 'Event not found.' })
  const registrationIndex = data.registrations.findIndex(item => item.eventId === event.id && item.userId === request.user.id)
  const registered = registrationIndex >= 0
  if (!registered && event.date && event.date < new Date().toISOString().slice(0, 10)) return response.status(409).json({ message: 'Registration for this event has closed.' })
  if (!registered && event.capacity && data.registrations.filter(item => item.eventId === event.id).length >= event.capacity) {
    return response.status(409).json({ message: 'This event is full. Check with the organizer for cancellations or a waitlist.' })
  }
  data.registrations = registered
    ? data.registrations.filter((_, index) => index !== registrationIndex)
    : [...data.registrations, { eventId: event.id, userId: request.user.id, joinedAt: new Date().toISOString() }]
  await writeData(data)
  const registrationCount = data.registrations.filter(item => item.eventId === event.id).length
  response.json({ registered: !registered, registrationCount, spots: event.capacity ? Math.max(0, event.capacity - registrationCount) : null })
})

app.get('/api/events/:id/guest-list', requireAuth, requireAdmin, (request, response) => {
  const data = request.data
  const event = data.events.find(item => item.id === request.params.id)
  if (!event) return response.status(404).json({ message: 'Event not found.' })
  const attendees = data.registrations
    .filter(registration => registration.eventId === event.id)
    .map(registration => {
      const user = data.users.find(item => item.id === registration.userId)
      return user ? { name: user.name, email: user.email, joinedAt: registration.joinedAt } : null
    })
    .filter(Boolean)
    .sort((first, second) => first.name.localeCompare(second.name))
  response.json({ event: { id: event.id, title: event.title }, attendees })
})

app.patch('/api/profile', requireAuth, async (request, response) => {
  const data = request.data
  const user = data.users.find(item => item.id === request.user.id)
  const { branch, year, hostel = '' } = request.body
  if (typeof branch !== 'string' || !branch.trim() || typeof year !== 'string' || !year.trim()) return response.status(400).json({ message: 'Branch and year are required.' })
  if (branch.trim().length > 100 || year.trim().length > 20 || typeof hostel !== 'string' || hostel.trim().length > 100) return response.status(400).json({ message: 'Branch, year, or hostel is too long.' })
  user.branch = branch.trim()
  user.year = year.trim()
  user.hostel = hostel.trim()
  await writeData(data)
  response.json({ user: publicUser(user) })
})

app.get('/api/announcements', requireAuth, (request, response) => {
  const data = request.data
  const announcements = [...(data.announcements || [])].sort((first, second) => Number(second.pinned) - Number(first.pinned) || new Date(second.createdAt) - new Date(first.createdAt))
  response.json({ announcements })
})

app.post('/api/announcements', requireAuth, requireAdmin, async (request, response) => {
  const { title, category = 'General', content = '', pinned = false } = request.body
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) return response.status(400).json({ message: 'Announcement title is required and must be 120 characters or fewer.' })
  if (typeof content !== 'string' || !content.trim() || content.trim().length > 3000) return response.status(400).json({ message: 'Announcement details are required and must be 3,000 characters or fewer.' })
  if (typeof category !== 'string' || !category.trim() || category.trim().length > 60 || typeof pinned !== 'boolean') return response.status(400).json({ message: 'Choose a category of 60 characters or fewer and a valid pin setting.' })
  const data = request.data
  const announcement = {
    id: `announcement-${randomUUID()}`,
    title: title.trim(),
    category: String(category || 'General').trim() || 'General',
    content: content.trim(),
    pinned: Boolean(pinned),
    author: request.user.name,
    createdAt: new Date().toISOString(),
  }
  data.announcements = [announcement, ...(data.announcements || [])]
  await writeData(data)
  response.status(201).json({ announcement })
})

app.delete('/api/announcements/:id', requireAuth, requireAdmin, async (request, response) => {
  const data = request.data
  const index = (data.announcements || []).findIndex(item => item.id === request.params.id)
  if (index < 0) return response.status(404).json({ message: 'Announcement not found.' })
  data.announcements.splice(index, 1)
  await writeData(data)
  response.json({ removed: true })
})

app.put('/api/announcements/:id', requireAuth, requireAdmin, async (request, response) => {
  const { title, category, content, pinned } = request.body
  const data = request.data
  const announcement = (data.announcements || []).find(item => item.id === request.params.id)
  if (!announcement) return response.status(404).json({ message: 'Announcement not found.' })
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    return response.status(400).json({ message: 'Announcement title and details are required.' })
  }
  if (title.trim().length > 120 || content.trim().length > 3000) return response.status(400).json({ message: 'Announcement title or details are too long.' })
  if (typeof category !== 'string' || !category.trim() || category.trim().length > 60 || typeof pinned !== 'boolean') return response.status(400).json({ message: 'Choose a category of 60 characters or fewer and a valid pin setting.' })
  announcement.title = title.trim()
  announcement.category = category.trim()
  announcement.content = content.trim()
  announcement.pinned = Boolean(pinned)
  await writeData(data)
  response.json({ announcement })
})

app.get('/api/lost-found', requireAuth, (request, response) => {
  const data = request.data
  const items = [...(data.lostFound || [])]
    .map(item => {
      const reporter = data.users.find(user => user.id === item.reporterId)
      return { ...item, contactEmail: item.contactEmail || reporter?.email || '', contactPhone: item.contactPhone || reporter?.phone || '' }
    })
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
  response.json({ items })
})

app.get('/api/lost-found/:id', requireAuth, (request, response) => {
  const data = request.data
  const item = (data.lostFound || []).find(entry => entry.id === request.params.id)
  if (!item) return response.status(404).json({ message: 'Report not found.' })
  response.json({ item })
})

app.post('/api/lost-found', requireAuth, async (request, response) => {
  const { title, type = 'lost', category = 'Other', description = '', location = '', date = '', image = '' } = request.body
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) return response.status(400).json({ message: 'Item title is required and must be 120 characters or fewer.' })
  if (!['lost', 'found'].includes(type)) return response.status(400).json({ message: 'Report type must be lost or found.' })
  if (!['Accessories', 'Electronics', 'Documents', 'Clothing', 'Other'].includes(category)) return response.status(400).json({ message: 'Choose a valid item category.' })
  if (typeof description !== 'string' || !description.trim() || description.trim().length > 1500) return response.status(400).json({ message: 'Please describe the item in 1,500 characters or fewer.' })
  if (typeof location !== 'string' || !location.trim() || location.trim().length > 160) return response.status(400).json({ message: 'Location is required and must be 160 characters or fewer.' })
  if (date && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime()) || new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date || date > new Date().toISOString().slice(0, 10))) {
    return response.status(400).json({ message: 'Choose a valid date today or earlier.' })
  }
  if (!isValidImage(image)) return response.status(400).json({ message: 'Choose a valid image URL or an uploaded JPEG under 2.25 MB.' })
  const data = request.data
  const item = {
    id: `lost-found-${randomUUID()}`,
    title: title.trim(),
    type,
    category,
    description: description.trim(),
    location: location.trim(),
    date: typeof date === 'string' ? date : '',
    image: typeof image === 'string' ? image.trim() : '',
    contactName: request.user.name,
    contactEmail: request.user.email,
    contactPhone: request.user.phone || '',
    reporterId: request.user.id,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  data.lostFound = [item, ...(data.lostFound || [])]
  await writeData(data)
  response.status(201).json({ item })
})

app.put('/api/lost-found/:id', requireAuth, async (request, response) => {
  const data = request.data
  const item = (data.lostFound || []).find(entry => entry.id === request.params.id)
  if (!item) return response.status(404).json({ message: 'Report not found.' })
  if (item.reporterId !== request.user.id && request.user.role !== 'admin') return response.status(403).json({ message: 'You can only edit your own report.' })
  const { title, type, category, description, location, date, image } = request.body
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) return response.status(400).json({ message: 'Item title is required and must be 120 characters or fewer.' })
  if (!['lost', 'found'].includes(type)) return response.status(400).json({ message: 'Report type must be lost or found.' })
  if (!['Accessories', 'Electronics', 'Documents', 'Clothing', 'Other'].includes(category)) return response.status(400).json({ message: 'Choose a valid item category.' })
  if (typeof description !== 'string' || !description.trim() || description.trim().length > 1500) return response.status(400).json({ message: 'Please describe the item in 1,500 characters or fewer.' })
  if (typeof location !== 'string' || !location.trim() || location.trim().length > 160) return response.status(400).json({ message: 'Location is required and must be 160 characters or fewer.' })
  if (typeof date !== 'string' || (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime()) || new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date || date > new Date().toISOString().slice(0, 10)))) {
    return response.status(400).json({ message: 'Choose a valid date today or earlier.' })
  }
  if (!isValidImage(image)) return response.status(400).json({ message: 'Choose a valid image URL or an uploaded JPEG under 2.25 MB.' })
  Object.assign(item, { title: title.trim(), type, category, description: description.trim(), location: location.trim(), date, image: image.trim() })
  await writeData(data)
  response.json({ item })
})

app.put('/api/lost-found/:id/resolve', requireAuth, async (request, response) => {
  const data = request.data
  const item = (data.lostFound || []).find(entry => entry.id === request.params.id)
  if (!item) return response.status(404).json({ message: 'Report not found.' })
  if (item.reporterId !== request.user.id && request.user.role !== 'admin') return response.status(403).json({ message: 'Only the reporter or an administrator can resolve this item.' })
  item.status = 'resolved'
  await writeData(data)
  response.json({ item })
})

app.delete('/api/lost-found/:id', requireAuth, async (request, response) => {
  const data = request.data
  const index = (data.lostFound || []).findIndex(item => item.id === request.params.id)
  if (index < 0) return response.status(404).json({ message: 'Report not found.' })
  if (data.lostFound[index].reporterId !== request.user.id && request.user.role !== 'admin') return response.status(403).json({ message: 'You can only delete your own report.' })
  data.lostFound.splice(index, 1)
  await writeData(data)
  response.json({ removed: true })
})

app.get('/api/maintenance', requireAuth, (request, response) => {
  const data = request.data
  const visibleRequests = request.user.role === 'admin'
    ? data.maintenanceRequests || []
    : (data.maintenanceRequests || []).filter(item => item.userId === request.user.id)
  const requests = [...visibleRequests].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
  response.json({ requests })
})

app.get('/api/maintenance/my', requireAuth, (request, response) => {
  const data = request.data
  const requests = (data.maintenanceRequests || []).filter(item => item.userId === request.user.id).sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
  response.json({ requests })
})

app.post('/api/maintenance', requireAuth, async (request, response) => {
  const { title, category = 'Electrical', location = '', description = '', image = '' } = request.body
  const categories = ['Electrical', 'Water', 'Cleanliness', 'Furniture', 'Internet']
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) return response.status(400).json({ message: 'Issue title is required and must be 120 characters or fewer.' })
  if (!categories.includes(category)) return response.status(400).json({ message: 'Choose a valid maintenance category.' })
  if (typeof location !== 'string' || !location.trim() || location.trim().length > 160) return response.status(400).json({ message: 'Location is required and must be 160 characters or fewer.' })
  if (typeof description !== 'string' || !description.trim() || description.trim().length > 1500) return response.status(400).json({ message: 'Describe the issue in 1,500 characters or fewer.' })
  if (!isValidImage(image)) return response.status(400).json({ message: 'Choose a valid image URL or an uploaded JPEG under 2.25 MB.' })
  const data = request.data
  const requestEntry = {
    id: `maintenance-${randomUUID()}`,
    title: title.trim(),
    category: String(category || 'Electrical').trim() || 'Electrical',
    location: location.trim(),
    description: description.trim(),
    image: typeof image === 'string' ? image.trim() : '',
    userId: request.user.id,
    userName: request.user.name,
    status: 'Submitted',
    createdAt: new Date().toISOString(),
  }
  data.maintenanceRequests = [requestEntry, ...(data.maintenanceRequests || [])]
  await writeData(data)
  response.status(201).json({ request: requestEntry })
})

app.put('/api/maintenance/:id/status', requireAuth, requireAdmin, async (request, response) => {
  const { status } = request.body
  if (!['Submitted', 'In Progress', 'Resolved'].includes(status)) return response.status(400).json({ message: 'Choose a valid maintenance status.' })
  const data = request.data
  const requestEntry = (data.maintenanceRequests || []).find(item => item.id === request.params.id)
  if (!requestEntry) return response.status(404).json({ message: 'Maintenance request not found.' })
  const nextStatus = requestEntry.status === 'Submitted' ? 'In Progress' : requestEntry.status === 'In Progress' ? 'Resolved' : null
  if (status !== requestEntry.status && status !== nextStatus) return response.status(409).json({ message: 'Maintenance requests must move from Submitted to In Progress to Resolved.' })
  requestEntry.status = status
  if (status !== 'Resolved') delete requestEntry.confirmedByUserAt
  await writeData(data)
  response.json({ request: requestEntry })
})

app.put('/api/maintenance/:id/assign', requireAuth, requireAdmin, async (request, response) => {
  const assigneeId = typeof request.body.userId === 'string' ? request.body.userId.trim() : ''
  const data = request.data
  const requestEntry = (data.maintenanceRequests || []).find(item => item.id === request.params.id)
  if (!requestEntry) return response.status(404).json({ message: 'Maintenance request not found.' })
  if (assigneeId) {
    const assignee = data.users.find(user => user.id === assigneeId && user.role === 'student' && !user.suspendedAt)
    if (!assignee) return response.status(400).json({ message: 'Choose an active student account for this assignment.' })
    requestEntry.assignedTo = assignee.id
    requestEntry.assignedToName = assignee.name
  } else {
    delete requestEntry.assignedTo
    delete requestEntry.assignedToName
  }
  await writeData(data)
  response.json({ request: requestEntry })
})

app.put('/api/maintenance/:id/confirm', requireAuth, async (request, response) => {
  const data = request.data
  const requestEntry = (data.maintenanceRequests || []).find(item => item.id === request.params.id)
  if (!requestEntry) return response.status(404).json({ message: 'Maintenance request not found.' })
  if (requestEntry.userId !== request.user.id) return response.status(403).json({ message: 'Only the requester can confirm resolution.' })
  if (requestEntry.status !== 'Resolved') return response.status(409).json({ message: 'An administrator must mark the request resolved before it can be confirmed.' })
  requestEntry.confirmedByUserAt = new Date().toISOString()
  await writeData(data)
  response.json({ request: requestEntry })
})

app.post('/api/reviews', requireAuth, async (request, response) => {
  const { requestId, rating, comment = '' } = request.body
  if (typeof requestId !== 'string' || !requestId) return response.status(400).json({ message: 'A completed resource request is required for a review.' })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return response.status(400).json({ message: 'Rating must be a whole number between 1 and 5.' })
  if (typeof comment !== 'string' || comment.length > 500) return response.status(400).json({ message: 'Review comments must be 500 characters or fewer.' })
  const data = request.data
  const exchangeRequest = data.requests.find(item => item.id === requestId)
  if (!exchangeRequest || exchangeRequest.status !== 'Returned') return response.status(409).json({ message: 'Reviews are available only after a resource has been returned.' })
  if (exchangeRequest.requesterId !== request.user.id) return response.status(403).json({ message: 'Only the student who borrowed the resource can review this exchange.' })
  if (data.reviews.some(item => item.requestId === exchangeRequest.id && item.reviewerId === request.user.id)) return response.status(409).json({ message: 'You have already reviewed this exchange.' })
  const reviewedUserId = exchangeRequest.ownerId || data.listings.find(item => item.id === exchangeRequest.listingId)?.ownerId
  if (!reviewedUserId || reviewedUserId === request.user.id) return response.status(409).json({ message: 'This exchange cannot be reviewed.' })
  const review = {
    id: `review-${randomUUID()}`,
    resourceId: exchangeRequest.listingId,
    requestId: exchangeRequest.id,
    userId: reviewedUserId,
    reviewerId: request.user.id,
    reviewerName: request.user.name,
    rating,
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  }
  data.reviews.push(review)
  const owner = data.users.find(user => user.id === reviewedUserId)
  const ownerReviews = data.reviews.filter(item => item.userId === reviewedUserId)
  if (owner) owner.rating = ownerReviews.reduce((total, item) => total + item.rating, 0) / ownerReviews.length
  await writeData(data)
  response.status(201).json({ review })
})

app.get('/api/users/:id/reviews', requireAuth, (request, response) => {
  const data = request.data
  const reviews = (data.reviews || []).filter(item => item.userId === request.params.id || item.reviewerId === request.params.id)
  response.json({ reviews })
})

app.use((error, _request, response, _next) => {
  console.error('CampusLoop API request failed:', error)
  if (response.headersSent) return
  if (error.type === 'entity.parse.failed') return response.status(400).json({ message: 'Request body contains invalid JSON.' })
  if (error.type === 'entity.too.large') return response.status(413).json({ message: 'Request body is too large. Choose a smaller image or remove optional content.' })
  if (error.code === 11000) return response.status(409).json({ message: 'This record already exists. Refresh the page and try again.' })
  if (error.code === 112 || error.hasErrorLabel?.('TransientTransactionError')) return response.status(503).json({ message: 'The database is processing another update. Please retry in a moment.' })
  if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError' || error.name === 'MongoNetworkTimeoutError') {
    return response.status(503).json({ message: 'The campus database is temporarily unavailable. Please try again shortly.' })
  }
  response.status(error.status || 500).json({ message: error.status ? error.message : 'The server could not complete the request. Please retry; contact support if the problem continues.' })
})

async function startServer() {
  if (!mongoUri) throw new Error('MONGODB_URI is required. Configure the MongoDB Atlas connection string in your .env file.')
  if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET is required and must contain at least 32 characters.')

  const server = app.listen(port, () => console.log(`CampusLoop API listening on http://localhost:${port}; waiting for MongoDB readiness.`))
  let shuttingDown = false
  const shutdown = signal => {
    shuttingDown = true
    console.log(`CampusLoop API received ${signal}; closing connections.`)
    server.close(async () => {
      try {
        await mongoClient?.close()
        process.exit(0)
      } catch (error) {
        console.error('CampusLoop could not close MongoDB cleanly:', error.message)
        process.exit(1)
      }
    })
    setTimeout(() => process.exit(1), 10000).unref()
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))

  let retryDelay = 1000
  while (!shuttingDown && !databaseReady) {
    try {
      mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 })
      await mongoClient.connect()
      database = mongoClient.db(databaseName)
      stateCollection = database.collection('_campusloop_state')
      await initializeDatabase()
      await database.collection('users').createIndex({ email: 1 }, { unique: true })
      databaseReady = true
      console.log(`CampusLoop connected to MongoDB database "${databaseName}".`)
    } catch (error) {
      databaseReady = false
      console.error(`CampusLoop database is not ready: ${error.message}`)
      if (mongoClient) {
        try {
          await mongoClient.close()
        } catch (closeError) {
          console.error('CampusLoop could not close the failed MongoDB connection:', closeError.message)
        }
      }
      mongoClient = undefined
      database = undefined
      stateCollection = undefined
      if (!['MongoServerSelectionError', 'MongoNetworkError', 'MongoNetworkTimeoutError'].includes(error.name)) {
        console.error('CampusLoop will keep the API available, but database initialization needs configuration or data repair.')
        return
      }
      console.error(`Retrying MongoDB connection in ${Math.ceil(retryDelay / 1000)} second(s).`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      retryDelay = Math.min(retryDelay * 2, 30000)
    }
  }
}

startServer().catch(async error => {
  console.error('CampusLoop failed to start:', error.message)
  if (mongoClient) {
    try {
      await mongoClient.close()
    } catch (closeError) {
      console.error('CampusLoop could not close MongoDB after startup failure:', closeError.message)
    }
  }
  process.exitCode = 1
})