# LevaêTraz Delivery

Aplicação web estática com **login seguro**, **troca de temas**, **simulação de trajeto** e **assistente inteligente** para pedidos de delivery.

## Recursos
- **Sistema de login e cadastro** com e-mail/senha, telefone e botões de redes sociais. Sessão validada e armazenada em `localStorage`.
- **Temas claro, escuro, colorido e automático** (escolha por horário), aplicados a todas as seções e ao mapa.
- **Simulação de rota** com cálculo automático de distância (haversine), preço (valor base + km × taxa) e tempo estimado (tráfego + velocidade média).
- **Mapa interativo (Leaflet + OpenStreetMap)** com marcadores para origem/destino e linha do trajeto.
- **Assistente conversacional** para dúvidas de preço, prazo, rota e pagamento.
- **Status dinâmico** (em preparação, a caminho, próximo ao destino) com feedback visual e resumo do pedido.
- **Pagamentos**: cartão, PIX, dinheiro, carteira digital e opção de pagar antecipado ou no recebimento.

## Como usar
1. Abra `index.html` em um navegador moderno.
2. Selecione o tema desejado (ou deixe no modo automático) e faça login ou cadastro.
3. Em "Simular trajeto", informe origem/destino ou insira lat,lng. Ajuste valor base, taxa por km, velocidade média e fator de tráfego se quiser.
4. Clique em **Calcular e simular rota** para ver distância, preço, tempo, status e visualizar o mapa.
5. Escolha o método de pagamento; o resumo é atualizado na hora.
6. Use o chat do assistente para tirar dúvidas ou pedir sugestões de rota/pagamento.

## Observações
- Coordenadas conhecidas para cidades principais estão pré-mapeadas; endereços não encontrados usam a distância manual informada.
- Todo o estado é mantido no navegador (sem back-end). Nenhuma credencial real é enviada.
- É possível servir os arquivos com qualquer servidor estático simples, por exemplo: `python -m http.server 8000`.
