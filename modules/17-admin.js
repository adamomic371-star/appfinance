// 17-ADMIN.JS - Gestione credenziali admin
// NOTA: ADMIN_CREDENTIALS è definito in 14-auth.js — non ridichiarare qui

const ADMIN_CONFIG = {
  email: "adamomic371@gmail.com",
  password: "123admin456",
  username: "admin",
  name: "Administrator"
};

async function loginAsAdmin() {
  try {
    console.log('🔄 Admin login attempt...');
    
    // Prova con Firebase first
    if (firebase && firebase.auth) {
      console.log('🔄 Tentando login admin via Firebase...');
      
      try {
        const result = await firebase.auth().signInWithEmailAndPassword(
          ADMIN_CONFIG.email, 
          ADMIN_CONFIG.password
        );
        
        user = {
          id: result.user.uid,
          email: result.user.email,
          name: ADMIN_CONFIG.name,
          username: ADMIN_CONFIG.username,
          isAdmin: true,
          adminSince: new Date().toISOString()
        };
        
        console.log('✅ Admin login successful via Firebase');
        localStorage.setItem('fp_user', JSON.stringify(user));
        localStorage.setItem('fp_admin_session', JSON.stringify({
          adminUser: true,
          loginTime: new Date().toISOString()
        }));
        
        showNotification('✅ Benvenuto Admin!', 'success');
        return user;
        
      } catch (firebaseErr) {
        console.warn('⚠️ Firebase admin login failed:', firebaseErr.code);
      }
    }
    
    // Fallback: Login locale
    console.log('🔄 Usando admin login locale...');
    user = {
      id: 'admin-' + Date.now(),
      email: ADMIN_CONFIG.email,
      name: ADMIN_CONFIG.name,
      username: ADMIN_CONFIG.username,
      isAdmin: true,
      adminSince: new Date().toISOString(),
      localAuth: true
    };
    
    localStorage.setItem('fp_user', JSON.stringify(user));
    localStorage.setItem('fp_admin_session', JSON.stringify({
      adminUser: true,
      loginTime: new Date().toISOString(),
      localAuth: true
    }));
    
    console.log('✅ Admin login successful (local)');
    showNotification('✅ Benvenuto Admin!', 'success');
    return user;
    
  } catch (err) {
    console.error('❌ Admin login error:', err);
    showNotification('❌ Admin login failed', 'error');
    return null;
  }
}

function isAdminUser() {
  if (!user) return false;
  return user.isAdmin === true || user.username === 'admin';
}

function getAdminStatus() {
  const adminSession = localStorage.getItem('fp_admin_session');
  if (!adminSession) return null;
  
  try {
    return JSON.parse(adminSession);
  } catch (e) {
    return null;
  }
}

function logoutAdmin() {
  console.log('🔄 Admin logout...');
  
  user = null;
  localStorage.removeItem('fp_user');
  localStorage.removeItem('fp_admin_session');
  
  console.log('✅ Admin logout successful');
  showNotification('✅ Admin logout completato', 'success');
  showLoginScreen();
}

console.log('✅ admin.js loaded - Admin credentials configured');
