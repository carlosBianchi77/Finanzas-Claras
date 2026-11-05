import React, { useState } from 'react';
import { convertAndFormatCurrency, formatDate, calculatePeriodSummary, validateMovement } from '../utils/formatters';
import { dbService } from '../db/indexedDB';
import { ExpenseChart } from './ExpenseChart';

export function Dashboard({ movements, categories, currency, exchangeRates, onUpdate }) {
  // Generador dinámico de meses basados en los movimientos reales para las píldoras
  const getDynamicMonths = () => {
    if (!movements || movements.length === 0) return [];

    const uniqueMonths = [...new Set(
      movements
        .filter(m => m.date)
        .map(m => m.date.slice(0, 7))
    )].sort().reverse();

    return uniqueMonths.map(monthStr => {
      const [year, month] = monthStr.split('-');
      const d = new Date(year, month - 1, 1);
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      return { value: monthStr, year, month, label };
    });
  };

  const dynamicMonths = getDynamicMonths();

  // Estado del mes seleccionado (por defecto 'all' o el mes actual si hay datos)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonthKey, setSelectedMonthKey] = useState(
    dynamicMonths.some(m => m.value === currentMonthStr) ? currentMonthStr : 'all'
  );

  const [showAllMovements, setShowAllMovements] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getNowLocalDateTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: categories.length > 0 ? categories[0].name : '',
    date: getNowLocalDateTime(),
    type: 'expense'
  });
  const [errors, setErrors] = useState({});

  const handleOpenModal = () => {
    setFormData({
      amount: '',
      description: '',
      category: categories.length > 0 ? categories[0].name : '',
      date: getNowLocalDateTime(),
      type: 'expense'
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateMovement(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const payload = {
      ...formData,
      id: `mov-${Date.now()}`,
      amount: Number(formData.amount)
    };

    await dbService.saveMovement(payload);
    setShowModal(false);
    if (onUpdate) onUpdate();
  };

  // Separa año y mes para el summary de calculatePeriodSummary
  let summaryYear = String(now.getFullYear());
  let summaryMonth = String(now.getMonth() + 1).padStart(2, '0');

  if (selectedMonthKey !== 'all') {
    const parts = selectedMonthKey.split('-');
    summaryYear = parts[0];
    summaryMonth = parts[1];
  }

  // Si el usuario eligió 'all', calculamos un resumen global o adaptado
  const summary = selectedMonthKey === 'all' 
    ? {
        balance: movements.reduce((acc, m) => acc + (m.type === 'income' ? m.amount : -m.amount), 0),
        income: movements.filter(m => m.type === 'income').reduce((acc, m) => acc + m.amount, 0),
        expense: movements.filter(m => m.type === 'expense').reduce((acc, m) => acc + m.amount, 0),
        filteredMovements: movements,
        expensesByCategory: movements
          .filter(m => m.type === 'expense')
          .reduce((acc, m) => {
            acc[m.category] = (acc[m.category] || 0) + m.amount;
            return acc;
          }, {})
      }
    : calculatePeriodSummary(movements, summaryYear, summaryMonth);

  const sortedMovements = summary.filteredMovements
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const recentMovements = showAllMovements ? sortedMovements : sortedMovements.slice(0, 5);

  return (
    <div className="dashboard-wrapper" style={{ paddingBottom: '100px', boxSizing: 'border-box' }}>
      
      {/* Selector de Meses Moderno (Píldoras) */}
      {dynamicMonths.length > 0 && (
        <div 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            overflowX: 'auto', 
            paddingBottom: '8px',
            marginBottom: '12px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}
        >
          <button
            onClick={() => setSelectedMonthKey('all')}
            style={{
              background: selectedMonthKey === 'all' ? 'var(--primary, #3b82f6)' : 'var(--bg-card, #1e222d)',
              color: selectedMonthKey === 'all' ? '#ffffff' : 'var(--text-main, #fff)',
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
            📅 Histórico (Todos)
          </button>

          {dynamicMonths.map(m => {
            const isSelected = selectedMonthKey === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setSelectedMonthKey(m.value)}
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
      )}

      {/* Cabecera de Balances con Botón de Acceso Rápido */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0 }}>Resumen Financiero</h3>
        <button 
          className="btn-primary" 
          onClick={handleOpenModal}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          + Agregar Movimiento
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card balance">
          <span>Balance del Período</span>
          <h3>{convertAndFormatCurrency(summary.balance, currency, exchangeRates)}</h3>
        </div>
        <div className="metric-card income">
          <span>Ingresos del Período</span>
          <h3>{convertAndFormatCurrency(summary.income, currency, exchangeRates)}</h3>
        </div>
        <div className="metric-card expense">
          <span>Gastos del Período</span>
          <h3>{convertAndFormatCurrency(summary.expense, currency, exchangeRates)}</h3>
        </div>
      </div>

      {/* Gráfico filtrado por el período seleccionado */}
      <ExpenseChart 
        movements={summary.filteredMovements} 
        categories={categories} 
        currency={currency} 
        exchangeRates={exchangeRates} 
      />

      {/* Sección de Movimientos Recientes */}
      <section className="card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Movimientos Recientes</h3>
          {sortedMovements.length > 5 && (
            <button 
              onClick={() => setShowAllMovements(!showAllMovements)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--primary)', 
                cursor: 'pointer', 
                fontWeight: '600',
                fontSize: '0.85rem' 
              }}
            >
              {showAllMovements ? 'Ver menos 🔼' : `Ver todos (${sortedMovements.length}) 🔽`}
            </button>
          )}
        </div>

        {sortedMovements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>No hay movimientos registrados en este período.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {recentMovements.map(m => (
              <div 
                key={m.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px 12px', 
                  background: 'var(--bg-primary)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}
              >
                <div>
                  <strong>{m.description}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <span>{formatDate(m.date)}</span> • <span style={{ fontWeight: '500' }}>{m.category}</span>
                  </div>
                </div>
                <div className={m.type === 'income' ? 'text-success' : 'text-danger'}>
                  {m.type === 'income' ? '+' : '-'}{convertAndFormatCurrency(m.amount, currency, exchangeRates)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card-section">
        <h3>Gastos por Categoría</h3>
        {Object.keys(summary.expensesByCategory).length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay gastos registrados en este período.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {Object.entries(summary.expensesByCategory).map(([catName, amount]) => {
              const percentage = summary.expense > 0 ? ((amount / summary.expense) * 100).toFixed(1) : 0;
              return (
                <div key={catName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{catName}</span>
                    <span>{convertAndFormatCurrency(amount, currency, exchangeRates)} ({percentage}%)</span>
                  </div>
                  <div style={{ background: 'var(--border)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--primary)', width: `${percentage}%`, height: '100%' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Carga Rápida */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Nuevo Movimiento</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tipo</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>

              <div className="form-group">
                <label>Importe</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                />
                {errors.amount && <span className="error-text">{errors.amount}</span>}
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <input 
                  type="text" 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">-- Seleccionar --</option>
                  {categories
                    .filter(c => c.type === formData.type)
                    .map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                  }
                </select>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label>Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  value={formData.date} 
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}