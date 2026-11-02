import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import { motion, useInView } from 'framer-motion'
import * as THREE from 'three'
import WAVES from 'vanta/dist/vanta.waves.min.js'
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  Camera,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  GraduationCap,
  Heart,
  ImagePlus,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  PackageOpen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Ticket,
  UserRound,
  UsersRound,
  X,
  Zap,
} from 'lucide-react'
import './styles.css'

const initialListings = [
  { id: 1, title: 'Casio fx-991EX Calculator', category: 'Study gear', condition: 'Like new', mode: 'Borrow', price: 'Free', owner: 'Nisha Rao', initials: 'NR', color: 'coral', image: 'https://images.unsplash.com/photo-1616628182503-47a55d7f2d91?auto=format&fit=crop&w=900&q=80', saved: false },
  { id: 2, title: 'Introduction to Algorithms', category: 'Books', condition: 'Good', mode: 'Exchange', price: 'For a book', owner: 'Arjun Mehta', initials: 'AM', color: 'blue', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80', saved: true },
  { id: 3, title: 'Sony WH-1000XM4 Headphones', category: 'Electronics', condition: 'Excellent', mode: 'Borrow', price: 'Free', owner: 'Diya Shah', initials: 'DS', color: 'green', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80', saved: false },
  { id: 4, title: 'IKEA Desk Lamp', category: 'Room & living', condition: 'Good', mode: 'Give away', price: 'Free', owner: 'Kabir Singh', initials: 'KS', color: 'yellow', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80', saved: false },
]
function viewFromLocation() {
  const view = window.location.hash.slice(1)
  return validViews.has(view) ? view : 'overview'
}

async function processImageFile(file) {
  if (!file) throw new Error('Choose an image first.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    throw new Error('Choose a JPEG, PNG, or WebP image under 8 MB.')
  }
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('The selected image could not be read.'))
    reader.readAsDataURL(file)
  })
  const image = await new Promise((resolve, reject) => {
    const loadedImage = new Image()
    loadedImage.onload = () => resolve(loadedImage)
    loadedImage.onerror = () => reject(new Error('The selected image could not be opened.'))
    loadedImage.src = source
  })
  const scale = Math.min(1, 1000 / image.width, 800 / image.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image processing is not available in this browser.')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const resizedImage = canvas.toDataURL('image/jpeg', .76)
  if (resizedImage.length > 3 * 1024 * 1024) throw new Error('That image is still too large after resizing. Choose a smaller photo.')
  return resizedImage
}

function ImageUploadControls({ image, onChange, onError }) {
  const selectImage = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      onChange(await processImageFile(file))
      onError('')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'The selected image could not be processed.')
    }
  }
  return <div className="image-upload-controls">
    <label className="image-picker"><ImagePlus size={17} /><span>{image ? 'Change image' : 'Upload image'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} /></label>
    <label className="image-picker"><Camera size={17} /><span>Take a photo</span><input type="file" accept="image/*" capture="environment" onChange={selectImage} /></label>
    {image && <button type="button" className="image-search-button" onClick={() => { onChange(''); onError('') }}>Remove image</button>}
    {image && <img className="request-image-preview" src={image} alt="Selected image preview" />}
  </div>
}

const events = [
  { id: 'event-yrc-blood-donation', month: 'TBA', day: '—', title: 'Blood Donation Camp', type: 'Community service', time: 'To be announced', place: 'Student Activity Centre', host: 'Youth Red Cross (YRC)', color: 'mint', description: 'A campus blood donation drive organized by YRC.' },
  { id: 'event-painting-face-painting', month: 'TBA', day: '—', title: 'Face Painting', type: 'Arts & culture', time: 'To be announced', place: 'Student Activity Centre', host: 'Painting and Animation', color: 'green', description: 'A creative face-painting session hosted by Painting and Animation.' },
  { id: 'event-student-council-diwali', month: 'TBA', day: '—', title: 'Diwali Celebration', type: 'Festival', time: 'To be announced', place: 'NIT Warangal Stadium', host: 'Student Council', color: 'orange', description: 'A campus Diwali celebration organized by the Student Council at the stadium.' },
  { id: 'event-athletics-badminton', month: 'TBA', day: '—', title: 'Intramural Badminton', type: 'Sports', time: 'To be announced', place: 'Indoor Badminton Courts', host: 'Athletics', color: 'blue', description: 'An Athletics-organized intramural badminton event for students.' },
]

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'exchange', label: 'Resource exchange', icon: PackageOpen },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'events', label: 'Events calendar', icon: CalendarDays },
  { id: 'lost-found', label: 'Lost & Found', icon: Compass },
  { id: 'maintenance', label: 'Maintenance', icon: Settings },
  { id: 'profile', label: 'My profile', icon: UserRound },
  { id: 'admin', label: 'Admin dashboard', icon: ShieldCheck, adminOnly: true },
]
const validViews = new Set(navItems.map(item => item.id))

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const PREVIEW_MODE_KEY = 'campusloop-ui-preview'
const previewProfile = {
  id: 'preview-student',
  name: 'Maya Patel',
  email: 'maya.patel@student.nitw.ac.in',
  role: 'admin',
  branch: 'Computer Science',
  year: '3',
  hostel: 'Godavari',
  phone: '+91 98765 43210',
  createdAt: '2025-08-15T00:00:00.000Z',
}
const previewListings = [
  { id: 'preview-listing-1', title: 'Graphing calculator for tomorrow’s exam', category: 'Study gear', owner: 'Aarav Sharma', initials: 'AS', color: 'green', description: 'Looking to borrow one for the afternoon. I can pick it up near the library.', postType: 'wanted', status: 'Open', createdAt: '2026-10-28T10:00:00.000Z' },
  { id: 'preview-listing-2', title: 'Desk lamp available to borrow', category: 'Room & living', owner: 'Maya Patel', ownerId: previewProfile.id, initials: 'MP', color: 'coral', description: 'Available this week. Works well and includes the bulb.', postType: 'resource', status: 'Open', mode: 'Borrow', condition: 'Good', createdAt: '2026-10-25T10:00:00.000Z' },
  { id: 'preview-listing-3', title: 'Second-year engineering textbooks', category: 'Books', owner: 'Rohan Kumar', initials: 'RK', color: 'blue', description: 'Looking for a few recommended texts for this semester.', postType: 'wanted', status: 'Open', createdAt: '2026-10-22T10:00:00.000Z' },
]
const previewEvents = [
  { id: 'preview-event-1', title: 'Campus Open Mic', type: 'Arts & culture', description: 'An evening of music and performances from the campus community.', date: '2026-11-22', time: '6:00 PM', place: 'Student Activity Centre', host: 'Student Council', spots: 40, capacity: 40 },
  { id: 'preview-event-2', title: 'Weekend Badminton', type: 'Sports', description: 'Friendly doubles games open to students of all experience levels.', date: '2026-11-28', time: '9:00 AM', place: 'Indoor Badminton Courts', host: 'Athletics', spots: 24, capacity: 24 },
]
const previewClubs = [
  { id: 'preview-club-1', name: 'Student Council', isMember: true, requestPending: false, pendingRequests: [], canApproveRequests: false },
  { id: 'preview-club-2', name: 'Photography Club', isMember: false, requestPending: false, pendingRequests: [], canApproveRequests: false },
]
const previewAnnouncements = [
  { id: 'preview-announcement-1', title: 'Library hours extended during exams', category: 'Academic', content: 'The central library will remain open until midnight this week. Please carry your student ID when entering after 8 PM.', author: 'Academic Office', createdAt: '2026-10-29T10:00:00.000Z', pinned: true },
  { id: 'preview-announcement-2', title: 'Student Council meeting this Friday', category: 'Club', content: 'Students are welcome to join the open meeting at the Student Activity Centre.', author: 'Student Council', createdAt: '2026-10-27T10:00:00.000Z', pinned: false },
]
const previewLostFoundItems = [
  { id: 'preview-lost-found-1', title: 'Blue water bottle', type: 'found', category: 'Accessories', description: 'Found near the library entrance. Has a small sticker on the side.', location: 'Central Library', date: '2026-10-29', status: 'open', userId: 'preview-other-student', userName: 'Aarav Sharma', createdAt: '2026-10-29T10:00:00.000Z' },
]
const previewMaintenanceRequests = [
  { id: 'preview-maintenance-1', title: 'Study room light needs replacing', category: 'Electrical', location: 'Library, second floor', description: 'One of the lights in the group study room is not working.', status: 'In Progress', userId: previewProfile.id, userName: previewProfile.name, createdAt: '2026-10-28T10:00:00.000Z' },
]
const previewAdminStats = { students: 128, resources: 34, pendingResourceRequests: 3, openLostFound: 2, upcomingEvents: 2, unresolvedMaintenance: 4, announcements: 6, openWantedRequests: 8 }
const previewAdminUsers = [
  previewProfile,
  { id: 'preview-student-2', name: 'Aarav Sharma', email: 'aarav.sharma@student.nitw.ac.in', role: 'student', branch: 'Electrical Engineering', year: '2' },
  { id: 'preview-student-3', name: 'Rohan Kumar', email: 'rohan.kumar@student.nitw.ac.in', role: 'student', branch: 'Mechanical Engineering', year: '3' },
]

async function apiFetch(path, options = {}) {
  if (sessionStorage.getItem(PREVIEW_MODE_KEY) === 'true') {
    throw new Error('This is a UI preview. Changes are not saved.')
  }
  const retryableRead = !options.method || options.method.toUpperCase() === 'GET'
  let lastError
  for (let attempt = 0; attempt < (retryableRead ? 2 : 1); attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const token = sessionStorage.getItem('campusloop-token')
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        signal: options.signal || controller.signal,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
      })
      const body = await response.json().catch(() => ({}))
      if (response.status === 401 || (path === '/auth/me' && response.status === 403)) {
        sessionStorage.removeItem('campusloop-token')
        window.dispatchEvent(new CustomEvent('campusloop-session-expired', { detail: { message: body.message || 'Your session ended. Please sign in again.' } }))
      }
      if (!response.ok) {
        const error = new Error(body.message || `Request failed (${response.status}). Please try again.`)
        error.status = response.status
        if (response.status === 409 && body.message?.startsWith('Campus data changed in another session')) {
          window.dispatchEvent(new Event('campusloop-stale-data'))
        }
        if (retryableRead && response.status >= 500 && attempt === 0) {
          lastError = error
          await new Promise(resolve => setTimeout(resolve, 350))
          continue
        }
        throw error
      }
      window.dispatchEvent(new CustomEvent('campusloop-api-status', { detail: { available: true } }))
      return body
    } catch (error) {
      lastError = error
      if (error.name === 'AbortError') lastError = new Error('The server took too long to respond. Check your connection and retry.')
      if (error.name === 'TypeError') lastError = new Error('Cannot reach CampusLoop. Check that the API is running and your network is online.')
      if (retryableRead && attempt === 0 && (error.name === 'TypeError' || error.status >= 500 || error.name === 'AbortError')) {
        await new Promise(resolve => setTimeout(resolve, 350))
        continue
      }
      if (error.name === 'TypeError' || error.name === 'AbortError' || error.status >= 500) {
        window.dispatchEvent(new CustomEvent('campusloop-api-status', { detail: { available: false } }))
      }
      throw lastError
    } finally {
      clearTimeout(timeout)
    }
  }
  throw lastError || new Error('The request could not be completed. Please retry.')
}

function App() {
  const previewMode = sessionStorage.getItem(PREVIEW_MODE_KEY) === 'true'
  const [theme, setTheme] = useState(() => localStorage.getItem('campusloop-theme') === 'dark' ? 'dark' : 'light')
  const [activeView, setActiveView] = useState(viewFromLocation)
  const [listings, setListings] = useState(previewMode ? previewListings : [])
  const [events, setEvents] = useState(previewMode ? previewEvents : [])
  const [clubs, setClubs] = useState(previewMode ? previewClubs : [])
  const [registered, setRegistered] = useState([])
  const [offers, setOffers] = useState([])
  const [resourceRequests, setResourceRequests] = useState([])
  const [adminStats, setAdminStats] = useState(previewMode ? previewAdminStats : null)
  const [adminUsers, setAdminUsers] = useState(previewMode ? previewAdminUsers : [])
  const [announcements, setAnnouncements] = useState(previewMode ? previewAnnouncements : [])
  const [lostFoundItems, setLostFoundItems] = useState(previewMode ? previewLostFoundItems : [])
  const [maintenanceRequests, setMaintenanceRequests] = useState(previewMode ? previewMaintenanceRequests : [])
  const [profile, setProfile] = useState(previewMode ? previewProfile : null)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showEventCreate, setShowEventCreate] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)
  const [listingToEdit, setListingToEdit] = useState(null)
  const [selectedResource, setSelectedResource] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(!previewMode)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [apiUnavailable, setApiUnavailable] = useState(false)
  const [authNotice, setAuthNotice] = useState('')
  const registrationInProgress = useRef(new Set())

  useEffect(() => {
    localStorage.setItem('campusloop-theme', theme)
  }, [theme])

  useEffect(() => {
    const expireSession = event => {
      setProfile(null)
      setLoadError('')
      setAuthNotice(event.detail?.message || 'Your session ended. Please sign in again.')
    }
    window.addEventListener('campusloop-session-expired', expireSession)
    return () => window.removeEventListener('campusloop-session-expired', expireSession)
  }, [])
  useEffect(() => {
    const onApiStatus = event => setApiUnavailable(!event.detail.available)
    window.addEventListener('campusloop-api-status', onApiStatus)
    return () => window.removeEventListener('campusloop-api-status', onApiStatus)
  }, [])
  useEffect(() => {
    const reloadStaleData = () => {
      setToast({ message: 'Campus data changed in another session. The latest data is loading; retry your action afterward.', icon: CircleHelp })
      refreshApplication()
    }
    window.addEventListener('campusloop-stale-data', reloadStaleData)
    return () => window.removeEventListener('campusloop-stale-data', reloadStaleData)
  }, [])

  useEffect(() => {
    const restoreView = () => setActiveView(viewFromLocation())
    window.addEventListener('hashchange', restoreView)
    return () => window.removeEventListener('hashchange', restoreView)
  }, [])

  useEffect(() => {
    async function loadApplication() {
      try {
        if (previewMode) return
        const token = sessionStorage.getItem('campusloop-token')
        if (!token) return
        const auth = await apiFetch('/auth/me')
        const [listingData, eventData, offerData, clubData, announcementData, lostFoundData, maintenanceData, requestData] = await Promise.all([
          apiFetch('/listings'),
          apiFetch('/events'),
          apiFetch('/offers/my'),
          apiFetch('/clubs'),
          apiFetch('/announcements'),
          apiFetch('/lost-found'),
          apiFetch('/maintenance'),
          apiFetch('/requests/my'),
        ])
        setProfile(auth.user)
        setListings(listingData.listings)
        setEvents(eventData.events)
        setRegistered(eventData.events.filter(event => event.registered).map(event => event.id))
        setOffers(offerData.offers)
        setClubs(clubData.clubs)
        setAnnouncements(announcementData.announcements)
        setLostFoundItems(lostFoundData.items)
        setMaintenanceRequests(maintenanceData.requests)
        setResourceRequests(requestData.requests)
        if (auth.user.role === 'admin') {
          const [dashboardData, userData] = await Promise.all([apiFetch('/admin/dashboard'), apiFetch('/admin/users')])
          setAdminStats(dashboardData.stats)
          setAdminUsers(userData.users)
        }
      } catch (error) {
        if (sessionStorage.getItem('campusloop-token')) setLoadError(error.message)
      } finally {
        setLoading(false)
      }
    }
    loadApplication()
  }, [loadAttempt, previewMode])

  useEffect(() => {
    if (!profile || previewMode) return undefined
    let syncing = false
    const syncSharedData = async () => {
      if (syncing || !sessionStorage.getItem('campusloop-token')) return
      syncing = true
      try {
        const [listingData, lostFoundData, requestData, offerData] = await Promise.all([
          apiFetch('/listings'),
          apiFetch('/lost-found'),
          apiFetch('/requests/my'),
          apiFetch('/offers/my'),
        ])
        setListings(listingData.listings)
        setLostFoundItems(lostFoundData.items)
        setResourceRequests(requestData.requests)
        setOffers(offerData.offers)
      } catch {
        // apiFetch reports connection failures through the shared connection banner.
      } finally {
        syncing = false
      }
    }
    const onStorage = event => {
      if (event.key === 'campusloop-data-updated') syncSharedData()
    }
    const onFocus = () => syncSharedData()
    const interval = window.setInterval(syncSharedData, 8000)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [profile, previewMode])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (activeView !== 'profile' || !profile || previewMode) return undefined
    let cancelled = false
    apiFetch('/offers/my')
      .then(result => { if (!cancelled) setOffers(result.offers) })
      .catch(error => { if (!cancelled) notify(error.message, CircleHelp) })
    return () => { cancelled = true }
  }, [activeView, profile, previewMode])

  const notify = (message, icon = Check) => setToast({ message, icon })
  const toggleTheme = () => setTheme(current => current === 'dark' ? 'light' : 'dark')
  const navigate = (view) => {
    if (!validViews.has(view)) return
    if (viewFromLocation() !== view) window.history.pushState(null, '', `#${view}`)
    setActiveView(view)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const announceSharedDataChange = () => {
    try {
      localStorage.setItem('campusloop-data-updated', `${Date.now()}-${Math.random()}`)
    } catch (error) {
      notify('This browser could not notify other tabs; they will refresh campus updates shortly.', CircleHelp)
    }
  }
  const toggleSave = async (id) => {
    try {
      const result = await apiFetch(`/listings/${id}/save`, { method: 'PATCH' })
      setListings(items => items.map(item => item.id === id ? { ...item, saved: result.saved } : item))
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const toggleRegistration = async (id) => {
    if (registrationInProgress.current.has(id)) return
    registrationInProgress.current.add(id)
    const joined = registered.includes(id)
    try {
      const result = await apiFetch(`/events/${id}/registration`, { method: 'POST' })
      setRegistered(items => result.registered ? [...items, id] : items.filter(item => item !== id))
      setEvents(items => items.map(event => event.id === id ? { ...event, registered: result.registered, registrationCount: result.registrationCount, spots: result.spots } : event))
      notify(joined ? 'Registration cancelled' : 'You’re on the guest list', joined ? CalendarDays : Ticket)
    } catch (error) { notify(error.message, CircleHelp) }
    finally { registrationInProgress.current.delete(id) }
  }
  const addListing = async (listing) => {
    try {
      const result = await apiFetch('/listings', { method: 'POST', body: JSON.stringify(listing) })
      setListings(items => [result.listing, ...items])
      announceSharedDataChange()
      setShowCreate(false)
      notify(listing.postType === 'resource' ? 'Your resource listing is live' : 'Your resource request is live', PackageOpen)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const deleteListing = async (id) => {
    const listing = listings.find(item => item.id === id)
    if (!listing || !window.confirm(listing.postType === 'resource'
      ? `Delete "${listing.title}"? You must first resolve pending requests; completed exchange history will be preserved.`
      : `Delete "${listing.title}"? Related offers will also be removed.`)) return
    try {
      await apiFetch(`/listings/${id}`, { method: 'DELETE' })
      setListings(items => items.filter(item => item.id !== id))
      announceSharedDataChange()
      setOffers(items => items.filter(offer => offer.listingId !== id))
      await refreshResourceRequests()
      notify('Resource listing deleted', PackageOpen)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const updateListing = async (id, draft) => {
    try {
      const result = await apiFetch(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(draft) })
      setListings(items => items.map(item => item.id === id ? result.listing : item))
      announceSharedDataChange()
      setListingToEdit(null)
      notify('Resource listing updated', PackageOpen)
      return true
    } catch (error) { notify(error.message, CircleHelp); return false }
  }
  const sendOffer = async (id, message) => {
    try {
      await apiFetch(`/listings/${id}/offers`, { method: 'POST', body: JSON.stringify({ message }) })
      announceSharedDataChange()
      setSelectedListing(null)
      notify('Your message was sent to the student who posted the request', MessageCircle)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const closeListing = async (id) => {
    try {
      await apiFetch(`/listings/${id}/close`, { method: 'PATCH' })
      setListings(items => items.map(item => item.id === id ? { ...item, status: 'Fulfilled' } : item))
      announceSharedDataChange()
      notify('Request closed — marked as received', Check)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const refreshResourceRequests = async () => {
    const result = await apiFetch('/requests/my')
    setResourceRequests(result.requests)
  }
  const requestResource = async (id, message) => {
    try {
      await apiFetch(`/listings/${id}/requests`, { method: 'POST', body: JSON.stringify({ message }) })
      await refreshResourceRequests()
      announceSharedDataChange()
      setSelectedResource(null)
      notify('Request sent to the resource owner', PackageOpen)
      return true
    } catch (error) { notify(error.message, CircleHelp); return false }
  }
  const updateResourceRequest = async (id, action) => {
    try {
      const result = await apiFetch(`/requests/${id}/${action}`, { method: 'PUT' })
      setResourceRequests(items => items.map(item => item.id === id ? { ...item, ...result.request } : item))
      if (result.listing) setListings(items => items.map(item => item.id === result.listing.id ? { ...item, ...result.listing } : item))
      announceSharedDataChange()
      notify(action === 'approve' ? 'Resource request approved' : action === 'reject' ? 'Resource request declined' : 'Resource marked as returned', PackageOpen)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const submitReview = async (id, rating, comment) => {
    try {
      await apiFetch('/reviews', { method: 'POST', body: JSON.stringify({ requestId: id, rating, comment }) })
      await refreshResourceRequests()
      notify('Thanks for reviewing this exchange', Star)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const refreshApplication = () => {
    setLoadError('')
    setLoading(true)
    setLoadAttempt(attempt => attempt + 1)
  }
  const setUserSuspension = async (userId, suspended) => {
    try {
      const result = await apiFetch(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ suspended }) })
      setAdminUsers(users => users.map(user => user.id === userId ? result.user : user))
      const stats = await apiFetch('/admin/dashboard')
      setAdminStats(stats.stats)
      notify(suspended ? 'Student account suspended' : 'Student account restored', ShieldCheck)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const assignMaintenance = async (id, userId) => {
    try {
      const result = await apiFetch(`/maintenance/${id}/assign`, { method: 'PUT', body: JSON.stringify({ userId }) })
      setMaintenanceRequests(items => items.map(item => item.id === id ? result.request : item))
      notify(userId ? 'Maintenance request assigned' : 'Maintenance assignment cleared', Settings)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const updateLostFound = async (id, draft) => {
    try {
      const result = await apiFetch(`/lost-found/${id}`, { method: 'PUT', body: JSON.stringify(draft) })
      setLostFoundItems(items => items.map(item => item.id === id ? { ...item, ...result.item } : item))
      announceSharedDataChange()
      notify('Lost and found report updated', Compass)
      return true
    } catch (error) { notify(error.message, CircleHelp); return false }
  }
  const updateProfile = async (draft) => {
    try {
      const result = await apiFetch('/profile', { method: 'PATCH', body: JSON.stringify(draft) })
      setProfile(result.user)
      notify('Profile updated', UserRound)
      return true
    } catch (error) { notify(error.message, CircleHelp) }
    return false
  }
  const refreshClubs = async () => {
    const result = await apiFetch('/clubs')
    setClubs(result.clubs)
  }
  const requestClubMembership = async (clubId) => {
    try {
      await apiFetch(`/clubs/${clubId}/join-requests`, { method: 'POST' })
      await refreshClubs()
      notify('Membership request sent', UsersRound)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const approveClubMembership = async (clubId, requestId) => {
    try {
      await apiFetch(`/clubs/${clubId}/join-requests/${requestId}/approve`, { method: 'POST' })
      await refreshClubs()
      notify('Student added to the club', UsersRound)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const createEvent = async (eventDraft) => {
    try {
      const result = await apiFetch('/events', { method: 'POST', body: JSON.stringify({ ...eventDraft, capacity: eventDraft.capacity ? Number(eventDraft.capacity) : 0 }) })
      setEvents(items => [...items, result.event])
      notify('Campus event posted', CalendarDays)
      return true
    } catch (error) { notify(error.message, CircleHelp); return false }
  }
  const removeEvent = async (id) => {
    try {
      await apiFetch(`/events/${id}`, { method: 'DELETE' })
      setEvents(items => items.filter(event => event.id !== id))
      setRegistered(items => items.filter(eventId => eventId !== id))
      notify('Past campus event removed', CalendarDays)
    } catch (error) { notify(error.message, CircleHelp) }
  }

  if (loading) return <div className="app-loading"><div className="brand-mark"><Leaf size={17} /></div><strong>Opening CampusLoop</strong><span>Connecting to your campus space...</span></div>
  if (loadError) return <div className="app-loading"><div className="brand-mark"><CircleHelp size={17} /></div><strong>CampusLoop could not connect</strong><span>{loadError}</span><small>Check that the API is running, MongoDB Atlas is reachable, and your network is online.</small><button className="button button-dark" onClick={refreshApplication}>Retry connection</button></div>
  if (!profile) return <LoginScreen notice={authNotice} theme={theme} onToggleTheme={toggleTheme} onPreview={() => { sessionStorage.setItem(PREVIEW_MODE_KEY, 'true'); window.location.reload() }} />

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Leaf size={17} strokeWidth={2.5} /></div><span>campus<span>loop</span></span></div>
        <div className="campus-switcher"><div className="campus-avatar">NITW</div><div><strong>NITW</strong><span>Student space</span></div><ChevronRight size={15} /></div>
        <p className="nav-label">Workspace</p>
        <nav>{navItems.filter(item => !item.adminOnly || profile.role === 'admin').map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activeView === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={18} /><span>{label}</span></button>)}</nav>
        <div className="sidebar-spacer" />
        {activeView !== 'exchange' && <div className="sidebar-note"><Leaf size={16} /><strong>Make campus yours.</strong><span>Small exchanges make a bigger place feel close.</span></div>}
        <button className="nav-item muted" onClick={() => navigate('profile')}><Settings size={18} /><span>Settings</span></button>
        <div className="sidebar-profile"><div className="avatar avatar-coral">{profile.name.split(' ').map(part => part[0]).join('')}</div><div><strong>{profile.name}</strong><span>{profile.role === 'admin' ? 'Administrator account' : 'Student account'}</span></div><button onClick={() => setShowAuth(true)} aria-label="Open account menu"><LogOut size={16} /></button></div>
      </aside>

      <main className="main-content">
        {previewMode && <div className="preview-banner" role="status"><strong>UI preview</strong><span>Sample content only. Changes are not saved.</span><button type="button" onClick={() => { sessionStorage.removeItem(PREVIEW_MODE_KEY); window.location.reload() }}>Exit preview</button></div>}
        {apiUnavailable && <div className="connection-banner" role="status"><CircleHelp size={17} /><span>CampusLoop is having trouble reaching the server. Your changes may not have been saved.</span><button type="button" onClick={refreshApplication}>Reconnect</button></div>}
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(value => !value)} aria-label="Toggle navigation"><Menu size={20} /></button>
          <div className="breadcrumb"><span>NITW</span><ChevronRight size={14} /><strong>{navItems.find(item => item.id === activeView)?.label || 'Overview'}</strong></div>
          <div className="top-actions"><div className="search-mini"><Search size={16} /><input placeholder="Search campusloop" onChange={(event) => event.target.value && navigate('exchange')} /></div><button type="button" className="theme-toggle-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications"><Bell size={18} /><i /></button><button className="avatar avatar-coral top-avatar" onClick={() => navigate('profile')}>{profile.name.split(' ').map(part => part[0]).join('')}</button></div>
          {showNotifications && <div className="notification-pop"><div className="pop-header"><strong>Notifications</strong><span>2 new</span></div><div className="notification-row"><div className="notification-dot green" /><span><strong>Meera</strong> saved your calculator listing.<small>8 minutes ago</small></span></div><div className="notification-row"><div className="notification-dot orange" /><span><strong>Open mic</strong> is almost full.<small>Yesterday</small></span></div></div>}
        </header>

        <div className="page-wrap">
          {activeView === 'overview' && <Overview navigate={navigate} />}
          {activeView === 'exchange' && <Exchange listings={listings} isAdmin={profile.role === 'admin'} onSave={toggleSave} onCreate={() => setShowCreate(true)} onOffer={setSelectedListing} onDelete={deleteListing} onEdit={setListingToEdit} onRequest={setSelectedResource} currentUserId={profile.id} />}
          {activeView === 'announcements' && <AnnouncementsPage announcements={announcements} isAdmin={profile.role === 'admin'} onCreate={async draft => {
            try {
              const result = await apiFetch('/announcements', { method: 'POST', body: JSON.stringify(draft) })
              setAnnouncements(items => [result.announcement, ...items])
              notify('Announcement posted', Bell)
              return true
            } catch (error) { notify(error.message, CircleHelp); return false }
          }} onUpdate={async (id, draft) => {
            try {
              const result = await apiFetch(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(draft) })
              setAnnouncements(items => items.map(item => item.id === id ? result.announcement : item))
              notify('Announcement updated', Bell)
              return true
            } catch (error) { notify(error.message, CircleHelp); return false }
          }} onDelete={async id => {
            try {
              await apiFetch(`/announcements/${id}`, { method: 'DELETE' })
              setAnnouncements(items => items.filter(item => item.id !== id))
              notify('Announcement removed', Bell)
            } catch (error) { notify(error.message, CircleHelp) }
          }} />}
          {activeView === 'events' && <Events events={events} registered={registered} clubs={clubs} isAdmin={profile.role === 'admin'} onRegister={toggleRegistration} onOpen={event => setSelectedEvent(events.find(item => item.id === event.id) || event)} onCreate={() => setShowEventCreate(true)} onRemove={removeEvent} />}
          {activeView === 'lost-found' && <LostFoundPage items={lostFoundItems} currentUserId={profile.id} isAdmin={profile.role === 'admin'} onUpdate={updateLostFound} onCreate={async (draft) => {
            try {
              const result = await apiFetch('/lost-found', { method: 'POST', body: JSON.stringify(draft) })
              setLostFoundItems(items => [result.item, ...items])
              announceSharedDataChange()
              notify('Lost or found item reported', Compass)
              return true
            } catch (error) { notify(error.message, CircleHelp); return false }
          }} onResolve={async (id) => {
            try {
              const result = await apiFetch(`/lost-found/${id}/resolve`, { method: 'PUT' })
              setLostFoundItems(items => items.map(item => item.id === id ? { ...item, status: result.item.status } : item))
              announceSharedDataChange()
              notify('Report marked as resolved', Check)
            } catch (error) { notify(error.message, CircleHelp) }
          }} onDelete={async (id) => {
            try {
              await apiFetch(`/lost-found/${id}`, { method: 'DELETE' })
              setLostFoundItems(items => items.filter(item => item.id !== id))
              announceSharedDataChange()
              notify('Report removed', Compass)
            } catch (error) { notify(error.message, CircleHelp) }
          }} />}
          {activeView === 'maintenance' && <MaintenancePage requests={maintenanceRequests} students={adminUsers.filter(user => user.role === 'student' && !user.suspendedAt)} currentUserId={profile.id} isAdmin={profile.role === 'admin'} onAssign={assignMaintenance} onCreate={async (draft) => {
            try {
              const result = await apiFetch('/maintenance', { method: 'POST', body: JSON.stringify(draft) })
              setMaintenanceRequests(items => [result.request, ...items])
              announceSharedDataChange()
              notify('Maintenance request submitted', Settings)
              return true
            } catch (error) { notify(error.message, CircleHelp); return false }
          }} onUpdateStatus={async (id, status) => {
            try {
              const result = await apiFetch(`/maintenance/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
              setMaintenanceRequests(items => items.map(item => item.id === id ? { ...item, ...result.request } : item))
              notify('Status updated', Check)
            } catch (error) { notify(error.message, CircleHelp) }
          }} onConfirmResolved={async (id) => {
            try {
              const result = await apiFetch(`/maintenance/${id}/confirm`, { method: 'PUT' })
              setMaintenanceRequests(items => items.map(item => item.id === id ? { ...item, confirmedByUserAt: result.request.confirmedByUserAt } : item))
              notify('Resolution confirmed', Check)
            } catch (error) { notify(error.message, CircleHelp) }
          }} />}
          {activeView === 'profile' && <Profile profile={profile} onSave={updateProfile} clubs={clubs} onRequestClub={requestClubMembership} onApproveClubRequest={approveClubMembership} listings={listings} registered={registered} offers={offers} navigate={navigate} />}
          {activeView === 'profile' && <RequestHistory listings={listings.filter(item => item.ownerId === profile.id && item.postType === 'wanted')} offers={offers} onCloseRequest={closeListing} onDeleteRequest={deleteListing} />}
          {activeView === 'profile' && <ResourceRequestHistory requests={resourceRequests} currentUserId={profile.id} onAction={updateResourceRequest} onReview={submitReview} />}
          {activeView === 'admin' && profile.role === 'admin' && <AdminDashboard stats={adminStats} users={adminUsers} onSuspend={setUserSuspension} onRefresh={refreshApplication} />}
        </div>
      </main>

      {showCreate && <CreateListing onClose={() => setShowCreate(false)} onSubmit={addListing} />}
      {listingToEdit && <CreateListing listing={listingToEdit} onClose={() => setListingToEdit(null)} onSubmit={draft => updateListing(listingToEdit.id, draft)} />}
      {showEventCreate && <CreateEventModal clubs={clubs} isAdmin={profile.role === 'admin'} onClose={() => setShowEventCreate(false)} onSubmit={createEvent} />}
      {selectedListing && <OfferModal listing={selectedListing} onClose={() => setSelectedListing(null)} onSubmit={message => sendOffer(selectedListing.id, message)} />}
      {selectedResource && <ResourceRequestModal listing={selectedResource} onClose={() => setSelectedResource(null)} onSubmit={message => requestResource(selectedResource.id, message)} />}
      {showAuth && <AuthModal profile={profile} onClose={() => setShowAuth(false)} onSignedOut={() => { sessionStorage.removeItem('campusloop-token'); sessionStorage.removeItem(PREVIEW_MODE_KEY); window.location.reload() }} />}
      {selectedEvent && <EventModal event={events.find(item => item.id === selectedEvent.id) || selectedEvent} registered={registered.includes(selectedEvent.id)} canViewGuestList={profile.role === 'admin' || clubs.some(club => club.id === selectedEvent.clubId && club.isMember)} onClose={() => setSelectedEvent(null)} onRegister={() => { toggleRegistration(selectedEvent.id); setSelectedEvent(null) }} />}
      {toast && <div className="toast"><toast.icon size={17} /><span>{toast.message}</span></div>}
    </div>
  )
}

function PageNavigation({ activeView, isOpen, onToggle, onNavigate, onSignOut, isAdmin }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const closeOnEscape = event => {
      if (event.key === 'Escape') onToggle()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onToggle])

  return createPortal(
    <div className="page-navigation">
      <button
        className="page-navigation-toggle"
        type="button"
        aria-label={isOpen ? 'Close page navigation' : 'Open page navigation'}
        aria-expanded={isOpen}
        aria-controls="page-navigation-menu"
        onClick={onToggle}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav id="page-navigation-menu" className={`page-navigation-menu ${isOpen ? 'is-open' : ''}`} aria-label="CampusLoop pages" aria-hidden={!isOpen}>
        {navItems.filter(item => !item.adminOnly || isAdmin).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={activeView === id ? 'is-active' : ''}
            aria-current={activeView === id ? 'page' : undefined}
            tabIndex={isOpen ? 0 : -1}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
        <button
          type="button"
          className="page-navigation-signout"
          tabIndex={isOpen ? 0 : -1}
          onClick={onSignOut}
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </nav>
    </div>,
    document.body,
  )
}

function VantaBackground() {
  const container = useRef(null)
  const effect = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !container.current) return undefined
    const createWaves = WAVES.default || WAVES
    effect.current = createWaves({
      el: container.current,
      THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 1,
      color: 0x173a36,
      shininess: 34,
      waveHeight: 17,
      waveSpeed: 0.42,
      zoom: 0.72,
    })
    return () => {
      effect.current?.destroy()
      effect.current = null
    }
  }, [])

  return <div ref={container} className="vanta-background" aria-hidden="true" />
}

function SiteVideoBackground() {
  return <div className="site-video-background" aria-hidden="true"><video src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4" muted autoPlay loop playsInline preload="auto" /><div /></div>
}

function MainframeVideo() {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    let previousX = null
    let targetTime = null
    let seeking = false

    const clamp = value => Math.min(Math.max(value, 0), video.duration || 0)
    const seek = () => {
      if (!Number.isFinite(video.duration) || targetTime === null || seeking) return
      seeking = true
      video.currentTime = targetTime
    }
    const onMetadata = () => {
      targetTime = video.duration * 0.08
      video.currentTime = targetTime
    }
    const onSeeked = () => {
      seeking = false
      if (targetTime !== null && Math.abs(video.currentTime - targetTime) > 0.02) seek()
    }
    const onMouseMove = event => {
      if (!Number.isFinite(video.duration)) return
      if (previousX === null) { previousX = event.clientX; return }
      const delta = event.clientX - previousX
      previousX = event.clientX
      const baseTime = targetTime ?? video.currentTime
      targetTime = clamp(baseTime + (delta / window.innerWidth) * 0.8 * video.duration)
      seek()
    }

    video.addEventListener('loadedmetadata', onMetadata)
    video.addEventListener('seeked', onSeeked)
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      video.removeEventListener('loadedmetadata', onMetadata)
      video.removeEventListener('seeked', onSeeked)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return <video ref={videoRef} className="mainframe-video" muted playsInline preload="auto" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4" />
}

function LoginScreen({ notice = '', theme, onToggleTheme, onPreview }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', branch: '', year: '', hostel: '', phone: '', email: '', password: '', adminSetupKey: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await apiFetch(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) })
      sessionStorage.setItem('campusloop-token', result.token)
      window.location.reload()
    } catch (requestError) {
      setError(requestError.message)
      setSubmitting(false)
    }
  }
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))

  return <main className={`mainframe-login ${theme === 'dark' ? 'theme-dark' : ''}`}>
    <button type="button" className="theme-toggle-button login-theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
    <section className="mainframe-hero" id="top">
      <aside className="mainframe-auth" id="auth">
        <p className="mainframe-auth-kicker">CAMPUSLOOP / {mode === 'login' ? 'STUDENT ACCESS' : 'NEW MEMBER'}</p>
        <h2>{mode === 'login' ? 'Welcome back.' : 'Join the loop.'}</h2>
        <form onSubmit={submit}>{mode === 'register' && <><label>Full name<input value={form.name} onChange={event => update('name', event.target.value)} placeholder="Maya Patel" required /></label><label>Branch<input value={form.branch} onChange={event => update('branch', event.target.value)} placeholder="Computer Science" required /></label><label>Year<input value={form.year} onChange={event => update('year', event.target.value)} placeholder="e.g. 3" required /></label><label>Hostel (optional)<input value={form.hostel} onChange={event => update('hostel', event.target.value)} placeholder="e.g. Godavari" /></label><label>Phone number<input type="tel" autoComplete="tel" value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="+91 98765 43210" minLength={7} maxLength={25} pattern="\+?[0-9().\-\s]{7,25}" required /></label><label>Administrator setup key (if configured)<input type="password" autoComplete="off" value={form.adminSetupKey} onChange={event => update('adminSetupKey', event.target.value)} /></label></>}<label>Campus email<input type="email" value={form.email} onChange={event => update('email', event.target.value)} placeholder="you@student.nitw.ac.in" required /></label>{mode === 'register' && <small className="registration-email-hint">Use your @student.nitw.ac.in email address.</small>}<label>Password<input type="password" value={form.password} onChange={event => update('password', event.target.value)} minLength={6} required /></label>{notice && <p className="mainframe-form-error" role="alert">{notice}</p>}{error && <p className="mainframe-form-error" role="alert">{error}</p>}<button className="mainframe-submit" disabled={submitting}>{submitting ? 'Connecting...' : mode === 'login' ? 'Enter CampusLoop' : 'Create account'}<ArrowUpRight size={15} /></button></form>
        <button className="mainframe-switch" onClick={() => { const nextMode = mode === 'login' ? 'register' : 'login'; setMode(nextMode); setError(''); if (nextMode === 'register') update('email', '') }}>{mode === 'login' ? 'Create a student account' : 'Back to sign in'}</button>
        <button type="button" className="mainframe-preview" onClick={onPreview}>Preview the campus UI</button>
      </aside>
    </section>
  </main>
}

function PageIntro({ eyebrow, title, body, action, onAction }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{body && <p className="intro-copy">{body}</p>}</div>{action && <button className="button button-dark" onClick={onAction}>{action}<Plus size={16} /></button>}</div>
}

function AnnouncementsPage({ announcements, isAdmin, onCreate, onUpdate, onDelete }) {
  const [form, setForm] = useState({ title: '', category: 'General', content: '', pinned: false })
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [posting, setPosting] = useState(false)
  const categories = ['All', ...new Set((announcements || []).map(item => item.category || 'General'))]
  const visible = (announcements || []).filter(item =>
    (filter === 'All' || item.category === filter)
    && `${item.title} ${item.content} ${item.author || ''}`.toLowerCase().includes(query.toLowerCase()),
  )

  return <div className="module-shell">
    <PageIntro eyebrow="CAMPUS ANNOUNCEMENTS" title="Stay in the loop." body="Official notices, club updates, and important reminders for campus life." />
    <div className="module-toolbar">
      <div className="filter-pills">
        {categories.map(category => <button key={category} type="button" className={filter === category ? 'selected' : ''} onClick={() => setFilter(category)}>{category}</button>)}
      </div>
      <label className="search-field"><Search size={16} /><input aria-label="Search announcements" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search announcements" /></label>
    </div>
    <div className="details-grid">
      <div className="panel-block">
        <h3 className="panel-title">Latest notices</h3>
        <div className="stack-list">
          {visible.length === 0 ? <div className="empty-state"><strong>No announcements match</strong><span>Try another search, or post the first campus notice.</span></div> : visible.map(item => <article key={item.id} className="detail-card"><div className="detail-top"><span className="chip">{item.category || 'General'}</span>{item.pinned && <span className="chip accent">Pinned</span>}</div>{editing?.id === item.id ? <form className="announcement-edit-form" onSubmit={async event => { event.preventDefault(); if (posting) return; setPosting(true); try { if (await onUpdate(item.id, editing.draft)) setEditing(null) } finally { setPosting(false) } }}><label>Title<input maxLength={120} required value={editing.draft.title} onChange={event => setEditing(current => ({ ...current, draft: { ...current.draft, title: event.target.value } }))} /></label><label>Category<select value={editing.draft.category} onChange={event => setEditing(current => ({ ...current, draft: { ...current.draft, category: event.target.value } }))}><option>General</option><option>Academic</option><option>Administrative</option><option>Club</option><option>Health</option></select></label><label>Details<textarea rows="4" maxLength={3000} required value={editing.draft.content} onChange={event => setEditing(current => ({ ...current, draft: { ...current.draft, content: event.target.value } }))} /></label><label className="checkbox-row"><input type="checkbox" checked={editing.draft.pinned} onChange={event => setEditing(current => ({ ...current, draft: { ...current.draft, pinned: event.target.checked } }))} /> Pin this announcement</label><div className="modal-actions"><button type="button" className="button button-light" disabled={posting} onClick={() => setEditing(null)}>Cancel</button><button className="button button-dark" disabled={posting}>{posting ? 'Saving…' : 'Save changes'}</button></div></form> : <><h4>{item.title}</h4><p>{item.content}</p></>}<div className="detail-footer"><small>{item.author || 'Campus admin'}</small><small>{formatPostedDate(item.createdAt)}</small>{isAdmin && onDelete && <>{editing?.id !== item.id && <button type="button" className="text-button" onClick={() => setEditing({ id: item.id, draft: { title: item.title, category: item.category || 'General', content: item.content, pinned: Boolean(item.pinned) } })}>Edit</button>}<button type="button" className="text-button" onClick={() => onDelete(item.id)}>Delete</button></>}</div></article>)}
        </div>
      </div>
      {isAdmin && <form className="panel-block form-panel" onSubmit={async event => { event.preventDefault(); if (posting) return; setPosting(true); try { if (await onCreate(form)) setForm({ title: '', category: 'General', content: '', pinned: false }) } finally { setPosting(false) } }}>
        <h3 className="panel-title">Post a notice</h3>
        <label>Title<input maxLength={120} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Exam schedule update" required /></label>
        <label>Category<select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))}><option>General</option><option>Academic</option><option>Administrative</option><option>Club</option><option>Health</option></select></label>
        <label>Details<textarea maxLength={3000} value={form.content} onChange={event => setForm(current => ({ ...current, content: event.target.value }))} rows="5" placeholder="Share the update or reminder here..." required /></label>
        <label className="checkbox-row"><input type="checkbox" checked={form.pinned} onChange={event => setForm(current => ({ ...current, pinned: event.target.checked }))} /> Pin this announcement</label>
        <button type="submit" className="button button-dark" disabled={posting}>{posting ? 'Publishing…' : 'Publish'}</button>
      </form>}
    </div>
  </div>
}

function LostFoundPage({ items, currentUserId, isAdmin, onCreate, onUpdate, onResolve, onDelete }) {
  const [form, setForm] = useState({ title: '', type: 'lost', category: 'Other', description: '', location: '', date: '', image: '' })
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [posting, setPosting] = useState(false)
  const [imageError, setImageError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const visible = items.filter(item =>
    (filter === 'all' || item.type === filter)
    && `${item.title} ${item.description} ${item.location}`.toLowerCase().includes(query.toLowerCase()),
  )

  return <div className="module-shell">
    <PageIntro eyebrow="LOST & FOUND" title="Help campus items find home." body="Report a lost item or match a found one with its owner." />
    <div className="module-toolbar"><div className="filter-pills"><button type="button" className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>All</button><button type="button" className={filter === 'lost' ? 'selected' : ''} onClick={() => setFilter('lost')}>Lost</button><button type="button" className={filter === 'found' ? 'selected' : ''} onClick={() => setFilter('found')}>Found</button></div><label className="search-field"><Search size={16} /><input aria-label="Search lost and found" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search items or locations" /></label></div>
    <div className="details-grid">
      <div className="panel-block">
        <h3 className="panel-title">Recent reports</h3>
        <div className="stack-list">
          {visible.length === 0 ? <div className="empty-state"><strong>No reports match</strong><span>Try another search, or submit a lost or found report.</span></div> : visible.map(item => <article key={item.id} className="detail-card"><div className="detail-top"><span className="chip">{item.type}</span><span className="chip">{item.category || 'Other'}</span><span className={`chip ${item.status === 'resolved' ? 'muted' : 'accent'}`}>{item.status === 'resolved' ? 'Resolved' : 'Open'}</span></div><h4>{item.title}</h4>{item.image && <img src={item.image} alt={item.title} className="detail-image" onError={event => { event.currentTarget.hidden = true }} />}<p>{item.description}</p><div className="meta-row"><span>{item.location}</span><span>{item.date || 'Date unspecified'}</span></div><div className="detail-footer"><span>{item.contactEmail ? <a href={`mailto:${item.contactEmail}`}>{item.contactName || item.contactEmail}</a> : item.contactName || 'Campus student'}{item.contactPhone && <> · <a href={`tel:${item.contactPhone}`}>{item.contactPhone}</a></>}</span>{(item.reporterId === currentUserId || isAdmin) && <button type="button" className="text-button" onClick={() => setEditingItem(item)}>Edit</button>} {(item.reporterId === currentUserId || isAdmin) && item.status !== 'resolved' && <button type="button" className="text-button" onClick={() => onResolve(item.id)}>Resolve</button>} {(item.reporterId === currentUserId || isAdmin) && <button type="button" className="text-button" onClick={() => window.confirm(`Delete the report for “${item.title}”?`) && onDelete(item.id)}>Delete</button>}</div></article>)}
        </div>
      </div>
      <form className="panel-block form-panel" onSubmit={async event => { event.preventDefault(); if (posting) return; setPosting(true); try { if (await onCreate(form)) { setForm({ title: '', type: 'lost', category: 'Other', description: '', location: '', date: '', image: '' }); setImageError('') } } finally { setPosting(false) } }}>
        <h3 className="panel-title">Report item</h3>
        <label>Item name<input maxLength={120} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Blue water bottle" required /></label>
        <label>Type<select value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value }))}><option value="lost">Lost item</option><option value="found">Found item</option></select></label>
        <label>Category<select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))}><option>Accessories</option><option>Electronics</option><option>Documents</option><option>Clothing</option><option>Other</option></select></label>
        <label>Location<input value={form.location} onChange={event => setForm(current => ({ ...current, location: event.target.value }))} placeholder="Library second floor" required /></label>
        <label>Date<input type="date" value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} /></label>
        <div className="photo-form-field"><span>Item photo (optional)</span><ImageUploadControls image={form.image} onChange={image => setForm(current => ({ ...current, image }))} onError={setImageError} /><label>Or image URL<input type="url" maxLength={2048} value={form.image.startsWith('data:') ? '' : form.image} onChange={event => setForm(current => ({ ...current, image: event.target.value }))} placeholder="https://..." /></label>{imageError && <span className="image-form-error" role="alert">{imageError}</span>}</div>
        <label>Details<textarea maxLength={1500} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} rows="4" placeholder="Describe the item and any identifying details." required /></label>
        <button type="submit" className="button button-dark" disabled={posting}>{posting ? 'Submitting…' : 'Submit report'}</button>
      </form>
    </div>
    {editingItem && <LostFoundEditModal item={editingItem} onClose={() => setEditingItem(null)} onSubmit={async draft => { if (await onUpdate(editingItem.id, draft)) setEditingItem(null) }} />}
  </div>
}

function LostFoundEditModal({ item, onClose, onSubmit }) {
  const [draft, setDraft] = useState({ title: item.title, type: item.type, category: item.category || 'Other', description: item.description, location: item.location, date: item.date || '', image: item.image || '' })
  const [saving, setSaving] = useState(false)
  const [imageError, setImageError] = useState('')
  const submit = async event => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await onSubmit(draft)
    } finally {
      setSaving(false)
    }
  }
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}>
    <button type="button" className="modal-close" aria-label="Close" disabled={saving} onClick={onClose}><X size={18} /></button>
    <p className="eyebrow">LOST &amp; FOUND</p><h2>Edit report</h2>
    <label>Item name<input required maxLength={120} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
    <label>Type<select value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })}><option value="lost">Lost item</option><option value="found">Found item</option></select></label>
    <label>Category<select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}><option>Accessories</option><option>Electronics</option><option>Documents</option><option>Clothing</option><option>Other</option></select></label>
    <label>Location<input required maxLength={160} value={draft.location} onChange={event => setDraft({ ...draft, location: event.target.value })} /></label>
    <label>Date<input type="date" max={new Date().toISOString().slice(0, 10)} value={draft.date} onChange={event => setDraft({ ...draft, date: event.target.value })} /></label>
    <div className="photo-form-field"><span>Item photo (optional)</span><ImageUploadControls image={draft.image} onChange={image => setDraft(current => ({ ...current, image }))} onError={setImageError} /><label>Or image URL<input type="url" maxLength={2048} value={draft.image.startsWith('data:') ? '' : draft.image} onChange={event => setDraft(current => ({ ...current, image: event.target.value }))} placeholder="https://..." /></label>{imageError && <span className="image-form-error" role="alert">{imageError}</span>}</div>
    <label>Details<textarea required maxLength={1500} rows={4} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label>
    <div className="modal-actions"><button type="button" className="button button-light" disabled={saving} onClick={onClose}>Cancel</button><button type="submit" className="button button-dark" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
  </form></div>
}

function MaintenancePage({ requests, students = [], currentUserId, isAdmin, onAssign, onCreate, onUpdateStatus, onConfirmResolved }) {
  const [form, setForm] = useState({ title: '', category: 'Electrical', location: '', description: '', image: '' })
  const [posting, setPosting] = useState(false)
  const [imageError, setImageError] = useState('')

  return <div className="module-shell">
    <PageIntro eyebrow="CAMPUS MAINTENANCE" title="Submit and track help requests." body="Report facilities issues and track them through submission to resolution." />
    <div className="details-grid">
      <div className="panel-block">
        <h3 className="panel-title">Open requests</h3>
        <div className="stack-list">
          {(requests || []).length === 0 ? <div className="empty-state"><strong>No maintenance requests</strong><span>Report the next campus issue.</span></div> : (requests || []).map(item => { const nextStatus = item.status === 'Submitted' ? 'In Progress' : item.status === 'In Progress' ? 'Resolved' : null; return <article key={item.id} className="detail-card"><div className="detail-top"><span className="chip">{item.category}</span><span className={`chip ${item.status === 'Resolved' ? 'muted' : 'accent'}`}>{item.status}</span></div><h4>{item.title}</h4>{item.image && <img src={item.image} alt={item.title} className="detail-image" onError={event => { event.currentTarget.hidden = true }} />}<p>{item.description}</p><div className="meta-row"><span>{item.location}</span><span>{formatPostedDate(item.createdAt)}</span></div><div className="detail-footer"><small>{item.userName || 'Student'}{item.assignedToName ? ` · Assigned to ${item.assignedToName}` : ''}{item.confirmedByUserAt ? ' · Resolution confirmed' : ''}</small>{isAdmin && <div className="status-actions"><select aria-label={`Assign ${item.title}`} value={item.assignedTo || ''} onChange={event => onAssign(item.id, event.target.value)}><option value="">Unassigned</option>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select>{nextStatus && <button type="button" className="text-button" onClick={() => onUpdateStatus(item.id, nextStatus)}>{nextStatus}</button>}</div>}{item.userId === currentUserId && item.status === 'Resolved' && !item.confirmedByUserAt && <button type="button" className="text-button" onClick={() => onConfirmResolved(item.id)}>Confirm resolved</button>}</div></article>})}
        </div>
      </div>
      <form className="panel-block form-panel" onSubmit={async event => { event.preventDefault(); if (posting) return; setPosting(true); try { if (await onCreate(form)) { setForm({ title: '', category: 'Electrical', location: '', description: '', image: '' }); setImageError('') } } finally { setPosting(false) } }}>
        <h3 className="panel-title">Submit request</h3>
        <label>Issue title<input maxLength={120} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Broken corridor light" required /></label>
        <label>Category<select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))}><option>Electrical</option><option>Water</option><option>Cleanliness</option><option>Furniture</option><option>Internet</option></select></label>
        <label>Location<input maxLength={160} value={form.location} onChange={event => setForm(current => ({ ...current, location: event.target.value }))} placeholder="Block A, corridor 2" required /></label>
        <div className="photo-form-field"><span>Issue photo (optional)</span><ImageUploadControls image={form.image} onChange={image => setForm(current => ({ ...current, image }))} onError={setImageError} /><label>Or image URL<input type="url" maxLength={2048} value={form.image.startsWith('data:') ? '' : form.image} onChange={event => setForm(current => ({ ...current, image: event.target.value }))} placeholder="https://..." /></label>{imageError && <span className="image-form-error" role="alert">{imageError}</span>}</div>
        <label>Details<textarea maxLength={1500} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} rows="4" placeholder="Describe the issue and when it started." required /></label>
        <button type="submit" className="button button-dark" disabled={posting}>{posting ? 'Sending…' : 'Send request'}</button>
      </form>
    </div>
  </div>
}

function Overview({ navigate }) {
  const shortcuts = [
    { label: 'Resource exchange', detail: 'Find or share books, study gear, and useful items.', icon: PackageOpen, view: 'exchange' },
    { label: 'Campus events', detail: 'See what is happening and register to attend.', icon: CalendarDays, view: 'events' },
    { label: 'Lost & Found', detail: 'Report an item or help it get back to its owner.', icon: Compass, view: 'lost-found' },
    { label: 'Maintenance', detail: 'Report a campus issue and follow its status.', icon: Settings, view: 'maintenance' },
  ]
  return <div className="module-shell overview-page">
    <section className="overview-welcome">
      <p className="eyebrow">YOUR CAMPUS, IN ONE PLACE</p>
      <h1>Make campus life a little easier.</h1>
      <p>Find what you need, share what you can, and stay up to date with the NIT Warangal community.</p>
      <button className="button button-dark" onClick={() => navigate('exchange')}>Explore the resource exchange<ArrowRight size={16} /></button>
    </section>
    <section className="overview-shortcuts" aria-labelledby="overview-shortcuts-title">
      <div className="section-heading"><div><p className="eyebrow">CAMPUS SERVICES</p><h2 id="overview-shortcuts-title">What would you like to do?</h2></div></div>
      <div className="overview-shortcut-grid">{shortcuts.map(({ label, detail, icon: Icon, view }) => <button type="button" className="overview-shortcut" key={view} onClick={() => navigate(view)}><span className="overview-shortcut-icon"><Icon size={19} /></span><span className="overview-shortcut-copy"><strong>{label}</strong><small>{detail}</small></span><ChevronRight size={17} /></button>)}</div>
    </section>
    <section className="overview-notices panel-block"><div><p className="eyebrow">CAMPUS UPDATES</p><h2>Stay in the loop.</h2><p>Read official notices, club updates, and important reminders.</p></div><button type="button" className="button button-light" onClick={() => navigate('announcements')}>View announcements<ArrowRight size={16} /></button></section>
  </div>
}

function Reveal({ children, className = '', ...props }) {
  const ref = useRef(null)
  const visible = useInView(ref, { once: true, margin: '-100px' })
  return <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 40 }} animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }} transition={{ duration: .8, ease: 'easeOut' }} {...props}>{children}</motion.div>
}

function AboutSection() {
  return <section className="asme-section asme-about" id="asme-about"><Reveal><p className="asme-label">Why CampusLoop</p></Reveal><Reveal><h2>Small exchanges make a <em>big campus</em> feel<br className="asme-desktop-break" /> <em>close, useful, and shared.</em></h2></Reveal></section>
}

function FeaturedVideoSection() {
  return <section className="asme-section asme-featured"><Reveal className="asme-featured-frame"><video src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4" muted autoPlay loop playsInline preload="auto" /><div className="asme-video-gradient" /><div className="asme-featured-overlay"><div className="liquid-glass asme-approach"><p className="asme-label">Campus in motion</p><p>CampusLoop brings resources, events, and student life into one shared space, so finding help or finding your people takes less effort.</p></div></div></Reveal></section>
}

function PhilosophySection() {
  return <section className="asme-section asme-philosophy" id="asme-philosophy"><Reveal><h2>Ask <em>x</em> Participate</h2></Reveal><div className="asme-philosophy-grid"><Reveal className="asme-philosophy-media" transition={{ duration: .8, delay: .1 }}><video src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4" muted autoPlay loop playsInline preload="auto" /></Reveal><Reveal className="asme-philosophy-copy" transition={{ duration: .8, delay: .2 }}><div><p className="asme-label">Find what you need</p><p>Post a request for books, calculators, electronics, or everyday essentials. Students who have what you need can message you with an offer.</p></div><div className="asme-divider" /><div><p className="asme-label">Show up for more</p><p>Discover talks, runs, club activities, and cultural events. Register for what interests you and keep your week connected to campus life.</p></div></Reveal></div></section>
}

function ServicesSection({ navigate }) {
  const services = [
    { tag: 'Module 01', title: 'Resource Exchange', description: 'Request books, study gear, electronics, and more. Students who have what you need can message you with an offer, and you can close your request once it is fulfilled.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4', view: 'exchange' },
    { tag: 'Module 02', title: 'Announcements', description: 'Keep up with academic updates, administrative notices, club announcements, and standout campus reminders.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4', view: 'announcements' },
    { tag: 'Module 03', title: 'Events Calendar', description: 'See what is happening across campus, explore event details, and register for talks, runs, club activities, and community moments.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4', view: 'events' },
    { tag: 'Module 04', title: 'Lost & Found', description: 'Post a missing item or report a recovered one to reunite belongings with their owners across campus.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4', view: 'lost-found' },
    { tag: 'Module 05', title: 'Maintenance', description: 'Report broken facilities, water issues, damaged furniture, and electrical problems so they can be tracked to resolution.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4', view: 'maintenance' },
  ]
  return <section className="asme-section asme-services" id="asme-services"><Reveal className="asme-services-heading"><h2>Find your way around</h2><span>CampusLoop modules</span></Reveal><div className="asme-service-grid">{services.map((service, index) => <Reveal key={service.title} className="liquid-glass asme-service-card" transition={{ duration: .8, delay: index * .15 }}><div className="asme-service-video"><video src={service.video} muted autoPlay loop playsInline preload="auto" /><div /></div><div className="asme-service-body"><div className="asme-service-top"><p className="asme-label">{service.tag}</p><button className="liquid-glass" aria-label={`Open ${service.title}`} onClick={() => navigate(service.view)}><ArrowUpRight size={17} /></button></div><h3>{service.title}</h3><p>{service.description}</p></div></Reveal>)}</div></section>
}

function Metric({ icon: Icon, value, label, detail, color, onClick }) { return <button className="metric-card" onClick={onClick}><div className={`metric-icon ${color}-bg`}><Icon size={19} /></div><strong className="metric-value">{value}</strong><span>{label}</span><small>{detail}</small><ArrowUpRight className="metric-arrow" size={16} /></button> }

function Exchange({ listings, isAdmin, onSave, onCreate, onOffer, onDelete, onEdit, onRequest, currentUserId }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All items')
  const filtered = listings.filter(item => {
    return item.postType === 'wanted' && item.status === 'Open'
      && `${item.title} ${item.category} ${item.owner} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase())
      && (category === 'All items' || item.category === category)
  })
  return <>
    <PageIntro eyebrow="RESOURCE EXCHANGE" title="Find what you need." body="See what students need and offer a resource to help." action="Request a resource" onAction={onCreate} />
    <section className="module-toolbar">
      <div className="search-field"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search wanted resources..." /></div>
      <div className="filter-pills">{['All items', 'Books', 'Electronics', 'Study gear', 'Room & living'].map(item => <button className={category === item ? 'selected' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <span className="result-count">{filtered.length} results</span>
    </section>
    <div className="exchange-layout">
      <aside className="exchange-aside">
        <div className="aside-card dark-card"><Sparkles size={21} /><strong>Have what<br />someone needs?</strong><span>Offer an item to a student who is looking for it.</span></div>
        <div className="aside-filter">
          <p className="eyebrow">How it works</p>
          <div className="step"><b>01</b><span><strong>Post a request</strong><small>Describe what you need</small></span></div>
          <div className="step"><b>02</b><span><strong>Get a message</strong><small>Someone can offer the item</small></span></div>
          <div className="step"><b>03</b><span><strong>Close it when done</strong><small>Mark it received in your profile</small></span></div>
        </div>
      </aside>
      <section className="listing-grid">
        {filtered.map(item => <ListingCard key={item.id} item={item} isOwner={item.ownerId === currentUserId} isAdmin={isAdmin} onSave={() => onSave(item.id)} onOffer={() => onOffer(item)} onRequest={() => onRequest(item)} onDelete={() => onDelete(item.id)} onEdit={() => onEdit(item)} />)}
        {filtered.length === 0 && <div className="empty-state"><Search size={28} /><strong>No wanted resources match yet.</strong><span>Try another search or category, or post what you need.</span></div>}
      </section>
    </div>
  </>
}

function formatPostedDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : 'Date unavailable'
}

function ListingCard({ item, onSave, onOffer, onRequest, onDelete, onEdit, isOwner, isAdmin }) {
  const isResource = item.postType === 'resource'
  const unavailable = item.availabilityStatus === 'Borrowed'
  return <article className="listing-card">
    <div className="listing-image">
      {item.image ? <img src={item.image} alt="" /> : <div className="listing-placeholder"><PackageOpen size={32} /></div>}
      <span className="listing-mode">{isResource ? (unavailable ? 'Checked out' : item.mode || 'Available') : 'Looking for'}</span>
      <button className={`save-button ${item.saved ? 'saved' : ''}`} onClick={onSave} aria-label="Save request"><Heart size={17} fill={item.saved ? 'currentColor' : 'none'} /></button>
    </div>
    <div className="listing-body">
      <div className="listing-meta"><CalendarDays size={13} /><span>Posted {formatPostedDate(item.createdAt)}</span></div>
      <h3>{item.title}</h3>
      {item.description && <p className="listing-description">{item.description}</p>}
      {isResource && <div className="listing-resource-details"><span>{item.condition || 'Condition not listed'}</span><span>{item.category}</span></div>}
      <div className="listing-footer">
        <div className={`avatar avatar-${item.color || 'blue'}`}>{item.initials || 'CL'}</div>
        <span><strong>{item.owner || 'Campus student'}</strong><small>{item.category}</small></span>
        {isOwner ? <span className="request-owner-label">{isResource ? 'Your listing' : 'Your request'}</span> : isResource && !isAdmin ? <button className="request-button" disabled={unavailable} onClick={onRequest}>{unavailable ? 'Unavailable' : 'Request item'}</button> : !isResource && !isAdmin ? <button className="request-button" onClick={onOffer}>I have this</button> : null}
        {(isOwner || isAdmin) && isResource && <button type="button" className="text-button" onClick={onEdit}>Edit</button>}
        {(isOwner || isAdmin) && <button type="button" className="text-button" disabled={isResource && unavailable} onClick={onDelete}>Delete</button>}
      </div>
    </div>
  </article>
}

function Events({ events: eventItems, registered, clubs, isAdmin, onRegister, onOpen, onCreate, onRemove }) {
  const [category, setCategory] = useState('All')
  const [dateRange, setDateRange] = useState('upcoming')
  const categories = ['All', ...new Set(eventItems.map(event => event.type).filter(Boolean))]
  const today = new Date().toISOString().slice(0, 10)
  const visibleEvents = eventItems.filter(event =>
    (category === 'All' || event.type === category)
    && (dateRange === 'all' || (dateRange === 'upcoming' ? !event.date || event.date >= today : event.date && event.date < today)),
  )
  return <div className="module-shell">
    <PageIntro eyebrow="CAMPUS EVENTS" title="What's happening on campus." body="Find student activities, see the details, and join the events that interest you." action="Post an event" onAction={onCreate} />
    <div className="module-toolbar event-filter-toolbar">
      <div className="filter-pills">{categories.map(item => <button type="button" className={category === item ? 'selected' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <label className="search-field"><CalendarDays size={16} /><select aria-label="Filter events by date" value={dateRange} onChange={event => setDateRange(event.target.value)}><option value="upcoming">Upcoming</option><option value="past">Past events</option><option value="all">All dates</option></select></label>
    </div>
    {visibleEvents.length ? <div className="campus-event-grid">{visibleEvents.map(event => {
      const isRegistered = registered.includes(event.id)
      const canRemove = isAdmin || (event.date && event.date < today && clubs.some(club => club.id === event.clubId && club.isMember))
      const eventDate = event.date
        ? new Date(`${event.date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Date to be announced'
      return <article className="campus-event-card" key={event.id}>
        <div className="campus-event-card-header"><span className="chip">{event.type || 'Campus event'}</span><span>{eventDate}</span></div>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <div className="campus-event-details"><span><CalendarDays size={15} />{event.time || 'Time to be announced'}</span><span><Compass size={15} />{event.place || 'Location to be announced'}</span><span><UsersRound size={15} />Hosted by {event.host || 'Campus community'}</span></div>
        <div className="campus-event-actions">
          <button type="button" className="button button-dark" disabled={!isRegistered && event.spots === 0} onClick={() => onRegister(event.id)}>{isRegistered ? 'Cancel registration' : event.spots === 0 ? 'Event full' : 'Register'}</button>
          <button type="button" className="button button-light" onClick={() => onOpen(event)}>View details</button>
          {canRemove && <button type="button" className="text-button" onClick={() => onRemove(event.id)}>Remove event</button>}
        </div>
      </article>
    })}</div> : <div className="empty-state"><strong>No events found</strong><span>Try another date or category, or post a new campus event.</span></div>}
  </div>
}

const lumoraVideos = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4',
]
function LumoraEvents({ events, registered, clubs, isAdmin, onRegister, onOpen, onCreate, onRemove }) {
  const [activeEvent, setActiveEvent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [readyVideos, setReadyVideos] = useState([])
  const pointerStart = useRef(null)
  const cooldown = useRef(null)
  const event = events[activeEvent % Math.max(events.length, 1)]
  const activeVideo = activeEvent % lumoraVideos.length
  const memberClubIds = clubs.filter(club => club.isMember).map(club => club.id)
  const canRemove = isAdmin || (event?.date && event.date < new Date().toISOString().slice(0, 10) && memberClubIds.includes(event.clubId))

  useEffect(() => () => clearTimeout(cooldown.current), [])
  useEffect(() => setActiveEvent(index => events.length ? (index >= events.length - 1 ? events.length - 1 : index) : 0), [events.length])

  const move = direction => {
    if (isTransitioning || events.length < 2) return
    setIsTransitioning(true)
    setActiveEvent(index => (index + direction + events.length) % events.length)
    cooldown.current = setTimeout(() => setIsTransitioning(false), 1000)
  }
  const selectEvent = index => {
    if (isTransitioning || index === activeEvent) return
    setActiveEvent(index)
    setIsTransitioning(true)
    cooldown.current = setTimeout(() => setIsTransitioning(false), 1000)
  }
  const onWheel = wheelEvent => { if (Math.abs(wheelEvent.deltaX) > 18 || Math.abs(wheelEvent.deltaY) > 38) move(wheelEvent.deltaX > 18 || wheelEvent.deltaY > 38 ? 1 : -1) }
  const onPointerDown = pointerEvent => { pointerStart.current = pointerEvent.clientX }
  const onPointerUp = pointerEvent => { if (pointerStart.current === null) return; const distance = pointerEvent.clientX - pointerStart.current; pointerStart.current = null; if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1) }

  return <section className={`lumora-events ${activeVideo === 2 ? 'is-dark-content' : ''}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
    <div className="lumora-video-stack" aria-hidden="true">{lumoraVideos.map((video, index) => <video key={video} className={index === activeVideo && readyVideos.includes(index) ? 'is-active' : ''} src={video} muted autoPlay loop playsInline preload="auto" onPlaying={() => setReadyVideos(current => current.includes(index) ? current : [...current, index])} />)}</div>
    <img className="lumora-train-overlay" src="https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png" alt="" aria-hidden="true" />
    <main className="lumora-content" id="events">
      {event ? <>
        <div className="lumora-badge liquid-glass">{event.type}</div>
        <p className="lumora-kicker">{event.host} · {event.date ? `${event.day} ${event.month}` : 'Date to be announced'}</p>
        <h1>{event.title}</h1>
        <p className="lumora-subtext">{event.description}</p>
        <div className="lumora-event-facts"><span>{event.time}</span><span>{event.place}</span></div>
        <div className="lumora-actions"><button className="lumora-primary" disabled={!registered.includes(event.id) && event.spots === 0} onClick={() => onRegister(event.id)}>{registered.includes(event.id) ? 'Going' : event.spots === 0 ? 'Event full' : 'Join event'}<ArrowUpRight size={15} /></button><button className="lumora-secondary liquid-glass" onClick={() => onOpen(event)}>View details</button>{canRemove && <button className="lumora-secondary liquid-glass" onClick={() => onRemove(event.id)}>{isAdmin ? 'Remove event' : 'Remove past event'}</button>}</div>
      </> : <><div className="lumora-badge liquid-glass">Campus events</div><h1>No events listed</h1><p className="lumora-subtext">An approved club member can post the next campus event.</p></>}
      <button className="lumora-create-event" onClick={onCreate}><Plus size={14} /> Post a campus event</button>
      <div className="lumora-switcher" aria-label="Choose a campus event">{events.map((item, index) => <button type="button" key={item.id} className={index === activeEvent ? 'is-active' : ''} aria-current={index === activeEvent ? 'true' : undefined} onClick={() => selectEvent(index)}>{item.title}<span>{item.host}</span></button>)}</div>
    </main>
    {events.length > 1 && <div className="lumora-arrows"><button onClick={() => move(-1)} aria-label="Previous event">←</button><button onClick={() => move(1)} aria-label="Next event">→</button></div>}
  </section>
}

const mostarSights = [
  { kicker: 'Old Bridge', title: 'Stari Most', text: "The stone arch over the Neretva and Mostar's main landmark.", icon: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png' },
  { kicker: 'Bazaar Street', title: 'Kujundziluk', text: 'Copper shops, souvenirs, and the old bazaar lane by the bridge.', icon: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png' },
  { kicker: 'Viewpoint', title: 'Koski Mehmed Pasha Mosque', text: 'A classic minaret view back toward Stari Most and the river.', icon: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230448_825949c9-ccdb-4857-b4a6-e349eccc9010.png' },
  { kicker: 'Ottoman House', title: 'Kajtaz House', text: "A preserved residential house showing Mostar's Ottoman layers.", icon: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png' },
  { kicker: 'Museum', title: 'War Photo Exhibition', text: "A compact, moving stop for context on the city's recent history.", icon: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png' },
]

function MostarHeader() {
  return <header className="mostar-nav" aria-label="Events navigation"><a className="mostar-logo" href="#cinema">CampusLoop / Events</a><nav aria-label="Events menu"><a href="#cinema">Intro</a><a href="#campus-events">Campus events</a><a href="#routes">Profile</a></nav><button className="mostar-language" aria-label="Current section"><span>LIVE</span></button></header>
}

function MostarEvents({ events, registered, onRegister, onOpen }) {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const controlsRef = useRef(null)
  const [activeSight, setActiveSight] = useState(mostarSights.length)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return undefined
    let targetScroll = 0
    let smoothScroll = 0
    let rafPending = false
    let initialized = false
    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0
    const root = document.documentElement
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
    const smoothstep = (start, end, value) => { const x = clamp((value - start) / (end - start)); return x * x * (3 - 2 * x) }
    const lerp = (start, end, amount) => start + (end - start) * amount
    const segment = (value, enterStart, enterEnd, exitStart, exitEnd) => { const enter = smoothstep(enterStart, enterEnd, value); const exit = smoothstep(exitStart, exitEnd, value); return { enter, exit, active: enter * (1 - exit) } }
    const distance = () => clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - window.innerHeight)
    const setVar = (name, value) => root.style.setProperty(name, value)
    const update = () => {
      rafPending = false
      targetScroll = distance()
      if (!initialized || reduceMotion.matches) { smoothScroll = targetScroll; initialized = true } else smoothScroll = lerp(smoothScroll, targetScroll, .14)
      if (Math.abs(smoothScroll - targetScroll) < .08) smoothScroll = targetScroll
      mouseX = lerp(mouseX, targetMouseX, .12)
      mouseY = lerp(mouseY, targetMouseY, .12)
      const frame2 = segment(smoothScroll, 560, 900, 1300, 1620)
      const frame3 = segment(smoothScroll, 1760, 2140, 2540, 2700)
      const progress = clamp(smoothScroll / 2700)
      const introExit = smoothstep(90, 650, smoothScroll)
      const sightsEnter = Math.pow(smoothstep(2760, 3560, smoothScroll), 1.55)
      const controlsEnter = smoothstep(3360, 3660, smoothScroll)
      const blurActive = clamp(frame2.active + frame3.active)
      const splitDrift = Math.pow(frame2.enter, 1.5)
      const backScale = .76 + progress * .2 + frame2.enter * .18 + frame3.enter * .16
      const sharedHeroY = progress * -74
      const sharedHeroScale = progress * .23
      const screenTop = Math.min(220, Math.max(112, window.innerHeight * .19)) - 50
      const parentTop = window.innerHeight - (window.innerHeight - screenTop) / backScale
      setVar('--mx', (reduceMotion.matches ? 0 : mouseX).toFixed(4)); setVar('--my', (reduceMotion.matches ? 0 : mouseY).toFixed(4))
      setVar('--back-opacity', 1 - frame2.active * .06); setVar('--back-x', `${mouseX * -12}px`); setVar('--back-y', `${mouseY * -4}px`); setVar('--back-scale', backScale)
      setVar('--four-y', `${10 + progress * 10}vh`); setVar('--four-scale', .78 + progress * .16); setVar('--bazaar-y', `${20 - progress * 8}vh`); setVar('--blur-px', `${blurActive * 14}px`); setVar('--back-brightness', 1 - blurActive * .255); setVar('--bazaar-blur-px', `${frame2.active * 14}px`); setVar('--bazaar-brightness', 1 - frame2.active * .255 - frame3.active * .06); setVar('--bazaar-saturation', 1 + frame3.active * .18)
      setVar('--shade-opacity', 1); setVar('--shade-z', frame2.active > .02 ? '2' : '0'); setVar('--shade-top-alpha', blurActive * .465); setVar('--shade-mid-alpha', blurActive * .42); setVar('--shade-bottom-alpha', blurActive * .51)
      setVar('--title-y', `${introExit * -210}px`); setVar('--title-scale', 1 - introExit * .08); setVar('--title-opacity', 1 - introExit)
      setVar('--bridge-x', `calc(-50% + ${mouseX * 18}px)`); setVar('--bridge-y', `${mouseY * 8 + sharedHeroY - frame2.exit * 760}px`); setVar('--bridge-bottom', `${5 - frame2.enter * 13}vh`); setVar('--bridge-width', `${67.2 + frame2.enter * 37.8}vw`); setVar('--bridge-scale', 1.02 + sharedHeroScale + frame2.exit * .46)
      setVar('--split-left-x', `calc(-50% + ${-splitDrift * 46}vw + ${mouseX * 22}px)`); setVar('--split-left-y', `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`); setVar('--split-left-scale', 1 + sharedHeroScale + frame2.enter * .74); setVar('--split-right-x', `calc(-50% + ${splitDrift * 46}vw + ${mouseX * 22}px)`); setVar('--split-right-y', `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`); setVar('--split-right-scale', 1 + sharedHeroScale + frame2.enter * .74)
      setVar('--frame2-opacity', frame2.active * (1 - frame3.enter)); setVar('--frame2-x', `calc(-50% + ${mouseX * 10}px)`); setVar('--frame2-y', `calc(-50% + ${mouseY * 8 - frame2.exit * 150}px)`); setVar('--frame2-scale', 1.06 + frame2.enter * .08 + frame2.exit * .08); setVar('--intro-copy-y', `${introExit * 90}px`); setVar('--intro-copy-opacity', 1 - introExit); setVar('--panel2-opacity', frame2.active * (1 - frame2.exit)); setVar('--panel2-y', `calc(-50% + ${-frame2.exit * 86 + (1 - frame2.enter) * 58}px)`); setVar('--panel3-opacity', frame3.active * (1 - frame3.exit)); setVar('--panel3-y', `calc(-50% + ${-frame3.exit * 86 + (1 - frame3.enter) * 58}px)`)
      setVar('--sights-visibility', sightsEnter > .01 ? 'visible' : 'hidden'); setVar('--sights-enter-x', `${(1 - sightsEnter) * 420}vw`); setVar('--sights-scale', 1 / backScale); setVar('--sights-top', `${parentTop}px`); setVar('--sights-screen-top', `${screenTop}px`); setVar('--sights-controls-opacity', controlsEnter); controlsRef.current?.classList.toggle('is-ready', controlsEnter > .98)
      if (Math.abs(smoothScroll - targetScroll) > .08 || Math.abs(mouseX - targetMouseX) > .001 || Math.abs(mouseY - targetMouseY) > .001) requestTick()
    }
    const requestTick = () => { if (!rafPending) { rafPending = true; requestAnimationFrame(update) } }
    const onScroll = () => requestTick()
    const onResize = () => { updateSlider(); requestTick() }
    const onPointer = event => { targetMouseX = event.clientX / window.innerWidth - .5; targetMouseY = event.clientY / window.innerHeight - .5; requestTick() }
    const updateSlider = () => { const card = track.querySelector('.mostar-sight-card'); if (!card) return; const gap = parseFloat(getComputedStyle(track).columnGap || '0'); root.style.setProperty('--sights-shift', `${-(card.offsetWidth + gap) * activeSight}px`) }
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onResize); window.addEventListener('pointermove', onPointer, { passive: true }); updateSlider(); requestTick()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); window.removeEventListener('pointermove', onPointer); root.style.cssText = '' }
  }, [activeSight])

  const moveSight = direction => setActiveSight(index => index + direction >= mostarSights.length * 2 ? index + direction - mostarSights.length : index + direction < mostarSights.length ? index + direction + mostarSights.length : index + direction)
  const selectSight = sight => onOpen(events[mostarSights.indexOf(sight) % Math.max(events.length, 1)])
  const cards = [...mostarSights, ...mostarSights, ...mostarSights]
  useEffect(() => {
    const host = sectionRef.current?.parentElement
    if (!host) return undefined
    const mount = document.createElement('div')
    mount.className = 'campus-events-after-mount'
    host.appendChild(mount)
    const eventRoot = createRoot(mount)
    eventRoot.render(<CampusEventsAfter events={events} registered={registered} onRegister={onRegister} onOpen={onOpen} />)
    return () => { eventRoot.unmount(); mount.remove() }
  }, [events, registered, onRegister, onOpen])
  return <main className="mostar-route"><section className="cinema-scroll" aria-label="Mostar cinematic scroll story" ref={sectionRef}><div className="mostar-stage"><div className="mostar-world"><img className="mostar-scene sky-img" src="https://raft-blast-61784561.figma.site/_assets/v11/16b5007d9c93971e26ffe4e0e3e37946f6bd538c.png" alt="" /><MostarHeader /><div className="mostar-back-stack"><img className="mostar-scene back-img back-four" src="https://raft-blast-61784561.figma.site/_assets/v11/8a7f8af50e0ce92ec2e228e7b0b4112178c51cf1.png" alt="" /><div className="mostar-sights-slider"><div className="mostar-sights-track" ref={trackRef}>{cards.map((sight, index) => <article className={`mostar-sight-card ${index === activeSight ? 'is-active' : ''}`} key={`${sight.title}-${index}`} role="button" tabIndex="0" aria-label={`Open ${sight.title} card`} onClick={() => selectSight(sight)} onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && selectSight(sight)}><span className="sight-kicker">{sight.kicker}</span><img className="sight-pin" src={sight.icon} alt="" /><h3>{sight.title}</h3><p>{sight.text}</p></article>)}</div></div><img className="mostar-scene back-img back-bazaar" src="https://raft-blast-61784561.figma.site/_assets/v11/864afe00e41e2fa20a5aa546e15cb807e0f81384.png" alt="" /></div><div className="mostar-sights-controls" ref={controlsRef}><button onClick={() => moveSight(-1)} aria-label="Previous sight">←</button><button onClick={() => moveSight(1)} aria-label="Next sight">→</button></div><h1 className="mostar-hero-title">MOSTAR</h1><img className="mostar-scene splitframe-img splitframe-left" src="https://raft-blast-61784561.figma.site/_assets/v11/7536d7b60a1fce482cf6edf3f0bffd3bad5d0f8a.png" alt="" /><img className="mostar-scene splitframe-img splitframe-right" src="https://raft-blast-61784561.figma.site/_assets/v11/392db6a6a6b98e868bd7f8d3f55bb719d51e5028.png" alt="" /><img className="mostar-scene bridge-img" src="https://raft-blast-61784561.figma.site/_assets/v11/c6a6d8ef49bca43f708aa852692942c45ec950d4.png" alt="" /><img className="mostar-scene frame-two-img" src="https://raft-blast-61784561.figma.site/_assets/v11/ba75252bab2b1c510987b74837770f7bc8a6b2d4.png" alt="" /><div className="mostar-shade" /><section className="mostar-intro-copy" aria-label="Mostar overview"><p>A stone arch, emerald water, and a compact old city made for slow mornings, late light, and one unforgettable crossing.</p><div className="hero-tags" aria-label="Mostar highlights"><span>Old Bridge</span><span>Neretva River</span><span>UNESCO old city</span></div></section><section className="mostar-story-panel mostar-story-bridge" aria-label="Old Bridge details"><h2>The bridge is the city's compass.</h2><p>Stari Most links the banks of the Neretva and anchors a historic quarter shaped by Ottoman, Mediterranean, and European layers.</p><dl className="facts"><div><dt>1566</dt><dd>Original bridge completed</dd></div><div><dt>2005</dt><dd>Old Bridge Area inscribed by UNESCO</dd></div></dl></section><section className="mostar-story-panel mostar-story-bazaar" aria-label="Old town details"><h2>The bazaar keeps Mostar close.</h2><p>Stone lanes, mosque courtyards, copper stalls, and riverside coffee stay within a short walk of Stari Most.</p><button className="note-button"><span aria-hidden="true">↗</span><span>Open old town notes</span></button></section></div></div></section></main>
}

function CampusEventsAfter({ events, registered, onRegister, onOpen }) {
  return <section className="campus-events-after" id="campus-events"><div className="campus-events-after-inner"><p className="campus-events-kicker">CampusLoop / Events Calendar</p><h1>What is happening<br /><em>around campus.</em></h1><p className="campus-events-lede">After the cinematic intro, find the real events, dates, places, and people waiting for you this week.</p><div className="campus-events-list">{events.map(event => <article className="campus-event-card" key={event.id} onClick={() => onOpen(event)}><div className={`campus-event-date ${event.color}`}><strong>{event.day}</strong><span>{event.month}</span></div><div className="campus-event-info"><p>{event.host} · {event.type}</p><h2>{event.title}</h2><span>{event.time} · {event.place}</span></div><button className={`campus-event-action ${registered.includes(event.id) ? 'is-registered' : ''}`} onClick={click => { click.stopPropagation(); onRegister(event.id) }}>{registered.includes(event.id) ? 'Going' : 'Join event'}<ArrowUpRight size={15} /></button></article>)}</div></div></section>
}

function MostarEventsLayout({ events, registered, onRegister, onOpen }) {
  return <main className="mostar-calendar-page"><div className="mostar-calendar-backdrop"><img src="https://raft-blast-61784561.figma.site/_assets/v11/16b5007d9c93971e26ffe4e0e3e37946f6bd538c.png" alt="" /><img src="https://raft-blast-61784561.figma.site/_assets/v11/864afe00e41e2fa20a5aa546e15cb807e0f81384.png" alt="" /><img src="https://raft-blast-61784561.figma.site/_assets/v11/c6a6d8ef49bca43f708aa852692942c45ec950d4.png" alt="" /></div><div className="mostar-calendar-shade" /><MostarHeader /><section className="campus-events-content"><div className="campus-events-heading"><p>CampusLoop / Events Calendar</p><h1>Find your next<br /><em>reason to show up.</em></h1><span>Real events, clear details, and one place to keep your campus week moving.</span></div><div className="campus-events-list">{events.map(event => <article className="campus-event-card" key={event.id} onClick={() => onOpen(event)}><div className={`campus-event-date ${event.color}`}><strong>{event.day}</strong><span>{event.month}</span></div><div className="campus-event-info"><p>{event.host} · {event.type}</p><h2>{event.title}</h2><span>{event.time} · {event.place}</span></div><button className={`campus-event-action ${registered.includes(event.id) ? 'is-registered' : ''}`} onClick={click => { click.stopPropagation(); onRegister(event.id) }}>{registered.includes(event.id) ? 'Going' : 'Join event'}<ArrowUpRight size={15} /></button></article>)}</div></section></main>
}

function EventCard({ event, registered, onRegister, onOpen }) { return <article className="event-card"><button className="event-image" onClick={onOpen}><img src={event.image} alt="" /><span className={`date-badge ${event.color}`}><b>{event.day}</b><small>{event.month}</small></span><span className="event-type">{event.type}</span></button><div className="event-body"><p className="eyebrow">{event.host}</p><h3>{event.title}</h3><div className="event-detail"><Clock3 size={15} /><span>{event.time}</span></div><div className="event-detail"><Compass size={15} /><span>{event.place}</span></div><div className="event-actions"><span>{event.spots} spots left</span><button className={`button ${registered ? 'button-success' : 'button-dark'}`} onClick={onRegister}>{registered ? <><Check size={15} /> Going</> : <>Join event <Ticket size={15} /></>}</button></div></div></article> }

function Profile({ profile, onSave, clubs, onRequestClub, onApproveClubRequest }) {
  return <>
    <AccountHero profile={profile} onSave={onSave} />
    <ClubMemberships clubs={clubs} onRequest={onRequestClub} onApprove={onApproveClubRequest} />
  </>
}

function ClubMemberships({ clubs, onRequest, onApprove }) {
  return <section className="account-clubs-panel">
    <div className="account-clubs-heading"><div><p>STUDENT ORGANIZATIONS</p><h2>Campus clubs</h2></div><UsersRound size={22} /></div>
    <div className="account-clubs-list">
      {clubs.map(club => <article className="account-club-card" key={club.id}>
        <div className="account-club-summary"><strong>{club.name}</strong><span>{club.isMember ? 'Member' : club.requestPending ? 'Membership requested' : 'Join the club to organize events'}</span></div>
        {!club.isMember && !club.requestPending && <button onClick={() => onRequest(club.id)}>Request to join</button>}
        {club.requestPending && <button disabled>Request pending</button>}
        {club.isMember && <span className="account-club-member">Approved member</span>}
        {club.canApproveRequests && club.pendingRequests.length > 0 && <div className="club-pending-requests">
          <span>Membership requests</span>
          {club.pendingRequests.map(joinRequest => <div key={joinRequest.id}><strong>{joinRequest.name}</strong><button onClick={() => onApprove(club.id, joinRequest.id)}>Approve</button></div>)}
        </div>}
      </article>)}
    </div>
    <p className="account-clubs-note">An administrator or a current club member approves requests. Only approved members can post or remove events for their club.</p>
  </section>
}

function AccountHero({ profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => profileDraft(profile))
  const [saving, setSaving] = useState(false)
  useEffect(() => setDraft(profileDraft(profile)), [profile])
  const save = async event => {
    event.preventDefault()
    setSaving(true)
    const saved = await onSave(draft)
    setSaving(false)
    if (saved) setEditing(false)
  }
  const year = profile.year || 'Not provided'
  const branch = profile.branch || profile.course?.replace(/\s*[·-]\s*Year\s*\d+/i, '') || 'Not provided'
  const createdDate = profile.createdAt ? new Date(profile.createdAt) : null
  const createdLabel = createdDate && !Number.isNaN(createdDate.getTime())
    ? createdDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not recorded'
  return <main className="account-hero account-profile-page">
    <header className="account-profile-header">
      <span className="account-profile-email">{profile.email}</span>
    </header>
    <section className="account-profile-card">
      <div className="account-profile-identity">
        <div><p className="account-profile-kicker">MY PROFILE</p><h1>{profile.name}<em>.</em></h1></div>
      </div>
      {editing ? <form className="account-profile-form" onSubmit={save}>
        <label>Branch<input value={draft.branch || ''} onChange={event => setDraft({ ...draft, branch: event.target.value })} required maxLength={100} /></label>
        <label>Year<input value={draft.year || ''} onChange={event => setDraft({ ...draft, year: event.target.value })} required maxLength={20} placeholder="e.g. 3" /></label>
        <label>Hostel<input value={draft.hostel || ''} onChange={event => setDraft({ ...draft, hostel: event.target.value })} maxLength={100} placeholder="Enter your hostel" /></label>
        <div className="account-profile-form-actions"><button type="button" className="account-profile-cancel" onClick={() => { setDraft(profileDraft(profile)); setEditing(false) }}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
      </form> : <div className="account-profile-details">
        <div><span>Branch</span><strong>{branch}</strong></div>
        <div><span>Year</span><strong>{year}</strong></div>
        <div><span>Hostel</span><strong>{profile.hostel || 'Not provided'}</strong></div>
        <div><span>Phone</span><strong>{profile.phone || 'Not provided'}</strong></div>
        <div><span>Account created</span><strong>{createdLabel}</strong></div>
        <button className="account-profile-edit" onClick={() => setEditing(true)}>Edit profile</button>
      </div>}
    </section>
  </main>
}

function profileDraft(profile) {
  return {
    branch: profile.branch || profile.course?.replace(/\s*[·-]\s*Year\s*\d+/i, '') || '',
    year: profile.year || profile.course?.match(/(?:Year\s*)(\d+)/i)?.[1] || '',
    hostel: profile.hostel || '',
  }
}

function RequestHistory({ listings, offers, onCloseRequest, onDeleteRequest }) {
  return <section className="request-history">
    <div className="section-heading"><div><p className="eyebrow">RESOURCE EXCHANGE</p><h2>Your requests &amp; messages</h2></div></div>
    <div className="activity-columns">
      <div>
        <h3>My resource requests</h3>
        {listings.length === 0 ? <p className="empty-copy">You haven’t requested anything yet.</p> : <div className="request-history-list">{listings.map(item => <div className="request-row" key={item.id}>
          <span><strong>{item.title}</strong><small>{formatPostedDate(item.createdAt)} · {item.status === 'Open' ? 'Open' : 'Received'}</small></span>
          <div className="request-row-actions">
            {item.status === 'Open' && <button className="close-request-button" onClick={() => onCloseRequest(item.id)}>Mark received</button>}
            <button type="button" className="text-button" onClick={() => onDeleteRequest(item.id)}>Delete</button>
          </div>
        </div>)}</div>}
      </div>
      <div>
        <h3>Messages offering help</h3>
        {offers.length === 0 ? <p className="empty-copy">When a student offers to help with your request, their message will appear here.</p> : <div className="request-history-list">{offers.slice().reverse().map(offer => <div className="offer-row" key={offer.id}>
          <strong>{offer.listing?.title || 'Resource request'}</strong>
          <small>From {offer.senderName} · {formatPostedDate(offer.createdAt)}</small>
          <p>{offer.message}</p>
          <div className="offer-contact"><span>Contact {offer.senderName}</span><a href={`mailto:${offer.senderEmail}`}>{offer.senderEmail}</a>{offer.senderPhone && <a href={`tel:${offer.senderPhone}`}>{offer.senderPhone}</a>}</div>
        </div>)}</div>}
      </div>
    </div>
  </section>
}

function ResourceRequestHistory({ requests, currentUserId, onAction, onReview }) {
  const mine = requests.filter(request => request.requesterId === currentUserId)
  const received = requests.filter(request => request.ownerId === currentUserId)
  const renderRequest = (request, isOwner) => <article className="resource-request-row" key={request.id}>
    <div><strong>{request.listing?.title || 'Resource listing removed'}</strong><small>{isOwner ? `Requested by ${request.requesterName}` : `Owner: ${request.listing?.owner || 'Campus student'}`} · {formatPostedDate(request.requestedAt || request.createdAt)}</small>{request.message && <p>{request.message}</p>}</div>
    <span className={`chip ${request.status === 'Approved' ? 'accent' : 'muted'}`}>{request.status}</span>
    <div className="resource-request-actions">
      {isOwner && request.status === 'Pending' && <><button className="text-button" onClick={() => onAction(request.id, 'approve')}>Approve</button><button className="text-button" onClick={() => onAction(request.id, 'reject')}>Decline</button></>}
      {isOwner && request.status === 'Approved' && <button className="text-button" onClick={() => onAction(request.id, 'return')}>Mark returned</button>}
      {!isOwner && request.status === 'Pending' && <button className="text-button" onClick={() => onAction(request.id, 'cancel')}>Cancel request</button>}
      {!isOwner && request.status === 'Returned' && !request.reviewed && <ReviewForm onSubmit={(rating, comment) => onReview(request.id, rating, comment)} />}
      {!isOwner && request.status === 'Returned' && request.reviewed && <small>Reviewed <Star size={13} fill="currentColor" /></small>}
    </div>
  </article>
  return <section className="request-history">
    <div className="section-heading"><div><p className="eyebrow">BORROW &amp; EXCHANGE</p><h2>Resource handovers</h2></div></div>
    <div className="resource-request-columns">
      <div><h3>Requests to me</h3>{received.length ? received.map(request => renderRequest(request, true)) : <p className="empty-copy">Requests for your resources will appear here.</p>}</div>
      <div><h3>My requests</h3>{mine.length ? mine.map(request => renderRequest(request, false)) : <p className="empty-copy">Your requests to borrow or exchange resources will appear here.</p>}</div>
    </div>
  </section>
}

function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async event => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await onSubmit(Number(rating), comment)
    } finally {
      setSubmitting(false)
    }
  }
  return <form className="resource-review-form" onSubmit={submit}>
    <label>Rate this exchange<select value={rating} onChange={event => setRating(event.target.value)}><option value="5">5 — Great</option><option value="4">4 — Good</option><option value="3">3 — Okay</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select></label>
    <input aria-label="Optional review" maxLength={500} value={comment} onChange={event => setComment(event.target.value)} placeholder="Optional comment" />
    <button type="submit" className="text-button" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit review'}</button>
  </form>
}

function AdminDashboard({ stats, users, onSuspend, onRefresh }) {
  const [query, setQuery] = useState('')
  const visibleUsers = users.filter(user => `${user.name} ${user.email} ${user.branch || ''}`.toLowerCase().includes(query.toLowerCase()))
  const metrics = [
    ['Active students', stats?.students ?? '—'],
    ['Shared resources', stats?.resources ?? '—'],
    ['Pending borrow requests', stats?.pendingResourceRequests ?? '—'],
    ['Open lost & found', stats?.openLostFound ?? '—'],
    ['Upcoming events', stats?.upcomingEvents ?? '—'],
    ['Maintenance to resolve', stats?.unresolvedMaintenance ?? '—'],
    ['Announcements', stats?.announcements ?? '—'],
    ['Open resource requests', stats?.openWantedRequests ?? '—'],
  ]
  return <div className="module-shell">
    <PageIntro eyebrow="ADMINISTRATION" title="Campus operations." body="Review campus activity and manage student access." action="Refresh data" onAction={onRefresh} />
    <div className="admin-stats-grid">{metrics.map(([label, value]) => <article className="admin-stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <section className="panel-block admin-users-panel">
      <div className="admin-users-heading"><div><h2 className="panel-title">Student accounts</h2><p>Suspend accounts that violate campus guidelines; suspended users cannot sign in.</p></div><label className="search-field"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search students" /></label></div>
      {visibleUsers.length ? <div className="admin-users-list">{visibleUsers.map(user => <article className="admin-user-row" key={user.id}><div><strong>{user.name}</strong><span>{user.email} · {user.branch || 'Branch not provided'} · Year {user.year || '—'}</span></div><span className={`chip ${user.suspendedAt ? 'muted' : 'accent'}`}>{user.suspendedAt ? 'Suspended' : 'Active'}</span><button className="text-button" disabled={user.role === 'admin'} onClick={() => onSuspend(user.id, !user.suspendedAt)}>{user.suspendedAt ? 'Restore access' : 'Suspend'}</button></article>)}</div> : <p className="empty-copy">No students match that search.</p>}
    </section>
  </div>
}

function CreateListing({ listing, onClose, onSubmit }) {
  const [form, setForm] = useState(() => listing
    ? { title: listing.title, category: listing.category, description: listing.description || '', image: listing.image || '', postType: listing.postType, condition: listing.condition || 'Good', mode: listing.mode || 'Borrow' }
    : { title: '', category: 'Books', description: '', image: '', postType: 'wanted', condition: 'Good', mode: 'Borrow' })
  const [imageError, setImageError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submissionInProgress = useRef(false)
  const loadImage = async file => {
    if (!file) return false
    try {
      const image = await processImageFile(file)
      setForm(current => ({ ...current, image }))
      setImageError('')
      return true
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'The selected image could not be processed.')
      return false
    }
  }
  const selectImage = async event => {
    await loadImage(event.target.files?.[0])
    event.target.value = ''
  }
  const pasteImage = async () => {
    if (!navigator.clipboard?.read) {
      setImageError('Image paste is not available here. Copy an image, then press Ctrl+V in this form, or upload a saved photo.')
      return
    }
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => ['image/png', 'image/jpeg', 'image/webp'].includes(type))
        if (!imageType) continue
        const file = new File([await item.getType(imageType)], `clipboard-image.${imageType.split('/')[1]}`, { type: imageType })
        if (await loadImage(file)) return
      }
      setImageError('No image found on the clipboard. Copy the image itself in Google Images, then paste again.')
    } catch (error) {
      setImageError(error instanceof Error && error.name === 'NotAllowedError'
        ? 'Clipboard access was blocked. Copy the image itself, then press Ctrl+V in this form.'
        : error instanceof Error ? error.message : 'Could not read an image from the clipboard.')
    }
  }
  const handlePaste = async event => {
    const imageFile = Array.from(event.clipboardData?.files || []).find(file => file.type.startsWith('image/'))
    if (!imageFile) return
    event.preventDefault()
    await loadImage(imageFile)
  }
  const searchImages = () => {
    if (!form.title.trim()) {
      setImageError('Enter the resource name before searching for an image.')
      return
    }
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(form.title.trim())}`, '_blank', 'noopener,noreferrer')
  }
  const submit = async event => {
    event.preventDefault()
    if (!form.title.trim() || submissionInProgress.current) return
    submissionInProgress.current = true
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      submissionInProgress.current = false
      setSubmitting(false)
    }
  }
  return <div className="modal-backdrop"><form className="modal listing-modal" onPaste={handlePaste} onSubmit={submit}>
    <button type="button" className="modal-close" onClick={onClose} aria-label="Close" disabled={submitting}><X size={18} /></button>
    <p className="eyebrow">RESOURCE EXCHANGE</p><h2>{listing ? 'Edit resource listing.' : 'Request a resource.'}</h2>
    {!listing && <p className="modal-copy">Describe what you need. Students who have it can message you with an offer.</p>}
    <label>Resource name<input autoFocus maxLength={120} required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. A graphing calculator" /></label>
    <label>Category<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}><option>Books</option><option>Electronics</option><option>Study gear</option><option>Room & living</option></select></label>
    {form.postType === 'resource' && <><label>Exchange type<select value={form.mode} onChange={event => setForm({ ...form, mode: event.target.value })}><option>Borrow</option><option>Exchange</option><option>Give away</option></select></label><label>Condition<select value={form.condition} onChange={event => setForm({ ...form, condition: event.target.value })}><option>New</option><option>Like new</option><option>Good</option><option>Fair</option></select></label></>}
    <label>Details (optional)<textarea maxLength={500} rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Add details like the model, size, or when you need it." /></label>
    <div className="image-request-field">
      <div className="image-request-actions">
        <label className="image-picker"><ImagePlus size={17} /><span>{form.image ? 'Change photo' : 'Upload a photo'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} /></label>
        <button type="button" className="image-search-button" onClick={pasteImage}><ImagePlus size={15} />Paste copied image</button>
        <button type="button" className="image-search-button" onClick={searchImages}><Search size={15} />Search Google Images</button>
      </div>
      {form.image && <img className="request-image-preview" src={form.image} alt="Preview of selected resource image" />}
      <small>Optional. Upload a photo, or copy an image from Google Images and paste it here. The preview is resized before posting.</small>
      {imageError && <span className="image-form-error" role="alert">{imageError}</span>}
    </div>
    <div className="modal-actions"><button type="button" className="button button-light" onClick={onClose} disabled={submitting}>Cancel</button><button className="button button-dark" type="submit" disabled={submitting}>{submitting ? listing ? 'Saving…' : 'Posting…' : listing ? 'Save changes' : 'Post request'} {!submitting && <ArrowUpRight size={16} />}</button></div>
  </form></div>
}

function OfferModal({ listing, onClose, onSubmit }) {
  const [message, setMessage] = useState(`Hi! I have a ${listing.title} and would be happy to help.`)
  return <div className="modal-backdrop"><form className="modal offer-modal" onSubmit={event => { event.preventDefault(); onSubmit(message) }}>
    <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
    <p className="eyebrow">MESSAGE THE STUDENT</p><h2>Offer to help</h2>
    <p className="modal-copy">Send {listing.owner} a message about “{listing.title}”.</p>
    <label>Your message<textarea autoFocus maxLength={1000} required rows={5} value={message} onChange={event => setMessage(event.target.value)} /></label>
    <div className="modal-actions"><button type="button" className="button button-light" onClick={onClose}>Cancel</button><button className="button button-dark" type="submit">Send message <MessageCircle size={16} /></button></div>
  </form></div>
}

function ResourceRequestModal({ listing, onClose, onSubmit }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async event => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const succeeded = await onSubmit(message)
      if (succeeded) onClose()
    } finally {
      setSubmitting(false)
    }
  }
  return <div className="modal-backdrop"><form className="modal offer-modal" onSubmit={submit}>
    <button type="button" className="modal-close" onClick={onClose} aria-label="Close" disabled={submitting}><X size={18} /></button>
    <p className="eyebrow">RESOURCE EXCHANGE</p><h2>Request this item</h2>
    <p className="modal-copy">{listing.owner} will review your request for “{listing.title}”.</p>
    <label>Message (optional)<textarea maxLength={500} rows={4} value={message} onChange={event => setMessage(event.target.value)} placeholder="Let the owner know when you need it or what you can exchange." /></label>
    <div className="modal-actions"><button type="button" className="button button-light" onClick={onClose} disabled={submitting}>Cancel</button><button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send request'} <ArrowUpRight size={16} /></button></div>
  </form></div>
}

function AuthModal({ profile, onClose, onSignedOut }) { return <div className="modal-backdrop"><div className="modal auth-modal"><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="auth-orb"><Leaf size={22} /></div><p className="eyebrow">CAMPUSLOOP ACCOUNT</p><h2>Welcome back, {profile.name.split(' ')[0]}.</h2><p className="modal-copy">Your account is securely connected to the CampusLoop API. Your listings, registrations, and profile changes are saved for your next visit.</p><div className="signed-in"><div className="avatar avatar-coral">{profile.name.split(' ').map(part => part[0]).join('')}</div><span><strong>{profile.email}</strong><small>{profile.role === 'admin' ? 'Administrator' : 'Student'} account · NITW</small></span><Check size={18} /></div><button className="button button-dark full-button" onClick={onClose}>Continue to CampusLoop <ArrowUpRight size={16} /></button><button className="sign-out" onClick={onSignedOut}>Sign out</button></div></div> }

function EventModal({ event, registered, canViewGuestList, onClose, onRegister }) {
  const [guestList, setGuestList] = useState(null)
  const [guestListError, setGuestListError] = useState('')
  const [guestListLoading, setGuestListLoading] = useState(false)

  useEffect(() => {
    const closeOnEscape = keyEvent => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  useEffect(() => {
    if (!canViewGuestList) return undefined
    let cancelled = false
    setGuestListLoading(true)
    setGuestListError('')
    apiFetch(`/events/${event.id}/guest-list`)
      .then(result => { if (!cancelled) setGuestList(result.attendees) })
      .catch(error => { if (!cancelled) setGuestListError(error.message) })
      .finally(() => { if (!cancelled) setGuestListLoading(false) })
    return () => { cancelled = true }
  }, [canViewGuestList, event.id])

  return <div className="modal-backdrop event-modal-backdrop" onMouseDown={mouseEvent => { if (mouseEvent.target === mouseEvent.currentTarget) onClose() }}>
    <div className="modal event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <button className="modal-close" onClick={onClose} aria-label="Close event details"><X size={18} /></button>
    {event.image && <img src={event.image} alt="" />}
    <div className="event-modal-content"><button className="event-modal-back" onClick={onClose}><ArrowLeft size={14} /> Back to events</button><p className="eyebrow">{event.host} · {event.type}</p><h2 id="event-modal-title">{event.title}</h2><p>{event.description}</p>
      <div className="event-modal-facts"><span><CalendarDays size={16} />{event.date ? new Date(`${event.date}T00:00:00`).toLocaleDateString() : 'Date to be announced'}</span><span><Clock3 size={16} />{event.time}</span><span><Compass size={16} />{event.place}</span><span><UsersRound size={16} />{event.registrationCount || 0} registered{event.capacity ? ` · ${event.spots} spots left` : ''}</span></div>
      {canViewGuestList && <section className="event-guest-list" aria-label={`Guest list for ${event.title}`}>
        <div className="event-guest-list-heading"><strong>Guest list</strong>{guestList && <span>{guestList.length} going</span>}</div>
        {guestListLoading ? <p>Loading attendees…</p> : guestListError ? <p role="alert">{guestListError}</p> : guestList?.length ? <ul>{guestList.map((attendee, index) => <li key={`${attendee.email}-${index}`}><strong>{attendee.name}</strong><a href={`mailto:${attendee.email}`}>{attendee.email}</a></li>)}</ul> : <p>No students have joined this event yet.</p>}
      </section>}
      <button className={`button ${registered ? 'button-success' : 'button-dark'} full-button`} disabled={!registered && event.spots === 0} onClick={onRegister}>{registered ? <><Check size={15} /> You’re going</> : event.spots === 0 ? 'Event full' : <>Join this event <Ticket size={15} /></>}</button>
    </div>
    </div>
  </div>
}

function CreateEventModal({ clubs, isAdmin, onClose, onSubmit }) {
  const memberClubs = clubs.filter(club => isAdmin || club.isMember)
  const [draft, setDraft] = useState({ title: '', type: 'Campus event', date: '', time: '', place: '', description: '', capacity: '', clubId: memberClubs[0]?.id || '' })
  const [submitting, setSubmitting] = useState(false)
  const submit = async event => {
    event.preventDefault()
    if (!draft.clubId || submitting) return
    setSubmitting(true)
    try {
      if (await onSubmit(draft)) onClose()
    } finally {
      setSubmitting(false)
    }
  }
  return <div className="modal-backdrop"><form className="modal event-create-modal" onSubmit={submit}>
    <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
    <p className="eyebrow">ORGANIZE FOR YOUR CLUB</p><h2>Post a campus event</h2>
    {memberClubs.length ? <>
      <label>Organizing club<select required value={draft.clubId} onChange={event => setDraft({ ...draft, clubId: event.target.value })}>{memberClubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
      <label>Event name<input autoFocus required maxLength={100} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Campus workshop" /></label>
      <label>Event type<input required maxLength={60} value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })} /></label>
      <label>Date<input type="date" min={new Date().toISOString().slice(0, 10)} required value={draft.date} onChange={event => setDraft({ ...draft, date: event.target.value })} /></label>
      <label>Time<input required maxLength={80} value={draft.time} onChange={event => setDraft({ ...draft, time: event.target.value })} placeholder="e.g. 5:00 PM - 7:00 PM" /></label>
      <label>Location<input required maxLength={120} value={draft.place} onChange={event => setDraft({ ...draft, place: event.target.value })} placeholder="Campus venue" /></label>
      <label>Capacity (optional)<input type="number" min="1" max="5000" step="1" value={draft.capacity} onChange={event => setDraft({ ...draft, capacity: event.target.value })} placeholder="Leave blank for unlimited registration" /></label>
      <label>Details (optional)<textarea rows={3} maxLength={500} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label>
      <p className="modal-copy">Each club can list up to two upcoming events at a time.</p>
      <div className="modal-actions"><button type="button" className="button button-light" onClick={onClose} disabled={submitting}>Cancel</button><button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'Posting event…' : <>Post event <ArrowUpRight size={16} /></>}</button></div>
    </> : <><p className="modal-copy">You need approved membership in a club before you can post its events. Request membership from your profile.</p><div className="modal-actions"><button type="button" className="button button-dark" onClick={onClose}>Close</button></div></>}
  </form></div>
}

class AppErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('CampusLoop interface crashed:', error, errorInfo)
  }

  render() {
    if (this.state.error) return <main className="app-loading" role="alert">
      <div className="brand-mark"><CircleHelp size={17} /></div>
      <strong>CampusLoop hit an unexpected error</strong>
      <span>Your account data is stored on the server. Reload the site to recover the interface.</span>
      <button className="button button-dark" onClick={() => window.location.reload()}>Reload CampusLoop</button>
    </main>
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(<AppErrorBoundary><App /></AppErrorBoundary>)
