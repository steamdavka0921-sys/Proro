const fetch = require('node-fetch');

// Telegram Bot Token
const BOT_TOKEN = '8619454573:AAERvZhRNoeUrllKD2SDd4TDZS6yyne5ndg';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Хэрэглэгчийн төлөвийг хадгалах (memory)
const userStates = {};

// Мессеж илгээх функц
async function sendMessage(chatId, text, replyMarkup = null) {
    try {
        const payload = {
            chat_id: chatId,
            text: text
        };
        
        if (replyMarkup) {
            payload.reply_markup = replyMarkup;
        }
        
        const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('Telegram API response:', JSON.stringify(data));
        
        return data;
    } catch (error) {
        console.error('sendMessage error:', error.message);
        return null;
    }
}

// Мессеж засах функц
async function editMessage(chatId, messageId, text, replyMarkup = null) {
    try {
        const payload = {
            chat_id: chatId,
            message_id: messageId,
            text: text
        };
        
        if (replyMarkup) {
            payload.reply_markup = replyMarkup;
        }
        
        const response = await fetch(`${TELEGRAM_API}/editMessageText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('Telegram editMessage response:', JSON.stringify(data));
        
        return data;
    } catch (error) {
        console.error('editMessage error:', error.message);
        return null;
    }
}

// Callback query-д хариу өгөх
async function answerCallback(callbackId, text = '') {
    try {
        await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                callback_query_id: callbackId,
                text: text
            })
        });
    } catch (error) {
        console.error('answerCallback error:', error.message);
    }
}

// Банк сонгох товчлуурууд
function getBankKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '🏦 ХААН БАНК', callback_data: 'bank_khan' },
                { text: '🏦 ХУДАЛДАА ХӨГЖИЛ', callback_data: 'bank_tdb' }
            ],
            [
                { text: '🏦 ХАС БАНК', callback_data: 'bank_xac' },
                { text: '🏦 ТӨРИЙН БАНК', callback_data: 'bank_state' }
            ],
            [
                { text: '🏦 БОГД БАНК', callback_data: 'bank_bogd' }
            ]
        ]
    };
}

// Цэнэглэлт/Таталт сонгох товчлуурууд
function getTransactionKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '💰 ЦЭНЭГЛЭЛТ', callback_data: 'action_deposit' },
                { text: '💸 ТАТАЛТ', callback_data: 'action_withdraw' }
            ]
        ]
    };
}

// /start командыг боловсруулах
async function handleStart(chatId, firstName) {
    const message = `👋 Сайн байна уу, ${firstName}!\n\n` +
        `Гүйлгээ хийх банкны нэрээ сонгоно уу:`;
    
    await sendMessage(chatId, message, getBankKeyboard());
}

// Callback query боловсруулах
async function handleCallback(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    const callbackId = callbackQuery.id;
    const firstName = callbackQuery.from.first_name || 'Хэрэглэгч';
    
    console.log('Callback data:', data);
    
    // Банк сонгогдсон үед
    if (data.startsWith('bank_')) {
        const bankNames = {
            'bank_khan': 'ХААН БАНК',
            'bank_tdb': 'ХУДАЛДАА ХӨГЖИЛ',
            'bank_xac': 'ХАС БАНК',
            'bank_state': 'ТӨРИЙН БАНК',
            'bank_bogd': 'БОГД БАНК'
        };
        
        const selectedBank = bankNames[data] || 'Банк';
        
        // Хэрэглэгчийн төлөвт банкийг хадгалах
        userStates[chatId] = {
            bank: data,
            bankName: selectedBank
        };
        
        await answerCallback(callbackId, `${selectedBank} сонгогдлоо`);
        
        const message = `✅ Сонгосон банк: ${selectedBank}\n\n` +
            `Одоо гүйлгээний төрлөө сонгоно уу:`;
        
        await editMessage(chatId, messageId, message, getTransactionKeyboard());
    }
    
    // Цэнэглэлт эсвэл Таталт сонгогдсон үед
    if (data.startsWith('action_')) {
        const actionType = data === 'action_deposit' ? 'ЦЭНЭГЛЭЛТ' : 'ТАТАЛТ';
        const userState = userStates[chatId] || {};
        const bankName = userState.bankName || 'Банк';
        
        await answerCallback(callbackId, `${actionType} сонгогдлоо`);
        
        const message = `🔄 QPAY үүсгэж байна...\n\n` +
            `Банк: ${bankName}\n` +
            `Гүйлгээ: ${actionType}\n\n` +
            `Түр хүлээнэ үү...`;
        
        await editMessage(chatId, messageId, message);
    }
}

// Webhook handler
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };
    
    // OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // GET request
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: 'Bot is running!' })
        };
    }
    
    try {
        const update = JSON.parse(event.body);
        console.log('Update received:', JSON.stringify(update));
        
        // Мессеж ирсэн үед
        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text || '';
            const firstName = update.message.from.first_name || 'Хэрэглэгч';
            
            if (text === '/start') {
                await handleStart(chatId, firstName);
            } else {
                await sendMessage(chatId, 'Сайн байна уу! 👋 /start гэж бичнэ үү.');
            }
        }
        
        // Callback query ирсэн үед (товчлуур дарсан)
        if (update.callback_query) {
            await handleCallback(update.callback_query);
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };
        
    } catch (error) {
        console.error('Error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
