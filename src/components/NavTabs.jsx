import './NavTabs.css'

export default function NavTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: 'Visión General' },
    { id: 'budget', label: 'Presupuesto' },
    { id: 'cashflow', label: 'Flujo' },
    { id: 'accounts', label: 'Ingresos' },
    { id: 'trends', label: 'Tendencias' }
  ]

  return (
    <div className="tabs-container">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
