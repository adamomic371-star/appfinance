
// GROUPS.JS - Gruppi e spese condivise

function loadGroups() {
  if (!user) return [];
  const stored = localStorage.getItem('fp_groups_' + user.id);
  return stored ? JSON.parse(stored) : [];
}

function saveGroups(groups) {
  if (!user) return;
  localStorage.setItem('fp_groups_' + user.id, JSON.stringify(groups));
  console.log('✅ Groups saved:', groups.length);
}

function createGroup(name, members) {
  const groups = loadGroups();
  const group = {
    id: Date.now().toString(),
    name: name,
    members: members,
    createdAt: new Date().toISOString(),
    expenses: []
  };
  groups.push(group);
  saveGroups(groups);
  return group;
}

console.log('✅ groups.js loaded');
