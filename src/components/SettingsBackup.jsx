import React, { useState } from 'react';
import { dbService } from '../db/indexedDB';

export function SettingsBackup({ currency, setCurrency, exchangeRates, setExchangeRates, onDataRestored }) {
  const [statusMsg, setStatusMsg] = useState('');

  const handleExport = async () => {
    try {
      const data = await dbService.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Billetera_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg('Copia de seguridad exportada con éxito.');
    } catch (err) {
      setStatusMsg('Error al exportar los datos.');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (window.confirm('¿Estás seguro de restaurar este respaldo? Se sobrescribirán los datos actuales.')) {
          await dbService.importBackup(json);
          setStatusMsg('Copia de seguridad restaurada correctamente.');
          onDataRestored();
        }
      } catch (err) {
        setStatusMsg('Error al importar: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="settings-wrapper" 
      style={{ 
        padding: '16px',
        paddingBottom: '120px', 
        overflowY: 'auto',       
        overflowX: 'hidden',
        minHeight: '100vh',
        boxSizing: 'border-box',
        width: '100%'
      }}
    >
      <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Configuración y Copias de Seguridad</h2>

      <div className="card-section" style={{ boxSizing: 'border-box', width: '100%' }}>
        <h3>Moneda de Visualización</h3>
        <div className="form-group">
          <label>Seleccionar Moneda Principal</label>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          >
            <option value="ARS">Peso Argentino (ARS)</option>
            <option value="USD">Dólar Estadounidense (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>

        <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Cotizaciones de Referencia (ARS)</h4>
        
        {/* Usamos flex-direction column en móviles para evitar que se desborden hacia el costado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
          <div className="form-group" style={{ width: '100%', boxSizing: 'border-box' }}>
            <label>1 USD =</label>
            <input 
              type="number" 
              value={exchangeRates.USD} 
              onChange={(e) => setExchangeRates({ ...exchangeRates, USD: Number(e.target.value) })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div className="form-group" style={{ width: '100%', boxSizing: 'border-box' }}>
            <label>1 EUR =</label>
            <input 
              type="number" 
              value={exchangeRates.EUR} 
              onChange={(e) => setExchangeRates({ ...exchangeRates, EUR: Number(e.target.value) })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      <div className="card-section" style={{ boxSizing: 'border-box', width: '100%' }}>
        <h3>Copias de Seguridad</h3>
        <p style={{ color: 'var(--text-muted)' }}>Exportá o importá tus datos locales para sincronizar o resguardar tu información.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', width: '100%', boxSizing: 'border-box' }}>
          <button className="btn-primary" onClick={handleExport} style={{ width: '100%', boxSizing: 'border-box' }}>📥 Exportar Respaldo (.json)</button>
          <label className="btn-secondary" style={{ cursor: 'pointer', textAlign: 'center', width: '100%', boxSizing: 'border-box', display: 'block', padding: '10px' }}>
            📤 Importar Respaldo (.json)
            <input type="file" accept=".json" onChange={handleImport} hidden />
          </label>
        </div>
        {statusMsg && <p style={{ marginTop: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{statusMsg}</p>}
      </div>

      <div className="card-section warning-card" style={{ boxSizing: 'border-box', width: '100%' }}>
        <h3>🔒 Privacidad Garantizada</h3>
        <p>Billetera funciona 100% de manera offline. Todos tus movimientos se almacenan únicamente en este dispositivo.</p>
      </div>
    </div>
  );
}