import { useState, useEffect } from 'react';

export function useTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    time,
    timeString: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dateString: time.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  };
}
