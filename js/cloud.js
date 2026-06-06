// Cloud save configuration
// To enable cloud saves via Firebase:
// 1. Go to https://console.firebase.google.com → Create project
// 2. Enable Firestore Database (start in test mode)
// 3. Go to Project Settings → General → Your apps → Web app
// 4. Copy the firebaseConfig object
// 5. Set CLOUD_CONFIG below

const CLOUD_CONFIG = {
  enabled: false,
  firebaseConfig: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
  collectionName: 'saves',
};

let _firestore = null;

function initCloud() {
  if (!CLOUD_CONFIG.enabled) return;
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(CLOUD_CONFIG.firebaseConfig);
    }
    _firestore = firebase.firestore();
    _firestore.settings({ merge: true });
  } catch(e) {
    console.log('Firebase init failed:', e);
    _firestore = null;
  }
}

async function cloudSave() {
  if (!_firestore || !USER || !G) return false;
  if (!isSubActive()) return false;
  try {
    const data = JSON.parse(JSON.stringify(G));
    await _firestore.collection(CLOUD_CONFIG.collectionName).doc(USER).set({
      username: USER,
      data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch(e) {
    console.log('Cloud save failed:', e);
    return false;
  }
}

async function cloudLoad() {
  if (!_firestore || !USER) return null;
  try {
    const doc = await _firestore.collection(CLOUD_CONFIG.collectionName).doc(USER).get();
    if (!doc.exists) return null;
    const d = doc.data();
    return { data: d.data, updatedAt: d.updatedAt?.toDate?.()?.toISOString() || '' };
  } catch(e) {
    console.log('Cloud load failed:', e);
    return null;
  }
}

function hasCloudConflict(local, cloud) {
  if (!cloud || !cloud.updatedAt) return false;
  const localTime = local.lastSave || 0;
  const cloudTime = new Date(cloud.updatedAt).getTime();
  return cloudTime > localTime + 5000;
}

async function syncCloud() {
  if (!_firestore || !USER || !G) return;
  if (!isSubActive()) return;

  const cloud = await cloudLoad();
  if (!cloud) {
    await cloudSave();
    return;
  }

  if (hasCloudConflict(G, cloud)) {
    const localDm = G.prest.dm || 0;
    const cloudDm = cloud.data.prest?.dm || 0;
    if (cloudDm > localDm) {
      const pw = G._pw;
      const sub = G._subActive;
      G = Object.assign(freshState(), cloud.data);
      migrateState(G);
      G._pw = pw;
      G._subActive = sub;
      toast('Cloud save restored (ahead of local)', 'info');
      rebuildUI();
    }
  }

  await cloudSave();
}
