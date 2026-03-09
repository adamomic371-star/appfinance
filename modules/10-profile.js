
// PROFILE.JS - Profilo utente

function loadProfile() {
  if (!user) return {};
  const stored = localStorage.getItem('fp_profile_' + user.id);
  return stored ? JSON.parse(stored) : {};
}

function saveProfile(profile) {
  if (!user) return;
  localStorage.setItem('fp_profile_' + user.id, JSON.stringify(profile));
  console.log('✅ Profile saved');
}

function updateProfile(updates) {
  const profile = loadProfile();
  Object.assign(profile, updates);
  saveProfile(profile);
  return profile;
}

console.log('✅ profile.js loaded');
