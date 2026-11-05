import React, { useState } from 'react';
import { dbService } from '../db/indexedDB';
import { convertAndFormatCurrency, formatDate, validateMovement } from '../utils/formatters';

export function MovementList({ movements, categories, currency, exchangeRates, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editingMov, setEditingMov] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Estado del mes seleccionado
  const [selectedMonth, setSelectedMonth] = useState('all');
  
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Generador dinámico de meses basados en los movimientos reales
  const getDynamicMonths = () => {
    if (!movements || movements.length === 0) return [];

    const uniqueMonths = [...new Set(
      movements
        .filter(m => m.date)
        .map(m => m.date.slice(0, 7))
    )].sort().reverse(); // Ordena del mes más reciente al más antiguo

    return uniqueMonths.map(monthStr => {
      const [year, month] = monthStr.split('-');
      const d = new Date(year, month - 1, 1);
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      return { value: monthStr, label };
    });
  };

  const dynamicMonths = getDynamicMonths();

  const getNowLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: getNowLocalDateTime(),
    type: 'expense'
  });
  const [errors, setErrors] = useState({});

  const handleOpenModal = (mov = null) => {
    if (mov) {
      setEditingMov(mov);
      setFormData(mov);
    } else {
      setEditingMov(null);
      setFormData({
        amount: '',
        description: '',
        category: categories.length > 0 ? categories[0].name : '',
        date: getNowLocalDateTime(),
        type: 'expense'
      });
    }
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
      id: editingMov ? editingMov.id : `mov-${Date.now()}`,
      amount: Number(formData.amount)
    };

    await dbService.saveMovement(payload);
    setShowModal(false);
    onUpdate();
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await dbService.deleteMovement(deletingId);
      setDeletingId(null);
      onUpdate();
    }
  };

  const confirmDeleteAll = async () => {
    try {
      await dbService.clearAllMovements();
      setShowDeleteAllModal(false);
      onUpdate();
    } catch (err) {
      console.error('Error al borrar todos los movimientos:', err);
      alert('Hubo un error al intentar eliminar los movimientos.');
    }
  };

  // Filtrado por Mes, Tipo, Categoría y Búsqueda por texto
  const filtered = movements
    .filter(m => {
      const movementMonth = m.date ? m.date.slice(0, 7) : '';
      return selectedMonth === 'all' || movementMonth === selectedMonth;
    })
    .filter(m => filterType === 'all' || m.type === filterType)
    .filter(m => selectedCategory === 'all' || m.category === selectedCategory)
    .filter(m => 
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (m.category && m.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="movements-wrapper" style={{ paddingBottom: '100px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Botones principales */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={() => handleOpenModal()} style={{ flex: 1, padding: '12px' }}>
            + Nuevo Movimiento
          </button>

          {movements && movements.length > 0 && (
            <button 
              className="btn-secondary" 
              onClick={() => setShowDeleteAllModal(true)} 
              style={{ 
                padding: '12px', 
                color: '#ef4444', 
                borderColor: 'rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.05)',
                whiteSpace: 'nowrap'
              }}
              title="Borrar todos los movimientos"
            >
              🗑️ Borrar todo
            </button>
          )}
        </div>

        {/* Selector de Meses Dinámico en Barra Horizontal */}
        {dynamicMonths.length > 0 && (
          <div 
            style={{ 
              display: 'flex', 
              gap: '8px', 
              overflowX: 'auto', 
              paddingBottom: '6px',
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

            {dynamicMonths.map(m => {
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
        )}
        
        {/* Búsqueda */}
        <input 
          type="text" 
          placeholder="🔍 Buscar por descripción..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ width: '100%', boxSizing: 'border-box' }}
        />

        {/* Filtros de Tipo y Categoría */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>

          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="movements-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
        {filtered.length === 0 ? (
          <div className="card-section" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron movimientos para este período.
          </div>
        ) : (
          filtered.map(m => (
            <div 
              key={m.id} 
              style={{ 
                background: 'var(--bg-card)', 
                borderRadius: 'var(--radius)', 
                padding: '14px 16px', 
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{m.description}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    🏷️ {m.category}
                  </div>
                </div>
                
                <div className={m.type === 'income' ? 'text-success' : 'text-danger'} style={{ fontSize: '1.1rem' }}>
                  {m.type === 'income' ? '+' : '-'}{convertAndFormatCurrency(m.amount, currency, exchangeRates)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  🕒 {formatDate(m.date)}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleOpenModal(m)}>
                    ✏️ Editar
                  </button>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setDeletingId(m.id)}>
                    🗑️ Borrar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{editingMov ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h3>
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

      {/* Modal Eliminar Individual */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ color: 'var(--danger)', marginTop: 0 }}>Eliminar movimiento</h3>
            <p style={{ color: 'var(--text-main)', margin: '12px 0 20px 0' }}>
              ¿Estás seguro de eliminar este movimiento? Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeletingId(null)}>
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--danger)' }} 
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Borrar Todo */}
      {showDeleteAllModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ color: 'var(--danger)', marginTop: 0 }}>⚠️ Borrar todo el historial</h3>
            <p style={{ color: 'var(--text-main)', margin: '12px 0 20px 0', lineHeight: '1.5' }}>
              ¿Estás seguro de que querés eliminar <strong>todos los movimientos</strong>? Se borrará todo tu historial financiero de forma permanente.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteAllModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--danger)' }} 
                onClick={confirmDeleteAll}
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}