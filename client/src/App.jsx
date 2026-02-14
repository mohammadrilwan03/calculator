import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://calculator-vngb.onrender.com/api/history';

function App() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldReset, setShouldReset] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      // Map MongoDB data to match the UI expectation if needed
      const mappedData = data.map(item => ({
        id: item._id,
        eq: item.equation,
        res: item.result
      }));
      setHistory(mappedData);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleNumber = (num) => {
    if (display === '0' || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op) => {
    setEquation(display + ' ' + op + ' ');
    setShouldReset(true);
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      // Using a simple Function constructor for safe-ish eval of math
      const result = new Function(`return ${fullEquation.replace(/[^-()\d/*+.]/g, '')}`)();
      const finalResult = Number(result.toFixed(8)).toString();

      // Save to Backend
      saveCalculation(fullEquation, finalResult);

      setDisplay(finalResult);
      setEquation('');
      setShouldReset(true);
    } catch (error) {
      setDisplay('Error');
      setEquation('');
      setShouldReset(true);
    }
  };

  const saveCalculation = async (equation, result) => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equation, result })
      });
      fetchHistory(); // Refresh history after saving
    } catch (error) {
      console.error('Error saving calculation:', error);
      // Fallback to local history update if backend fails
      setHistory(prev => [{ id: Date.now(), eq: equation, res: result }, ...prev].slice(0, 10));
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      } else {
        const errorData = await response.json();
        console.error('Server failed to delete:', errorData.message);
      }
    } catch (error) {
      console.error('Network error deleting history item:', error);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setShouldReset(false);
  };

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  return (
    <div className="calc-container">
      <div className="calc-glass">
        <div className="calc-header">
          <span>CALCULATOR</span>
          <div className="dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
        </div>

        <div className="display-section">
          <div className="equation">{equation}</div>
          <div className="current">{display}</div>
        </div>

        <div className="buttons-grid">
          <button onClick={clear} className="btn-util">AC</button>
          <button onClick={deleteLast} className="btn-util">DEL</button>
          <button onClick={() => handleOperator('%')} className="btn-op">%</button>
          <button onClick={() => handleOperator('/')} className="btn-op">÷</button>

          <button onClick={() => handleNumber('7')}>7</button>
          <button onClick={() => handleNumber('8')}>8</button>
          <button onClick={() => handleNumber('9')}>9</button>
          <button onClick={() => handleOperator('*')} className="btn-op">×</button>

          <button onClick={() => handleNumber('4')}>4</button>
          <button onClick={() => handleNumber('5')}>5</button>
          <button onClick={() => handleNumber('6')}>6</button>
          <button onClick={() => handleOperator('-')} className="btn-op">−</button>

          <button onClick={() => handleNumber('1')}>1</button>
          <button onClick={() => handleNumber('2')}>2</button>
          <button onClick={() => handleNumber('3')}>3</button>
          <button onClick={() => handleOperator('+')} className="btn-op">+</button>

          <button onClick={() => handleNumber('0')} className="btn-zero">0</button>
          <button onClick={() => handleNumber('.')} >.</button>
          <button onClick={calculate} className="btn-equal">=</button>
        </div>
      </div>

      <div className="history-panel">
        <div className="history-header">
          <h3>RECENT TOTALS</h3>
          <button onClick={async () => {
            try {
              await fetch(API_URL, { method: 'DELETE' });
              setHistory([]);
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          }} className="clear-history">Clear</button>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-history">No recent calculations</div>
          ) : (
            history.map(item => (
              <div key={item.id} className="history-item">
                <div className="history-item-content">
                  <span className="history-eq">{item.eq} =</span>
                  <span className="history-res" onClick={() => setDisplay(item.res)}>{item.res}</span>
                </div>
                <button
                  className="delete-item-btn"
                  onClick={() => deleteHistoryItem(item.id)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
