(async function(){
  const base = 'http://127.0.0.1:3001';
  const email = 'devtest' + Date.now() + '@example.com';
  console.log('=== Testing with email:', email);
  
  try {
    const res = await fetch(base + '/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'TestPass123' })
    });
    const text = await res.text();
    console.log('SIGNUP', res.status, text);
  } catch (e) { console.error('SIGNUP-ERR', e.message); }

  try {
    const res = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'TestPass123' })
    });
    console.log('LOGIN status:', res.status);
    const text = await res.text();
    console.log('LOGIN response body:', text);
    
    let data;
    try { data = JSON.parse(text); } catch (e) { data = null; }
    
    if (!data || !data.token) {
      console.log('ERROR: No token in login response');
      return;
    }
    
    console.log('LOGIN token:', data.token);
    const token = data.token;
    
    const prof = await fetch(base + '/api/profile', { 
      headers: { Authorization: 'Bearer ' + token }
    });
    const profText = await prof.text();
    console.log('PROFILE status:', prof.status);
    console.log('PROFILE response:', profText);
    
  } catch (e) { console.error('LOGIN/PROFILE-ERR', e.message); }
})();
