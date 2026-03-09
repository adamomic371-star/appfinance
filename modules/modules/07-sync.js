// 07-SYNC.JS - Sync state management

var syncQueue = [];
var syncTimer = null;

function queueSync(type) {
  if (!syncQueue.includes(type)) syncQueue.push(type);
  clearTimeout(syncTimer);
  syncTimer = setTimeout(processSyncQueue, 2000);
}

function processSyncQueue() {
  if (!user || user.localAuth || !db) {
    syncQueue = [];
    return;
  }

  if (syncQueue.length === 0) return;

  console.log('🔄 Processing sync queue:', syncQueue);
  updateSyncIndicator('syncing');

  const uid = user.id;
  const updates = {};

  syncQueue.forEach(type => {
    switch (type) {
      case 'transactions':
        if (transactions.length) {
          const txObj = {};
          transactions.forEach(tx => { txObj[tx.id] = tx; });
          updates['users/' + uid + '/transactions'] = txObj;
        }
        break;
      case 'goals':
        if (goals.length) {
          const goalsObj = {};
          goals.forEach(g => { goalsObj[g.id] = g; });
          updates['users/' + uid + '/goals'] = goalsObj;
        }
        break;
      case 'recurring':
        if (recurringItems.length) {
          const recObj = {};
          recurringItems.forEach(r => { recObj[r.id] = r; });
          updates['users/' + uid + '/recurring'] = recObj;
        }
        break;
      case 'groups':
        if (groups.length) {
          const grpObj = {};
          groups.forEach(g => { grpObj[g.id] = g; });
          updates['users/' + uid + '/groups'] = grpObj;
        }
        break;
    }
  });

  syncQueue = [];

  if (Object.keys(updates).length > 0) {
    db.ref().update(updates)
      .then(() => {
        console.log('✅ Sync queue processed');
        updateSyncIndicator('ready');
      })
      .catch(err => {
        console.error('❌ Sync error:', err);
        updateSyncIndicator('error');
        setTimeout(() => updateSyncIndicator('ready'), 3000);
      });
  } else {
    updateSyncIndicator('ready');
  }
}

console.log('✅ sync.js loaded');
