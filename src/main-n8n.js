import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import express from 'express';
import Message from './messages.js';
import { handleCreditFlow } from './credit-flow.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
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

const userState = {};
const userData = {};
const lidToPhoneMap = {}; // Mapeamento de @lid para números reais

client.on('qr', (qr) => {
    qrCodeData = qr;
    qrcode.generate(qr, { small: true });
});

client.once('ready', async () => {

    await sleep(10000);
    
    isReady = true;
    console.log('✅ Bot totalmente sincronizado e pronto para enviar mensagens!\n');
});



client.on('message', async (msg) => {
    const chatId = msg.from;
    const body = msg.body.trim();
    const bodyLower = body.toLowerCase();
    
    if (userState[chatId] === 'attendent') {
        // Se digitar "menu", volta ao menu principal
        if (bodyLower === 'menu') {
            console.log('🔙 Saindo do atendente, voltando ao menu');
            userState[chatId] = 'menu';
            await client.sendMessage(chatId, Message.getMessage(7));
            await sleep(2000);
            return client.sendMessage(chatId, Message.getMessage(10));
        }
        
        // Quando estiver com atendente, envia para n8n
        try {
            const webhookData = {
                from: chatId,
                name: chatId.split('@')[0],
                message: msg.body,
                timestamp: msg.timestamp,
                type: 'incoming_message'
            };
            
            console.log('📤 Enviando para n8n:', JSON.stringify(webhookData, null, 2));
            
            const response = await axios.post('https://tesoura.app.n8n.cloud/webhook-test/8ce175bf-869e-4810-becc-17c6a2bab280', webhookData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            console.log('✅ Resposta do n8n:', response.status, response.data);
            
        } catch (error) {
            if (error.response) {
                console.error('❌ Erro n8n - Status:', error.response.status);
                console.error('❌ Erro n8n - Data:', error.response.data);
            } else if (error.request) {
                console.error('❌ Erro n8n - Sem resposta do servidor');
            } else {
                console.error('❌ Erro n8n:', error.message);
            }
        }
        return;
    }

    // Verifica se está no fluxo de verificação de crédito
    const handledByCredit = await handleCreditFlow(client, msg, chatId, body, bodyLower, userState, userData);
    if (handledByCredit) return;

    // Estado especial: aguardando número de telefone para iniciar crédito
    if (userState[chatId] === 'awaiting_phone_for_credit') {
        const phone = body.replace(/[^0-9]/g, '');
        
        if (phone.length < 10) {
            return client.sendMessage(chatId, 
                '❌ Número inválido.\n\n' +
                'Por favor, envie um número válido com DDD (apenas números).\n\n' +
                'Exemplo: 61984915007');
        }
        
        // Cria o mapeamento
        lidToPhoneMap[chatId] = phone;
        console.log(`✅ Mapeamento criado: ${chatId} -> ${phone}`);
        
        // Busca o cliente
        const clientData = Message.findClientByPhone(phone);
        
        if (!clientData) {
            console.log(`❌ Cliente não encontrado: ${phone}`);
            userState[chatId] = 'menu';
            return client.sendMessage(chatId, Message.getNotFoundMessage());
        }
        
        console.log(`✅ Cliente encontrado: ${clientData.name}`);
        
        // Inicia o fluxo de verificação
        await client.sendMessage(chatId, Message.getInitialCreditCheck(clientData.name));
        await sleep(1000);
        
        userData[chatId] = clientData;
        userState[chatId] = 'confirm_name';
        return client.sendMessage(chatId, Message.getNameConfirmation(clientData.name, clientData.lastName));
    }

    // Menu automático
    if (bodyLower === 'menu' || !userState[chatId]) {
        userState[chatId] = 'menu';
        return client.sendMessage(chatId, Message.getMessage(10));
    }

    if (userState[chatId] === 'menu') {
        console.log(`📋 Menu - Usuário digitou: "${body}"`);
        
        if (body === '1') {
            // Ver horário de atendimento
            console.log('✅ Opção 1 selecionada');
            return client.sendMessage(chatId, Message.getMessage('1'));
        } else if (body === '2') {
            // Falar com atendente
            console.log('✅ Opção 2 selecionada');
            userState[chatId] = 'attendent';
            return client.sendMessage(chatId, Message.getMessage('2'));
        } else if (body === '5') {
            // Moda Masculina
            console.log('✅ Opção 5 selecionada - Moda Masculina');
            await client.sendMessage(chatId, '👔 *Moda Masculina*\n\nConfira nossos modelos:');
            await sleep(1000);
            
            // Envia as 3 imagens masculinas
            const masculinaImages = [
                'camiseta-masculina.jpg',
                'camiseta-masculina2.jpg',
                'camiseta-masculina3.jpg'
            ];
            
            for (const imageName of masculinaImages) {
                const imagePath = path.join(__dirname, 'image', imageName);
                if (fs.existsSync(imagePath)) {
                    const media = MessageMedia.fromFilePath(imagePath);
                    await client.sendMessage(chatId, media);
                    await sleep(1500);
                } else {
                    console.log(`⚠️ Imagem não encontrada: ${imagePath}`);
                }
            }
            
            await sleep(1000);
            return client.sendMessage(chatId, '\nDigite *menu* para voltar ao início');
        } else if (body === '6') {
            // Moda Feminina
            console.log('✅ Opção 6 selecionada - Moda Feminina');
            await client.sendMessage(chatId, '👗 *Moda Feminina*\n\nConfira nossos modelos:');
            await sleep(1000);
            
            // Envia as 3 imagens femininas
            const femininaImages = [
                'camiseta-feminina.jpg',
                'camiseta-feminina2.jpg',
                'camiseta-feminina3.jpg'
            ];
            
            for (const imageName of femininaImages) {
                const imagePath = path.join(__dirname, 'image', imageName);
                if (fs.existsSync(imagePath)) {
                    const media = MessageMedia.fromFilePath(imagePath);
                    await client.sendMessage(chatId, media);
                    await sleep(1500);
                } else {
                    console.log(`⚠️ Imagem não encontrada: ${imagePath}`);
                }
            }
            
            await sleep(1000);
            return client.sendMessage(chatId, '\nDigite *menu* para voltar ao início');
        } else if (body === '4') {
            // Verificação de Crédito
            console.log('✅ Opção 4 selecionada - Iniciando verificação de crédito');
            
            let phoneNumber;
            
            if (chatId.includes('@lid')) {
                // Para @lid, PRECISA ter mapeamento
                if (lidToPhoneMap[chatId]) {
                    phoneNumber = lidToPhoneMap[chatId];
                    console.log(`📱 Mapeamento @lid encontrado: ${phoneNumber}`);
                } else {
                    // Não tem mapeamento - solicita o número
                    console.log(`⚠️ @lid ${chatId} sem mapeamento - solicitando número`);
                    userState[chatId] = 'awaiting_phone_for_credit';
                    return client.sendMessage(chatId, 
                        '📱 *Verificação de Crédito*\n\n' +
                        'Para iniciarmos, por favor envie seu número de telefone com DDD (apenas números).\n\n' +
                        'Exemplo: 61984915007');
                }
            } else {
                // Para @c.us, extrai direto
                phoneNumber = chatId.replace('@c.us', '');
                console.log(`📱 Número @c.us: ${phoneNumber}`);
            }
            
            console.log(`📱 Buscando cliente com número: ${phoneNumber}`);
            const clientData = Message.findClientByPhone(phoneNumber);
            
            if (!clientData) {
                console.log(`❌ Cliente não encontrado para o número: ${phoneNumber}`);
                return client.sendMessage(chatId, Message.getNotFoundMessage());
            }
            
            console.log(`✅ Cliente encontrado: ${clientData.name}`);
            
            // Inicia o fluxo de verificação
            await client.sendMessage(chatId, Message.getInitialCreditCheck(clientData.name));
            await sleep(1000);
            
            userData[chatId] = clientData;
            userState[chatId] = 'confirm_name';
            console.log(`🔄 Estado alterado para: confirm_name`);
            
            return client.sendMessage(chatId, Message.getNameConfirmation(clientData.name, clientData.lastName));
        } else {
            // Opção inválida
            console.log(`❌ Opção inválida: "${body}"`);
            return client.sendMessage(chatId, Message.getMessage('0'));
        }
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
        
        console.log('📨 Requisição para enviar mensagem para:', to);
        
        if (!to || !message) {
            return res.status(400).json({ error: 'Campos "to" e "message" são obrigatórios' });
        }

        if (!isReady) {
            console.log('⚠️ Bot não está pronto ainda');
            return res.status(503).json({ error: 'Bot não está pronto' });
        }

        const cleanNumber = to.replace(/[^0-9]/g, '');
        console.log(`🔍 Verificando se o número ${cleanNumber} existe no WhatsApp...`);
        
        try {
            // Verifica se o número existe no WhatsApp e pega o ID correto
            const numberId = await client.getNumberId(cleanNumber);
            
            if (!numberId) {
                console.log(`❌ Número ${cleanNumber} não existe no WhatsApp`);
                return res.status(404).json({
                    error: 'Número não existe no WhatsApp',
                    details: `O número ${cleanNumber} não está registrado no WhatsApp.`,
                    to: cleanNumber
                });
            }
            
            // Pega o chatId correto (pode ser @c.us ou @lid)
            const chatId = numberId._serialized;
            console.log(`✅ Número verificado! ChatId: ${chatId}`);
            
            // Se for @lid, cria o mapeamento automaticamente
            if (chatId.includes('@lid')) {
                lidToPhoneMap[chatId] = cleanNumber;
                console.log(`📝 Mapeamento @lid criado: ${chatId} -> ${cleanNumber}`);
            }
            
            // Busca os dados do cliente no banco
            const clientData = Message.findClientByPhone(cleanNumber);
            
            if (clientData) {
                // Cliente encontrado - envia mensagem de boas-vindas + inicia confirmação
                userData[chatId] = clientData;
                console.log(`✅ Cliente ${clientData.name} encontrado no banco`);
                
                // Envia mensagem de boas-vindas
                await client.sendMessage(chatId, Message.getInitialCreditCheck(clientData.name));
                await sleep(1500);
                
                // Define estado e envia confirmação de nome
                userState[chatId] = 'confirm_name';
                await client.sendMessage(chatId, Message.getNameConfirmation(clientData.name, clientData.lastName));
                console.log(`✅ Fluxo de verificação iniciado para ${clientData.name}`);
            } else {
                // Cliente não encontrado - apenas envia a mensagem customizada
                console.log(`⚠️ Cliente não encontrado no banco: ${cleanNumber}`);
                await client.sendMessage(chatId, message);
            }
            
            console.log(`✅ Mensagem enviada com sucesso para ${cleanNumber}!`);
            
            res.json({ 
                success: true, 
                message: 'Mensagem enviada com sucesso',
                to: cleanNumber,
                chatId: chatId,
                clientFound: !!clientData
            });
            
        } catch (sendError) {
            console.log(`❌ Erro ao enviar: ${sendError.message}`);
            
            if (sendError.message.includes('phone number is not registered')) {
                res.status(404).json({ 
                    error: 'Número não registrado',
                    details: `O número ${cleanNumber} não está registrado no WhatsApp.`,
                    to: cleanNumber
                });
            } else {
                res.status(500).json({ 
                    error: sendError.message,
                    details: 'Erro ao enviar mensagem',
                    to: cleanNumber
                });
            }
        }
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        
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