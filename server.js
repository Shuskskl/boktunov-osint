const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==================== 1. ПРОВЕРКА EMAIL ====================
app.get('/api/email-breaches', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const response = await axios.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, {
      headers: { 'hibp-api-key': '' } // Можно оставить пустым для анонимных запросов
    });
    res.json({ breached: true, data: response.data });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.json({ breached: false, data: [] });
    }
    console.error('Email check error:', error.message);
    res.status(500).json({ error: 'Failed to check email' });
  }
});

// ==================== 2. ПРОВЕРКА USERNAME (GITHUB + REDDIT) ====================
app.get('/api/username-check', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  const results = {};

  // Проверка GitHub
  try {
    const githubRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`);
    results.github = githubRes.status === 200 
      ? { exists: true, profileUrl: `https://github.com/${username}` } 
      : { exists: false };
  } catch (e) {
    results.github = { exists: false };
  }

  // Проверка Reddit
  try {
    const redditRes = await axios.get(`https://www.reddit.com/user/${username}/about.json`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (redditRes.data && redditRes.data.data && !redditRes.data.data.is_suspended) {
      results.reddit = { exists: true, profileUrl: `https://www.reddit.com/user/${username}` };
    } else {
      results.reddit = { exists: false };
    }
  } catch (e) {
    results.reddit = { exists: false };
  }

  res.json(results);
});

// ==================== 3. ПРОВЕРКА ПАРОЛЯ (Pwned Passwords) ====================
app.get('/api/password-breach', async (req, res) => {
  let { password } = req.query;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  try {
    // SHA-1 хэширование
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
    const hashes = response.data.split('\n');
    const found = hashes.some(line => line.split(':')[0] === suffix);
    res.json({ pwned: found });
  } catch (error) {
    console.error('Password check error:', error.message);
    res.status(500).json({ error: 'Password check failed' });
  }
});

// ==================== 4. РЕАЛЬНАЯ ПРОВЕРКА ТЕЛЕФОНА (Numverify) ====================
app.get('/api/phone-check', async (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ error: 'Phone required' });
  }

  try {
    const YOUR_API_KEY = 'ВСТАВЬТЕ_ВАШ_КЛЮЧ_ЗДЕСЬ';
    const response = await axios.get(`http://apilayer.net/api/validate?access_key=${YOUR_API_KEY}&number=${encodeURIComponent(phone)}`);
    
    res.json({
      valid: response.data.valid,
      number: response.data.number,
      country: response.data.country_name,
      carrier: response.data.carrier,
      line_type: response.data.line_type,
      location: response.data.location
    });
  } catch (error) {
    console.error('Phone API error:', error.message);
    res.status(500).json({ error: 'Phone check failed', demo: false });
  }
});

});

// ==================== ЗАПУСК СЕРВЕРА ====================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
