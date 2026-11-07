import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,getFirestore} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// 1) FIREBASE WEB CONFIG
const cfg={apiKey:"AIzaSyBgkRMWNP-4L-3kELS_3EgHLJdF0op6j6g",authDomain:"qr-code-web-e8bcb.firebaseapp.com",projectId:"qr-code-web-e8bcb",
     storageBucket: "qr-code-web-e8bcb.firebasestorage.app",      appId:"1:947352872357:web:6be2e26ec75d7f578a744c",
          measurementId: "G-PHXKR7ZH11"};
const app=initializeApp(cfg);
let _db;try{_db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})})}catch(e){_db=getFirestore(app)}
export const db=_db,auth=getAuth(app);
export const ADMIN_EMAIL="mr5210421@gmail.com";
export const FREE_DISHES=10;
// Free image hosting (cloudinary.com free plan, UNSIGNED preset). Leave as is to store small photos in Firestore.
export const CLOUD_NAME="YOUR_CLOUDINARY_NAME", PRESET="YOUR_UNSIGNED_PRESET";
// ===== PAYMENTS: Paddle (the only gateway). Card form is embedded inside the dashboard (Paddle inline checkout). =====
// Set PADDLE_ON=true AFTER you finish the Paddle setup in README.md (token + 3 price ids + webhook).
export const PADDLE_ON=true;
export const PADDLE_ENV="sandbox";                       // "sandbox" while testing, "production" when live
export const PADDLE_TOKEN="test_f598e36c13c80c77d6853d6eb06";   // Paddle > Developer tools > Authentication > Client-side tokens (public, safe here)
// Prices (USD). Create the same 3 prices in Paddle (recurring) and paste their ids below (pri_...).
// m1 = every 1 month, m6 = every 6 months, m12 = every 12 months (1 year).
export const PLANS=[
 {id:"m1", months:1,  usd:10, price:"pri_01m6r4hr7rkkn0fqge9jvv8s77"},
 {id:"m6", months:6,  usd:51, price:"pri_01m6r4kz0vhx5a0tgjenf0h0xp",  save:15},
 {id:"m12",months:12, usd:90, price:"pri_01m6r4p74z46r0yphybnwjygrn", save:25}
];
export const menuUrl=(slug,t)=>{const lo=/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)||location.protocol==='file:';return lo?location.origin+'/menu.html?r='+slug+(t?'&t='+t:''):location.origin+'/m/'+slug+(t?'?t='+t:'')};
export const region=()=>{try{const z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';if(/Karachi/.test(z))return 'PK';const m=(navigator.language||'').match(/-([A-Za-z]{2})$/);return m?m[1].toUpperCase():''}catch(e){return ''}};
export const isLocal=()=>/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)||location.protocol==='file:';
export const adminUrl=()=>isLocal()?'/admin.html':'/admin';
export const CONTACT_EMAIL='contact.mtech.official.com',CONTACT_WA='+92 3292504951',CONTACT_WAN='923000000000';
