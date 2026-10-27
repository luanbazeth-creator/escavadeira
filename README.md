# 3ª Geração Terraplenagem — interface mobile

## O que mudou nesta versão
- Interface redesenhada para celular, inspirada na referência enviada: fundo escuro texturizado, azul, detalhes laranja e navegação inferior.
- Início com cartões de acesso rápido.
- Removida a agenda em calendário.
- Clientes aparecem em cartões, como um catálogo/cardápio, com status editável.
- O nome do cliente aparece primeiro; o botão “Editar cliente” fica logo abaixo do nome.
- Removido o campo de e-mail do cadastro do cliente.
- Ficha individual do cliente com máquinas, operador, horas e histórico de serviços.
- Máquinas padrão: CASE, Hyundai, Sany e Caterpillar.
- Lançamento de horas com cálculo pelo horímetro inicial/final.
- Alertas de óleo e registro de troca. O intervalo inicial de 15.000 horas é apenas exemplo e deve ser ajustado conforme a orientação técnica de cada equipamento.
- Exportação de backup em JSON.

## Como abrir
1. Extraia o ZIP.
2. Abra `index.html` no navegador ou use Live Server no Visual Studio Code.
3. O sistema salva os dados no armazenamento local do navegador.

## Importante
Este é um protótipo front-end. Dados não são sincronizados entre celulares/computadores. Os perfis e permissões reais ainda precisam de Firebase Authentication, Cloud Firestore e regras de segurança. Não use o protótipo local como sistema multiusuário de produção.

## Arquivos
- `index.html`: estrutura e navegação.
- `style.css`: cores e layout responsivo.
- `app.js`: cadastros, status, horas e alertas.
- `assets/terraplenagem-3a-geracao.jpeg`: imagem da identidade visual fornecida.
