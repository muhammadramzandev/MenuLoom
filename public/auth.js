import {auth} from './config.js';
import {dt,lang} from './i18n.js';
import {GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
const $=i=>document.getElementById(i);
const C={'auth/invalid-credential':'e_wrong','auth/wrong-password':'e_wrong','auth/user-not-found':'e_nouser','auth/email-already-in-use':'e_exists','auth/weak-password':'e_weak','auth/invalid-email':'e_email','auth/too-many-requests':'e_many','auth/network-request-failed':'e_net','auth/popup-closed-by-user':''};
export function bindAuth(lng){const d=k=>dt(k,lng||lang());let m='in';
 const say=(t,ok)=>{$('amsg').textContent=t;$('amsg').style.color=ok?'var(--em)':'var(--coral)'};
 const err=x=>{const k=C[x.code];return k===''?'':d(k||'e_other')};
 const refresh=()=>{$('go').textContent=d(m==='in'?'tin':'tup');$('eye').textContent=d($('pw1').type==='password'?'show':'hide')};
 const set=x=>{m=x;$('tin').classList.toggle('on',x==='in');$('tup').classList.toggle('on',x==='up');const hd=document.querySelector('.authbox h2');if(hd){hd.dataset.i=x==='in'?'tin':'tup';hd.textContent=d(hd.dataset.i)}$('pw1').autocomplete=x==='in'?'current-password':'new-password';try{history.replaceState(null,'',location.pathname+'?m='+x+location.hash)}catch(e){}refresh();$('cw').classList.toggle('hide',x==='in');if($('aw'))$('aw').classList.toggle('hide',x==='in');$('fg').classList.toggle('hide',x==='up');say('')};
 $('tin').onclick=()=>set('in');$('tup').onclick=()=>set('up');
 $('eye').textContent=d('show');$('eye').onclick=()=>{const t=$('pw1').type==='password'?'text':'password';$('pw1').type=t;$('pw2').type=t;$('eye').textContent=d(t==='password'?'show':'hide')};
 $('go').onclick=async()=>{const e=$('em').value.trim(),p=$('pw1').value;if(!e||!p)return say(d('e_need'));
  if(m==='up'&&p!==$('pw2').value)return say(d('e_match'));if(m==='up'&&$('agree')&&!$('agree').checked)return say(d('e_agree'));
  const b=$('go'),mode=m;say('');b.disabled=true;b.classList.add('ld');b.textContent=d(mode==='in'?'signing':'creating');let ok=false;try{if(mode==='in')await signInWithEmailAndPassword(auth,e,p);else{const c=await createUserWithEmailAndPassword(auth,e,p);sendEmailVerification(c.user).catch(()=>{})}ok=true}catch(x){if(x.code==='auth/email-already-in-use')set('in');say(err(x))}if(ok)await new Promise(r=>setTimeout(r,900));b.classList.remove('ld');b.disabled=false;refresh()};
 $('fg').onclick=async()=>{const e=$('em').value.trim();if(!e)return say(d('reset_need'));try{await sendPasswordResetEmail(auth,e);say(d('reset_ok'),1)}catch(x){say(err(x))}};
 $('g').onclick=async()=>{const g=$('g'),t=g.textContent;g.disabled=true;g.classList.add('ld');g.textContent=d('signing');try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(x){say(err(x))}g.classList.remove('ld');g.disabled=false;g.textContent=t};
 ['em','pw1','pw2'].forEach(i=>$(i).onkeydown=e=>{if(e.key==='Enter')$('go').click()});return {refresh,set}}
