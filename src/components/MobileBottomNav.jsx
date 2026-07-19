import './MobileBottomNav.css'

const TABS = [
  {
    id: 'overview',
    label: 'Visión',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9" rx="1"/>
        <rect x="10" y="7" width="4" height="14" rx="1"/>
        <rect x="17" y="3" width="4" height="18" rx="1"/>
      </svg>
    )
  },
  {
    id: 'budget',
    label: 'Presupuesto',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" opacity="0"/>
        <rect x="2" y="5" width="20" height="15" rx="2"/>
        <path d="M2 10h20"/>
        <circle cx="16" cy="15" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    )
  },
  {
    id: 'cashflow',
    label: 'Flujo',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18"/>
        <path d="M7 8l5-5 5 5"/>
        <path d="M7 16l5 5 5-5"/>
      </svg>
    )
  },
  {
    id: 'accounts',
    label: 'Ingresos',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
        <path d="M6 15h4"/>
        <path d="M14 15h2"/>
      </svg>
    )
  },
  {
    id: 'trends',
    label: 'Tendencias',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    )
  }
]

export default function MobileBottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="mobile-bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="mobile-nav-icon">{tab.icon}</span>
          <span className="mobile-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
