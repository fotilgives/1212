
const axios = require('axios');

/**
 * SMS Service for Svetlana Mazur Portfolio
 * Supports TurboSMS and Twilio
 */

const sendSms = async (phone, date, time) => {
  const text = `Вітаємо! Ваш запис до Svetlana Mazur підтверджено на ${date} о ${time}. Чекаємо на вас!`;
  
  // TurboSMS Integration (Preferred for Ukraine)
  if (process.env.TURBOSMS_API_KEY) {
    try {
      const response = await axios.post('https://api.turbosms.ua/message/send.json', {
        recipients: [phone],
        sms: {
          sender: process.env.TURBOSMS_SENDER || 'Msg',
          text: text
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.TURBOSMS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ TurboSMS Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ TurboSMS Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Twilio Integration (Global Alternative)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const params = new URLSearchParams();
      params.append('To', phone);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Body', text);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        params,
        {
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN
          }
        }
      );
      console.log('✅ Twilio Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Twilio Error:', error.response?.data || error.message);
      throw error;
    }
  }

  console.warn('⚠️ SMS not sent: No API keys provided in environment variables.');
  return { warning: 'No API keys' };
};

module.exports = { sendSms };
