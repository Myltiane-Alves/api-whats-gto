const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const Message = require('./messages');
const axios = require('axios');
const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

let isReady = false;
let qrCodeData = null;

client.on('qr', (qr) => {
    qrCodeData = qr;
    qrcode.generate(qr, { small: true });
});

client.once('ready', async () => {

    await sleep(10000);
    
    isReady = true;
    console.log('✅ Bot totalmente sincronizado e pronto para enviar mensagens!\n');
});


const userState = {};


client.on('message', async (msg) => {
    const chatId = msg.from;
    const body = msg.body.trim().toLowerCase();
    
    if (userState[chatId] === 'attendent') {

        try {
            const contact = await msg.getContact();
            const webhookData = {
                from: chatId,
                name: contact.pushname || contact.number || 'Desconhecido',
                message: msg.body,
                timestamp: msg.timestamp,
                type: 'incoming_message'
            };
            
            await axios.post('https://tesoura.app.n8n.cloud/webhook-test/8ce175bf-869e-4810-becc-17c6a2bab280', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookData)
            });
            
        } catch (error) {
            console.error('Erro ao enviar para n8n:', error);
        }
        return;
    }

    // Menu automático
    if (body === 'menu' || !userState[chatId]) {
        userState[chatId] = 'menu';
        return client.sendMessage(chatId, Message.getMessage(10));
    }

    if (userState[chatId] === 'menu') {
        if (body === '2') {
            userState[chatId] = 'attendent';
        }
        return client.sendMessage(chatId, Message.getMessage(body));
    }
});

client.on('message_create', async (msg) => {
    const chatId = msg.to;
    const body = msg.body.trim().toLowerCase();

    if (msg.fromMe && body == 'encerrar atendimento') {
        userState[chatId] = 'menu';
        await client.sendMessage(chatId, Message.getMessage(7));
        await sleep(3000);
        return client.sendMessage(chatId, Message.getMessage(10)); 
    }
});

// ===== API REST PARA O N8N =====

// Status do bot
app.get('/status', (req, res) => {
    res.json({ 
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        hasQrCode: qrCodeData !== null
    });
});

// Endpoint para obter QR Code
app.get('/qr', (req, res) => {
    if (qrCodeData) {
        res.json({ 
            qr: qrCodeData,
            message: 'Use este código para gerar QR em outro local'
        });
    } else if (isReady) {
        res.json({ 
            message: 'Bot já está conectado. Não é necessário QR Code.'
        });
    } else {
        res.status(404).json({ 
            error: 'QR Code ainda não foi gerado. Aguarde alguns segundos.'
        });
    }
});

// Enviar mensagem (chamado pelo n8n)
app.post('/send-message', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        console.log('📨 Recebida requisição para enviar mensagem:', { to, message });
        
        if (!to || !message) {
            return res.status(400).json({ error: 'Campos "to" e "message" são obrigatórios' });
        }

        if (!isReady) {
            console.log('⚠️ Bot não está pronto ainda');
            return res.status(503).json({ error: 'Bot não está pronto' });
        }

        // Remove qualquer formatação prévia e caracteres especiais
        const cleanNumber = to.replace(/[^0-9]/g, '');
        
        // Formata APENAS como contato individual (nunca grupo)
        const chatId = `${cleanNumber}@c.us`;
        
        console.log('📤 Enviando mensagem para contato individual:', chatId);
        
        // Verifica se é realmente um chat individual
        try {
            const chat = await client.getChatById(chatId);
            
            if (chat.isGroup) {
                console.log('❌ Tentativa de enviar para grupo bloqueada:', chatId);
                return res.status(400).json({ 
                    error: 'Este é um grupo. Use o endpoint correto para grupos.',
                    chatId
                });
            }
            
            console.log('✅ Chat verificado como contato individual');
        } catch (verifyError) {
            console.log('⚠️ Não foi possível verificar o chat, enviando mesmo assim...');
        }
        
        // Envia a mensagem
        const send = client.sendMessage(chatId, message);
        
        await Promise.race([send]);
        
        console.log('✅ Mensagem enviada com sucesso para:', chatId);
        
        res.json({ 
            success: true, 
            message: 'Mensagem enviada com sucesso',
            to: chatId
        });
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error.message);
        
        if (error.message.includes('Timeout')) {
            res.status(408).json({ 
                error: 'Timeout ao enviar mensagem',
                details: 'O WhatsApp pode não estar sincronizado. Aguarde alguns segundos e tente novamente.',
                to: req.body.to
            });
        } else {
            res.status(500).json({ 
                error: error.message,
                details: 'Verifique se o número está correto e existe no WhatsApp',
                to: req.body.to
            });
        }
    }
});

// Transferir para atendimento humano
app.post('/transfer-to-human', async (req, res) => {
    try {
        const { chatId } = req.body;
        
        if (!chatId) {
            return res.status(400).json({ error: 'Campo "chatId" é obrigatório' });
        }

        userState[chatId] = 'attendent';
        
        res.json({ 
            success: true,
            message: 'Usuário transferido para atendimento humano',
            chatId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Voltar para menu automático
app.post('/back-to-menu', async (req, res) => {
    try {
        const { chatId } = req.body;
        
        if (!chatId) {
            return res.status(400).json({ error: 'Campo "chatId" é obrigatório' });
        }

        userState[chatId] = 'menu';
        
        const formattedChatId = chatId.includes('@c.us') ? chatId : `${chatId}@c.us`;
        await client.sendMessage(formattedChatId, Message.getMessage(7));
        await sleep(3000);
        await client.sendMessage(formattedChatId, Message.getMessage(10));
        
        res.json({ 
            success: true,
            message: 'Usuário voltou para o menu',
            chatId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obter informações do contato
app.get('/contact/:number', async (req, res) => {
    try {
        const { number } = req.params;
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        
        // Tenta obter informações do contato de forma mais segura
        try {
            const contact = await client.getContactById(chatId);
            
            res.json({
                id: contact.id._serialized,
                name: contact.name || contact.pushname || 'Desconhecido',
                number: contact.number,
                state: userState[chatId] || 'unknown'
            });
        } catch (contactError) {
            // Se falhar ao obter contato, retorna info básica
            res.json({
                id: chatId,
                number: number,
                state: userState[chatId] || 'unknown',
                note: 'Informações limitadas disponíveis'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook para receber comandos do n8n
app.post('/webhook', async (req, res) => {
    try {
        const { action, chatId, message, data } = req.body;
        
        switch (action) {
            case 'send':
                await client.sendMessage(chatId, message);
                break;
            case 'transfer':
                userState[chatId] = 'attendent';
                break;
            case 'end':
                userState[chatId] = 'menu';
                await client.sendMessage(chatId, Message.getMessage(7));
                break;
            default:
                return res.status(400).json({ error: 'Ação inválida' });
        }
        
        res.json({ success: true, action, chatId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Inicializa o servidor Express
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor API rodando na porta ${PORT}`);
});


client.initialize();
