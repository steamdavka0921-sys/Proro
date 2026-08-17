const fetch = require('node-fetch');

// Telegram Bot Token (шууд код дотор)
const BOT_TOKEN = '8619454573:AAERvZhRNoeUrllKD2SDd4TDZS6yyne5ndg';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Khan Bank QPay Deep Link
const KHANBANK_LINK = 'khanbank://q?qPay_QRcode=0002010102121531279404962794049600260811923780427420014A00000084300010220Zyu1TML3Z-pQ4GBlMk1h5204739953034965405250005802MN5921KHURELSUKHERDENEBILEG6011ULAANBAATAR62240720Zyu1TML3Z-pQ4GBlMk1h7106QPP_QR78156274160678898577902228002016304AD46';

// Telegram руу мессеж илгээх функц
async function sendMessage(chatId, text, replyMarkup = null) {
    try {
        const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        };
        
        if (replyMarkup) {
            payload.reply_markup = replyMarkup;
        }
        
        console.log('Sending message to:', chatId);
        console.log('Payload:', JSON.stringify(payload));
        
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
        console.error('sendMessage error:', error);
        return null;
    }
}

// /start командыг боловсруулах
async function handleStart(chatId, firstName) {
    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: '🏦 Khan Bank',
                    url: KHANBANK_LINK
                }
            ]
        ]
    };
    
    const message = `👋 Сайн байна уу, <b>${firstName}</b>!\n\n` +
        `💳 <b>QPay Данс</b>\n\n` +
        `Доорх товчлуур дээр дарж Khan Bank аппаар төлбөрөө хийнэ үү:`;
    
    const result = await sendMessage(chatId, message, keyboard);
    console.log('handleStart result:', JSON.stringify(result));
}

// Webhook handler
exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };
    
    // OPTIONS request handling
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // GET request handling (test хийхэд)
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: 'Bot is running!' })
        };
    }
    
    try {
        // Telegram-с ирсэн update-г авах
        const update = JSON.parse(event.body);
        console.log('Full update:', JSON.stringify(update));
        
        // Message байгаа эсэхийг шалгах
        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text || '';
            const firstName = update.message.from.first_name || 'Хэрэглэгч';
            
            console.log('Chat ID:', chatId);
            console.log('Text:', text);
            console.log('First Name:', firstName);
            
            // /start командыг боловсруулах
            if (text === '/start') {
                await handleStart(chatId, firstName);
            } else {
                // Бусад мессежид хариу өгөх
                await sendMessage(chatId, `Та "${text}" гэж бичсэн. /start гэж бичнэ үү.`);
            }
        }
        
        // Callback query байгаа эсэхийг шалгах
        if (update.callback_query) {
            const callbackId = update.callback_query.id;
            const chatId = update.callback_query.message.chat.id;
            
            console.log('Callback query received');
            
            // Callback query-д хариу өгөх
            await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    callback_query_id: callbackId,
                    text: 'Төлбөр үүсгэж байна...'
                })
            });
            
            // Khan Bank товчлуурыг дахин илгээх
            const firstName = update.callback_query.from.first_name || 'Хэрэглэгч';
            await handleStart(chatId, firstName);
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Error stack:', error.stack);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
