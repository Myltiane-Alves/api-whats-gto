class Messages {
    messages = {
        '0': '❌ Opção inválida. Digite "menu" para ver as opções novamente.',
        '1': `🕒 Nosso horário de atendimento é:
                Seg-Sex: 09h às 18h
                Sáb: 09h às 12h\n\nDigite "menu" para retornar ao início`,
        '2': '📞 Um atendente será chamado. Por favor, aguarde...',
        '3': `💼 Nossos serviços:
            - Desenvolvimento de Sites
            - Chatbots para WhatsApp
            - Marketing Digital\n\nDigite "menu" para retornar ao início`,
        '4': `📍 Nossa localização:
                QS 9 - Arniqueira, Brasília - DF\n\nDigite "menu" para retornar ao início`,
        '5': `💳 Aceitamos pagamentos via:
            - Pix
            - Cartão de Crédito/Débito
            - Boleto Bancário\n\nDigite "menu" para retornar ao início`,
        '6': `🚀 Trabalhe conosco:
                Envie seu currículo para: talentos@exemplo.com\n\nDigite "menu" para retornar ao início`,
        '7': 'Atendimento automático foi reativado para este número',
        '10': `👋 Olá! Seja bem-vindo ao atendimento automático:

            1️⃣ - Ver horário de atendimento
            2️⃣ - Falar com atendente
            3️⃣ - Ver nossos serviços
            4️⃣ - Ver localização
            5️⃣ - Formas de pagamento
            6️⃣ - Trabalhe conosco

            Digite a opção desejada:`
    }

    getMessage(index = 0) {
        return this.messages[index.toString()] ?? this.messages['0'];
    }
}

module.exports = new Messages();

/* 

eu preciso criar o menu de mensages com a seguinte questão primeiro a mensagem perguntando se o nome da pessoa é eu não quero que ela digite apenas confirme
após confirmação do nome perguntar se os ultimos 3 digitos do cpf é eu não quero que ela digite apenas confirme exiba apenas os 3 ultimos digitos do cpf o restante oculto com *
após confirmação do cpf perguntar o email da pessoa eu não quero que ela digite apenas confirme
dizer que um cartão de crédito está aprovado no valor de R$ para cada um com seu limite diferente
e perguntar se ele deseja continuar um atendimento com um atendente ou encerrar o atendimento

Roberval
cpf = 062.127.070-90
email roberval@example.com
limite R$ 1.000,00

Adailton
958.772.590-59
email adailton@example.com
limite R$ 2.500,00
    
Chagas  
206.959.430-06
email chagas@example.com
limite R$ 1.500,00
*/