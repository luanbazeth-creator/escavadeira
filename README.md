# 3ª Geração Terraplenagem — protótipo de gestão de escavadeiras

## O que está incluído
- Painel com totais de serviços, horas e máquinas.
- Agenda em formato de lista com filtros e calendário mensal.
- Cadastro de clientes.
- Cadastro de várias escavadeiras e horímetro.
- Lançamento de horas por funcionário, usando horímetro inicial e final.
- Registros de troca, nível e consumo de óleo e manutenção.
- Status do serviço: Aguardando, Agendado, Atendido e Recusado.
- Interface azul-marinho e azul inspirada na identidade visual enviada.
- Frota inicial: CASE, Hyundai, Sany e Caterpillar.
- Campo de operador no serviço e identificação do operador quando o serviço é marcado como atendido.
- Alerta visual de troca de óleo quando o horímetro atinge o limite configurado; exige confirmação no botão “OK, estou ciente”.
- Interface adaptada para celular e computador.
- Imagem de identidade visual incluída em `assets/terraplenagem-3a-geracao.jpeg`.

## Como abrir
1. Extraia o arquivo ZIP para uma pasta.
2. Abra `index.html` no navegador, ou abra a pasta no Visual Studio Code e use a extensão Live Server.
3. Os dados desta demonstração são salvos no `localStorage` do navegador atual.

## Importante antes de usar com uma equipe
Esta primeira versão é um protótipo front-end. Os dados não são compartilhados entre computadores e usuários. O cadastro de perfis é ilustrativo e não implementa autenticação nem segurança real.

Para transformar em sistema multiusuário:
1. Crie um projeto no Firebase Console.
2. Ative Firebase Authentication (por exemplo, e-mail e senha).
3. Crie um banco Cloud Firestore.
4. Configure as regras do Firestore para que cada usuário só possa executar ações autorizadas.
5. Conecte a aplicação ao Firebase SDK e implemente perfis/roles verificados no backend/regras. Não confie em um perfil salvo apenas no navegador.
6. Publique em um serviço de hospedagem HTTPS, como Firebase Hosting.

## Alerta de óleo
Cada máquina começa com a próxima troca configurada em 15.000 horas como exemplo. Ajuste o campo “Horímetro da próxima troca de óleo” para o intervalo real definido pela empresa. O alerta é demonstrativo e aparece neste navegador; ele não envia notificações a outros dispositivos.

## Personalização
- Nome e logotipo demonstrativo: `index.html`.
- Cores, tipografia e layout: `style.css`.
- Campos, cadastros, filtros e renderização: `app.js`.

## Próximos passos recomendados
- Definir nome, logo e cores reais da empresa.
- Implementar login de verdade e permissões de Administrador, Operador, Agendador e Consulta.
- Sincronizar clientes, agenda, máquinas, horas e manutenção no Firestore.
- Adicionar histórico de alterações, backup/exportação CSV e validação de conflitos de agenda.
