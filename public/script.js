// Вспомогательная функция для показа результата
function showResult(elementId, content, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (isError) {
    el.innerHTML = `<span style="color:#f87171;">⚠️ ${content}</span>`;
  } else {
    el.innerHTML = content;
  }
}

// Email breach
document.getElementById('checkEmailBtn').addEventListener('click', async () => {
  const email = document.getElementById('emailInput').value.trim();
  if (!email) return showResult('emailResult', 'Введите email', true);
  showResult('emailResult', '⏳ Проверка...');
  try {
    const res = await fetch(`/api/email-breaches?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (data.breached) {
      const breaches = data.data.map(b => b.Name).join(', ');
      showResult('emailResult', `❗ Найден в утечках: ${breaches}`);
    } else {
      showResult('emailResult', '✅ Не обнаружен в публичных утечках (по данным HIBP)');
    }
  } catch (err) {
    showResult('emailResult', 'Ошибка соединения с сервером', true);
  }
});

// Username check
document.getElementById('checkUsernameBtn').addEventListener('click', async () => {
  const username = document.getElementById('usernameInput').value.trim();
  if (!username) return showResult('usernameResult', 'Введите username', true);
  showResult('usernameResult', '🔍 Поиск на GitHub и Reddit...');
  try {
    const res = await fetch(`/api/username-check?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    let html = '';
    if (data.github && data.github.exists) {
      html += `✅ GitHub: <a href="${data.github.profileUrl}" target="_blank">${username}</a><br>`;
    } else {
      html += `❌ GitHub: не найден<br>`;
    }
    if (data.reddit && data.reddit.exists) {
      html += `✅ Reddit: <a href="${data.reddit.profileUrl}" target="_blank">${username}</a>`;
    } else {
      html += `❌ Reddit: не найден`;
    }
    showResult('usernameResult', html);
  } catch (err) {
    showResult('usernameResult', 'Ошибка запроса', true);
  }
});

// Password breach (k-anonymity)
document.getElementById('checkPasswordBtn').addEventListener('click', async () => {
  const password = document.getElementById('passwordInput').value;
  if (!password) return showResult('passwordResult', 'Введите пароль', true);
  showResult('passwordResult', '⏳ Проверка через Pwned Passwords...');
  try {
    const res = await fetch(`/api/password-breach?password=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (data.pwned) {
      showResult('passwordResult', '⚠️ Этот пароль был скомпрометирован! Смените его.');
    } else {
      showResult('passwordResult', '✅ Хорошие новости – пароль не найден в известных утечках.');
    }
  } catch (err) {
    showResult('passwordResult', 'Ошибка проверки пароля', true);
  }
});

// Phone demo
document.getElementById('checkPhoneBtn').addEventListener('click', async () => {
  const phone = document.getElementById('phoneInput').value.trim();
  if (!phone) return showResult('phoneResult', 'Введите номер телефона', true);
  showResult('phoneResult', '📡 Демо-анализ...');
  try {
    const res = await fetch(`/api/phone-check?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    showResult('phoneResult', `
      📞 Номер: ${data.phone}<br>
      🧪 Режим: демо<br>
      ${data.message || ''}<br>
      🟢 Риск: ${data.risk || 'low'}
    `);
  } catch (err) {
    showResult('phoneResult', 'Ошибка демо-проверки', true);
  }
});