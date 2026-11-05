import React, { useMemo } from 'react';
import { convertAndFormatCurrency } from '../utils/formatters';

export function ExpenseChart({ movements, categories, currency, exchangeRates }) {
  const chartData = useMemo(() => {
    // 1. Filtrar solo los movimientos de tipo gasto
    const expenses = movements.filter(m => m.type === 'expense');
    
    // 2. Sumar el total de gastos globales
    const totalExpense = expenses.reduce((sum, m) => sum + Number(m.amount), 0);

    if (totalExpense === 0) return { totalExpense: 0, items: [] };

    // 3. Agrupar la suma por cada categoría
    const totalsByCategory = {};
    expenses.forEach(m => {
      const catName = m.category || 'Sin categoría';
      totalsByCategory[catName] = (totalsByCategory[catName] || 0) + Number(m.amount);
    });

    // 4. Crear la lista con porcentajes, colores y grados para el gráfico circular
    let currentDegree = 0;
    const items = Object.entries(totalsByCategory)
      .map(([name, amount]) => {
        const cat = categories.find(c => c.name === name);
        const percentage = Number(((amount / totalExpense) * 100).toFixed(1));
        const degrees = (amount / totalExpense) * 360;
        
        const itemData = {
          name,
          icon: cat?.icon || '🏷️',
          color: cat?.color || '#ef4444',
          amount,
          percentage,
          startDegree: currentDegree,
          endDegree: currentDegree + degrees
        };
        
        currentDegree += degrees;
        return itemData;
      })
      .sort((a, b) => b.amount - a.amount);

    // Generar la cadena para el conic-gradient de CSS
    const gradientStops = items
      .map(item => `${item.color} ${item.startDegree}deg ${item.endDegree}deg`)
      .join(', ');

    return { 
      totalExpense, 
      items, 
      conicGradient: gradientStops ? `conic-gradient(${gradientStops})` : 'none' 
    };
  }, [movements, categories]);

  if (chartData.totalExpense === 0) {
    return (
      <div style={{ 
        background: 'var(--bg-card, #1e222d)', 
        borderRadius: '16px', 
        padding: '24px', 
        textAlign: 'center', 
        color: 'var(--text-muted)',
        border: '1px solid var(--border)' 
      }}>
        📊 Registrá gastos para ver el gráfico de distribución de tu dinero en tiempo real.
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'var(--bg-card, #1e222d)', 
      borderRadius: '16px', 
      padding: '20px', 
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', alignSelf: 'flex-start' }}>
        📊 Distribución de Gastos
      </h3>

      {/* Gráfico de Dona Circular */}
      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '50%', 
            background: chartData.conicGradient,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }} 
        />
        {/* Hueco central de la dona con el total */}
        <div style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          right: '20px', 
          bottom: '20px', 
          background: 'var(--bg-card, #1e222d)', 
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
            Total Gastos
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
            {convertAndFormatCurrency(chartData.totalExpense, currency, exchangeRates)}
          </span>
        </div>
      </div>

      {/* Leyenda de Categorías */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {chartData.items.map(item => (
          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>
                {item.icon} {item.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
              <span>{convertAndFormatCurrency(item.amount, currency, exchangeRates)}</span>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}