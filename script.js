const state = {
  session: null,
  theme: 'auto',
  map: null,
  markers: [],
  polyline: null,
  lastSimulation: null,
};

const locationDB = {
  'são paulo': { lat: -23.5505, lng: -46.6333 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'belo horizonte': { lat: -19.9167, lng: -43.9345 },
  'porto alegre': { lat: -30.0346, lng: -51.2177 },
  'curitiba': { lat: -25.4284, lng: -49.2733 },
  'salvador': { lat: -12.9777, lng: -38.5016 },
  'recife': { lat: -8.0476, lng: -34.8770 },
  'brasília': { lat: -15.7801, lng: -47.9292 },
};

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => Array.from(document.querySelectorAll(selector));

function setTheme(theme) {
  state.theme = theme;
  const body = document.body;
  const effective = theme === 'auto' ? autoThemeByTime() : theme;
  body.className = '';
  body.classList.add(`theme-${effective}`);
  qs('#auto-theme').value = theme === 'auto' ? 'Depende do horário local' : 'Manual';
}

function autoThemeByTime() {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 18 ? 'light' : 'dark';
}

function persistSession(data) {
  const token = `sess-${Date.now()}`;
  state.session = { ...data, token };
  localStorage.setItem('levaetraz-session', JSON.stringify(state.session));
  renderSession();
}

function loadSession() {
  const stored = localStorage.getItem('levaetraz-session');
  if (stored) {
    state.session = JSON.parse(stored);
    renderSession();
  }
}

function renderSession(message) {
  const badge = qs('#session-badge');
  if (state.session) {
    badge.textContent = `Sessão ativa: ${state.session.email || state.session.social}`;
    badge.style.background = 'color-mix(in srgb, var(--accent) 15%, transparent)';
    qs('#login-feedback').textContent = message || 'Sessão validada localmente.';
  } else {
    badge.textContent = 'Sessão não iniciada';
    qs('#login-feedback').textContent = message || '';
  }
}

function parseCoordinates(value) {
  if (!value) return null;
  const trimmed = value.trim();
  const dbMatch = locationDB[trimmed.toLowerCase()];
  if (dbMatch) return dbMatch;
  const coordMatch = trimmed.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (coordMatch) {
    return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
  }
  return null;
}

function haversine(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatTime(minutes) {
  const rounded = Math.round(minutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m} min`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

function setupMap() {
  state.map = L.map('map').setView([-23.55, -46.63], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(state.map);
}

function updateMap(points) {
  if (!state.map) return;
  state.markers.forEach((m) => state.map.removeLayer(m));
  if (state.polyline) state.map.removeLayer(state.polyline);
  state.markers = [];
  const validPoints = points.filter(Boolean);
  validPoints.forEach((p) => {
    const marker = L.marker([p.lat, p.lng]).addTo(state.map);
    state.markers.push(marker);
  });
  if (validPoints.length >= 2) {
    state.polyline = L.polyline(validPoints.map((p) => [p.lat, p.lng]), {
      color: '#6cf1c8',
      weight: 5,
      opacity: 0.8,
    }).addTo(state.map);
    state.map.fitBounds(state.polyline.getBounds(), { padding: [30, 30] });
  } else if (validPoints.length === 1) {
    state.map.setView([validPoints[0].lat, validPoints[0].lng], 13);
  }
}

function updateStatus(step) {
  qsa('.status__item').forEach((el) => {
    el.classList.toggle('active', el.dataset.status === step);
  });
  const statusMap = {
    prep: 'Em preparação',
    way: 'A caminho',
    near: 'Próximo ao destino',
  };
  qs('#hero-status').textContent = statusMap[step];
  qs('#summary-status').textContent = statusMap[step];
}

function simulateProgress() {
  const stages = ['prep', 'way', 'near'];
  let index = 0;
  updateStatus(stages[index]);
  const interval = setInterval(() => {
    index += 1;
    if (index >= stages.length) {
      clearInterval(interval);
      return;
    }
    updateStatus(stages[index]);
  }, 2500);
}

function renderRouteResult(result) {
  qs('#distance').textContent = `${result.distance.toFixed(1)} km`;
  qs('#price').textContent = formatCurrency(result.price);
  qs('#eta').textContent = formatTime(result.timeMinutes);

  qs('#hero-distance').textContent = `${result.distance.toFixed(1)} km`;
  qs('#hero-price').textContent = formatCurrency(result.price);
  qs('#hero-eta').textContent = formatTime(result.timeMinutes);

  qs('#summary-start').textContent = result.startLabel;
  qs('#summary-end').textContent = result.endLabel;
  qs('#summary-distance').textContent = `${result.distance.toFixed(1)} km`;
  qs('#summary-price').textContent = formatCurrency(result.price);
  qs('#summary-time').textContent = formatTime(result.timeMinutes);
}

function simulateRoute(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const start = formData.get('start');
  const end = formData.get('end');
  const base = parseFloat(formData.get('base')) || 0;
  const rate = parseFloat(formData.get('rate')) || 0;
  const speed = parseFloat(formData.get('speed')) || 25;
  const traffic = parseFloat(formData.get('traffic')) || 1;
  const fallbackDistance = parseFloat(formData.get('fallbackDistance')) || 5;

  const startCoord = parseCoordinates(start);
  const endCoord = parseCoordinates(end);
  const hasCoords = startCoord && endCoord;
  const distance = hasCoords ? haversine(startCoord, endCoord) : fallbackDistance;
  const price = base + distance * rate;
  const timeMinutes = (distance / speed) * 60 * traffic;

  state.lastSimulation = {
    startLabel: start || '—',
    endLabel: end || '—',
    distance,
    price,
    timeMinutes,
    points: [startCoord, endCoord],
  };

  renderRouteResult(state.lastSimulation);
  updateStatus('prep');
  simulateProgress();
  updateMap([startCoord, endCoord]);

  const message = hasCoords
    ? `Rota calculada entre ${start} e ${end}.`
    : `Usando distância manual (${fallbackDistance} km) por falta de coordenadas.`;
  qs('#route-feedback').textContent = `${message} Valor estimado: ${formatCurrency(price)}.`;
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const email = formData.get('email');
  const password = formData.get('password');
  if (!email || !password) {
    qs('#login-feedback').textContent = 'Preencha e-mail e senha para continuar.';
    return;
  }
  const sessionData = { email, phone: formData.get('phone') || '', remember: formData.get('remember') === 'on' };
  persistSession(sessionData);
  qs('#login-feedback').textContent = 'Login realizado. Sessão ativa.';
}

function handleSocialLogin(provider) {
  persistSession({ social: provider });
  qs('#login-feedback').textContent = `Login via ${provider} concluído.`;
}

function validateSession() {
  const stored = localStorage.getItem('levaetraz-session');
  qs('#login-feedback').textContent = stored ? 'Sessão válida no dispositivo.' : 'Nenhuma sessão encontrada.';
}

function logout() {
  state.session = null;
  localStorage.removeItem('levaetraz-session');
  renderSession('Sessão encerrada.');
}

function initThemeButtons() {
  const buttons = [...qsa('[data-theme]')];
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });
  setTheme('auto');
}

function openModal() {
  qs('#login-modal').classList.add('show');
  qs('#login-modal').setAttribute('aria-hidden', 'false');
}

function closeModal() {
  qs('#login-modal').classList.remove('show');
  qs('#login-modal').setAttribute('aria-hidden', 'true');
}

function initModal() {
  qs('#open-login').addEventListener('click', openModal);
  qs('#close-login').addEventListener('click', closeModal);
  qs('#modal-login-action').addEventListener('click', () => {
    const stored = state.session;
    if (stored) {
      qs('#login-feedback').textContent = 'Sessão já validada.';
    } else {
      qs('#login-feedback').textContent = 'Use o formulário principal para registrar e-mail/telefone.';
    }
    closeModal();
  });
}

function assistantReply(question) {
  const lower = question.toLowerCase();
  let answer = 'Posso ajudar com preços, rotas, prazos e pagamentos. Informe origem/destino para uma simulação.';
  if (state.lastSimulation) {
    const { distance, price, timeMinutes, startLabel, endLabel } = state.lastSimulation;
    if (lower.includes('preço') || lower.includes('valor')) {
      answer = `Para ${startLabel} → ${endLabel}, o preço estimado é ${formatCurrency(price)}.`;
    } else if (lower.includes('tempo') || lower.includes('prazo')) {
      answer = `Tempo estimado: ${formatTime(timeMinutes)} considerando tráfego.`;
    } else if (lower.includes('rota') || lower.includes('trajeto')) {
      answer = `Distância simulada de ${distance.toFixed(1)} km. Posso sugerir rota alternativa reduzindo tráfego em 10%.`;
    }
  }
  if (lower.includes('pagamento') || lower.includes('pix') || lower.includes('cartão')) {
    answer = 'Aceitamos cartão, PIX, dinheiro, carteira digital, antecipado ou no recebimento. Selecione na seção de pagamentos.';
  }
  if (lower.includes('alternativa')) {
    answer = 'Sugestão: escolha vias com menos semáforos no trecho final. Considere antecipar pagamento para agilizar retirada.';
  }
  return answer;
}

function addChatMessage(text, from = 'me') {
  const bubble = document.createElement('div');
  bubble.className = `chat__bubble ${from}`;
  bubble.textContent = text;
  qs('#chat-log').appendChild(bubble);
  qs('#chat-log').scrollTop = qs('#chat-log').scrollHeight;
}

function handleChat(event) {
  event.preventDefault();
  const input = qs('#chat-input');
  const text = input.value.trim();
  if (!text) return;
  addChatMessage(text, 'me');
  const reply = assistantReply(text);
  setTimeout(() => addChatMessage(reply, 'bot'), 400);
  input.value = '';
}

function updatePaymentSummary() {
  const selected = qs('input[name="payment"]:checked');
  const label = selected ? selected.parentElement.textContent.trim() : 'Cartão de crédito/débito';
  qs('#summary-payment').textContent = label;
}

function initTabs() {
  qsa('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      qsa('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      qs('#login-submit').textContent = tab.dataset.mode === 'login' ? 'Entrar' : 'Cadastrar';
    });
  });
}

function wireEvents() {
  qs('#route-form').addEventListener('submit', simulateRoute);
  qs('#login-form').addEventListener('submit', handleLogin);
  qsa('.social__btn').forEach((btn) => btn.addEventListener('click', () => handleSocialLogin(btn.dataset.social)));
  qs('#validate-session').addEventListener('click', validateSession);
  qs('#logout').addEventListener('click', logout);
  qs('#chat-form').addEventListener('submit', handleChat);
  qsa('input[name="payment"]').forEach((input) => input.addEventListener('change', updatePaymentSummary));
  initTabs();
  initThemeButtons();
  initModal();
}

function init() {
  loadSession();
  setupMap();
  wireEvents();
  updatePaymentSummary();
  addChatMessage('Olá! Sou o assistente LevaêTraz. Simule um trajeto para ver preços e tempos.', 'bot');
}

document.addEventListener('DOMContentLoaded', init);
