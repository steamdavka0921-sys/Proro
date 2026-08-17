const fetch = require('node-fetch');

// Telegram Bot Token
const BOT_TOKEN = '8619454573:AAERvZhRNoeUrllKD2SDd4TDZS6yyne5ndg';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Мессеж илгээх функц
async function sendMessage(chatId, text) {
    try {
        const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text
            })
        });
        
        const data = await response.json();
        console.log('Telegram API response:', JSON.stringify(data));
        
        return data;
    } catch (error) {
        console.error('sendMessage error:', error.message);
        return null;
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
        
        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text || '';
            const firstName = update.message.from.first_name || 'Хэрэглэгч';
            
            console.log('Chat ID:', chatId);
            console.log('Text:', text);
            console.log('First Name:', firstName);
            
            if (text === '/start') {
                await sendMessage(chatId, `Сайн байна уу, ${firstName}! 👋`);
            } else {
                await sendMessage(chatId, 'Сайн байна уу! 👋');
            }
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
