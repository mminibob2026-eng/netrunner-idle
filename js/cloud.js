const CLOUD_CONFIG = {
  enabled: true,
  firebaseConfig: {
    apiKey: 'AIzaSyApYfL8qb3vidqZpPn9znxybuLUR35rz-c',
    authDomain: 'netrunner-idle-2b131.firebaseapp.com',
    projectId: 'netrunner-idle-2b131',
    storageBucket: 'netrunner-idle-2b131.firebasestorage.app',
    messagingSenderId: '436367736115',
    appId: '1:436367736115:web:06d6a555c9f10fc1131246',
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
    const payload = { username: USER, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    if (ACCOUNT) {
      // Save all profiles
      const profileStates = {};
      ACCOUNT.profiles.forEach((p, i) => {
        const key = profileStateKey(p.id);
        const raw = localStorage.getItem(key);
        if (raw) {
          try { profileStates[p.id] = JSON.parse(raw); } catch(e) {}
        }
      });
      payload.account = {
        uid: ACCOUNT.uid,
        email: ACCOUNT.email,
        authMethod: ACCOUNT.authMethod,
        activeProfile: ACCOUNT.activeProfile,
        profiles: ACCOUNT.profiles.map(p => ({ id:p.id, name:p.name, spec:p.spec })),
        profileStates: profileStates,
      };
    } else {
      payload.gameState = JSON.parse(JSON.stringify(G));
    }
    await _firestore.collection(CLOUD_CONFIG.collectionName).doc(USER).set(payload);
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
    return { data: d, updatedAt: d.updatedAt?.toDate?.()?.toISOString() || '' };
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

  const cd = cloud.data;
  if (cd.account && ACCOUNT) {
    // Cloud has account data — restore if ahead
    const localTime = G.lastSave || 0;
    const cloudTime = new Date(cloud.updatedAt).getTime();
    if (cloudTime > localTime + 5000) {
      const oldPw = G._pw;
      const oldSub = G._subActive;
      ACCOUNT.uid = cd.account.uid;
      ACCOUNT.email = cd.account.email || '';
      ACCOUNT.authMethod = cd.account.authMethod || 'google';
      ACCOUNT.activeProfile = cd.account.activeProfile || 0;
      if (cd.account.profiles) {
        cd.account.profiles.forEach((cp, i) => {
          if (ACCOUNT.profiles[i]) {
            ACCOUNT.profiles[i].name = cp.name;
            ACCOUNT.profiles[i].spec = cp.spec;
          }
        });
      }
      if (cd.account.profileStates) {
        Object.entries(cd.account.profileStates).forEach(([pid, state]) => {
          localStorage.setItem(profileStateKey(pid), JSON.stringify(state));
        });
      }
      saveAccount();
      const profile = ACCOUNT.profiles[ACCOUNT.activeProfile];
      if (loadProfile(profile.id)) {
        G._pw = oldPw;
        G._subActive = oldSub;
        toast('Cloud restore complete', 'info');
        rebuildUI();
      }
    }
  } else if (cd.gameState && !ACCOUNT) {
    // Legacy single-profile cloud restore
    const localDm = G.prest.dm || 0;
    const cloudDm = cd.gameState.prest?.dm || 0;
    if (cloudDm > localDm) {
      const pw = G._pw;
      const sub = G._subActive;
      G = Object.assign(freshState(), cd.gameState);
      migrateState(G);
      G._pw = pw;
      G._subActive = sub;
      toast('Cloud save restored (ahead of local)', 'info');
      rebuildUI();
    }
  }

  await cloudSave();
}
