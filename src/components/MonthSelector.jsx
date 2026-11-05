import React from 'react';

export function MonthSelector({ selectedMonth, setSelectedMonth }) {
  // Genera los últimos 6 meses dinámicamente
  const getRecentMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`; // Formato YYYY-MM
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  };

  const recentMonths = getRecentMonths();

  return (
    <div 
      style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        paddingBottom: '6px',
        marginBottom: '12px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}
    >
      <button
        onClick={() => setSelectedMonth('all')}
        style={{
          background: selectedMonth === 'all' ? 'var(--primary, #3b82f6)' : 'var(--bg-card, #1e222d)',
          color: selectedMonth === 'all' ? '#ffffff' : 'var(--text-main, #fff)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease'
        }}
      >
        📅 Todos
      </button>

      {recentMonths.map(m => {
        const isSelected = selectedMonth === m.value;
        return (
          <button
            key={m.value}
            onClick={() => setSelectedMonth(m.value)}
            style={{
              background: isSelected ? 'var(--primary, #3b82f6)' : 'var(--bg-card, #1e222d)',
              color: isSelected ? '#ffffff' : 'var(--text-main, #fff)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease'
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}