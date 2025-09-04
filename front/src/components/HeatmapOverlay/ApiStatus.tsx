import React, { useState, useEffect } from 'react';

interface ApiStatusProps {
  baseUrl?: string;
  onStatusChange?: (isOnline: boolean) => void;
}

const ApiStatus: React.FC<ApiStatusProps> = ({ 
  baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000',
  onStatusChange 
}) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkApiStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Добавляем timeout
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsOnline(true);
        onStatusChange?.(true);
        console.log('✅ API доступен:', data);
      } else {
        setIsOnline(false);
        onStatusChange?.(false);
        console.error('❌ API недоступен:', response.status);
      }
    } catch (error) {
      setIsOnline(false);
      onStatusChange?.(false);
      console.error('❌ Ошибка подключения к API:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // Проверяем каждые 30 секунд
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, [baseUrl]);

  if (isChecking) {
    return (
      <div className="api-status checking">
        <div className="status-indicator">
          <div className="loading-spinner"></div>
        </div>
        <span>Проверка API...</span>
      </div>
    );
  }

  return (
    <div className={`api-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="status-indicator">
        <div className={`status-dot ${isOnline ? 'green' : 'red'}`}></div>
      </div>
      <span>
        {isOnline ? 'API подключен' : 'API недоступен'}
      </span>
      {!isOnline && (
        <button 
          className="retry-btn"
          onClick={checkApiStatus}
          title="Попробовать снова"
        >
          🔄
        </button>
      )}
    </div>
  );
};

export default ApiStatus;
