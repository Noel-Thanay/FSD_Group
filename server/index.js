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
  'clubMemberships',
  'clubJoinRequests',
  'announcements',
  'lostFound',
  'maintenanceRequests',
  'reviews',
]
const snapshotRevisions = new WeakMap()
let database
let stateCollection
let mongoClient

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
  clubMemberships: [],
  clubJoinRequests: [],
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
  data.users ||= []
  let migrated = false
  const seenEmails = new Set()
  for (const user of data.users) {
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
  if (!Array.isArray(data.clubMemberships)) {
    data.clubMemberships = []
    migrated = true
  }
  if (!Array.isArray(data.clubJoinRequests)) {
    data.clubJoinRequests = []
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
  initialData.clubMemberships = []
  return normalizeData(initialData).data
}

function mongoDocument(collectionName, item, index) {
  let id = item.id
  if (!id && collectionName === 'registrations') id = `${item.eventId}:${item.userId}`
  if (!id && collectionName === 'clubMemberships') id = `${item.clubId}:${item.userId}`
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

const app = express()
app.use(cors())
app.use(express.json({ limit: '4mb' }))

app.get('/api/health', (_request, response) => response.json({ status: 'ok', service: 'campusloop-api' }))

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body
  const data = await readData()
  const user = data.users.find(item => item.email.toLowerCase() === String(email || '').toLowerCase())
  if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash)) return response.status(401).json({ message: 'Email or password is incorrect.' })
  response.json({ token: tokenFor(user), user: publicUser(user) })
})

app.post('/api/auth/register', async (request, response) => {
  const { name, branch, year, hostel = '', phone, email, password } = request.body
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : ''
  const phoneDigits = normalizedPhone.replace(/\D/g, '')
  if (!name || !branch || !year || !normalizedEmail || !password || String(password).length < 6 || !normalizedPhone) return response.status(400).json({ message: 'Name, branch, year, phone number, student email, and a password of at least 6 characters are required.' })
  if (!/^[^\s@]+@student\.nitw\.ac\.in$/.test(normalizedEmail)) return response.status(400).json({ message: 'Use your @student.nitw.ac.in student email address.' })
  if (!/^\+?[0-9().\-\s]+$/.test(normalizedPhone) || phoneDigits.length < 7 || phoneDigits.length > 15) return response.status(400).json({ message: 'Enter a valid phone number with 7 to 15 digits.' })
  if (String(name).trim().length > 100 || String(branch).trim().length > 100 || String(year).trim().length > 20 || String(hostel).trim().length > 100 || normalizedPhone.length > 25) return response.status(400).json({ message: 'Name, branch, year, hostel, or phone number is too long.' })
  const role = normalizedEmail === adminEmail && adminEmail
    ? request.body.adminSetupKey === adminSetupKey && adminSetupKey.length >= 24 ? 'admin' : null
    : 'student'
  if (!role) return response.status(403).json({ message: 'A valid administrator setup key is required for this account.' })
  const data = await readData()
  if (data.users.some(user => user.email.toLowerCase() === normalizedEmail)) return response.status(409).json({ message: 'An account with this email already exists.' })
  const user = { id: `user-${randomUUID()}`, name: name.trim(), branch: branch.trim(), year: String(year).trim(), hostel: String(hostel).trim(), phone: normalizedPhone, email: normalizedEmail, passwordHash: bcrypt.hashSync(String(password), 10), role, createdAt: new Date().toISOString() }
  data.users.push(user)
  await writeData(data)
  response.status(201).json({ token: tokenFor(user), user: publicUser(user) })
})

app.get('/api/auth/me', requireAuth, (request, response) => response.json({ user: publicUser(request.user) }))

app.get('/api/listings', requireAuth, (request, response) => {
  const data = request.data
  const listings = data.listings
    .filter(item => item.postType === 'wanted' && (item.status === 'Open' || item.ownerId === request.user.id))
    .map(item => ({ ...item, saved: (item.savedBy || []).includes(request.user.id) }))
  response.json({ listings })
})

app.post('/api/listings', requireAuth, async (request, response) => {
  const { title, category, description = '', image = '' } = request.body
  const categories = ['Books', 'Electronics', 'Study gear', 'Room & living']
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120 || !categories.includes(category)) {
    return response.status(400).json({ message: 'A title (up to 120 characters) and a valid category are required.' })
  }
  if (typeof description !== 'string' || description.length > 500) return response.status(400).json({ message: 'The description must be 500 characters or fewer.' })
  if (typeof image !== 'string' || (image && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(image) || image.length > 3 * 1024 * 1024))) {
    return response.status(400).json({ message: 'Choose a JPEG image smaller than 2 MB after resizing.' })
  }
  const data = request.data
  const listing = {
    id: `listing-${randomUUID()}`,
    postType: 'wanted',
    status: 'Open',
    title: title.trim(),
    category,
    description: description.trim(),
    image,
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

app.patch('/api/listings/:id/save', requireAuth, async (request, response) => {
  const data = request.data
  const listing = data.listings.find(item => item.id === request.params.id)
  if (!listing) return response.status(404).json({ message: 'Listing not found.' })
  const saved = listing.savedBy.includes(request.user.id)
  listing.savedBy = saved ? listing.savedBy.filter(id => id !== request.user.id) : [...listing.savedBy, request.user.id]
  await writeData(data)
  response.json({ saved: !saved })
})

app.post('/api/listings/:id/requests', requireAuth, async (request, response) => {
  const data = request.data
  const listing = data.listings.find(item => item.id === request.params.id)
  if (!listing) return response.status(404).json({ message: 'Listing not found.' })
  const exchangeRequest = { id: `request-${randomUUID()}`, listingId: listing.id, requesterId: request.user.id, status: 'Pending', createdAt: new Date().toISOString() }
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
  const requests = data.requests.filter(item => item.requesterId === request.user.id).map(item => ({ ...item, listing: data.listings.find(listing => listing.id === item.listingId) }))
  response.json({ requests })
})

app.get('/api/events', requireAuth, (request, response) => {
  const data = request.data
  const visibleCount = new Map()
  const events = data.events.filter(event => {
    const count = visibleCount.get(event.clubId) || 0
    if (count >= 2) return false
    visibleCount.set(event.clubId, count + 1)
    return true
  })
  response.json({ events: events.map(event => ({
    ...event,
    registered: data.registrations.some(registration => registration.eventId === event.id && registration.userId === request.user.id),
  })) })
})

app.get('/api/clubs', requireAuth, (request, response) => {
  const data = request.data
  const result = data.clubs.map(club => {
    const isMember = data.clubMemberships.some(member => member.clubId === club.id && member.userId === request.user.id)
    const joinRequest = data.clubJoinRequests.find(item => item.clubId === club.id && item.userId === request.user.id && item.status === 'pending')
    const pendingRequests = isMember
      ? data.clubJoinRequests.filter(item => item.clubId === club.id && item.status === 'pending').map(item => ({
        id: item.id,
        userId: item.userId,
        name: data.users.find(user => user.id === item.userId)?.name || 'Campus student',
      }))
      : []
    return { ...club, isMember, requestPending: Boolean(joinRequest), pendingRequests }
  })
  response.json({ clubs: result })
})

app.post('/api/clubs/:id/join-requests', requireAuth, async (request, response) => {
  const data = request.data
  const club = data.clubs.find(item => item.id === request.params.id)
  if (!club) return response.status(404).json({ message: 'Club not found.' })
  if (data.clubMemberships.some(item => item.clubId === club.id && item.userId === request.user.id)) return response.status(409).json({ message: 'You are already a member of this club.' })
  if (data.clubJoinRequests.some(item => item.clubId === club.id && item.userId === request.user.id && item.status === 'pending')) return response.status(409).json({ message: 'Your request to join this club is already pending.' })
  const joinRequest = { id: `club-request-${randomUUID()}`, clubId: club.id, userId: request.user.id, status: 'pending', createdAt: new Date().toISOString() }
  if (!data.clubMemberships.some(item => item.clubId === club.id)) {
    joinRequest.status = 'approved'
    joinRequest.approvedAt = new Date().toISOString()
    joinRequest.approvedBy = request.user.id
    data.clubMemberships.push({ clubId: club.id, userId: request.user.id, joinedAt: joinRequest.approvedAt })
    data.clubJoinRequests.push(joinRequest)
    await writeData(data)
    return response.status(201).json({ request: joinRequest, approved: true })
  }
  data.clubJoinRequests.push(joinRequest)
  await writeData(data)
  response.status(201).json({ request: joinRequest })
})

app.post('/api/clubs/:id/join-requests/:requestId/approve', requireAuth, async (request, response) => {
  const data = request.data
  const club = data.clubs.find(item => item.id === request.params.id)
  if (!club) return response.status(404).json({ message: 'Club not found.' })
  if (!data.clubMemberships.some(item => item.clubId === club.id && item.userId === request.user.id)) return response.status(403).json({ message: 'Only an existing club member can approve membership requests.' })
  const joinRequest = data.clubJoinRequests.find(item => item.id === request.params.requestId && item.clubId === club.id)
  if (!joinRequest || joinRequest.status !== 'pending') return response.status(404).json({ message: 'Pending membership request not found.' })
  joinRequest.status = 'approved'
  joinRequest.approvedAt = new Date().toISOString()
  joinRequest.approvedBy = request.user.id
  data.clubMemberships.push({ clubId: club.id, userId: joinRequest.userId, joinedAt: joinRequest.approvedAt })
  await writeData(data)
  response.json({ approved: true })
})

app.post('/api/events', requireAuth, async (request, response) => {
  const { title, type, date, time, place, description = '', clubId } = request.body
  const data = request.data
  const club = data.clubs.find(item => item.id === clubId)
  if (!club) return response.status(400).json({ message: 'Choose a valid organizing club.' })
  if (!data.clubMemberships.some(item => item.clubId === club.id && item.userId === request.user.id)) return response.status(403).json({ message: 'You must be an approved member of the organizing club to post an event.' })
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 100 || typeof type !== 'string' || !type.trim() || type.trim().length > 60) return response.status(400).json({ message: 'Event name and type are required and must be within 100 and 60 characters.' })
  const parsedDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00.000Z`) : null
  const today = new Date().toISOString().slice(0, 10)
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date || date < today) return response.status(400).json({ message: 'Choose a valid date today or later.' })
  if (typeof time !== 'string' || !time.trim() || time.trim().length > 80 || typeof place !== 'string' || !place.trim() || place.trim().length > 120) return response.status(400).json({ message: 'Event time and location are required.' })
  if (typeof description !== 'string' || description.length > 500) return response.status(400).json({ message: 'Event details must be 500 characters or fewer.' })
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
    spots: 0,
    image: '',
    createdBy: request.user.id,
  }
  data.events.push(event)
  await writeData(data)
  response.status(201).json({ event: { ...event, registered: false } })
})

app.delete('/api/events/:id', requireAuth, async (request, response) => {
  const data = request.data
  const eventIndex = data.events.findIndex(item => item.id === request.params.id)
  if (eventIndex < 0) return response.status(404).json({ message: 'Event not found.' })
  const event = data.events[eventIndex]
  if (!data.clubMemberships.some(item => item.clubId === event.clubId && item.userId === request.user.id)) return response.status(403).json({ message: 'Only an approved member of the organizing club can remove this event.' })
  const today = new Date().toISOString().slice(0, 10)
  if (!event.date || event.date >= today) return response.status(409).json({ message: 'An event can only be removed after its scheduled date has passed.' })
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
  data.registrations = registered
    ? data.registrations.filter((_, index) => index !== registrationIndex)
    : [...data.registrations, { eventId: event.id, userId: request.user.id, joinedAt: new Date().toISOString() }]
  await writeData(data)
  response.json({ registered: !registered })
})

app.get('/api/events/:id/guest-list', requireAuth, (request, response) => {
  const data = request.data
  const event = data.events.find(item => item.id === request.params.id)
  if (!event) return response.status(404).json({ message: 'Event not found.' })
  const isOrganizer = data.clubMemberships.some(member => member.clubId === event.clubId && member.userId === request.user.id)
  if (!isOrganizer) return response.status(403).json({ message: 'Only approved members of the organizing club can view this guest list.' })
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
  if (typeof title !== 'string' || !title.trim()) return response.status(400).json({ message: 'Announcement title is required.' })
  if (typeof content !== 'string' || !content.trim()) return response.status(400).json({ message: 'Announcement details are required.' })
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
  announcement.title = title.trim()
  announcement.category = typeof category === 'string' && category.trim() ? category.trim() : 'General'
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
  const { title, type = 'lost', description = '', location = '', date = '', image = '' } = request.body
  if (typeof title !== 'string' || !title.trim()) return response.status(400).json({ message: 'Item title is required.' })
  if (!['lost', 'found'].includes(type)) return response.status(400).json({ message: 'Report type must be lost or found.' })
  if (typeof description !== 'string' || !description.trim()) return response.status(400).json({ message: 'Please describe the item.' })
  if (typeof location !== 'string' || !location.trim()) return response.status(400).json({ message: 'Location is required.' })
  const data = request.data
  const item = {
    id: `lost-found-${randomUUID()}`,
    title: title.trim(),
    type,
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
  if (item.reporterId !== request.user.id) return response.status(403).json({ message: 'You can only edit your own report.' })
  const { title, type, description, location, date, image } = request.body
  if (typeof title === 'string' && title.trim()) item.title = title.trim()
  if (type === 'lost' || type === 'found') item.type = type
  if (typeof description === 'string' && description.trim()) item.description = description.trim()
  if (typeof location === 'string' && location.trim()) item.location = location.trim()
  if (typeof date === 'string') item.date = date
  if (typeof image === 'string') item.image = image.trim()
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
  const requests = [...(data.maintenanceRequests || [])].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
  response.json({ requests })
})

app.get('/api/maintenance/my', requireAuth, (request, response) => {
  const data = request.data
  const requests = (data.maintenanceRequests || []).filter(item => item.userId === request.user.id).sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
  response.json({ requests })
})

app.post('/api/maintenance', requireAuth, async (request, response) => {
  const { title, category = 'Electrical', location = '', description = '', image = '' } = request.body
  if (typeof title !== 'string' || !title.trim()) return response.status(400).json({ message: 'Issue title is required.' })
  if (typeof location !== 'string' || !location.trim()) return response.status(400).json({ message: 'Location is required.' })
  if (typeof description !== 'string' || !description.trim()) return response.status(400).json({ message: 'Describe the issue clearly.' })
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
  requestEntry.status = status
  if (status !== 'Resolved') delete requestEntry.confirmedByUserAt
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
  const { resourceId = '', userId = '', rating = 5, comment = '' } = request.body
  if (typeof rating !== 'number' || rating < 1 || rating > 5) return response.status(400).json({ message: 'Rating must be between 1 and 5.' })
  const data = request.data
  const review = {
    id: `review-${randomUUID()}`,
    resourceId: String(resourceId || 'campusloop'),
    userId: String(userId || request.user.id),
    reviewerId: request.user.id,
    reviewerName: request.user.name,
    rating,
    comment: typeof comment === 'string' ? comment.trim() : '',
    createdAt: new Date().toISOString(),
  }
  data.reviews.push(review)
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
  response.status(error.status || 500).json({ message: error.status ? error.message : 'The server could not complete the request.' })
})

async function startServer() {
  if (!mongoUri) throw new Error('MONGODB_URI is required. Configure the MongoDB Atlas connection string in your .env file.')
  if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET is required and must contain at least 32 characters.')

  mongoClient = new MongoClient(mongoUri)
  await mongoClient.connect()
  database = mongoClient.db(databaseName)
  stateCollection = database.collection('_campusloop_state')
  await initializeDatabase()
  await database.collection('users').createIndex({ email: 1 }, { unique: true })
  app.listen(port, () => console.log(`CampusLoop API connected to MongoDB database "${databaseName}" on http://localhost:${port}`))
}

startServer().catch(async error => {
  console.error('CampusLoop failed to start:', error.message)
  if (mongoClient) await mongoClient.close()
  process.exitCode = 1
})
