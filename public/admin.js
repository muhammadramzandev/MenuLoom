import {db,auth,ADMIN_EMAIL} from './config.js';
import {GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut,sendEmailVerification} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {doc,updateDoc,collection,getDocs,deleteDoc,query,orderBy,limit,addDoc} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
const $=i=>document.getElementById(i),show=(i,v)=>$(i).classList.toggle('hide',!v),DAY=864e5;
const pro=d=>d.plan==='pro'&&(!d.planUntil||d.planUntil>Date.now());
import {bindAuth} from './auth.js';
let R=[],P=[];
bindAuth('en');$('out').onclick=()=>{try{localStorage.removeItem('tb_user')}catch(e){}signOut(auth)};
let note='';
onAuthStateChanged(auth,async u=>{const isA=!!u&&(u.email||'').toLowerCase()===ADMIN_EMAIL.toLowerCase();
 if(u&&!isA){note='This account is not the admin account. Sign in with the admin email.';await signOut(auth);return}
 if(isA&&!u.emailVerified){try{await sendEmailVerification(u)}catch(e){}note='Your admin email is not verified yet. We sent a verification link to '+u.email+' (check spam). Open it, then sign in again. Or use Continue with Google: no verification needed.';await signOut(auth);return}
 const ok=isA;show('login',!ok);show('app',ok);show('out',ok);if(ok){note='';try{localStorage.tb_user='admin'}catch(e){}load()}else{$('amsg').textContent=note;$('amsg').style.color='var(--coral)'}});
async function load(){R=(await getDocs(collection(db,'restaurants'))).docs.map(d=>({id:d.id,...d.data()}));P=(await getDocs(collection(db,'payments'))).docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.ts-a.ts);stats();rest();pays();extras();announce()}
function stats(){const ap=P.filter(p=>p.status==='approved'),sum=f=>{const t={};ap.filter(f).forEach(p=>t[p.cur||'PKR']=(t[p.cur||'PKR']||0)+p.amount);return Object.entries(t).map(([c,v])=>c+' '+v).join(' + ')||'0'};
 const a=[['Restaurants',R.length],['Pro active',R.filter(pro).length],['Free',R.filter(r=>!pro(r)).length],['Suspended',R.filter(r=>r.suspended).length],['New this week',R.filter(r=>r.created>Date.now()-7*DAY).length],['Revenue (all time)',sum(()=>1)],['Revenue (30 days)',sum(p=>p.ts>Date.now()-30*DAY)],['Total menu views',R.reduce((s,r)=>s+(r.views||0),0)]];
 $('stats').innerHTML=a.map(x=>`<div class="stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('')}
function table(el,head,rows){const t=$(el);t.innerHTML='<tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr>';rows.forEach(r=>{const tr=document.createElement('tr');r.forEach(c=>{const td=document.createElement('td');c instanceof Node?td.append(c):td.textContent=c;tr.append(td)});t.append(tr)})}
const btn=(t,f)=>{const b=document.createElement('button');b.className='btn sm ghost';b.textContent=t;b.onclick=async()=>{await f();load()};return b};
const box=(...b)=>{const d=document.createElement('div');d.style.cssText='display:flex;gap:6px;flex-wrap:wrap';d.append(...b);return d};
function rest(){const s=$('q').value.toLowerCase();table('rt',['Restaurant','Link','Owner','Plan','Until','Views','Actions'],R.filter(r=>(r.name+r.id+(r.ownerEmail||'')).toLowerCase().includes(s)).map(r=>{const l=document.createElement('a');l.href='/menu.html?r='+r.id;l.textContent=r.id;l.target='_blank';
 return [r.name,l,r.ownerEmail||'',(pro(r)?'Pro':'Free')+(r.suspended?' (suspended)':''),r.planUntil?new Date(r.planUntil).toLocaleDateString():'-',r.views||0,
 box(btn('+30 days Pro',()=>updateDoc(doc(db,'restaurants',r.id),{plan:'pro',planUntil:Math.max(Date.now(),r.planUntil||0)+30*DAY})),btn('Set Free',()=>updateDoc(doc(db,'restaurants',r.id),{plan:'free',planUntil:null})),
 btn(r.suspended?'Unsuspend':'Suspend',()=>updateDoc(doc(db,'restaurants',r.id),{suspended:!r.suspended})),btn('Delete',async()=>{if(!confirm('Delete '+r.name+' and all its data?'))return;
 for(const c of ['items','orders'])for(const d of (await getDocs(collection(db,'restaurants',r.id,c))).docs)await deleteDoc(d.ref);await deleteDoc(doc(db,'restaurants',r.id))}))]}))}
$('q').oninput=rest;
function pays(){const row=p=>[new Date(p.ts).toLocaleString(),p.slug,p.ownerEmail||'',p.method,p.trx||'',(p.cur||'PKR')+' '+p.amount];
 table('pay',['Date','Restaurant','Owner','Method','Transaction ID','Amount','Status'],P.map(p=>[...row(p),p.status]))}

$('sm').onclick=()=>{const o=location.origin,pg=['','qr-menu-for-restaurants','free-qr-code-menu-generator','digital-menu-for-cafes','qr-menu-pakistan'].map(x=>o+'/'+x),rs=R.filter(r=>!r.suspended).map(r=>o+'/m/'+r.id);
 const x='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...pg,...rs].map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>';
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([x],{type:'application/xml'}));a.download='sitemap.xml';a.click()};

async function extras(){try{const f=(await getDocs(collection(db,'feedback'))).docs;table('fbt',['Date','Business','Type · Country','Rating','Text','Status','Action'],f.sort((p,q)=>(q.data().ts||0)-(p.data().ts||0)).map(x=>{const v=x.data();return [new Date(v.ts).toLocaleDateString(),v.name,(v.type||'')+' · '+(v.country||''),'★'.repeat(v.rating),v.text||'',v.approved?'Approved (live on home page)':'Pending',box(btn(v.approved?'Hide':'Approve',()=>updateDoc(x.ref,{approved:!v.approved})),btn('Delete',()=>deleteDoc(x.ref)))]}))}catch(e){}
 try{const c=(await getDocs(collection(db,'contacts'))).docs.sort((a,b)=>b.data().ts-a.data().ts);table('cmt',['Date','Name','Email','Topic','Message','Action'],c.map(x=>{const v=x.data();return [new Date(v.ts).toLocaleString(),v.name,v.email,v.topic,v.message,btn('Delete',()=>deleteDoc(x.ref))]}))}catch(e){}}

async function announce(){try{const s=(await getDocs(collection(db,'announcements'))).docs.sort((x,y)=>y.data().ts-x.data().ts);
 table('ant',['Date','Title','For','Status','Actions'],s.map(x=>{const v=x.data(),exp=v.until&&v.until<Date.now();return [new Date(v.ts).toLocaleDateString(),v.title+' — '+v.text,v.audience+' · '+(v.lang||'all'),!v.active?'Off':(exp?'Expired':'Live'),box(btn(v.active?'Turn off':'Turn on',()=>updateDoc(x.ref,{active:!v.active})),btn('Delete',()=>deleteDoc(x.ref)))]}))}catch(e){}}
$('an_p').onclick=async()=>{const t=$('an_t').value.trim(),m=$('an_m').value.trim(),o=$('an_msg');if(t.length<2||m.length<2){o.textContent='Write a title and a message first.';return}
 const days=Math.max(0,parseInt($('an_d').value)||0);$('an_p').disabled=true;
 try{await addDoc(collection(db,'announcements'),{title:t,text:m,type:$('an_ty').value,audience:$('an_a').value,lang:$('an_l').value,active:true,ts:Date.now(),until:days?Date.now()+days*864e5:0});o.textContent='Published. Owners see it now.';$('an_t').value='';$('an_m').value='';announce()}catch(e){o.textContent='Could not publish. Check that the new firestore.rules are published.'}$('an_p').disabled=false};
