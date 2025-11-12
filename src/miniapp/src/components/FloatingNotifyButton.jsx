import React from 'react';

export default function FloatingNotifyButton(){
  function subscribe(){
    window.TelegramWebApp?.sendData(JSON.stringify({ action: 'subscribe_notifications' }));
  }
  return (
    <button onClick={subscribe} style={{ position: 'fixed', right: 18, bottom: 18, background: '#0b74ff', color: '#fff', border: 0, padding: '12px 16px', borderRadius: 999 }}>
      Notify me
    </button>
  );
}
