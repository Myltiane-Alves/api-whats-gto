# 🤖 WhatsApp Bot com Node.js

Este é um bot para WhatsApp criado com [whatsapp-web.js](https://github.com/Myltiane-Alves/api-whats-gto), que oferece:

- Um **menu interativo automático** com múltiplas opções
- Encaminhamento para **atendimento humano**
- Retorno ao menu digitando `"menu"`
- Gerenciamento simples de estado por usuário

---

## 🚀 Funcionalidades

- Menu automático com opções como:
  - Ver horário de atendimento
  - Falar com atendente
  - Verificação de Crédito
  - Moda Masculina
  - Moda Feminina


---

## 🛠 Tecnologias

- [Node.js](https://nodejs.org/)
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [qrcode-terminal](https://www.npmjs.com/package/qrcode-terminal)

---

## 🧩 Pré-requisitos

- Node.js instalado (v18 ou superior)
- WhatsApp com acesso ao QR Code
- Navegador instalado (Chromium via Puppeteer é usado internamente)

---

## 📦 Instalação

```bash
npm install
node main.js


Melhorias a serem feitas

1.quando for confirmar o cpf em vez dele  responder sim ou nao
  ele precisa digitar o cpf
  quando for confirmar o sobre nome em vez dele  responder sim ou nao
  ele precisa digitar o nome completo

2.cadastros de usuário 
  1.telefone
  2.cpf
  3.email
  4.endereço
  5.nome completo

3.confirmação de cadastro e exibir o usuário as informações enviadas

4.salvar os dados do usuário em arquivo temporário em um csv do google docs 

5.melhoria de arquitetura de código estrutura de pastas