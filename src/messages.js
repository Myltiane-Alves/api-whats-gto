class Messages {
    // Base de dados dos clientes com telefones
    clients = {
        '61982080101': {
            id: '1',
            name: 'Hugo',
            lastName: '',
            cpf: '062.127.070-90',
            cpfMasked: '***.***.**0-90',
            cpfLast3: '090',
            email: 'hugo@example.com',
            limit: 'R$ 10.000,00',
            phone: '61982080101'
        },
        '61981536894': {
            id: '2',
            name: 'Juliano',
            lastName: 'Linhares',
            cpf: '958.772.590-59',
            cpfMasked: '***.***.*90-59',
            cpfLast3: '059',
            email: 'juliano@example.com',
            limit: 'R$ 2.500,00',
            phone: '61981536894'
        },
        '61984915007': {
            id: '3',
            name: 'Myltiane',
            lastName: 'Alves',
            cpf: '206.959.430-06',
            cpfMasked: '***.***.*30-06',
            cpfLast3: '006',
            email: 'myltiane@example.com',
            limit: 'R$ 1.500,00',
            phone: '61984915007'
        },
        '61985431686': {
            id: '4',
            name: 'Lucas',
            lastName: 'Eutacio',
            cpf: '048.711.930-47',
            cpfMasked: '***.***.*30-47',
            cpfLast3: '047',
            email: 'lucas@example.com',
            limit: 'R$ 1.300,00',
            phone: '61985431686'
        },
        '61996107156': {
            id: '5',
            name: 'Gabriel Bichelinha',
            lastName: 'Bixa Figueredo',
            cpf: '048.711.930-47',
            cpfMasked: '***.***.*30-47',
            cpfLast3: '047',
            email: 'bichelinha@example.com',
            limit: 'R$ 24.240,24',
            phone: '61996107156'
        }
    };

    messages = {
        '0': '❌ Opção inválida. Digite "menu" para ver as opções novamente.',
        '1': '��� Nosso horário de atendimento é:\n                Seg-Sex: 09h às 18h\n                Sáb: 09h às 12h\n\nDigite "menu" para retornar ao início',
        '2': '��� Um atendente será chamado. Por favor, aguarde...',
        '3': 'Atendimento automático foi reativado para este número',
        '4': '��� Verificação de Crédito',
        '5': 'Moda Masculina',
        '6': 'Moda Feminina',
    };

    getMessage(index = 0, clientName = null) {
        if (index === '10' || index === 10) {
            return '👋 Olá! Seja bem-vindo(a) ao atendimento *Tesoura de Ouro*' + (clientName ? ', *' + clientName + '*' : '') + '!\n\n' +
                '1️⃣ - Ver horário de atendimento\n' +
                '2️⃣ - Falar com atendente\n' +
                '4️⃣ - Verificação de Crédito\n' +
                '5️⃣ - Moda Masculina\n' +
                '6️⃣ - Moda Feminina\n\n' +
                'Digite a opção desejada:';
        }
        return this.messages[index.toString()] ?? this.messages['0'];
    }

    findClientByPhone(phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        
        // Tenta buscar direto
        if (this.clients[cleanPhone]) {
            return this.clients[cleanPhone];
        }
        
        // Se não encontrou, tenta adicionar código do país (55)
        if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
            const withCountryCode = '55' + cleanPhone;
            if (this.clients[withCountryCode]) {
                return this.clients[withCountryCode];
            }
        }
        
        // Se não encontrou, tenta remover código do país
        if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
            const withoutCountryCode = cleanPhone.substring(2);
            if (this.clients[withoutCountryCode]) {
                return this.clients[withoutCountryCode];
            }
        }
        
        return null;
    }

    findClientById(id) {
        for (const [phone, client] of Object.entries(this.clients)) {
            if (client.id === id || client.id === id.toString()) {
                return client;
            }
        }
        return null;
    }

    addOrUpdateClient(clientData) {
        const { id, phone, name, lastName, cpf, cpfMasked, cpfLast3, email, limit } = clientData;
        
        if (!phone || !name) {
            throw new Error('Phone e name são obrigatórios');
        }
        
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        
        this.clients[cleanPhone] = {
            id: id || cleanPhone,
            name,
            lastName: lastName || '',
            cpf: cpf || '',
            cpfMasked: cpfMasked || '',
            cpfLast3: cpfLast3 || (cpf ? cpf.slice(-3) : ''),
            email: email || '',
            limit: limit || 'R$ 0,00',
            phone: cleanPhone
        };
        
        return this.clients[cleanPhone];
    }

    removeClient(phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        delete this.clients[cleanPhone];
    }

    getAllClients() {
        return Object.values(this.clients);
    }

    findClient(name) {
        const nameKey = name.toLowerCase().trim();
        for (const [phone, client] of Object.entries(this.clients)) {
            if (client.name.toLowerCase() === nameKey) {
                return client;
            }
        }
        return null;
    }

    getNameConfirmation(name, lastName) {
        return '👤 *Confirmação de Identidade*\n\n' +
               'Seu nome é *' + name + '*?\n\n' +
               '✅ Digite *SIM* para confirmar\n' +
               '❌ Digite *NAO* se estiver incorreto';
    }

    getFullNameRequest() {
        return '👤 *Confirmação de Nome Completo*\n\n' +
           'Por favor, digite seu nome completo para validação.\n\n' +
           'Exemplo: Vitorino Silva Nascimento \n\n' +
           '💡 Digite eu nome completo.';
    }

    getLastNameConfirmation(lastName) {
        return '👤 *Confirmação de Sobrenome*\n\n' +
               'Seu sobrenome é *' + lastName + '*?\n\n' +
               '✅ Digite *SIM* para confirmar\n' +
               '❌ Digite *NAO* se estiver incorreto';
    }

    getCpfLast3Confirmation(cpfLast3) {
        return '🔐 *Confirmação de CPF*\n\n' +
               'Os últimos 3 dígitos do seu CPF são *' + cpfLast3 + '*?\n\n' +
               '✅ Digite *SIM* para confirmar\n' +
               '❌ Digite *NAO* se estiver incorreto';
    }

    getCpfRequest() {
        return '🔐 *Confirmação de CPF*\n\n' +
            'Por favor, digite seu CPF completo para validação.\n\n' +
            'Formato aceito: 000.000.000-00 ou somente números\n\n' +
            'Exemplo: 062.127.070-90';
    }

    getEmailConfirmation(email) {
        return '��� Confirmação de Email\n\n' +
               'Seu email é *' + email + '*?\n\n' +
               '✅ Digite *SIM* para confirmar\n' +
               '❌ Digite *NAO* se estiver incorreto';
    }

    getCreditApproval(fullName, limit) {
        return '🎉 *PARABÉNS ' + fullName.toUpperCase() + '!*\n\n' +
               '✅ Seu cartão de crédito foi *APROVADO*!\n\n' +
               '💳 *Limite aprovado:* ' + limit + '\n\n' +
               'Como deseja prosseguir?\n\n' +
               '1️⃣ - Falar com um atendente\n' +
               '2️⃣ - Encerrar atendimento\n\n' +
               'Digite a opção desejada:';
    }

    getNotFoundMessage() {
        return '❌ *Dados não encontrados*\n\n' +
               'Desculpe, não localizamos seus dados em nosso sistema.\n\n' +
               'Por favor, entre em contato com um atendente.\n\n' +
               'Digite *2* para falar com um atendente.';
    }

    getClosingMessage() {
        return '✅ *Atendimento Encerrado*\n\n' +
               'Obrigado por utilizar nossos serviços!\n' +
               'Em breve você receberá mais informações sobre seu cartão.\n\n' +
               'Digite *menu* para voltar ao início.';
    }

    getInitialCreditCheck(clientName) {
        if (clientName) {
            return '👋 Olá! Seja bem-vindo(a) ao atendimento *Tesoura de Ouro*!\n\n' +
                   '💳 Vamos confirmar seus dados para liberar seu crédito.\n\n' +
                   'Iniciando verificação...';
        }
        return '👋 Olá! Seja bem-vindo(a) ao atendimento *Tesoura de Ouro*!\n\n' +
               '❌ Não conseguimos identificar seu cadastro.\n\n' +
               'Digite *menu* para ver as opções disponíveis.';
    }
}

module.exports = new Messages();
