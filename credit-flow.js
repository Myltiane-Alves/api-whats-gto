const Message = require('./messages');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleCreditFlow(client, msg, chatId, body, bodyLower, userState, userData) {
    const currentState = userState[chatId];
    
    // Estados do fluxo de crédito
    // if (currentState === 'confirm_name') {
    //     if (bodyLower === 'sim') {
    //         // Nome confirmado - vai para sobrenome
    //         userState[chatId] = 'confirm_lastname';
    //         return await client.sendMessage(chatId, Message.getLastNameConfirmation(userData[chatId].lastName));
    //     } else if (bodyLower === 'nao' || bodyLower === 'não') {
    //         // Nome incorreto
    //         userState[chatId] = 'menu';
    //         return await client.sendMessage(chatId, Message.getNotFoundMessage());
    //     }
    //     return false;
    // }
    
    if (currentState === 'confirm_name') {
        if (bodyLower === 'sim') {
            // Nome confirmado - vai para sobrenome
            userState[chatId] = 'input_fullname';

            if(!userData[chatId].nameAttempts) {
                userData[chatId].nameAttempts = 3;
            }
            return await client.sendMessage(chatId, Message.getFullNameRequest());
        } else if (bodyLower === 'nao' || bodyLower === 'não') {
            // Nome incorreto
            userState[chatId] = 'menu';
            return await client.sendMessage(chatId, Message.getNotFoundMessage());
        }
        return false;
    }
    
    if (currentState === 'confirm_lastname') {
        if (bodyLower === 'sim') {
            // Sobrenome confirmado - vai para CPF (últimos 3 dígitos)
            userState[chatId] = 'confirm_cpf_digits';
            return await client.sendMessage(chatId, Message.getCpfLast3Confirmation(userData[chatId].cpfLast3));
        } else if (bodyLower === 'nao' || bodyLower === 'não') {
            // Sobrenome incorreto
            userState[chatId] = 'menu';
            return await client.sendMessage(chatId, Message.getNotFoundMessage());
        }
        return false;
    }
    
    if (currentState === 'confirm_cpf_digits') {
        if (bodyLower === 'sim') {
            // Últimos 3 dígitos confirmados - vai para CPF completo
            userState[chatId] = 'input_cpf';

            if(!userData[chatId].cpfAttempts) {
                userData[chatId].cpfAttempts = 3;
            }
            return await client.sendMessage(chatId, Message.getCpfRequest());
        } else if (bodyLower === 'nao' || bodyLower === 'não') {
            // CPF incorreto
            userState[chatId] = 'menu';
            return await client.sendMessage(chatId, Message.getNotFoundMessage());
        }
        return false;
    }
    
    if (currentState === 'input_cpf') {
        const cpfDigitado = body.replace(/[^0-9]/g, '');
        const cpfCadastrado = userData[chatId].cpf.replace(/[^0-9]/g, '');
        if (cpfDigitado === cpfCadastrado) {
            // CPF completo confirmado - vai para email
            userState[chatId] = 'confirm_email';
            return await client.sendMessage(chatId, Message.getEmailConfirmation(userData[chatId].email));
        } else {
            // CPF incorreto
            userData[chatId].cpfAttempts--;
           
            if(userData[chatId].cpfAttempts > 0) {
                return await client.sendMessage(chatId, 
                    `❌ *CPF incorreto*\n\n` +
                    `Você ainda tem *${userData[chatId].cpfAttempts} tentativa(s)*.\n\n` +
                    `Por favor, digite seu CPF novamente:`
                );
            } else {
                console.log('❌ Tentativas de CPF esgotadas');
                userState[chatId] = 'menu';
                delete userData[chatId];
                return await client.sendMessage(chatId,
                    '❌ *Número máximo de tentativas de CPF atingido*\n\n' +
                    'Por favor, entre em contato com um atendente.\n\n' +
                    'Digite *2* para falar com um atendente.'
                )
            }
        }
        
    }
    
    if (currentState === 'confirm_email') {
        if (bodyLower === 'sim') {
            // Email confirmado - CRÉDITO APROVADO!
            const fullName = `${userData[chatId].name} ${userData[chatId].lastName}`.trim();
            userState[chatId] = 'credit_approved';
            return await client.sendMessage(chatId, Message.getCreditApproval(fullName, userData[chatId].limit));
        } else if (bodyLower === 'nao' || bodyLower === 'não') {
            // Email incorreto
            userState[chatId] = 'menu';
            return await client.sendMessage(chatId, Message.getNotFoundMessage());
        }
        return false;
    }
    
    if (currentState === 'credit_approved') {
        if (body === '1') {
            // Falar com atendente
            userState[chatId] = 'attendent';
            return await client.sendMessage(chatId, Message.getMessage('2'));
        } else if (body === '2') {
            // Encerrar atendimento
            userState[chatId] = null;
            delete userData[chatId];
            return await client.sendMessage(chatId, Message.getClosingMessage());
        }
        return false;
    }
    
    return false;
}

module.exports = { handleCreditFlow };
