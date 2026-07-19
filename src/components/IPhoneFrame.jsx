import './IPhoneFrame.css'

export default function IPhoneFrame({ children, onExit }) {
  return (
    <div className="iphone-preview-page">
      <button className="iphone-exit-btn" onClick={onExit}>← Escritorio</button>
      <div className="iphone-body">
        <div className="iphone-btn iphone-btn-mute" />
        <div className="iphone-btn iphone-btn-vol-up" />
        <div className="iphone-btn iphone-btn-vol-down" />
        <div className="iphone-btn iphone-btn-power" />
        <div className="iphone-screen">
          <div className="iphone-status-bar">
            <span className="iphone-time">9:41</span>
            <div className="iphone-status-icons">
              <svg width="17" height="11" viewBox="0 0 17 11" fill="var(--text-primary)">
                <rect x="0" y="4" width="3" height="7" rx="1" opacity="0.3"/>
                <rect x="4.5" y="2.5" width="3" height="8.5" rx="1" opacity="0.6"/>
                <rect x="9" y="0" width="3" height="11" rx="1"/>
                <rect x="13.5" y="0" width="3" height="11" rx="1"/>
              </svg>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="var(--text-primary)">
                <path d="M8 2C10.3 2 12.4 3 13.9 4.6L15.1 3.4C13.2 1.3 10.8 0 8 0C5.2 0 2.8 1.3 0.9 3.4L2.1 4.6C3.6 3 5.7 2 8 2Z"/>
                <path d="M8 5C9.6 5 11 5.7 12 6.8L13.2 5.6C11.9 4.1 10.1 3.2 8 3.2C5.9 3.2 4.1 4.1 2.8 5.6L4 6.8C5 5.7 6.4 5 8 5Z"/>
                <circle cx="8" cy="9.5" r="1.5"/>
              </svg>
              <svg width="25" height="12" viewBox="0 0 25 12" fill="var(--text-primary)">
                <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="var(--text-primary)" strokeOpacity="0.35" fill="none"/>
                <rect x="2" y="2" width="17" height="8" rx="2"/>
                <path d="M23 4V8C24 7.5 24.5 7 24.5 6C24.5 5 24 4.5 23 4Z" fill="var(--text-primary)" opacity="0.4"/>
              </svg>
            </div>
          </div>
          <div className="iphone-dynamic-island" />
          <div className="iphone-content-area">
            {children}
          </div>
          <div className="iphone-home-indicator" />
        </div>
      </div>
    </div>
  )
}
