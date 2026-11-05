export const convertAndFormatCurrency = (amount, currency = 'ARS', customRates = { USD: 1525, EUR: 1600 }) => {
  const num = Number(amount) || 0;
  const rates = { ARS: 1, ...customRates };
  const rate = rates[currency] || 1;
  const convertedAmount = currency === 'ARS' ? num : num / rate;

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(convertedAmount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  if (dateString.includes('T')) {
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-');
    const time = timePart ? timePart.substring(0, 5) : '';
    return `${day}/${month}/${year}${time ? ' ' + time : ''}`;
  }
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export const validateMovement = (data) => {
  const errors = {};
  if (!data.amount || isNaN(data.amount) || Number(data.amount) <= 0) {
    errors.amount = 'El importe debe ser un número mayor a 0.';
  }
  if (!data.description || !data.description.trim()) {
    errors.description = 'La descripción es requerida.';
  }
  if (!data.date) {
    errors.date = 'Seleccioná una fecha y hora válida.';
  }
  if (!data.category) {
    errors.category = 'Seleccioná una categoría.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const calculatePeriodSummary = (movements, year, month) => {
  const filtered = movements.filter(m => {
    if (!m.date) return false;
    const dateOnly = m.date.split('T')[0];
    const [mYear, mMonth] = dateOnly.split('-');
    if (year && String(mYear) !== String(year)) return false;
    if (month && String(mMonth) !== String(mMonth).padStart(2, '0')) return false;
    return true;
  });

  const income = filtered.filter(m => m.type === 'income').reduce((acc, m) => acc + Number(m.amount), 0);
  const expense = filtered.filter(m => m.type === 'expense').reduce((acc, m) => acc + Number(m.amount), 0);
  const balance = income - expense;

  const expensesByCategory = filtered.filter(m => m.type === 'expense').reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + Number(m.amount);
    return acc;
  }, {});

  return { filteredMovements: filtered, income, expense, balance, expensesByCategory };
};