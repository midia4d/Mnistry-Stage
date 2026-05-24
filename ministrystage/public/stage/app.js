let ws = null;
let timerInterval = null;
let timeLeft = 0;

function connectWebSocket() {
  const wsUrl = `ws://${window.location.hostname}:8080`;
  ws = new WebSocket(wsUrl);

  const statusEl = document.getElementById('status');

  ws.onopen = () => {
    statusEl.textContent = 'Conectado';
    statusEl.className = 'status-connected';
  };

  ws.onclose = () => {
    statusEl.textContent = 'Desconectado';
    statusEl.className = 'status-disconnected';
    setTimeout(connectWebSocket, 3000); // Reconnect
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleMessage(data);
    } catch (e) {
      console.error('Error parsing WS message', e);
    }
  };
}

function handleMessage(data) {
  const { action, payload } = data;
  
  if (action === 'update_scene') {
    document.getElementById('current-lyrics').textContent = payload.current || 'Nenhuma cena ativa';
    document.getElementById('next-lyrics').textContent = payload.next || '...';
  } else if (action === 'start_timer') {
    startTimer(payload.seconds, false);
  } else if (action === 'stop_timer') {
    stopTimer(false);
  }
}

function sendCommand(action, payload = {}) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action, payload }));
  }
}

function updateTimerDisplay() {
  const display = document.getElementById('timer');
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  display.textContent = `${m}:${s}`;
}

function startTimer(seconds, broadcast = true) {
  if (timerInterval) clearInterval(timerInterval);
  timeLeft = seconds;
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timeLeft = 0;
    }
    updateTimerDisplay();
  }, 1000);

  if (broadcast) sendCommand('start_timer', { seconds });
}

function stopTimer(broadcast = true) {
  if (timerInterval) clearInterval(timerInterval);
  timeLeft = 0;
  updateTimerDisplay();
  if (broadcast) sendCommand('stop_timer');
}

// Inicializar
connectWebSocket();
