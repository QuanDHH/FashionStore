import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Bell,
  Box, Check, ChevronDown, CircleHelp, CreditCard, Eye, Heart, LayoutDashboard,
  LogOut, Menu, Package, Plus, Search, Settings, Shield, ShoppingBag,
  ShoppingCart, Store, X,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import './market.css'

type Product = {
  id: number
  name: string
  shop: string
  price: number
  category: string
  image: string
  label?: string
  tone: string
}

type Workspace = 'customer' | 'shop' | 'admin'

const products: Product[] = [
  { id: 1, name: 'Relaxed linen shirt', shop: 'Studio August', price: 68, category: 'Clothing', image: 'photo-1598033129183-c4f50c736f10', label: 'JUST IN', tone: 'sage' },
  { id: 2, name: 'Everyday shoulder bag', shop: 'Forma Goods', price: 94, category: 'Accessories', image: 'photo-1584917865442-de89df76afd3', label: 'BESTSELLER', tone: 'rose' },
  { id: 3, name: 'Utility overshirt', shop: 'Northline', price: 112, category: 'Clothing', image: 'photo-1591047139829-d91aecb6caea', tone: 'blue' },
  { id: 4, name: 'Soft leather loafer', shop: 'Morrow', price: 138, category: 'Shoes', image: 'photo-1543163521-1bf539c55dd2', label: 'LOW STOCK', tone: 'sand' },
  { id: 5, name: 'Sunday knit vest', shop: 'Studio August', price: 76, category: 'Clothing', image: 'photo-1618354691373-d851c5c3a990', tone: 'yellow' },
  { id: 6, name: 'Sculpted silver hoops', shop: 'Forma Goods', price: 42, category: 'Accessories', image: 'photo-1535632066927-ab7c9ab60908', tone: 'lilac' },
  { id: 7, name: 'Canvas weekend tote', shop: 'Morrow', price: 58, category: 'Accessories', image: 'photo-1590874103328-eac38a683ce7', tone: 'mint' },
  { id: 8, name: 'City runner sneaker', shop: 'Northline', price: 126, category: 'Shoes', image: 'photo-1542291026-7eec264c27ff', tone: 'peach' },
]

const imageUrl = (id: string, width = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const money = (amount: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount)
const fetchProducts = async () => products

function App() {
  const [workspace, setWorkspace] = useState<Workspace>('customer')
  const [category, setCategory] = useState('All items')
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useState<number[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [sendingLink, setSendingLink] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [notice, setNotice] = useState('')
  const [orderStatuses, setOrderStatuses] = useState(['Processing', 'Ready to ship', 'Processing'])
  const queryClient = useQueryClient()
  const { data: catalog = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts })
  const addProduct = useMutation({
    mutationFn: async (): Promise<Product> => ({
      id: Date.now(), name: 'New studio essential', shop: 'Studio August', price: 84,
      category: 'Clothing', image: 'photo-1529139574466-a303027c1d8b', label: 'JUST ADDED', tone: 'mint',
    }),
    onSuccess: (product) => {
      queryClient.setQueryData<Product[]>(['products'], (current = []) => [product, ...current])
      setNotice('New product added to your catalog')
    },
  })

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const visibleProducts = useMemo(() => catalog.filter((product) => {
    const matchesCategory = category === 'All items' || product.category === category
    const query = search.trim().toLowerCase()
    return matchesCategory && (!query || `${product.name} ${product.shop} ${product.category}`.toLowerCase().includes(query))
  }), [catalog, category, search])

  const sendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) {
      setAuthMessage('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.local to enable sign-in.')
      return
    }
    setSendingLink(true)
    setAuthMessage('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    setSendingLink(false)
    setAuthMessage(error ? error.message : 'Check your inbox for your sign-in link.')
  }
  const toggleFavorite = (id: number) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const cycleOrder = (index: number) => setOrderStatuses((current) => current.map((status, row) => row !== index ? status : status === 'Processing' ? 'Ready to ship' : 'Processing'))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Thread home"><span className="brand-mark">t<span>.</span></span><span>thread<span className="brand-market"> / market</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switcher" role="group" aria-label="Choose workspace">
          <WorkspaceButton active={workspace === 'customer'} icon={<ShoppingBag size={16} />} onClick={() => setWorkspace('customer')}>Shopper</WorkspaceButton>
          <WorkspaceButton active={workspace === 'shop'} icon={<Store size={16} />} onClick={() => setWorkspace('shop')}>My shop</WorkspaceButton>
          <WorkspaceButton active={workspace === 'admin'} icon={<Shield size={16} />} onClick={() => setWorkspace('admin')}>Platform</WorkspaceButton>
        </div>
        <div className="sidebar-rule" />
        {workspace === 'customer' ? <>
          <div className="workspace-label">DISCOVER</div>
          <nav className="side-nav" aria-label="Shopping categories">
            {['All items', 'Clothing', 'Shoes', 'Accessories'].map((item) => <button className={category === item ? 'nav-item active' : 'nav-item'} key={item} onClick={() => setCategory(item)}>{item === 'All items' ? <LayoutDashboard size={17} /> : item === 'Clothing' ? <Package size={17} /> : item === 'Shoes' ? <Box size={17} /> : <ShoppingBag size={17} />}<span>{item}</span>{item === 'All items' && <span className="nav-count">08</span>}</button>)}
          </nav>
          <div className="sidebar-rule second-rule" />
          <div className="workspace-label">YOUR ACCOUNT</div>
          <nav className="side-nav">
            <button className="nav-item" onClick={() => setNotice(`${favorites.length} saved ${favorites.length === 1 ? 'piece' : 'pieces'}`)}><Heart size={17} /><span>Saved pieces</span><span className="nav-count">{favorites.length.toString().padStart(2, '0')}</span></button>
            <button className="nav-item" onClick={() => setNotice('Your recent orders will appear here')}><CreditCard size={17} /><span>Orders</span></button>
          </nav>
        </> : workspace === 'shop' ? <>
          <div className="workspace-label">STUDIO AUGUST</div>
          <nav className="side-nav">
            <button className="nav-item active"><LayoutDashboard size={17} /><span>Overview</span></button>
            <button className="nav-item" onClick={() => setNotice('Showing all 24 active listings')}><Package size={17} /><span>Products</span><span className="nav-count">24</span></button>
            <button className="nav-item" onClick={() => setNotice('You have 12 orders to fulfill')}><ShoppingBag size={17} /><span>Orders</span><span className="nav-count alert-count">12</span></button>
            <button className="nav-item" onClick={() => setNotice('Customer messages are up to date')}><Bell size={17} /><span>Messages</span></button>
          </nav>
          <div className="sidebar-rule second-rule" /><button className="nav-item" onClick={() => setNotice('Shop settings opened')}><Settings size={17} /><span>Shop settings</span></button>
        </> : <>
          <div className="workspace-label">SYSTEM</div>
          <nav className="side-nav">
            <button className="nav-item active"><LayoutDashboard size={17} /><span>Overview</span></button>
            <button className="nav-item" onClick={() => setNotice('Reviewing 18 registered shops')}><Store size={17} /><span>Shops</span><span className="nav-count">18</span></button>
            <button className="nav-item" onClick={() => setNotice('Viewing platform orders')}><ShoppingBag size={17} /><span>Transactions</span></button>
            <button className="nav-item" onClick={() => setNotice('All system signals are nominal')}><Activity size={17} /><span>System health</span></button>
          </nav>
          <div className="sidebar-rule second-rule" /><button className="nav-item" onClick={() => setNotice('Platform settings opened')}><Settings size={17} /><span>Configuration</span></button>
        </>}
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={16} /></div><p>Need a hand?</p><span>We're one message away.</span><button onClick={() => setNotice('Support will be with you shortly')}>Contact support <ArrowRight size={13} /></button></div>
          <button className="profile-row" onClick={() => setAuthOpen(true)}><span className="avatar">{session?.user.email?.slice(0, 1).toUpperCase() || 'J'}</span><span className="profile-copy"><strong>{session?.user.email?.split('@')[0] || 'Jamie Parker'}</strong><small>{session ? 'Signed in' : 'Personal account'}</small></span><ChevronDown size={15} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Thread</span><span className="crumb-slash">/</span><strong>{workspace === 'customer' ? 'Marketplace' : workspace === 'shop' ? 'Shop dashboard' : 'Platform overview'}</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={16} /><input aria-label="Search products" placeholder="Search the marketplace" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice('You are all caught up')}><Bell size={18} /><i /></button>
            <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${cartCount} items`}><ShoppingCart size={17} /><span>Bag</span><b>{cartCount.toString().padStart(2, '0')}</b></button>
            <button className="mobile-menu" aria-label="Open menu" onClick={() => setNotice('Choose a workspace from the sidebar')}><Menu size={20} /></button>
          </div>
        </header>

        {workspace === 'customer' ? <section className="customer-view page-content" id="home">
          <div className="welcome-line"><span className="eyebrow"><i /> THE INDEPENDENT EDIT</span><span className="date-note">MONDAY, OCTOBER 06</span></div>
          <section className="editorial-hero">
            <img src={imageUrl('photo-1529139574466-a303027c1d8b', 1600)} alt="A model in a sculptural, everyday outfit" />
            <div className="hero-shade" /><div className="hero-copy"><span className="hero-kicker">NEW SEASON / VOL. 04</span><h1>Good things<br />get <em>wear.</em></h1><p>Thoughtful pieces from independent labels.<br />Made to live in, not just look at.</p><button className="hero-cta" onClick={() => { setCategory('All items'); document.getElementById('new-arrivals')?.scrollIntoView({ behavior: 'smooth' }) }}>Explore the edit <ArrowRight size={16} /></button></div>
            <div className="hero-index"><span>01</span><i /> 04</div><div className="hero-caption">INDEPENDENT DESIGNERS, CONSIDERED DAILY</div>
          </section>
          <section className="product-section" id="new-arrivals">
            <div className="section-heading"><div><span className="eyebrow section-eyebrow">CURATED FOR YOU</span><h2>Find your <em>new favorite.</em></h2></div><button className="text-link" onClick={() => { setCategory('All items'); setSearch('') }}>View all pieces <ArrowRight size={15} /></button></div>
            <div className="category-tabs" role="group" aria-label="Filter products">{['All items', 'Clothing', 'Shoes', 'Accessories'].map((item) => <button className={category === item ? 'category-tab selected' : 'category-tab'} key={item} onClick={() => setCategory(item)}>{item}</button>)}<span className="result-count">{visibleProducts.length} PIECES</span></div>
            {isLoading ? <div className="loading-state">Gathering the latest pieces...</div> : visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product, index) => <article className="product-card" key={product.id} style={{ animationDelay: `${index * 55}ms` }}>
              <div className={`product-image ${product.tone}`}><img src={imageUrl(product.image, 640)} alt={product.name} loading="lazy" />{product.label && <span className="product-label">{product.label}</span>}<button className={favorites.includes(product.id) ? 'favorite-button favorited' : 'favorite-button'} aria-label={favorites.includes(product.id) ? `Remove ${product.name} from saved pieces` : `Save ${product.name}`} onClick={() => toggleFavorite(product.id)}><Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} /></button><button className="quick-add" onClick={() => { setCartCount((count) => count + 1); setNotice(`${product.name} added to your bag`) }}>Add to bag <Plus size={14} /></button></div>
              <div className="product-info"><div><span className="product-shop">{product.shop}</span><h3>{product.name}</h3></div><span className="product-price">{money(product.price)}</span></div>
            </article>)}</div> : <div className="empty-state">No pieces match that search. Try another name or category.</div>}
          </section>
          <footer className="customer-footer"><span>GOOD STYLE, BETTER STORIES.</span><span>Independent by nature. Together by design.</span></footer>
        </section> : workspace === 'shop' ? <SellerDashboard onAdd={() => addProduct.mutate()} adding={addProduct.isPending} orderStatuses={orderStatuses} onCycleOrder={cycleOrder} notice={setNotice} /> : <AdminDashboard notice={setNotice} />}
      </main>

      {cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-heading"><div><span className="eyebrow section-eyebrow">YOUR SELECTION</span><h2>Your bag <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={19} /></button></div>{cartCount ? <><div className="cart-filled"><div className="cart-product-thumb"><img src={imageUrl(products[0].image, 180)} alt="" /></div><div><strong>Curated pieces</strong><span>{cartCount} {cartCount === 1 ? 'item' : 'items'} in your bag</span></div><strong>{money(68 * cartCount)}</strong></div><div className="cart-note"><Check size={15} /> You’re supporting independent makers.</div><button className="checkout-button" onClick={() => { setCartOpen(false); setNotice('Checkout is ready to connect to your payment provider') }}>Continue to checkout <ArrowRight size={16} /></button></> : <div className="cart-empty"><div><ShoppingBag size={22} /></div><h3>Your bag is taking a breather.</h3><p>When something feels right, it’ll be here.</p><button className="primary-button" onClick={() => setCartOpen(false)}>Explore the edit</button></div>}</aside></div>}

      {authOpen && <div className="modal-backdrop" onClick={() => setAuthOpen(false)}><section className="auth-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close sign in"><X size={19} /></button><span className="brand-mark modal-mark">t<span>.</span></span><span className="eyebrow section-eyebrow">A GOOD PLACE TO COME BACK TO</span><h2>{session ? 'You’re signed in.' : 'Welcome to Thread.'}</h2><p>{session ? session.user.email : 'Sign in to keep your saved pieces and orders close.'}</p>{session ? <button className="checkout-button" onClick={async () => { await supabase?.auth.signOut(); setAuthOpen(false) }}><LogOut size={16} /> Sign out</button> : <form onSubmit={sendMagicLink}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className="checkout-button" type="submit" disabled={sendingLink}>{sendingLink ? 'Sending link...' : 'Send me a sign-in link'} <ArrowRight size={16} /></button>{authMessage && <p className="auth-message">{authMessage}</p>}</form>}</section></div>}
      {notice && <div className="toast"><Check size={15} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={14} /></button></div>}
    </div>
  )
}

function WorkspaceButton({ active, icon, onClick, children }: { active: boolean; icon: ReactNode; onClick: () => void; children: string }) {
  return <button className={active ? 'workspace-option active' : 'workspace-option'} onClick={onClick}>{icon}<span>{children}</span>{active && <span className="switch-dot" />}</button>
}

function Metric({ label, value, change, up, detail, icon }: { label: string; value: string; change: string; up: boolean; detail: string; icon: ReactNode }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className={up ? 'metric-change positive' : 'metric-change negative'}>{up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{change}</span><span>{detail}</span></div></article>
}

function Traffic({ label, amount, width, color }: { label: string; amount: string; width: string; color: string }) {
  return <div className="traffic-row"><div className="traffic-label"><span>{label}</span><strong>{amount}</strong></div><div className="traffic-track"><i className={color} style={{ width }} /></div></div>
}

function SellerDashboard({ onAdd, adding, orderStatuses, onCycleOrder, notice }: { onAdd: () => void; adding: boolean; orderStatuses: string[]; onCycleOrder: (index: number) => void; notice: (message: string) => void }) {
  const orders = [['#TH-2481', 'Maya Chen', 'Oct 06, 2025', '2 items', '$184'], ['#TH-2480', 'Alex Rivera', 'Oct 06, 2025', '1 item', '$68'], ['#TH-2479', 'Sam Wilson', 'Oct 05, 2025', '3 items', '$246']]
  return <section className="page-content dashboard-view">
    <div className="dashboard-heading"><div><span className="eyebrow section-eyebrow">MONDAY, OCTOBER 06, 2025</span><h1>Your shop, <em>in focus.</em></h1><p>A little snapshot of how Studio August is doing.</p></div><button className="primary-button" onClick={onAdd} disabled={adding}><Plus size={16} /> {adding ? 'Adding...' : 'Add product'}</button></div>
    <div className="metric-grid"><Metric label="Gross sales" value="$8,420" change="18.4%" up detail="vs. last month" icon={<CreditCard size={18} />} /><Metric label="Orders" value="126" change="12.8%" up detail="vs. last month" icon={<ShoppingBag size={18} />} /><Metric label="Shop visits" value="3,842" change="4.2%" up detail="vs. last month" icon={<Eye size={18} />} /><Metric label="Returns" value="2.1%" change="0.6%" up={false} detail="vs. last month" icon={<ArrowDownRight size={18} />} /></div>
    <div className="dashboard-columns"><section className="panel sales-panel"><div className="panel-heading"><div><span className="eyebrow section-eyebrow">PERFORMANCE</span><h2>Sales overview</h2></div><button className="select-button">Last 7 days <ChevronDown size={14} /></button></div><div className="sales-summary"><strong>$2,840.00</strong><span className="positive"><ArrowUpRight size={14} /> 18.4%</span><span>compared to last week</span></div><div className="chart-area" aria-label="Sales chart showing a rising trend through the week"><div className="chart-y-labels"><span>$1,000</span><span>$750</span><span>$500</span><span>$250</span><span>$0</span></div><div className="chart-main"><div className="chart-grid-lines"><i /><i /><i /><i /><i /></div><svg className="sales-chart" viewBox="0 0 640 188" preserveAspectRatio="none" role="img" aria-label="Weekly revenue trend"><defs><linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d85c43" stopOpacity=".2" /><stop offset="100%" stopColor="#d85c43" stopOpacity="0" /></linearGradient></defs><path d="M0 154 C32 151 44 122 84 133 S139 145 171 104 S228 123 256 91 S306 112 342 79 S396 102 428 62 S483 84 514 50 S567 69 597 27 S625 40 640 12 V188 H0Z" fill="url(#area-fill)" /><path d="M0 154 C32 151 44 122 84 133 S139 145 171 104 S228 123 256 91 S306 112 342 79 S396 102 428 62 S483 84 514 50 S567 69 597 27 S625 40 640 12" fill="none" stroke="#d85c43" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg><div className="chart-x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div></section>
      <section className="panel traffic-panel"><div className="panel-heading"><div><span className="eyebrow section-eyebrow">WHERE THEY FIND YOU</span><h2>Top traffic</h2></div><button className="icon-button subdued" aria-label="Traffic information"><CircleHelp size={16} /></button></div><Traffic label="Instagram" amount="42%" width="42%" color="coral" /><Traffic label="Direct" amount="31%" width="31%" color="green" /><Traffic label="Search" amount="18%" width="18%" color="blue" /><Traffic label="Other" amount="9%" width="9%" color="yellow" /><div className="traffic-total"><span>Total visits</span><strong>3,842</strong></div></section></div>
    <section className="panel orders-panel"><div className="panel-heading"><div><span className="eyebrow section-eyebrow">NEEDS YOUR ATTENTION</span><h2>Recent orders <span className="order-number">12</span></h2></div><button className="text-link" onClick={() => notice('Showing all orders')}>All orders <ArrowRight size={15} /></button></div><div className="table-wrap"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th /></tr></thead><tbody>{orders.map((row, index) => <tr key={row[0]}><td className="order-id">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td className="table-total">{row[4]}</td><td><button className={orderStatuses[index] === 'Processing' ? 'status-pill processing' : 'status-pill ready'} onClick={() => onCycleOrder(index)}>{orderStatuses[index]}</button></td><td><button className="row-more" aria-label={`Open order ${row[0]}`} onClick={() => notice(`Order ${row[0]} details`)}>···</button></td></tr>)}</tbody></table></div></section>
  </section>
}

function AdminDashboard({ notice }: { notice: (message: string) => void }) {
  const shops = [['Northline', 'Taylor Brooks', 'Mar 12, 2025', '$18,420', '284', 'Verified'], ['Studio August', 'Jamie Parker', 'Apr 02, 2025', '$12,840', '196', 'Verified'], ['Common Ground', 'Robin Lee', 'Jun 18, 2025', '$9,260', '143', 'Review']]
  return <section className="page-content dashboard-view admin-view">
    <div className="dashboard-heading"><div><span className="eyebrow section-eyebrow">PLATFORM CONTROL / MONDAY, OCTOBER 06</span><h1>Everything, <em>in view.</em></h1><p>A clear read on the health of your marketplace.</p></div><button className="select-button admin-range">Last 30 days <ChevronDown size={14} /></button></div>
    <div className="metric-grid admin-metrics"><Metric label="Platform volume" value="$284.6k" change="14.2%" up detail="vs. prior period" icon={<CreditCard size={18} />} /><Metric label="Active shops" value="1,284" change="8.6%" up detail="vs. prior period" icon={<Store size={18} />} /><Metric label="Orders today" value="846" change="6.1%" up detail="vs. prior period" icon={<ShoppingBag size={18} />} /><Metric label="Open issues" value="07" change="2 resolved" up detail="since yesterday" icon={<Shield size={18} />} /></div>
    <div className="dashboard-columns admin-columns"><section className="panel sales-panel"><div className="panel-heading"><div><span className="eyebrow section-eyebrow">MARKETPLACE ACTIVITY</span><h2>Volume over time</h2></div><button className="select-button">30 days <ChevronDown size={14} /></button></div><div className="sales-summary"><strong>$284,620</strong><span className="positive"><ArrowUpRight size={14} /> 14.2%</span><span>compared to prior period</span></div><div className="admin-bars" aria-label="Daily marketplace volume">{[42, 58, 49, 73, 66, 81, 57, 92, 72, 100, 84, 94, 76, 88, 68, 96, 80, 100, 74, 91, 83, 97, 78, 100, 88, 72, 94, 85, 100, 96].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="admin-bar-labels"><span>SEP 07</span><span>SEP 14</span><span>SEP 21</span><span>SEP 28</span><span>OCT 06</span></div></section>
      <section className="panel health-panel"><div className="panel-heading"><div><span className="eyebrow section-eyebrow">LIVE STATUS</span><h2>System health</h2></div><span className="live-indicator"><i /> ALL SYSTEMS UP</span></div><div className="health-score"><div className="health-ring"><strong>99.98<span>%</span></strong><small>UPTIME</small></div><div><strong>Looking good.</strong><p>All services are operating within normal ranges.</p></div></div><div className="service-list"><span><i /> API gateway <b>42 ms</b></span><span><i /> Checkout <b>118 ms</b></span><span><i /> Image delivery <b>86 ms</b></span></div></section></div>
    <section className="panel shops-panel"><div className="panel-heading"><div><span className="eyebrow section-eyebrow">SELLER NETWORK</span><h2>Shops to keep an eye on</h2></div><button className="text-link" onClick={() => notice('Opening the complete shop directory')}>View shop directory <ArrowRight size={15} /></button></div><div className="table-wrap"><table><thead><tr><th>SHOP</th><th>OWNER</th><th>JOINED</th><th>30D VOLUME</th><th>ORDERS</th><th>STATUS</th><th /></tr></thead><tbody>{shops.map((row) => <tr key={row[0]}><td><span className="shop-table-mark">{row[0].slice(0, 1)}</span><span className="shop-name">{row[0]}</span></td><td>{row[1]}</td><td>{row[2]}</td><td className="table-total">{row[3]}</td><td>{row[4]}</td><td><span className={row[5] === 'Verified' ? 'status-pill verified' : 'status-pill processing'}>{row[5] === 'Verified' && <BadgeCheck size={12} />}{row[5]}</span></td><td><button className="row-more" aria-label={`Open ${row[0]}`} onClick={() => notice(`${row[0]} shop details`)}>···</button></td></tr>)}</tbody></table></div></section>
  </section>
}

export default App
