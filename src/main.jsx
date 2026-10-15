import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import Lenis from 'lenis'
import { motion, useInView } from 'framer-motion'
import * as THREE from 'three'
import WAVES from 'vanta/dist/vanta.waves.min.js'
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
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
  PackageOpen,
  Plus,
  Search,
  Settings,
  Sparkles,
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

const events = [
  { id: 'event-yrc-blood-donation', month: 'TBA', day: '—', title: 'Blood Donation Camp', type: 'Community service', time: 'To be announced', place: 'Student Activity Centre', host: 'Youth Red Cross (YRC)', color: 'mint', description: 'A campus blood donation drive organized by YRC.' },
  { id: 'event-painting-face-painting', month: 'TBA', day: '—', title: 'Face Painting', type: 'Arts & culture', time: 'To be announced', place: 'Student Activity Centre', host: 'Painting and Animation', color: 'purple', description: 'A creative face-painting session hosted by Painting and Animation.' },
  { id: 'event-student-council-diwali', month: 'TBA', day: '—', title: 'Diwali Celebration', type: 'Festival', time: 'To be announced', place: 'NIT Warangal Stadium', host: 'Student Council', color: 'orange', description: 'A campus Diwali celebration organized by the Student Council at the stadium.' },
  { id: 'event-athletics-badminton', month: 'TBA', day: '—', title: 'Intramural Badminton', type: 'Sports', time: 'To be announced', place: 'Indoor Badminton Courts', host: 'Athletics', color: 'blue', description: 'An Athletics-organized intramural badminton event for students.' },
]

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'exchange', label: 'Resource exchange', icon: PackageOpen, count: 12 },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'events', label: 'Events calendar', icon: CalendarDays, count: 4 },
  { id: 'lost-found', label: 'Lost & Found', icon: Compass },
  { id: 'maintenance', label: 'Maintenance', icon: Settings },
  { id: 'profile', label: 'My profile', icon: UserRound },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem('campusloop-token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Something went wrong. Please try again.')
  return body
}

function App() {
  const [activeView, setActiveView] = useState('overview')
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [listings, setListings] = useState([])
  const [events, setEvents] = useState([])
  const [clubs, setClubs] = useState([])
  const [registered, setRegistered] = useState([])
  const [offers, setOffers] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [lostFoundItems, setLostFoundItems] = useState([])
  const [maintenanceRequests, setMaintenanceRequests] = useState([])
  const [profile, setProfile] = useState(null)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showEventCreate, setShowEventCreate] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    async function loadApplication() {
      try {
        let token = sessionStorage.getItem('campusloop-token')
        if (!token) return
        const auth = await apiFetch('/auth/me')
        setProfile(auth.user)
        const [listingData, eventData, offerData, clubData, announcementData, lostFoundData, maintenanceData] = await Promise.all([
          apiFetch('/listings'),
          apiFetch('/events'),
          apiFetch('/offers/my'),
          apiFetch('/clubs'),
          apiFetch('/announcements'),
          apiFetch('/lost-found'),
          apiFetch('/maintenance'),
        ])
        setListings(listingData.listings)
        setEvents(eventData.events)
        setRegistered(eventData.events.filter(event => event.registered).map(event => event.id))
        setOffers(offerData.offers)
        setClubs(clubData.clubs)
        setAnnouncements(announcementData.announcements)
        setLostFoundItems(lostFoundData.items)
        setMaintenanceRequests(maintenanceData.requests)
      } catch (error) {
        setLoadError(error.message)
      } finally {
        setLoading(false)
      }
    }
    loadApplication()
  }, [])

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    let frame
    const raf = (time) => { lenis.raf(time); frame = requestAnimationFrame(raf) }
    frame = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(frame); lenis.destroy() }
  }, [])

  useEffect(() => {
    gsap.fromTo('.app-shell', { opacity: 0 }, { opacity: 1, duration: 0.65, ease: 'power2.out' })
    gsap.fromTo('.sidebar, .topbar, .hero-panel', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' })
  }, [])

  useEffect(() => {
    gsap.fromTo('.page-wrap > *', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: 'power3.out' })
  }, [activeView])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (activeView !== 'profile' || !profile) return undefined
    let cancelled = false
    apiFetch('/offers/my')
      .then(result => { if (!cancelled) setOffers(result.offers) })
      .catch(error => { if (!cancelled) notify(error.message, CircleHelp) })
    return () => { cancelled = true }
  }, [activeView, profile])

  const notify = (message, icon = Check) => setToast({ message, icon })
  const navigate = (view) => { setActiveView(view); setSidebarOpen(false); setNavigationOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const toggleSave = async (id) => {
    try {
      const result = await apiFetch(`/listings/${id}/save`, { method: 'PATCH' })
      setListings(items => items.map(item => item.id === id ? { ...item, saved: result.saved } : item))
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const toggleRegistration = async (id) => {
    const joined = registered.includes(id)
    try {
      const result = await apiFetch(`/events/${id}/registration`, { method: 'POST' })
      setRegistered(items => result.registered ? [...items, id] : items.filter(item => item !== id))
      setEvents(items => items.map(event => event.id === id ? { ...event, registered: result.registered } : event))
    } catch (error) { notify(error.message, CircleHelp); return }
    notify(joined ? 'Registration cancelled' : 'You’re on the guest list', joined ? CalendarDays : Ticket)
  }
  const addListing = async (listing) => {
    try {
      const result = await apiFetch('/listings', { method: 'POST', body: JSON.stringify(listing) })
      setListings(items => [result.listing, ...items])
      setShowCreate(false)
      notify('Your resource request is live', PackageOpen)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const sendOffer = async (id, message) => {
    try {
      await apiFetch(`/listings/${id}/offers`, { method: 'POST', body: JSON.stringify({ message }) })
      setSelectedListing(null)
      notify('Your message was sent to the student who posted the request', MessageCircle)
    } catch (error) { notify(error.message, CircleHelp) }
  }
  const closeListing = async (id) => {
    try {
      await apiFetch(`/listings/${id}/close`, { method: 'PATCH' })
      setListings(items => items.map(item => item.id === id ? { ...item, status: 'Fulfilled' } : item))
      notify('Request closed — marked as received', Check)
    } catch (error) { notify(error.message, CircleHelp) }
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
      const result = await apiFetch('/events', { method: 'POST', body: JSON.stringify(eventDraft) })
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
  if (loadError) return <div className="app-loading"><div className="brand-mark"><CircleHelp size={17} /></div><strong>CampusLoop is offline</strong><span>{loadError}</span><button className="button button-dark" onClick={() => window.location.reload()}>Try again</button></div>
  if (!profile) return <LoginScreen />

  return (
    <div className={`app-shell ${activeView === 'overview' ? 'overview-mode' : ''} ${activeView === 'exchange' ? 'exchange-mode' : ''} ${activeView === 'events' ? 'events-mode' : ''} ${activeView === 'profile' ? 'profile-mode' : ''}`}>
      {activeView === 'overview' || activeView === 'profile' ? null : <SiteVideoBackground />}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Leaf size={17} strokeWidth={2.5} /></div><span>campus<span>loop</span></span></div>
        <div className="campus-switcher"><div className="campus-avatar">NITW</div><div><strong>NITW</strong><span>Student space</span></div><ChevronRight size={15} /></div>
        <p className="nav-label">Workspace</p>
        <nav>{navItems.map(({ id, label, icon: Icon, count }) => <button key={id} className={`nav-item ${activeView === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={18} /><span>{label}</span>{count && <em>{count}</em>}</button>)}</nav>
        <div className="sidebar-spacer" />
        {activeView !== 'exchange' && <div className="sidebar-note"><Sparkles size={16} /><strong>Make campus yours.</strong><span>Small exchanges make a bigger place feel close.</span></div>}
        <button className="nav-item muted" onClick={() => navigate('profile')}><Settings size={18} /><span>Settings</span></button>
        <div className="sidebar-profile"><div className="avatar avatar-coral">{profile.name.split(' ').map(part => part[0]).join('')}</div><div><strong>{profile.name}</strong><span>Student account</span></div><button onClick={() => setShowAuth(true)} aria-label="Open account menu"><LogOut size={16} /></button></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(value => !value)} aria-label="Toggle navigation"><Menu size={20} /></button>
          <div className="breadcrumb"><span>NITW</span><ChevronRight size={14} /><strong>{navItems.find(item => item.id === activeView)?.label || 'Overview'}</strong></div>
          <div className="top-actions"><div className="search-mini"><Search size={16} /><input placeholder="Search campusloop" onChange={(event) => event.target.value && navigate('exchange')} /></div><button className="icon-button notification-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications"><Bell size={18} /><i /></button><button className="avatar avatar-coral top-avatar" onClick={() => navigate('profile')}>{profile.name.split(' ').map(part => part[0]).join('')}</button></div>
          {showNotifications && <div className="notification-pop"><div className="pop-header"><strong>Notifications</strong><span>2 new</span></div><div className="notification-row"><div className="notification-dot green" /><span><strong>Meera</strong> saved your calculator listing.<small>8 minutes ago</small></span></div><div className="notification-row"><div className="notification-dot orange" /><span><strong>Open mic</strong> is almost full.<small>Yesterday</small></span></div></div>}
        </header>

        <div className="page-wrap">
          {activeView === 'overview' && <Overview navigate={navigate} />}
          {activeView === 'exchange' && <Exchange listings={listings} onSave={toggleSave} onCreate={() => setShowCreate(true)} onOffer={setSelectedListing} currentUserId={profile.id} />}
          {activeView === 'announcements' && <AnnouncementsPage announcements={announcements} isAdmin={profile.role === 'admin'} onCreate={async (draft) => {
            const result = await apiFetch('/announcements', { method: 'POST', body: JSON.stringify(draft) })
            setAnnouncements(items => [result.announcement, ...items])
            notify('Announcement posted', Bell)
          }} onDelete={async (id) => {
            await apiFetch(`/announcements/${id}`, { method: 'DELETE' })
            setAnnouncements(items => items.filter(item => item.id !== id))
            notify('Announcement removed', Bell)
          }} />}
          {activeView === 'events' && <Events events={events} registered={registered} clubs={clubs} onRegister={toggleRegistration} onOpen={setSelectedEvent} onCreate={() => setShowEventCreate(true)} onRemove={removeEvent} />}
          {activeView === 'lost-found' && <LostFoundPage items={lostFoundItems} currentUserId={profile.id} isAdmin={profile.role === 'admin'} onCreate={async (draft) => {
            const result = await apiFetch('/lost-found', { method: 'POST', body: JSON.stringify(draft) })
            setLostFoundItems(items => [result.item, ...items])
            notify('Lost or found item reported', Compass)
          }} onResolve={async (id) => {
            const result = await apiFetch(`/lost-found/${id}/resolve`, { method: 'PUT' })
            setLostFoundItems(items => items.map(item => item.id === id ? { ...item, status: result.item.status } : item))
            notify('Report marked as resolved', Check)
          }} onDelete={async (id) => {
            await apiFetch(`/lost-found/${id}`, { method: 'DELETE' })
            setLostFoundItems(items => items.filter(item => item.id !== id))
            notify('Report removed', Compass)
          }} />}
          {activeView === 'maintenance' && <MaintenancePage requests={maintenanceRequests} currentUserId={profile.id} isAdmin={profile.role === 'admin'} onCreate={async (draft) => {
            const result = await apiFetch('/maintenance', { method: 'POST', body: JSON.stringify(draft) })
            setMaintenanceRequests(items => [result.request, ...items])
            notify('Maintenance request submitted', Settings)
          }} onUpdateStatus={async (id, status) => {
            const result = await apiFetch(`/maintenance/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
            setMaintenanceRequests(items => items.map(item => item.id === id ? { ...item, status: result.request.status } : item))
            notify('Status updated', Check)
          }} onConfirmResolved={async (id) => {
            const result = await apiFetch(`/maintenance/${id}/confirm`, { method: 'PUT' })
            setMaintenanceRequests(items => items.map(item => item.id === id ? { ...item, confirmedByUserAt: result.request.confirmedByUserAt } : item))
            notify('Resolution confirmed', Check)
          }} />}
          {activeView === 'profile' && <Profile profile={profile} onSave={updateProfile} clubs={clubs} onRequestClub={requestClubMembership} onApproveClubRequest={approveClubMembership} listings={listings} registered={registered} offers={offers} navigate={navigate} />}
          {activeView === 'profile' && <RequestHistory listings={listings.filter(item => item.ownerId === profile.id)} offers={offers} onCloseRequest={closeListing} />}
        </div>
      </main>

      <PageNavigation
        activeView={activeView}
        isOpen={navigationOpen}
        onToggle={() => setNavigationOpen(open => !open)}
        onNavigate={navigate}
        onSignOut={() => { sessionStorage.removeItem('campusloop-token'); window.location.reload() }}
      />
      {showCreate && <CreateListing onClose={() => setShowCreate(false)} onSubmit={addListing} />}
      {showEventCreate && <CreateEventModal clubs={clubs} onClose={() => setShowEventCreate(false)} onSubmit={createEvent} />}
      {selectedListing && <OfferModal listing={selectedListing} onClose={() => setSelectedListing(null)} onSubmit={message => sendOffer(selectedListing.id, message)} />}
      {showAuth && <AuthModal profile={profile} onClose={() => setShowAuth(false)} onSignedOut={() => { sessionStorage.removeItem('campusloop-token'); window.location.reload() }} />}
      {selectedEvent && <EventModal event={selectedEvent} registered={registered.includes(selectedEvent.id)} canViewGuestList={clubs.some(club => club.id === selectedEvent.clubId && club.isMember)} onClose={() => setSelectedEvent(null)} onRegister={() => { toggleRegistration(selectedEvent.id); setSelectedEvent(null) }} />}
      {toast && <div className="toast"><toast.icon size={17} /><span>{toast.message}</span></div>}
    </div>
  )
}

function PageNavigation({ activeView, isOpen, onToggle, onNavigate, onSignOut }) {
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
        {navItems.map(({ id, label, icon: Icon }) => (
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

function LoginScreen() {
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

  return <main className="mainframe-login">
    <MainframeVideo />
    <div className="mainframe-wash" />
    <section className="mainframe-hero" id="top">
      <aside className="mainframe-auth" id="auth">
        <p className="mainframe-auth-kicker">CAMPUSLOOP / {mode === 'login' ? 'STUDENT ACCESS' : 'NEW MEMBER'}</p>
        <h2>{mode === 'login' ? 'Welcome back.' : 'Join the loop.'}</h2>
        <form onSubmit={submit}>{mode === 'register' && <><label>Full name<input value={form.name} onChange={event => update('name', event.target.value)} placeholder="Maya Patel" required /></label><label>Branch<input value={form.branch} onChange={event => update('branch', event.target.value)} placeholder="Computer Science" required /></label><label>Year<input value={form.year} onChange={event => update('year', event.target.value)} placeholder="e.g. 3" required /></label><label>Hostel (optional)<input value={form.hostel} onChange={event => update('hostel', event.target.value)} placeholder="e.g. Godavari" /></label><label>Phone number<input type="tel" autoComplete="tel" value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="+91 98765 43210" minLength={7} maxLength={25} pattern="\+?[0-9().\-\s]{7,25}" required /></label><label>Administrator setup key (if configured)<input type="password" autoComplete="off" value={form.adminSetupKey} onChange={event => update('adminSetupKey', event.target.value)} /></label></>}<label>Campus email<input type="email" value={form.email} onChange={event => update('email', event.target.value)} placeholder="you@student.nitw.ac.in" required /></label>{mode === 'register' && <small className="registration-email-hint">Use your @student.nitw.ac.in email address.</small>}<label>Password<input type="password" value={form.password} onChange={event => update('password', event.target.value)} minLength={6} required /></label>{error && <p className="mainframe-form-error">{error}</p>}<button className="mainframe-submit" disabled={submitting}>{submitting ? 'Connecting...' : mode === 'login' ? 'Enter CampusLoop' : 'Create account'}<ArrowUpRight size={15} /></button></form>
        <button className="mainframe-switch" onClick={() => { const nextMode = mode === 'login' ? 'register' : 'login'; setMode(nextMode); setError(''); if (nextMode === 'register') update('email', '') }}>{mode === 'login' ? 'Create a student account' : 'Back to sign in'}</button>
      </aside>
    </section>
  </main>
}

function PageIntro({ eyebrow, title, body, action, onAction }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{body && <p className="intro-copy">{body}</p>}</div>{action && <button className="button button-dark" onClick={onAction}>{action}<Plus size={16} /></button>}</div>
}

function AnnouncementsPage({ announcements, isAdmin, onCreate, onDelete }) {
  const [form, setForm] = useState({ title: '', category: 'General', content: '', pinned: false })
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
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
          {visible.length === 0 ? <div className="empty-state"><strong>No announcements yet</strong><span>Post the first campus notice.</span></div> : visible.map(item => <article key={item.id} className="detail-card"><div className="detail-top"><span className="chip">{item.category || 'General'}</span>{item.pinned && <span className="chip accent">Pinned</span>}</div><h4>{item.title}</h4><p>{item.content}</p><div className="detail-footer"><small>{item.author || 'Campus admin'}</small><small>{new Date(item.createdAt).toLocaleDateString()}</small>{isAdmin && onDelete && <button type="button" className="text-button" onClick={() => onDelete(item.id)}>Delete</button>}</div></article>)}
        </div>
      </div>
      {isAdmin && <form className="panel-block form-panel" onSubmit={async event => { event.preventDefault(); await onCreate(form); setForm({ title: '', category: 'General', content: '', pinned: false }) }}>
        <h3 className="panel-title">Post a notice</h3>
        <label>Title<input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Exam schedule update" required /></label>
        <label>Category<select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))}><option>General</option><option>Academic</option><option>Administrative</option><option>Club</option><option>Health</option></select></label>
        <label>Details<textarea value={form.content} onChange={event => setForm(current => ({ ...current, content: event.target.value }))} rows="5" placeholder="Share the update or reminder here..." required /></label>
        <label className="checkbox-row"><input type="checkbox" checked={form.pinned} onChange={event => setForm(current => ({ ...current, pinned: event.target.checked }))} /> Pin this announcement</label>
        <button type="submit" className="button button-dark">Publish</button>
      </form>}
    </div>
  </div>
}

function LostFoundPage({ items, currentUserId, isAdmin, onCreate, onResolve, onDelete }) {
  const [form, setForm] = useState({ title: '', type: 'lost', description: '', location: '', date: '', image: '' })
  const [filter, setFilter] = useState('all')
  const visible = items.filter(item => filter === 'all' || item.type === filter)

  return <div className="module-shell">
    <PageIntro eyebrow="LOST & FOUND" title="Help campus items find home." body="Report a lost item or match a found one with its owner." />
    <div className="module-toolbar"><div className="filter-pills"><button type="button" className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>All</button><button type="button" className={filter === 'lost' ? 'selected' : ''} onClick={() => setFilter('lost')}>Lost</button><button type="button" className={filter === 'found' ? 'selected' : ''} onClick={() => setFilter('found')}>Found</button></div></div>
    <div className="details-grid">
      <div className="panel-block">
        <h3 className="panel-title">Recent reports</h3>
        <div className="stack-list">
          {visible.length === 0 ? <div className="empty-state"><strong>No reports yet</strong><span>Start with the first lost or found post.</span></div> : visible.map(item => <article key={item.id} className="detail-card"><div className="detail-top"><span className="chip">{item.type}</span><span className={`chip ${item.status === 'resolved' ? 'muted' : 'accent'}`}>{item.status === 'resolved' ? 'Resolved' : 'Open'}</span></div><h4>{item.title}</h4>{item.image && <img src={item.image} alt={item.title} className="detail-image" />}<p>{item.description}</p><div className="meta-row"><span>{item.location}</span><span>{item.date || 'Date unspecified'}</span></div><div className="detail-footer"><span>{item.contactEmail ? <a href={`mailto:${item.contactEmail}`}>{item.contactName || item.contactEmail}</a> : item.contactName || 'Campus student'}{item.contactPhone && <> · <a href={`tel:${item.contactPhone}`}>{item.contactPhone}</a></>}</span>{(item.reporterId === currentUserId || isAdmin) && item.status !== 'resolved' && <button type="button" className="text-button" onClick={() => onResolve(item.id)}>Resolve</button>} {(item.reporterId === currentUserId || isAdmin) && <button type="button" className="text-button" onClick={() => onDelete(item.id)}>Delete</button>}</div></article>)}
        </div>
      </div>
      <form className="panel-block form-panel" onSubmit={async event => { event.preventDefault(); await onCreate(form); setForm({ title: '', type: 'lost', description: '', location: '', date: '', image: '' }) }}>
        <h3 className="panel-title">Report item</h3>
        <label>Item name<input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Blue water bottle" required /></label>
        <label>Type<select value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value }))}><option value="lost">Lost item</option><option value="found">Found item</option></select></label>
        <label>Location<input value={form.location} onChange={event => setForm(current => ({ ...current, location: event.target.value }))} placeholder="Library second floor" required /></label>
        <label>Date<input type="date" value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} /></label>
        <label>Image URL<input value={form.image} onChange={event => setForm(current => ({ ...current, image: event.target.value }))} placeholder="https://..." /></label>
        <label>Details<textarea value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} rows="4" placeholder="Describe the item and any identifying details." required /></label>
        <button type="submit" className="button button-dark">Submit report</button>
      </form>
    </div>
  </div>
}

function MaintenancePage({ requests, currentUserId, isAdmin, onCreate, onUpdateStatus, onConfirmResolved }) {
  const [form, setForm] = useState({ title: '', category: 'Electrical', location: '', description: '', image: '' })
  const statuses = ['Submitted', 'In Progress', 'Resolved']

  return <div className="module-shell">
    <PageIntro eyebrow="CAMPUS MAINTENANCE" title="Submit and track help requests." body="Report facilities issues and track them through submission to resolution." />
    <div className="details-grid">
      <div className="panel-block">
        <h3 className="panel-title">Open requests</h3>
        <div className="stack-list">
          {(requests || []).length === 0 ? <div className="empty-state"><strong>No maintenance requests</strong><span>Report the next campus issue.</span></div> : (requests || []).map(item => <article key={item.id} className="detail-card"><div className="detail-top"><span className="chip">{item.category}</span><span className={`chip ${item.status === 'Resolved' ? 'muted' : 'accent'}`}>{item.status}</span></div><h4>{item.title}</h4>{item.image && <img src={item.image} alt={item.title} className="detail-image" />}<p>{item.description}</p><div className="meta-row"><span>{item.location}</span><span>{new Date(item.createdAt).toLocaleDateString()}</span></div><div className="detail-footer"><small>{item.userName || 'Student'}{item.confirmedByUserAt ? ' · Resolution confirmed' : ''}</small>{isAdmin && <div className="status-actions">{statuses.filter(status => status !== item.status).map(status => <button key={status} type="button" className="text-button" onClick={() => onUpdateStatus(item.id, status)}>{status}</button>)}</div>}{item.userId === currentUserId && item.status === 'Resolved' && !item.confirmedByUserAt && <button type="button" className="text-button" onClick={() => onConfirmResolved(item.id)}>Confirm resolved</button>}</div></article>)}
        </div>
      </div>
      <form className="panel-block form-panel" onSubmit={async event => { event.preventDefault(); await onCreate(form); setForm({ title: '', category: 'Electrical', location: '', description: '', image: '' }) }}>
        <h3 className="panel-title">Submit request</h3>
        <label>Issue title<input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Broken corridor light" required /></label>
        <label>Category<select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))}><option>Electrical</option><option>Water</option><option>Cleanliness</option><option>Furniture</option><option>Internet</option></select></label>
        <label>Location<input value={form.location} onChange={event => setForm(current => ({ ...current, location: event.target.value }))} placeholder="Block A, corridor 2" required /></label>
        <label>Image URL<input value={form.image} onChange={event => setForm(current => ({ ...current, image: event.target.value }))} placeholder="https://..." /></label>
        <label>Details<textarea value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} rows="4" placeholder="Describe the issue and when it started." required /></label>
        <button type="submit" className="button button-dark">Send request</button>
      </form>
    </div>
  </div>
}

function Overview({ navigate }) {
  return <main className="asme-overview">
    <section className="asme-hero" id="asme-top">
      <video className="asme-hero-video" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4" muted autoPlay playsInline preload="auto" loop />
      <div className="asme-hero-shade" />
      <div className="asme-hero-content"><h1>Make campus feel <em>closer</em>.</h1><button className="asme-manifesto liquid-glass" onClick={() => document.querySelector('#asme-about')?.scrollIntoView({ behavior: 'smooth' })}>Explore CampusLoop</button></div>
    </section>
    <AboutSection />
    <FeaturedVideoSection />
    <PhilosophySection />
    <ServicesSection navigate={navigate} />
  </main>
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

function Exchange({ listings, onSave, onCreate, onOffer, currentUserId }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All items')
  const filtered = listings.filter(item => item.postType === 'wanted' && item.status === 'Open' && `${item.title} ${item.category} ${item.owner}`.toLowerCase().includes(query.toLowerCase()) && (category === 'All items' || item.category === category))
  return <>
    <PageIntro eyebrow="RESOURCE EXCHANGE" title="Ask for what you need." body="Post a resource request. If another student has it, they can message you directly." action="Request a resource" onAction={onCreate} />
    <section className="module-toolbar">
      <div className="search-field"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search requested resources..." /></div>
      <div className="filter-pills">{['All items', 'Books', 'Electronics', 'Study gear', 'Room & living'].map(item => <button className={category === item ? 'selected' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <span className="result-count">{filtered.length} results</span>
    </section>
    <div className="exchange-layout">
      <aside className="exchange-aside">
        <div className="aside-card dark-card"><Sparkles size={21} /><strong>Have what<br />someone needs?</strong><span>Send them a message and offer to help.</span></div>
        <div className="aside-filter">
          <p className="eyebrow">How it works</p>
          <div className="step"><b>01</b><span><strong>Post a request</strong><small>Describe what you need</small></span></div>
          <div className="step"><b>02</b><span><strong>Get a message</strong><small>Someone can offer the item</small></span></div>
          <div className="step"><b>03</b><span><strong>Close it when done</strong><small>Mark it received in your profile</small></span></div>
        </div>
      </aside>
      <section className="listing-grid">
        {filtered.map(item => <ListingCard key={item.id} item={item} isOwner={item.ownerId === currentUserId} onSave={() => onSave(item.id)} onOffer={() => onOffer(item)} />)}
        {filtered.length === 0 && <div className="empty-state"><Search size={28} /><strong>No open requests yet.</strong><span>Post what you need, and a student who has it can message you.</span></div>}
      </section>
    </div>
  </>
}

function formatPostedDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : 'Date unavailable'
}

function ListingCard({ item, onSave, onOffer, isOwner }) {
  return <article className="listing-card">
    <div className="listing-image">
      {item.image ? <img src={item.image} alt="" /> : <div className="listing-placeholder"><PackageOpen size={32} /></div>}
      <span className="listing-mode">Looking for</span>
      <button className={`save-button ${item.saved ? 'saved' : ''}`} onClick={onSave} aria-label="Save request"><Heart size={17} fill={item.saved ? 'currentColor' : 'none'} /></button>
    </div>
    <div className="listing-body">
      <div className="listing-meta"><CalendarDays size={13} /><span>Posted {formatPostedDate(item.createdAt)}</span></div>
      <h3>{item.title}</h3>
      {item.description && <p className="listing-description">{item.description}</p>}
      <div className="listing-footer">
        <div className={`avatar avatar-${item.color}`}>{item.initials}</div>
        <span><strong>{item.owner}</strong><small>{item.category}</small></span>
        {isOwner ? <span className="request-owner-label">Your request</span> : <button className="request-button" onClick={onOffer}>I have this</button>}
      </div>
    </div>
  </article>
}

function Events({ events: eventItems, registered, clubs, onRegister, onOpen, onCreate, onRemove }) {
  return <LumoraEvents events={eventItems} registered={registered} clubs={clubs} onRegister={onRegister} onOpen={onOpen} onCreate={onCreate} onRemove={onRemove} />
}

const lumoraVideos = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4',
]
function LumoraEvents({ events, registered, clubs, onRegister, onOpen, onCreate, onRemove }) {
  const [activeEvent, setActiveEvent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [readyVideos, setReadyVideos] = useState([])
  const pointerStart = useRef(null)
  const cooldown = useRef(null)
  const event = events[activeEvent % Math.max(events.length, 1)]
  const activeVideo = activeEvent % lumoraVideos.length
  const memberClubIds = clubs.filter(club => club.isMember).map(club => club.id)
  const canRemove = event?.date && event.date < new Date().toISOString().slice(0, 10) && memberClubIds.includes(event.clubId)

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
        <div className="lumora-actions"><button className="lumora-primary" onClick={() => onRegister(event.id)}>{registered.includes(event.id) ? 'Going' : 'Join event'}<ArrowUpRight size={15} /></button><button className="lumora-secondary liquid-glass" onClick={() => onOpen(event)}>View details</button>{canRemove && <button className="lumora-secondary liquid-glass" onClick={() => onRemove(event.id)}>Remove past event</button>}</div>
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
        {club.pendingRequests.length > 0 && <div className="club-pending-requests">
          <span>Membership requests</span>
          {club.pendingRequests.map(joinRequest => <div key={joinRequest.id}><strong>{joinRequest.name}</strong><button onClick={() => onApprove(club.id, joinRequest.id)}>Approve</button></div>)}
        </div>}
      </article>)}
    </div>
    <p className="account-clubs-note">A current club member must approve your request. Only approved members can post or remove events for their club.</p>
  </section>
}

const accountVideoUrls = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_030107_874273ea-684a-4e90-bbb6-8fdfde48d53d.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_032424_3c9c2a9d-807b-4482-80e6-dd6d9dfd4545.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260627_094019_4214ea73-b963-46a4-8327-61489192de99.mp4',
]

function AccountHero({ profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => profileDraft(profile))
  const [saving, setSaving] = useState(false)
  const [activeVideo, setActiveVideo] = useState(0)
  useEffect(() => setDraft(profileDraft(profile)), [profile])
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const interval = setInterval(() => setActiveVideo(index => (index + 1) % accountVideoUrls.length), 12000)
    return () => clearInterval(interval)
  }, [])
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
    <div className="account-video-stack" aria-hidden="true">{accountVideoUrls.map((source, index) => <video key={source} src={source} className={activeVideo === index ? 'is-active' : ''} muted autoPlay loop playsInline preload={index === 0 ? 'auto' : 'metadata'} />)}</div>
    <div className="account-video-shade account-profile-shade" aria-hidden="true" />
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

function RequestHistory({ listings, offers, onCloseRequest }) {
  return <section className="request-history">
    <div className="section-heading"><div><p className="eyebrow">RESOURCE EXCHANGE</p><h2>Your requests &amp; messages</h2></div></div>
    <div className="activity-columns">
      <div>
        <h3>My resource requests</h3>
        {listings.length === 0 ? <p className="empty-copy">You haven’t requested anything yet.</p> : <div className="request-history-list">{listings.map(item => <div className="request-row" key={item.id}>
          <span><strong>{item.title}</strong><small>{formatPostedDate(item.createdAt)} · {item.status === 'Open' ? 'Open' : 'Received'}</small></span>
          {item.status === 'Open' && <button className="close-request-button" onClick={() => onCloseRequest(item.id)}>Mark received</button>}
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

function CreateListing({ onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', category: 'Books', description: '', image: '' })
  const [imageError, setImageError] = useState('')
  const loadImage = async file => {
    if (!file) return false
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setImageError('Choose a JPEG, PNG, or WebP image under 8 MB.')
      return false
    }
    try {
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
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      const resizedImage = canvas.toDataURL('image/jpeg', .76)
      if (resizedImage.length > 3 * 1024 * 1024) throw new Error('That image is still too large after resizing. Choose a smaller photo.')
      setForm(current => ({ ...current, image: resizedImage }))
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
  const submit = event => {
    event.preventDefault()
    if (!form.title.trim()) return
    onSubmit(form)
  }
  return <div className="modal-backdrop"><form className="modal listing-modal" onPaste={handlePaste} onSubmit={submit}>
    <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
    <p className="eyebrow">RESOURCE REQUEST</p><h2>What do you need?</h2>
    <p className="modal-copy">Post what you’re looking for. Students who have it can message you with an offer.</p>
    <label>Resource name<input autoFocus maxLength={120} required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. A graphing calculator" /></label>
    <label>Category<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}><option>Books</option><option>Electronics</option><option>Study gear</option><option>Room & living</option></select></label>
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
    <div className="modal-actions"><button type="button" className="button button-light" onClick={onClose}>Cancel</button><button className="button button-dark" type="submit">Post request <ArrowUpRight size={16} /></button></div>
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

function AuthModal({ profile, onClose, onSignedOut }) { return <div className="modal-backdrop"><div className="modal auth-modal"><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="auth-orb"><Leaf size={22} /></div><p className="eyebrow">CAMPUSLOOP ACCOUNT</p><h2>Welcome back, {profile.name.split(' ')[0]}.</h2><p className="modal-copy">Your account is securely connected to the CampusLoop API. Your listings, registrations, and profile changes are saved for your next visit.</p><div className="signed-in"><div className="avatar avatar-coral">{profile.name.split(' ').map(part => part[0]).join('')}</div><span><strong>{profile.email}</strong><small>Student account · NITW</small></span><Check size={18} /></div><button className="button button-dark full-button" onClick={onClose}>Continue to CampusLoop <ArrowUpRight size={16} /></button><button className="sign-out" onClick={onSignedOut}>Sign out</button></div></div> }

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
      <div className="event-modal-facts"><span><CalendarDays size={16} />{event.date ? new Date(`${event.date}T00:00:00`).toLocaleDateString() : 'Date to be announced'}</span><span><Clock3 size={16} />{event.time}</span><span><Compass size={16} />{event.place}</span></div>
      {canViewGuestList && <section className="event-guest-list" aria-label={`Guest list for ${event.title}`}>
        <div className="event-guest-list-heading"><strong>Guest list</strong>{guestList && <span>{guestList.length} going</span>}</div>
        {guestListLoading ? <p>Loading attendees…</p> : guestListError ? <p role="alert">{guestListError}</p> : guestList?.length ? <ul>{guestList.map((attendee, index) => <li key={`${attendee.email}-${index}`}><strong>{attendee.name}</strong><a href={`mailto:${attendee.email}`}>{attendee.email}</a></li>)}</ul> : <p>No students have joined this event yet.</p>}
      </section>}
      <button className={`button ${registered ? 'button-success' : 'button-dark'} full-button`} onClick={onRegister}>{registered ? <><Check size={15} /> You’re going</> : <>Join this event <Ticket size={15} /></>}</button>
    </div>
    </div>
  </div>
}

function CreateEventModal({ clubs, onClose, onSubmit }) {
  const memberClubs = clubs.filter(club => club.isMember)
  const [draft, setDraft] = useState({ title: '', type: 'Campus event', date: '', time: '', place: '', description: '', clubId: memberClubs[0]?.id || '' })
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
      <label>Details (optional)<textarea rows={3} maxLength={500} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label>
      <p className="modal-copy">Each club can list up to two upcoming events at a time.</p>
      <div className="modal-actions"><button type="button" className="button button-light" onClick={onClose} disabled={submitting}>Cancel</button><button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'Posting event…' : <>Post event <ArrowUpRight size={16} /></>}</button></div>
    </> : <><p className="modal-copy">You need approved membership in a club before you can post its events. Request membership from your profile.</p><div className="modal-actions"><button type="button" className="button button-dark" onClick={onClose}>Close</button></div></>}
  </form></div>
}

createRoot(document.getElementById('root')).render(<App />)
