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

## Melhorias desta revisão
- Ajustes responsivos para evitar a tela esticada e a rolagem horizontal em celulares.
- Formulários adaptados a telas pequenas, com campos em uma coluna e controles maiores para toque.
- Ao registrar horas, agora é obrigatório vincular o lançamento a um cliente, além de informar máquina, data, operador e horímetro inicial/final.
- A ficha do cliente mostra as horas lançadas diretamente para ele e tem um botão para adicionar novos lançamentos.
- A lista geral de horas identifica o cliente de cada lançamento.


## Melhorias no registro de serviços
- Registro com data inicial e final, cada uma acompanhada pelo horímetro correspondente.
- Horas trabalhadas calculadas pelo horímetro final menos o inicial.
- Valor da hora definido pelo responsável; o total é calculado automaticamente.
- Forma de pagamento à vista ou parcelada em até 12 vezes.
- Controle manual de parcelas pagas na ficha do cliente, incluindo a data do pagamento.
- Máquina Caterpillar removida da lista padrão.

Observação: esta versão ainda salva dados no navegador deste aparelho. Para sincronizar dados entre aparelhos, é necessário integrar Firebase.

## Publicar para abrir pelo celular (importante)
O ZIP é o código-fonte, não é um endereço de site. Para abrir pelo celular com um link, publique a pasta `escava_pro` em um serviço de hospedagem estática, como Netlify Drop ou GitHub Pages. Depois de publicar, abra o link gerado no navegador do celular. Não basta enviar o arquivo ZIP pelo WhatsApp.

### Opção simples com computador
1. Extraia o ZIP.
2. Abra o site Netlify Drop no navegador do computador: https://app.netlify.com/drop
3. Arraste a pasta `escava_pro` extraída para a página (se não aceitar a pasta, compacte o conteúdo da pasta em um ZIP e envie esse ZIP).
4. Aguarde o endereço público ser criado e abra esse endereço no celular.

A publicação apenas disponibiliza o site na internet. Os dados ainda ficam guardados no navegador de cada aparelho; para compartilhar clientes, serviços e pagamentos entre aparelhos, será preciso conectar o Firebase.
