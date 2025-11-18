// const TelegramBot = require('node-telegram-bot-api');
// const { exec } = require('child_process');
// const fs = require('fs');
// const path = require('path');
// const https = require('https');
// const axios = require('axios');

// const TOKEN = process.env.BOT_TOKEN;
// const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || '@VorisxonGroup';
// const CHANNEL_LINK = process.env.CHANNEL_LINK || 'https://t.me/VorisxonGroup';
// const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id)) : [1723957261, 1515609034];

// const bot = new TelegramBot(TOKEN, { 
//   polling: { interval: 300, autoStart: true, params: { timeout: 10 } }
// });

// const tempDir = path.join(__dirname, 'temp');
// if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// // ===== ПОДПИСКА =====
// async function checkSubscription(userId) {
//   if (ADMIN_IDS.includes(userId)) return true;
//   try {
//     const member = await bot.getChatMember(CHANNEL_USERNAME, userId);
//     return ['creator','administrator','member'].includes(member.status);
//   } catch (error) {
//     console.error('Ошибка проверки подписки:', error.message);
//     return false;
//   }
// }

// async function sendSubscriptionMessage(chatId) {
//   await bot.sendMessage(
//     chatId,
//     `❌ Для использования бота подпишитесь на Мой канал!\n\n👉 ${CHANNEL_LINK}\n\nПосле подписки отправьте команду /start`,
//     { reply_markup: { inline_keyboard: [[{ text: '📢 Подписаться', url: CHANNEL_LINK }],[{ text:'✅ Я подписался', callback_data:'check_subscription' }]] } }
//   );
// }

// // ===== ОПРЕДЕЛЕНИЕ ПЛАТФОРМЫ =====
// function detectPlatform(url) {
//   if (/instagram\.com\/(p|reel|reels|tv)\/[\w-]+/.test(url)) return 'instagram';
//   if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts/.test(url)) return 'youtube';
//   if (/tiktok\.com/.test(url) || /vm\.tiktok\.com/.test(url) || /vt\.tiktok\.com/.test(url)) return 'tiktok';
//   return null;
// }

// // ===== TIKTOK БЕЗ ВОДЯНОГО ЗНАКА =====
// async function downloadTikTok(url, outputPath) {
//   const response = await axios.get('https://tikwm.com/api/', {
//     params: { url: url, hd: 1 },
//     timeout: 15000
//   });

//   if (response.data.code !== 0 || !response.data.data) {
//     throw new Error(response.data.msg || 'TikTok API error');
//   }

//   const data = response.data.data;
//   const videoUrl = data.hdplay || data.play;
//   if (!videoUrl) throw new Error('No video URL found');

//   const title = data.title ? data.title.trim() : 'TikTok видео';
//   const music = data.music_info?.title ? `🎵 ${data.music_info.title} — ${data.music_info.author || 'Original sound'}` : '';

//   return new Promise((resolve, reject) => {
//     const file = fs.createWriteStream(outputPath);
//     https.get(videoUrl, {
//       headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
//     })
//     .on('response', res => res.pipe(file))
//     .on('error', err => {
//       fs.unlink(outputPath, () => {});
//       reject(err);
//     });

//     file.on('finish', () => {
//       file.close();
//       resolve({ title, music });
//     });
//   });
// }

// // ===== CALLBACK QUERY =====
// bot.on('callback_query', async query => {
//   const chatId = query.message.chat.id;
//   const userId = query.from.id;
//   if (query.data === 'check_subscription') {
//     const isSubscribed = await checkSubscription(userId);
//     if (isSubscribed) {
//       await bot.answerCallbackQuery(query.id, { text: '✅ Спасибо за подписку!', show_alert: false });
//       await bot.deleteMessage(chatId, query.message.message_id);
//       await bot.sendMessage(chatId, '✅ Отлично! Теперь отправь ссылку на Instagram, YouTube или TikTok 🎵');
//     } else {
//       await bot.answerCallbackQuery(query.id, { text: '❌ Вы еще не подписались на канал!', show_alert: true });
//     }
//   }
// });

// // ===== /START =====
// bot.onText(/\/start/, async msg => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   if (!(await checkSubscription(userId))) {
//     await sendSubscriptionMessage(chatId);
//     return;
//   }
//   await bot.sendMessage(
//     chatId,
//     '👋 Привет! Я могу скачать:\n\n📸 Instagram (Reels, видео)\n🎥 YouTube (видео, Shorts)\n🎵 TikTok (видео без водяного знака)\n\n⚠️ Фото из Instagram пока не поддерживаются\n\nОтправь ссылку!'
//   );
// });

// // ===== /MYID =====
// bot.onText(/\/myid/, msg => {
//   bot.sendMessage(msg.chat.id, `Ваш Telegram ID: ${msg.from.id}`);
// });

// // ===== ОБРАБОТКА ССЫЛОК =====
// bot.on('message', async msg => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const text = msg.text;

//   if (!text || text.startsWith('/')) return;

//   if (!(await checkSubscription(userId))) {
//     await sendSubscriptionMessage(chatId);
//     return;
//   }

//   const platform = detectPlatform(text);
//   if (!platform) {
//     await bot.sendMessage(chatId, '⚠️ Отправьте ссылку на Instagram, YouTube или TikTok');
//     return;
//   }

//   // === TIKTOK ОТДЕЛЬНО ===
//   if (platform === 'tiktok') {
//     const statusMsg = await bot.sendMessage(chatId, '🎵 TikTok: получаю видео без водяного знака...');
//     const timestamp = Date.now();
//     const outputFile = path.join(tempDir, `media_${timestamp}.mp4`);

//     try {
//       const { title, music } = await downloadTikTok(text, outputFile);

//       const stats = fs.statSync(outputFile);
//       if (stats.size > 50 * 1024 * 1024) {
//         await bot.editMessageText(`❌ Файл слишком большой (${(stats.size / 1024 / 1024).toFixed(1)} MB)\nTelegram лимит: 50 МБ`, {
//           chat_id: chatId,
//           message_id: statusMsg.message_id
//         });
//         fs.unlinkSync(outputFile);
//         return;
//       }

//       const caption = `✅ Готово!\n📢 ${CHANNEL_LINK}`;

//       await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

//       await bot.sendVideo(chatId, outputFile, {
//         caption,
//         supports_streaming: true,
//         reply_markup: { inline_keyboard: [[{ text: '📢Мой канал', url: CHANNEL_LINK }]] }
//       });

//       setTimeout(() => fs.unlink(outputFile, () => {}), 8000);

//     } catch (err) {
//       console.error('TikTok error:', err.message);
//       await bot.editMessageText('❌ Не удалось скачать с TikTok\nПопробуй другую ссылку или чуть позже', {
//         chat_id: chatId,
//         message_id: statusMsg.message_id
//       });
//     }
//     return;
//   }

//   // === INSTAGRAM & YOUTUBE ===
//   const platformEmoji = platform === 'instagram' ? '📸' : '🎥';
//   const statusMsg = await bot.sendMessage(chatId, `${platformEmoji} Скачиваю...`);
//   const timestamp = Date.now();
//   const outputTemplate = path.join(tempDir, `media_${timestamp}.mp4`);

//   try {
//     let command;

//     if (platform === 'instagram') {
//       // Instagram: скачиваем доступный формат и конвертируем
//       command = `yt-dlp --no-warnings --no-check-certificate \
//         -f "best[ext=mp4]/best" \
//         --remux-video mp4 \
//         --postprocessor-args "ffmpeg:-c:v libx264 -preset fast -c:a aac -movflags +faststart" \
//         -o "${outputTemplate}" "${text}"`;
//     } else {
//       // YouTube: конвертируем в H.264 + AAC для Telegram
//       command = `yt-dlp --no-warnings --no-check-certificate \
//         --extractor-args "youtube:player_client=android" \
//         -f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]/best" \
//         --merge-output-format mp4 \
//         --postprocessor-args "ffmpeg:-c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart" \
//         -o "${outputTemplate}" "${text}"`;
//     }

//     console.log('Выполняю:', command);

//     exec(command, { timeout: 120000 }, async (error, stdout, stderr) => {
//       try {
//         if(error){
//           console.error('Ошибка yt-dlp:', stderr);

//           if(stderr.includes('Private video') || stderr.includes('private')){
//             await bot.editMessageText('❌ Это приватный аккаунт или видео.', 
//               { chat_id: chatId, message_id: statusMsg.message_id });
//           } else if(stderr.includes('not available') || stderr.includes('unavailable')){
//             await bot.editMessageText('❌ Видео недоступно или удалено.', 
//               { chat_id: chatId, message_id: statusMsg.message_id });
//           } else if(stderr.includes('HTTP Error 403') || stderr.includes('Forbidden')){
//             await bot.editMessageText('❌ Доступ запрещен. Попробуйте другое видео.', 
//               { chat_id: chatId, message_id: statusMsg.message_id });
//           } else if(stderr.includes('ffmpeg') || stderr.includes('Postprocessing')){
//             await bot.editMessageText('❌ Ошибка обработки видео.\n\nУстановите ffmpeg: apt install ffmpeg', 
//               { chat_id: chatId, message_id: statusMsg.message_id });
//           } else {
//             await bot.editMessageText(
//               '❌ Не удалось скачать.\n\nПопробуйте:\n- Другую ссылку\n- Повторить через минуту',
//               { chat_id: chatId, message_id: statusMsg.message_id }
//             );
//           }
//           return;
//         }

//         // Проверяем существование файла
//         if(!fs.existsSync(outputTemplate)){
//           await bot.editMessageText('❌ Файл не был создан. Попробуйте другую ссылку.', 
//             { chat_id: chatId, message_id: statusMsg.message_id });
//           return;
//         }

//         const stats = fs.statSync(outputTemplate);
//         const sizeMB = stats.size / (1024*1024);

//         console.log(`Скачан: media_${timestamp}.mp4, размер: ${sizeMB.toFixed(2)} MB`);

//         // Проверка размера
//         if(stats.size > 50*1024*1024){
//           await bot.editMessageText(
//             `❌ Файл слишком большой (${sizeMB.toFixed(1)} MB).\nTelegram лимит: 50MB\n\n💡 Попробуйте более короткое видео.`,
//             { chat_id: chatId, message_id: statusMsg.message_id }
//           );
//           fs.unlinkSync(outputTemplate);
//           return;
//         }

//         // Проверка на минимальный размер
//         if(stats.size < 1000){
//           await bot.editMessageText('❌ Файл слишком маленький (возможно ошибка скачивания).', 
//             { chat_id: chatId, message_id: statusMsg.message_id });
//           fs.unlinkSync(outputTemplate);
//           return;
//         }

//         await bot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});

//         // Отправляем видео
//         await bot.sendVideo(chatId, outputTemplate, {
//           caption: `✅ Готово! ${platformEmoji}\n\n📢 ${CHANNEL_LINK}`,
//           supports_streaming: true,
//           reply_markup:{ inline_keyboard:[[{text:'📢 Мой канал', url:CHANNEL_LINK}]] }
//         });

//         // Удаляем файл через 5 секунд
//         setTimeout(()=>{
//           try{ 
//             if(fs.existsSync(outputTemplate)) {
//               fs.unlinkSync(outputTemplate);
//               console.log(`Удален: media_${timestamp}.mp4`);
//             }
//           } catch(e){ 
//             console.error('Ошибка удаления:', e.message); 
//           }
//         }, 5000);

//       } catch(sendError){
//         console.error('Ошибка отправки:', sendError.message);
//         await bot.sendMessage(chatId, '❌ Ошибка при отправке файла.\n\nПопробуйте другую ссылку.');

//         // Удаляем файл при ошибке
//         try{
//           if(fs.existsSync(outputTemplate)) fs.unlinkSync(outputTemplate);
//         } catch(e){}
//       }
//     });

//   } catch (error){
//     console.error('Общая ошибка:', error.message);
//     await bot.editMessageText('❌ Произошла ошибка. Попробуйте позже.', 
//       { chat_id: chatId, message_id: statusMsg.message_id });
//   }
// });

// // ===== ОЧИСТКА TEMP =====
// const cleanupTemp = () => {
//   if (!fs.existsSync(tempDir)) return;
//   const files = fs.readdirSync(tempDir);
//   let cleaned = 0;
//   files.forEach(file => {
//     try {
//       const filePath = path.join(tempDir, file);
//       const stats = fs.statSync(filePath);
//       if (Date.now() - stats.mtimeMs > 3600000) {
//         fs.unlinkSync(filePath);
//         cleaned++;
//       }
//     } catch (e) {}
//   });
//   if (cleaned > 0) console.log(`Очищено файлов: ${cleaned}`);
// };

// setInterval(cleanupTemp, 1800000);
// cleanupTemp();

// bot.on('polling_error', error => console.error('Polling error:', error.code));
// bot.on('error', error => console.error('Bot error:', error));

// console.log('✅ Бот запущен — Instagram + YouTube + TikTok (без водяного знака)!');


// // Полностью рабочий код бота с поддержкой TikTok без водяного знака и улучшенной обработкой ошибок.











const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');

// --- КОНФИГУРАЦИЯ ---
const TOKEN = process.env.BOT_TOKEN;
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || '@VorisxonGroup';
const CHANNEL_LINK = process.env.CHANNEL_LINK || 'https://t.me/VorisxonGroup';
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id)) : [1723957261, 1515609034];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB - лимит Telegram

const bot = new TelegramBot(TOKEN, { 
    polling: { interval: 300, autoStart: true, params: { timeout: 10 } }
});

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// =========================================================
//                  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =========================================================

/**
 * Проверяет подписку пользователя.
 */
async function checkSubscription(userId) {
    if (ADMIN_IDS.includes(userId)) return true;
    try {
        const member = await bot.getChatMember(CHANNEL_USERNAME, userId);
        return ['creator','administrator','member'].includes(member.status);
    } catch (error) {
        // Ошибка 400: User not found in chat - означает, что не подписан.
        if (error.response && error.response.statusCode === 400 && error.response.body.description.includes('user not found')) {
            return false;
        }
        console.error('Ошибка проверки подписки:', error.message);
        return false;
    }
}

/**
 * Отправляет сообщение о необходимости подписки.
 */
async function sendSubscriptionMessage(chatId) {
    await bot.sendMessage(
        chatId,
        `❌ Для использования бота подпишитесь на Мой канал!\n\n👉 ${CHANNEL_LINK}\n\nПосле подписки отправьте команду /start`,
        { reply_markup: { inline_keyboard: [[{ text: '📢 Подписаться', url: CHANNEL_LINK }],[{ text:'✅ Я подписался', callback_data:'check_subscription' }]] } }
    );
}

/**
 * Определяет платформу по URL.
 */
function detectPlatform(url) {
    if (/instagram\.com\/(p|reel|reels|tv|stories)\/[\w-]+/.test(url)) return 'instagram';
    if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts/.test(url)) return 'youtube';
    if (/tiktok\.com/.test(url) || /vm\.tiktok\.com/.test(url) || /vt\.tiktok\.com/.test(url)) return 'tiktok';
    return null;
}

/**
 * Скачивает медиа-файл по прямой ссылке.
 */
function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        const protocol = url.startsWith('https') ? https : require('http');

        protocol.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        .on('response', res => res.pipe(file))
        .on('error', err => {
            fs.unlink(outputPath, () => {});
            reject(err);
        });

        file.on('finish', () => {
            file.close();
            resolve(outputPath);
        });
    });
}

/**
 * Скачивает TikTok без водяного знака (Видео).
 */
async function downloadTikTokVideo(url, outputPath) {
    const response = await axios.get('https://tikwm.com/api/', {
        params: { url: url, hd: 1 },
        timeout: 20000
    });

    if (response.data.code !== 0 || !response.data.data) {
        throw new Error(response.data.msg || 'TikTok API error');
    }

    const data = response.data.data;
    const videoUrl = data.hdplay || data.play;
    if (!videoUrl) throw new Error('No video URL found');

    await downloadFile(videoUrl, outputPath);
    return { title: data.title, music: data.music_info?.title };
}

// =========================================================
//                      ОБРАБОТЧИКИ СОБЫТИЙ
// =========================================================

// ===== CALLBACK QUERY =====
bot.on('callback_query', async query => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    if (query.data === 'check_subscription') {
        const isSubscribed = await checkSubscription(userId);
        if (isSubscribed) {
            await bot.answerCallbackQuery(query.id, { text: '✅ Спасибо за подписку!', show_alert: false });
            await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
            await bot.sendMessage(chatId, '✅ Отлично! Теперь отправь ссылку на Instagram, YouTube или TikTok 🎵');
        } else {
            await bot.answerCallbackQuery(query.id, { text: '❌ Вы еще не подписались на канал!', show_alert: true });
        }
    }
});

// ===== /START =====
bot.onText(/\/start/, async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (!(await checkSubscription(userId))) {
        await sendSubscriptionMessage(chatId);
        return;
    }
    await bot.sendMessage(
        chatId,
        '👋 Привет! Я могу скачать:\n\n📸 **Instagram** (Reels, видео, **фото, карусели**)\n🎥 **YouTube** (видео, Shorts)\n🎵 **TikTok** (видео **без водяного знака**)\n\nОтправь ссылку!'
    );
});

// ===== /MYID =====
bot.onText(/\/myid/, msg => {
    bot.sendMessage(msg.chat.id, `Ваш Telegram ID: ${msg.from.id}`);
});

// ===== ОБРАБОТКА ССЫЛОК =====
bot.on('message', async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;

    if (!(await checkSubscription(userId))) {
        await sendSubscriptionMessage(chatId);
        return;
    }

    const url = text.trim().split(/\s+/)[0]; // Берем только первую ссылку
    const platform = detectPlatform(url);

    if (!platform) {
        await bot.sendMessage(chatId, '⚠️ Отправьте ссылку на Instagram, YouTube или TikTok');
        return;
    }

    const statusMsg = await bot.sendMessage(chatId, `⏳ ${platform.toUpperCase()}: обрабатываю ссылку...`);
    const timestamp = Date.now();
    const caption = `✅ Готово!\n📢 ${CHANNEL_LINK}`;

    try {
        if (platform === 'tiktok') {
            // === TIKTOK (ТОЛЬКО ВИДЕО БЕЗ ЗНАКА) ===
            const outputFile = path.join(tempDir, `media_${timestamp}.mp4`);
            
            await bot.editMessageText('🎵 TikTok: получаю видео без водяного знака...', { chat_id: chatId, message_id: statusMsg.message_id });
            await downloadTikTokVideo(url, outputFile);

            const stats = fs.statSync(outputFile);
            if (stats.size > MAX_FILE_SIZE) {
                throw new Error(`Файл слишком большой (${(stats.size / 1024 / 1024).toFixed(1)} MB). Лимит: 50 МБ`);
            }

            await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
            await bot.sendVideo(chatId, outputFile, {
                caption, supports_streaming: true,
                reply_markup: { inline_keyboard: [[{ text: '📢 Мой канал', url: CHANNEL_LINK }]] }
            });
            setTimeout(() => fs.unlink(outputFile, () => {}), 5000);
            return;
        }

        // === INSTAGRAM & YOUTUBE (через yt-dlp) ===

        // Шаг 1: Получаем метаданные (JSON) с помощью yt-dlp
        await bot.editMessageText('⚙️ Запрашиваю метаданные...', { chat_id: chatId, message_id: statusMsg.message_id });
        
        const ytDlpCommandMeta = `yt-dlp --no-warnings --no-check-certificate --skip-download --print-json "${url}"`;
        
        const { stdout: metaJson } = await new Promise((resolve, reject) => {
            exec(ytDlpCommandMeta, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) return reject(new Error(stderr.trim() || error.message));
                resolve({ stdout });
            });
        });

        const mediaJson = JSON.parse(metaJson);
        const entries = mediaJson.entries || [mediaJson]; // Для карусели entries, для одиночного медиа - сам объект

        await bot.editMessageText('✨ Обрабатываю медиа...', { chat_id: chatId, message_id: statusMsg.message_id });

        // Шаг 2: Обрабатываем каждый элемент медиа
        for (const entry of entries) {
            const mediaUrl = entry.url;
            const mediaType = entry.ext; // 'mp4', 'jpg', 'jpeg'
            const isVideo = ['mp4', 'webm', 'mkv'].includes(mediaType);
            const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(mediaType);
            const mediaId = entry.id || timestamp;

            if (isImage) {
                // --- INSTAGRAM ФОТО ---
                const imageOutput = path.join(tempDir, `photo_${mediaId}.jpg`);

                await downloadFile(mediaUrl, imageOutput);
                const stats = fs.statSync(imageOutput);
                
                if (stats.size > MAX_FILE_SIZE) {
                    throw new Error(`Фото слишком большое (${(stats.size / 1024 / 1024).toFixed(1)} MB). Лимит: 50 МБ`);
                }

                await bot.sendPhoto(chatId, imageOutput, {
                    caption: (entries.length > 1 ? `✅ Фото из карусели.\n` : caption),
                    reply_markup: { inline_keyboard: [[{ text: '📢 Мой канал', url: CHANNEL_LINK }]] }
                });
                setTimeout(() => fs.unlink(imageOutput, () => {}), 5000);

            } else if (isVideo) {
                // --- INSTAGRAM REEL/VIDEO ИЛИ YOUTUBE ---
                const outputFile = path.join(tempDir, `video_${mediaId}.mp4`);
                const platformEmoji = platform === 'instagram' ? '📸' : '🎥';
                
                let dlCommand;
                if (platform === 'instagram') {
                     // Instagram: скачиваем лучший mp4
                    dlCommand = `yt-dlp --no-warnings --no-check-certificate \
                        -f "best[ext=mp4]/best" \
                        --remux-video mp4 \
                        --postprocessor-args "ffmpeg:-c:v libx264 -preset fast -c:a aac -movflags +faststart" \
                        -o "${outputFile}" "${url}"`;
                } else {
                    // YouTube: конвертируем в H.264 + AAC для Telegram (ограничиваем до 720p)
                    dlCommand = `yt-dlp --no-warnings --no-check-certificate \
                        --extractor-args "youtube:player_client=android" \
                        -f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]/best" \
                        --merge-output-format mp4 \
                        --postprocessor-args "ffmpeg:-c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart" \
                        -o "${outputFile}" "${url}"`;
                }
                
                await bot.editMessageText(`${platformEmoji} Скачиваю и конвертирую видео...`, { chat_id: chatId, message_id: statusMsg.message_id });

                const { stdout, stderr } = await new Promise((resolve, reject) => {
                    exec(dlCommand, { timeout: 180000 }, (error, stdout, stderr) => { // Увеличил таймаут
                        if (error) return reject(new Error(stderr.trim() || error.message));
                        resolve({ stdout, stderr });
                    });
                });
                
                // Проверка файла после скачивания
                if (!fs.existsSync(outputFile)) throw new Error('Файл не был создан после скачивания/конвертации.');
                
                const stats = fs.statSync(outputFile);
                if (stats.size > MAX_FILE_SIZE) {
                    fs.unlinkSync(outputFile);
                    throw new Error(`Файл слишком большой (${(stats.size / 1024 / 1024).toFixed(1)} MB). Лимит: 50 МБ. Попробуйте более короткое видео.`);
                }
                
                await bot.sendVideo(chatId, outputFile, {
                    caption: (entries.length > 1 ? `✅ Видео из карусели.\n` : caption),
                    supports_streaming: true,
                    reply_markup: { inline_keyboard: [[{ text: '📢 Мой канал', url: CHANNEL_LINK }]] }
                });
                setTimeout(() => fs.unlink(outputFile, () => {}), 5000);
            }
        }
        
        await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

    } catch (err) {
        // --- ОБЩАЯ ОБРАБОТКА ОШИБОК ---
        console.error('Ошибка обработки ссылки:', err.message);

        let userError = '❌ Не удалось скачать. Возможные причины:\n';
        if (err.message.includes('too large') || err.message.includes('слишком большой')) {
            userError = `❌ ${err.message}`;
        } else if (err.message.includes('Private video') || err.message.includes('private')) {
            userError += '- Приватный аккаунт или видео.';
        } else if (err.message.includes('not available') || err.message.includes('unavailable')) {
            userError += '- Видео недоступно или удалено.';
        } else if (err.message.includes('HTTP Error 403') || err.message.includes('Forbidden')) {
            userError += '- Доступ запрещен. Попробуйте другое видео.';
        } else if (err.message.includes('ffmpeg') || err.message.includes('Postprocessing')) {
             userError += '- Ошибка обработки видео (отсутствует ffmpeg?).';
        } else {
            userError += '- Некорректная ссылка или временные проблемы сервиса.';
        }

        await bot.editMessageText(userError, { chat_id: chatId, message_id: statusMsg.message_id }).catch(() => {});
        
        // Попытка очистить файл, если он был создан
        try {
            if (fs.existsSync(path.join(tempDir, `media_${timestamp}.mp4`))) fs.unlinkSync(path.join(tempDir, `media_${timestamp}.mp4`));
            fs.readdirSync(tempDir).filter(f => f.includes(`media_${timestamp}`)).forEach(f => fs.unlinkSync(path.join(tempDir, f)));
        } catch(e) {}
    }
});


// =========================================================
//                          СИСТЕМА
// =========================================================

// ===== ОЧИСТКА TEMP =====
const cleanupTemp = () => {
    if (!fs.existsSync(tempDir)) return;
    const files = fs.readdirSync(tempDir);
    let cleaned = 0;
    files.forEach(file => {
        try {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            // Удаляем файлы старше 1 часа
            if (Date.now() - stats.mtimeMs > 3600000) { 
                fs.unlinkSync(filePath);
                cleaned++;
            }
        } catch (e) {}
    });
    if (cleaned > 0) console.log(`Очищено старых файлов: ${cleaned}`);
};

setInterval(cleanupTemp, 1800000); // Раз в 30 минут
cleanupTemp();

bot.on('polling_error', error => console.error('Polling error:', error.code));
bot.on('error', error => console.error('Bot error:', error));

console.log('✅ Бот запущен — с поддержкой Instagram фото/каруселей!');