export async function sendTelegramNotification(message: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('[Telegram] Bot token or chat ID not configured. Skipping notification.');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Telegram] Failed to send notification:', error);
    } else {
      console.log('[Telegram] Notification sent successfully');
    }
  } catch (error) {
    console.error('[Telegram] Error sending notification:', error);
  }
}

export async function sendNewUserNotification(username: string): Promise<void> {
  const message = `🎉 <b>Новый пользователь зарегистрировался!</b>\n\n👤 Имя пользователя: <code>${username}</code>\n📅 Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;
  await sendTelegramNotification(message);
}
