import React, { useState, useEffect } from 'react';
import { dbService } from './db/indexedDB';
import { Dashboard } from './components/Dashboard';
import { MovementList } from './components/MovementList';
import { CategoriesView } from './components/CategoriesView';
import { SettingsBackup } from './components/SettingsBackup';
import './App.css';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar moneda guardada en localStorage (por defecto ARS)
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('billetera_currency') || 'ARS';
  });

  // Cargar cotizaciones guardadas en localStorage
  const [exchangeRates, setExchangeRates] = useState(() => {
    const savedRates = localStorage.getItem('billetera_rates');
    return savedRates ? JSON.parse(savedRates) : { USD: 1525, EUR: 1600 };
  });

  // Cargar tema oscuro guardado en localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('billetera_theme');
    return savedTheme === 'dark';
  });

  const reloadData = async () => {
    try {
      const [movs, cats] = await Promise.all([
        dbService.getMovements(),
        dbService.getCategories()
      ]);
      setMovements(movs);
      setCategories(cats);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Guardar tema oscuro en localStorage
  useEffect(() => {
    const themeName = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('billetera_theme', themeName);
  }, [darkMode]);

  // Guardar moneda seleccionada en localStorage
  useEffect(() => {
    localStorage.setItem('billetera_currency', currency);
  }, [currency]);

  // Guardar cotizaciones en localStorage
  useEffect(() => {
    localStorage.setItem('billetera_rates', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  if (loading) {
    return <div className="loading-spinner">Cargando Billetera...</div>;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <h1>Billetera</h1>
          <span className="badge-local">Datos Locales</span>
        </div>
        <div className="header-actions">
          <button 
            className="btn-theme" 
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Cambiar tema"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="content-area">
        {currentTab === 'dashboard' && (
          <Dashboard 
            movements={movements} 
            categories={categories}
            currency={currency} 
            exchangeRates={exchangeRates} 
            onUpdate={reloadData}
          />
        )}
        {currentTab === 'movements' && (
          <MovementList 
            movements={movements} 
            categories={categories} 
            currency={currency} 
            exchangeRates={exchangeRates}
            onUpdate={reloadData} 
          />
        )}
        {currentTab === 'categories' && (
          <CategoriesView 
            categories={categories} 
            onUpdate={reloadData} 
          />
        )}
        {currentTab === 'settings' && (
          <SettingsBackup 
            currency={currency} 
            setCurrency={setCurrency} 
            exchangeRates={exchangeRates} 
            setExchangeRates={setExchangeRates}
            onDataRestored={reloadData} 
          />
        )}
      </main>

      <nav className="main-nav-bottom">
        <button 
          className={currentTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setCurrentTab('dashboard')}
        >
          <span>📊</span>
          <small>Inicio</small>
        </button>
        <button 
          className={currentTab === 'movements' ? 'active' : ''} 
          onClick={() => setCurrentTab('movements')}
        >
          <span>💸</span>
          <small>Movimientos</small>
        </button>
        <button 
          className={currentTab === 'categories' ? 'active' : ''} 
          onClick={() => setCurrentTab('categories')}
        >
          <span>🏷️</span>
          <small>Categorías</small>
        </button>
        <button 
          className={currentTab === 'settings' ? 'active' : ''} 
          onClick={() => setCurrentTab('settings')}
        >
          <span>⚙️</span>
          <small>Ajustes</small>
        </button>
      </nav>
    </div>
  );
}