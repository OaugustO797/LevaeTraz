const form = document.querySelector('#delivery-form');
const feedback = document.querySelector('#form-feedback');
const mapFrame = document.querySelector('#map-frame');
const locationInput = document.querySelector('#location');
const geoBtn = document.querySelector('#geo-btn');

const updateMap = (target) => {
  const address = (target || locationInput).value.trim();
  if (!address) {
    return;
  }
  const url = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  mapFrame.src = url;
};

const showMessage = (message, isError = false) => {
  feedback.textContent = message;
  feedback.style.color = isError ? '#ff8c8c' : '#6cf1c8';
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  if (!data.produto || !data.recebedor || !data.localizacao || !form.querySelector('#safe-check').checked) {
    showMessage('Preencha todos os campos obrigatórios e confirme as diretrizes de segurança.', true);
    return;
  }

  showMessage(`Pedido registrado para ${data.recebedor}. Rota calculada para: ${data.localizacao}.`, false);
  updateMap({ value: data.localizacao });
  form.reset();
});

locationInput.addEventListener('change', () => updateMap(locationInput));
locationInput.addEventListener('blur', () => updateMap(locationInput));

geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showMessage('Geolocalização não suportada neste dispositivo.', true);
    return;
  }

  geoBtn.disabled = true;
  geoBtn.textContent = 'Buscando localização...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const coords = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      locationInput.value = coords;
      updateMap({ value: coords });
      showMessage('Localização atual aplicada ao mapa.');
      geoBtn.disabled = false;
      geoBtn.textContent = 'Usar minha localização';
    },
    () => {
      showMessage('Não foi possível obter sua localização. Tente novamente.', true);
      geoBtn.disabled = false;
      geoBtn.textContent = 'Usar minha localização';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});
