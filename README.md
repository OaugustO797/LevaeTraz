# LevaêTraz Delivery

Site estático para o serviço de delivery **LevaêTraz**, permitindo solicitar entregas de qualquer tipo de produto com foco em segurança, transparência e acompanhamento por mapa integrado.

## Como usar
1. Abra o arquivo `index.html` em um navegador moderno.
2. Preencha o formulário "Chamar entregador" com o tipo de produto, localização de entrega e nome de quem vai receber.
3. Opcional: clique em "Usar minha localização" para preencher automaticamente o campo de endereço com sua posição atual (caso o navegador permita).
4. O mapa integrado é atualizado conforme você digita o endereço, permitindo visualizar a região da entrega.

## Estrutura
- `index.html`: página principal com todas as seções do site.
- `styles.css`: estilos globais e responsivos.
- `script.js`: lógica de atualização do mapa, geolocalização e feedback do formulário.

## Observações
- O mapa utiliza o Google Maps em modo embed com buscas dinâmicas; não é necessário configurar chaves de API.
- O site é totalmente estático e pode ser servido por qualquer servidor simples (por exemplo, `python -m http.server`).
