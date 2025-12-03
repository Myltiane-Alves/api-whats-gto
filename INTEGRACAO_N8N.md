# 🔗 Integração do Bot WhatsApp com n8n

## 📋 Pré-requisitos

1. **n8n instalado** (local ou cloud)
2. **Node.js** instalado
3. **Express** instalado no projeto

## 🛠 Instalação

```bash
npm install express
```

## 🚀 Iniciando o Bot com API

Use o arquivo `main-n8n.js` em vez do `main.js`:

```bash
node main-n8n.js
```

O servidor API estará disponível em: `http://localhost:3000`

---

## 🔌 Endpoints Disponíveis

### 1. **GET /status**
Verifica se o bot está pronto

**Resposta:**
```json
{
  "status": "ready",
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

### 2. **POST /send-message**
Envia mensagem via n8n para um número

**Body:**
```json
{
  "to": "5511999999999",
  "message": "Olá! Esta mensagem veio do n8n"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "to": "5511999999999@c.us"
}
```

### 3. **POST /transfer-to-human**
Transfere usuário para atendimento humano

**Body:**
```json
{
  "chatId": "5511999999999@c.us"
}
```

### 4. **POST /back-to-menu**
Retorna usuário ao menu automático

**Body:**
```json
{
  "chatId": "5511999999999@c.us"
}
```

### 5. **GET /contact/:number**
Obtém informações de um contato

**Exemplo:** `GET /contact/5511999999999`

### 6. **POST /webhook**
Endpoint genérico para comandos do n8n

**Body:**
```json
{
  "action": "send",
  "chatId": "5511999999999@c.us",
  "message": "Texto da mensagem"
}
```

**Ações disponíveis:**
- `send` - Envia mensagem
- `transfer` - Transfere para atendimento humano
- `end` - Encerra atendimento e volta ao menu

---

## 🎯 Configuração no n8n

### **Workflow 1: Enviar Mensagem do n8n para WhatsApp**

1. **Trigger:** Webhook, Schedule, ou qualquer outro
2. **HTTP Request Node:**
   - Method: `POST`
   - URL: `http://localhost:3000/send-message`
   - Body (JSON):
   ```json
   {
     "to": "{{ $json.phone }}",
     "message": "{{ $json.text }}"
   }
   ```

### **Workflow 2: Receber Mensagens do WhatsApp no n8n**

No arquivo `main-n8n.js`, descomente e configure o webhook (linha ~42):

```javascript
await fetch('https://seu-n8n.com/webhook/whatsapp-incoming', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookData)
});
```

No n8n:
1. Crie um **Webhook node** (trigger)
2. Configure o caminho: `/webhook/whatsapp-incoming`
3. Adicione nodes para processar a mensagem recebida

### **Workflow 3: Sistema de Atendimento Completo**

```
[Webhook Recebe Mensagem] 
    → [Verifica Palavra-Chave]
    → [Se "ajuda"] → [HTTP Request: Envia Resposta Automática]
    → [Se "humano"] → [HTTP Request: Transfer to Human + Notifica Slack/Email]
    → [Salva no Banco] → [Google Sheets/Airtable]
```

---

## 🔐 Segurança (Recomendações)

### Adicione autenticação:

```javascript
// No main-n8n.js, adicione middleware
const API_KEY = 'sua-chave-secreta';

app.use((req, res, next) => {
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    next();
});
```

No n8n, adicione o header:
```
Headers:
  x-api-key: sua-chave-secreta
```

---

## 📊 Exemplo de Workflow Completo no n8n

### Workflow: "Atendimento Automático com IA"

```
1. [Webhook] Recebe mensagem do WhatsApp
2. [OpenAI Node] Processa mensagem com GPT
3. [IF Node] Verifica se precisa humano
   ├─ SIM → [HTTP Request] Transfer to Human + [Slack] Notifica equipe
   └─ NÃO → [HTTP Request] Envia resposta automática
4. [Google Sheets] Registra conversa
```

---

## 🐳 Deploy com Docker (Opcional)

### Dockerfile
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "main-n8n.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  whatsapp-bot:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./.wwebjs_auth:/app/.wwebjs_auth
    restart: unless-stopped
```

---

## 🧪 Testando a Integração

### Teste 1: Verificar Status
```bash
curl http://localhost:3000/status
```

### Teste 2: Enviar Mensagem
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Teste de integração n8n!"
  }'
```

### Teste 3: Obter Info do Contato
```bash
curl http://localhost:3000/contact/5511999999999
```

---

## 📱 Fluxo de Uso

1. **Cliente envia mensagem** no WhatsApp
2. **Bot recebe** e processa automaticamente
3. Se escolher **opção 2** (falar com atendente):
   - Estado muda para `attendent`
   - Mensagens futuras são enviadas para o webhook do n8n
4. **n8n processa** a mensagem (IA, banco de dados, notificações)
5. **n8n responde** usando o endpoint `/send-message`
6. **Atendente encerra** dizendo "encerrar atendimento"
7. **Bot volta** ao menu automático

---

## 🔧 Troubleshooting

### Bot não conecta
- Verifique se escaneou o QR Code
- Delete a pasta `.wwebjs_auth` e tente novamente

### Mensagens não chegam no n8n
- Verifique a URL do webhook
- Confirme que o n8n está acessível
- Veja os logs no console do bot

### Erro ao enviar mensagem
- Confirme que o número está no formato correto
- Verifique se o bot está `ready` (endpoint `/status`)

---

## 📚 Recursos Adicionais

- [Documentação n8n](https://docs.n8n.io/)
- [whatsapp-web.js Docs](https://wwebjs.dev/)
- [Express.js Guide](https://expressjs.com/)

---

## 💡 Ideias de Automação com n8n

- ✅ Enviar mensagens agendadas
- ✅ Integrar com CRM (HubSpot, Salesforce)
- ✅ Processar mensagens com IA (OpenAI, Claude)
- ✅ Criar tickets no Jira/Trello
- ✅ Salvar conversas no Google Sheets
- ✅ Notificar equipe via Slack/Discord
- ✅ Enviar emails automáticos
- ✅ Análise de sentimento das mensagens
