const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// EMAIL CHECK
app.get('/api/email-breaches', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const response = await axios.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`);
    res.json({ breached: true, data: response.data });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.json({ breached: false, data: [] });
    }
    res.status(500).json({ error: 'Failed to check email' });
  }
});

// USERNAME CHECK
app.get('/api/username-check', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const results = {};
  try {
    const githubRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`);
    results.github = githubRes.status === 200 ? { exists: true, profileUrl: `https://github.com/${username}` } : { exists: false };
  } catch (e) {
    results.github = { exists: false };
  }
  try {
    const redditRes = await axios.get(`https://www.reddit.com/user/${username}/about.json`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
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

// PASSWORD CHECK
app.get('/api/password-breach', async (req, res) => {
  let { password } = req.query;
  if (!password) return res.status(400).json({ error: 'Password required' });
  try {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
    const hashes = response.data.split('\n');
    const found = hashes.some(line => line.split(':')[0] === suffix);
    res.json({ pwned: found });
  } catch (error) {
    res.status(500).json({ error: 'Password check failed' });
  }
});

// PHONE CHECK (DEMO)
app.get('/api/phone-check', (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  res.json({
    demo: true,
    message: 'Demo function. For real phone check, add your API key in server.js',
    phone: phone,
    risk: 'low'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
