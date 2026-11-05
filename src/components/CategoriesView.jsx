import React, { useState } from 'react';
import { dbService } from '../db/indexedDB';

export function CategoriesView({ categories, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [associatedMovementsCount, setAssociatedMovementsCount] = useState(0);
  
  const [formData, setFormData] = useState({ name: '', type: 'expense' });
  const [errors, setErrors] = useState('');

  const handleOpenModal = () => {
    setFormData({ name: '', type: 'expense' });
    setErrors('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors('El nombre de la categoría no puede estar vacío.');
      return;
    }

    const payload = {
      id: `cat-${Date.now()}`,
      name: formData.name.trim(),
      type: formData.type
    };

    await dbService.saveCategory(payload);
    setShowModal(false);
    onUpdate();
  };

  const handleOpenDeleteModal = async (categoryId) => {
    // Verifica cuántos movimientos usan esta categoría para darle información precisa al usuario
    const movements = await dbService.getMovements();
    const count = movements.filter(m => m.categoryId === categoryId).length;
    
    setAssociatedMovementsCount(count);
    setDeletingId(categoryId);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await dbService.deleteCategory(deletingId);
      setDeletingId(null);
      onUpdate();
    }
  };

  const categoryToDelete = categories.find(c => c.id === deletingId);

  return (
    <div className="categories-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>Categorías Configuradas</h2>
        <button className="btn-primary" onClick={handleOpenModal}>
          + Nueva Categoría
        </button>
      </div>

      {/* Grilla de Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {categories.map(c => {
          const isIncome = c.type === 'income';
          return (
            <div 
              key={c.id} 
              style={{ 
                background: 'var(--bg-card, #1e222d)', 
                borderRadius: '12px', 
                padding: '16px', 
                borderLeft: `5px solid ${isIncome ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)'}`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                minHeight: '100px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  {isIncome ? 'Ingreso' : 'Gasto'}
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: '600', marginTop: '6px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {c.icon && <span>{c.icon}</span>}
                  <span>{c.name}</span>
                </div>
              </div>

              {/* Botón de eliminar por ID único */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button 
                  onClick={() => handleOpenDeleteModal(c.id)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '1rem',
                    padding: '4px',
                    opacity: '0.7',
                    transition: 'opacity 0.2s'
                  }}
                  title="Eliminar categoría"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Crear Categoría */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Nueva Categoría</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tipo de Categoría</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input 
                  type="text" 
                  placeholder="Ej: 🍕 Comida"
                  value={formData.name} 
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors(''); }} 
                />
                {errors && <span className="error-text">{errors}</span>}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado con Conteo Inteligente */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ color: 'var(--danger)', marginTop: 0 }}>Eliminar categoría</h3>
            <p style={{ color: 'var(--text-main)', margin: '12px 0 8px 0' }}>
              ¿Estás seguro de eliminar la categoría <strong>"{categoryToDelete?.name || 'esta categoría'}"</strong>?
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              {associatedMovementsCount > 0 
                ? `⚠️ Hay ${associatedMovementsCount} movimiento(s) registrado(s) con esta categoría. No se borrarán, pero quedarán sin categoría asignada.`
                : 'No hay movimientos asociados a esta categoría.'}
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeletingId(null)}>Cancelar</button>
              <button className="btn-primary" style={{ backgroundColor: 'var(--danger)' }} onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}