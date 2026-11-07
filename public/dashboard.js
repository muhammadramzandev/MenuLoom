import {db,auth,FREE_DISHES,CLOUD_NAME,PRESET,ADMIN_EMAIL,PADDLE_ON,PADDLE_ENV,PADDLE_TOKEN,PLANS,menuUrl,region,adminUrl,CONTACT_EMAIL,CONTACT_WA,CONTACT_WAN} from './config.js';
import {bindAuth} from './auth.js';
import {LANGS,ML,RTL,lang,tr,dt,setLang,D} from './i18n.js';
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {doc,getDoc,setDoc,updateDoc,collection,addDoc,getDocs,deleteDoc,query,where,orderBy,limit,onSnapshot} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
let LG=lang();if(!LANGS[LG])LG='en';const $=i=>document.getElementById(i),show=(i,v)=>$(i).classList.toggle('hide',!v),DAY=864e5,d=k=>D[k]?dt(k,LG):tr(k,LG);
const pro=x=>x.plan==='pro'&&(!x.planUntil||x.planUntil>Date.now());
let slug,data,items=[],editId=null,first=true,audio=null,qrMain=null,qk='',ordersAll=[],views={},ordStarted=false,lastBase=null,fbRating=0,cur='over';
const base=()=>(data&&data.lang)||'en',toast=m=>{$('toast').textContent=m;show('toast',1);setTimeout(()=>show('toast',0),4000)};
const BT=['restaurant','cafe','bar','hotel','bakery','fastfood','foodtruck','resort','other'],BE=['🍽️','☕','🍸','🏨','🥐','🍔','🚚','🏝️','✨'];
const CUR={PK:'Rs',IN:'₹',US:'$',CA:'$',AU:'$',GB:'£',AE:'AED',SA:'SAR',BD:'৳',TR:'₺',EG:'EGP',CN:'¥',JP:'¥',FR:'€',DE:'€',ES:'€',IT:'€',NL:'€',PT:'€',IE:'€'};
// ---------- language ----------
const opts=()=>Object.entries(LANGS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
function applyI(){document.documentElement.lang=LG;document.documentElement.dir=RTL.includes(LG)?'rtl':'ltr';document.querySelectorAll('[data-i]').forEach(e=>e.textContent=d(e.dataset.i));document.querySelectorAll('[data-p]').forEach(e=>e.placeholder=d(e.dataset.p))}
const cname=c=>{try{return new Intl.DisplayNames([LG],{type:'region'}).of(c)}catch(e){return c}};
function langInit(){const sv={sl:$('sl').value,pls:$('pls').value,pt:$('ptype').value,po:$('pot').value,cn:$('cn').value,pc:$('pcountry').value};
 ['dlang','dlang2','dlang3'].forEach(i=>{$(i).innerHTML=opts();$(i).value=LG});
 const mlo=Object.entries(ML).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');$('sl').innerHTML=mlo;$('sl').value=sv.sl||(ML[lang()]?lang():LG);$('pls').innerHTML=mlo;if(sv.pls)$('pls').value=sv.pls;
 $('ptype').innerHTML=BT.map((k,i)=>`<option value="${k}">${tr('b'+(i+1),LG)}</option>`).join('');if(sv.pt)$('ptype').value=sv.pt;
 $('pot').innerHTML=[['dashboard','ord_dash'],['whatsapp','ord_wa'],['both','ord_both']].map(([v,k])=>`<option value="${v}">${d(k)}</option>`).join('');if(sv.po)$('pot').value=sv.po;
 const co=countries().map(([c,n])=>`<option value="${c}">${n}</option>`).join('');$('cn').innerHTML='<option value=""></option>'+co;$('pcountry').innerHTML='<option value=""></option>'+co;$('cn').value=sv.cn||region()||'';if(sv.pc)$('pcountry').value=sv.pc;
 applyI();$('alh').textContent=tr('cta_t',LG);$('alp').textContent=tr('cta_s',LG);$('alu').replaceChildren(...['f1','f2','f3','f4','f6'].map(k=>{const li=document.createElement('li');li.textContent=tr(k,LG).split('¦')[0];return li}))}
function countries(){const dn=new Intl.DisplayNames([LG],{type:'region'}),skip=new Set(['AC','CP','DG','EA','EU','EZ','IC','TA','UN','XA','XB','ZZ','QO']),out=[];for(let a=65;a<=90;a++)for(let b=65;b<=90;b++){const c=String.fromCharCode(a,b);let n;try{n=dn.of(c)}catch(e){continue}if(n&&n!==c&&!skip.has(c))out.push([c,n])}return out.sort((x,y)=>x[1].localeCompare(y[1],LG))}
function changeLang(l){setLang(l);LG=l;const t1=trGet($('trs')),t2=trGet($('rtrs'));langInit();trRows($('trs'),true,base());trRows($('rtrs'),false,base());trSet($('trs'),t1);trSet($('rtrs'),t2);
 [...$('biz').children].forEach((b,i)=>b.lastChild.textContent=tr('b'+(i+1),LG));au.refresh();if(!$('setup').classList.contains('hide'))wiz();
 if(data){drawNews();$('add').textContent=d(editId?'save_b':'add_b');$('ft').textContent=d(editId?'edit_t':'add_t');render();load();go(cur);if(ordStarted)drawOrderList();drawAnalytics()}}
['dlang','dlang2','dlang3'].forEach(i=>$(i).onchange=e=>changeLang(e.target.value));
// ---------- translation rows ----------
function trRows(b,withD,bl){b.innerHTML='';Object.keys(ML).filter(c=>c!==bl).forEach(c=>{const w=document.createElement('label'),s=document.createElement('span');s.textContent=ML[c];w.append(s);[['n',d('p_name')],...(withD?[['d',d('p_desc')]]:[])].forEach(([k,ph])=>{const i=document.createElement('input');i.dataset.l=c;i.dataset.k=k;i.placeholder=ph;if(RTL.includes(c))i.dir='rtl';w.append(i)});b.append(w)})}
const trGet=b=>{const o={};b.querySelectorAll('input').forEach(i=>{const v=i.value.trim();if(v)(o[i.dataset.l]=o[i.dataset.l]||{})[i.dataset.k]=v});return o};
const trSet=(b,o)=>b.querySelectorAll('input').forEach(i=>i.value=((o||{})[i.dataset.l]||{})[i.dataset.k]||'');
const rnGet=()=>Object.fromEntries(Object.entries(trGet($('rtrs'))).map(([l,v])=>[l,v.n]));
$('atr').onclick=async()=>{const n=$('in').value.trim(),ds=$('id').value.trim();if(!n){alert(d('enter_name'));return}
 const mm=c=>({zh:'zh-CN',zt:'zh-TW',no:'nb'}[c]||c),old=$('atr').textContent;$('atr').disabled=true;$('atr').textContent=d('translating');let fail=0;
 for(const inp of $('trs').querySelectorAll('input')){const src=inp.dataset.k==='n'?n:ds;if(!src||inp.value)continue;
  try{const r=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(src)+'&langpair='+mm(base())+'|'+mm(inp.dataset.l)),j=await r.json(),t=j.responseData&&j.responseData.translatedText;if(t&&!/MYMEMORY|QUERY LENGTH/i.test(t))inp.value=t;else fail++}catch(e){fail++}}
 $('atr').disabled=false;$('atr').textContent=old;if(fail)alert(d('e_atr'))};
// ---------- images ----------
function shrink(f,max,q){return new Promise((ok,no)=>{const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?ok(b):no(),'image/jpeg',q)};i.onerror=no;i.src=u})}
const toData=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)});
async function upload(f,max){const b=await shrink(f,max,.82);if(!/^YOUR_/.test(CLOUD_NAME)){try{const m=new FormData();m.append('file',b);m.append('upload_preset',PRESET);const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,{method:'POST',body:m});const j=await r.json();if(j.secure_url)return j.secure_url}catch(e){}}return toData(await shrink(f,Math.min(max,520),.7))}
const bind=(f,u,max,cb)=>$(f).onchange=async e=>{const file=e.target.files[0];if(!file)return;const old=$(u).placeholder;$(u).placeholder=d('uploading');try{$(u).value=await upload(file,max)}catch{alert(d('e_img'))}$(u).placeholder=old;if(cb)cb()};
const pv=(box,src,cls)=>{const b=$(box);b.replaceChildren();if(src){const i=new Image();i.src=src;i.className=cls;i.alt='';b.append(i)}};
const lpv=()=>pv('plp',$('pl').value,'lpv'),wpv=()=>pv('wprev',$('wl').value,'lpv');
$('pl').addEventListener('input',lpv);
bind('if','iu',900);bind('pf','pl',300,lpv);bind('wf','wl',300,wpv);
// ---------- QR ----------
const loadImg=src=>new Promise((ok,no)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>ok(i);i.onerror=no;i.src=src});
const rr=(g,x,y,w,h,r)=>{g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h)};
function qrCanvas(text,size){const q=qrcode(0,'H');q.addData(text);q.make();const n=q.getModuleCount(),m=4,u=Math.max(2,Math.floor(size/(n+2*m))),s=u*(n+2*m),c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,s,s);x.fillStyle='#0c1f1b';for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k))x.fillRect((k+m)*u,(r+m)*u,u,u);return c}
async function qrLogo(text,size){const c=qrCanvas(text,size);if(!data.logo||!pro(data))return c;try{const i=await loadImg(data.logo),s=c.width,b=Math.round(s*.2),p=Math.round(b*.14),x=Math.round((s-b)/2),g=c.getContext('2d');g.fillStyle='#fff';rr(g,x-p,x-p,b+2*p,b+2*p,p*1.6);g.fill();g.save();rr(g,x,x,b,b,p);g.clip();g.drawImage(i,x,x,b,b);g.restore()}catch(e){}return c}
async function drawQr(){const url=menuUrl(slug),k=url+'|'+(data.logo||'').length+'|'+(pro(data)?1:0);if(k===qk)return;qk=k;qrMain=await qrLogo(url,720);qrMain.style.cssText='width:230px;max-width:100%;height:auto;border-radius:12px';$('qr').replaceChildren(qrMain)}
const save=(c,name)=>{const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download=name;document.body.append(a);a.click();a.remove()};
$('dl').onclick=()=>{if(qrMain){save(qrMain,slug+'-qr.png');try{localStorage.tb_dl=1}catch(e){}checklist()}};$('open').onclick=()=>{try{localStorage.tb_share=1}catch(e){}checklist()};
const loadScript=u=>new Promise((ok,no)=>{if(window.jspdf)return ok();const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=no;document.head.append(s)});
async function tablePage(i){const W=1240,H=1760,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,W,H);g.strokeStyle='#d4b26a';g.lineWidth=6;g.strokeRect(40,40,W-80,H-80);g.fillStyle='#0c1f1b';g.textAlign='center';
 g.font='700 150px Georgia,serif';g.fillText(($('tw').value||'Table')+' '+i,W/2,330);g.font='500 66px Arial,sans-serif';g.fillText($('tl').value||'Scan to order',W/2,440);
 g.drawImage(await qrLogo(menuUrl(slug,i),900),170,520,900,900);g.font='700 72px Georgia,serif';g.fillText(data.name,W/2,1570);return c}
async function tables(print){const n=Math.min(200,Math.max(1,parseInt($('tn').value)||1)),w=print?window.open('','_blank'):null;$('tmsg').textContent=d('t_prep');
 try{updateDoc(doc(db,'restaurants',slug),{tables:n}).catch(()=>{});const pages=[];for(let i=1;i<=n;i++)pages.push((await tablePage(i)).toDataURL('image/jpeg',.92));
  if(print){w.document.write('<html><head><title>Tables</title><style>@page{size:A5;margin:0}body{margin:0}img{width:148mm;height:210mm;display:block;page-break-after:always}</style></head><body>'+pages.map(u=>`<img src="${u}">`).join('')+'<script>onload=function(){setTimeout(function(){print()},500)}<\/script></body></html>');w.document.close()}
  else{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');const p=new window.jspdf.jsPDF({unit:'mm',format:'a5'});pages.forEach((u,i)=>{if(i)p.addPage();p.addImage(u,'JPEG',0,0,148,210)});p.save(slug+'-tables.pdf')}
  $('tmsg').textContent=d('t_done')+' '+n}catch(e){if(w)w.close();$('tmsg').textContent=d('t_err')}}
$('tpdf').onclick=()=>tables(false);$('tprint').onclick=()=>tables(true);
// ---------- onboarding wizard ----------
let step=1,btype='',ordTo='both',curEdited=false;
$('biz').replaceChildren(...BT.map((k,i)=>{const b=document.createElement('button');b.type='button';b.dataset.k=k;b.innerHTML='<span></span><b></b>';b.firstChild.textContent=BE[i];b.lastChild.textContent=tr('b'+(i+1),LG);b.onclick=()=>{btype=k;[...$('biz').children].forEach(x=>x.classList.toggle('on',x===b))};return b}));
[...$('ot').children].forEach(b=>b.onclick=()=>{ordTo=b.dataset.v;[...$('ot').children].forEach(x=>x.classList.toggle('on',x===b))});
$('cu0').oninput=()=>curEdited=true;$('cn').onchange=()=>{if(!curEdited)$('cu0').value=CUR[$('cn').value]||'$'};$('cu0').value=CUR[region()]||'$';
function wiz(){for(let i=1;i<=4;i++)show('s'+i,i===step);$('stn').textContent=step;[...$('prog').children].forEach((x,i)=>x.classList.toggle('on',i<step));show('bk',step>1);$('nx').textContent=d(step===4?'st_btn':'next');$('err').textContent=''}
$('bk').onclick=()=>{step--;wiz()};
$('nx').onclick=async()=>{const e=m=>{$('err').textContent=m};
 if(step===1){if(!btype)return e(d('ob_t1'))}
 if(step===2){if(!$('n').value.trim()||!$('cn').value)return e(d('st_name')+' / '+d('country'))}
 if(step===3){const g=$('gl0').value.trim();if(g&&!/^https:\/\//i.test(g))return e(d('g_link'));const s=$('s').value.trim().toLowerCase();if(!/^[a-z0-9-]{3,30}$/.test(s))return e(d('st_e1'));if((await getDoc(doc(db,'restaurants',s))).exists())return e(d('st_e2'))}
 if(step===4){const wa=$('w').value.replace(/\D/g,'');if(ordTo!=='dashboard'&&wa.length<7){step=3;wiz();return e(d('st_wa'))}
  const s=$('s').value.trim().toLowerCase();$('nx').disabled=true;
  await setDoc(doc(db,'restaurants',s),{owner:auth.currentUser.uid,ownerEmail:auth.currentUser.email,name:$('n').value.trim(),lang:$('sl').value,type:btype,country:$('cn').value,orderTo:ordTo,gLink:$('gl0').value.trim(),gRating:0,gCount:0,nameUr:'',names:{},whatsapp:wa,theme:'ember',currency:$('cu0').value||'$',plan:'free',planUntil:null,suspended:false,views:0,logo:$('wl').value||'',address:'',tables:10,created:Date.now()});location.reload();return}
 step++;wiz()};
// ---------- auth ----------
const au=bindAuth();langInit();try{au.set(new URLSearchParams(location.search).get('m')==='up'?'up':'in')}catch(e){}
const logout=async()=>{try{localStorage.removeItem('tb_user')}catch(e){}await signOut(auth)};$('out').onclick=logout;
onAuthStateChanged(auth,async u=>{show('boot',0);if(u&&(u.email||'').toLowerCase()===ADMIN_EMAIL.toLowerCase()){try{localStorage.tb_user='admin'}catch(e){}location.replace(adminUrl());return}
 show('login',!u);if(!u){try{localStorage.removeItem('tb_user')}catch(e){}show('setup',0);show('app',0);return}
 try{localStorage.tb_user='1'}catch(e){}
 const q=await getDocs(query(collection(db,'restaurants'),where('owner','==',u.uid)));
 if(q.empty){show('setup',1);wiz();return}slug=q.docs[0].id;data=q.docs[0].data();show('app',1);render();load();window._ld=1;loadViews();loadNews();
 onSnapshot(doc(db,'restaurants',slug),x=>{if(x.exists()){data=x.data();render()}})});
// ---------- navigation with locks ----------
const TITLE={news:'nav_news',contact:'nav_contact',over:'nav_over',dish:'dishes',ord:'orders',tab:'tables',anal:'anal',rev:'nav_rev',prof:'profile',bill:'billing',fb:'nav_fb'},PRO_ONLY=new Set(['ord','tab','anal','rev']);
function go(n){if(!data||!TITLE[n])n='over';cur=n;if(!data)return;const lk=PRO_ONLY.has(n)&&!pro(data);document.querySelectorAll('.panel').forEach(x=>x.classList.remove('on'));$(lk?'p-lock':'p-'+n).classList.add('on');document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===n));$('ptitle').textContent=d(TITLE[n]);
 if(n==='rev'&&!lk)loadReviews();if(n==='fb')loadFb();if(n==='anal'&&!lk)drawAnalytics()}
window.addEventListener('hashchange',()=>go(location.hash.slice(1)));
const closeNav=()=>{$('side').classList.remove('open');$('scrim').classList.remove('on');$('burger').setAttribute('aria-expanded','false')};
$('burger').onclick=()=>{const o=$('side').classList.toggle('open');$('scrim').classList.toggle('on',o);$('burger').setAttribute('aria-expanded',String(o))};$('scrim').onclick=closeNav;document.querySelectorAll('#side a').forEach(a=>a.addEventListener('click',closeNav));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav()});
setTimeout(()=>{if(!$('boot').classList.contains('hide')){show('boot',0);show('login',1)}},7000);
function checklist(){let dl=0,sh=0;try{dl=localStorage.tb_dl;sh=localStorage.tb_share}catch(e){}$('ck1').classList.toggle('ok',items.length>0);$('ck2').classList.toggle('ok',!!dl);$('ck3').classList.toggle('ok',!!sh)}
// ---------- render ----------
function render(){const p=pro(data),url=menuUrl(slug),b=base();$('url').textContent=url;$('open').href=url;$('plan').textContent=p?'PRO':'FREE';$('sv1').textContent=data.views||0;
 $('ovn').textContent=data.name;{const lg=data.logo||'';[['rbi','rb'],['mlogo'],['ovi']].forEach(([i,w])=>{$(i).classList.toggle('hide',!lg);if(lg&&$(i).getAttribute('src')!==lg)$(i).src=lg;if(w)$(w).classList.toggle('hide',!lg)});$('rbn').textContent=data.name}{const ti=BT.indexOf(data.type||'other');$('ovm').textContent=BE[ti]+' '+tr('b'+(ti+1),LG)+(data.country?' · '+cname(data.country):'')}$('ovl').textContent=url;$('plan2').textContent=p?'PRO':'FREE';show('stb2',p);show('mchc',p);
 if(b!==lastBase){lastBase=b;trRows($('trs'),true,b);trRows($('rtrs'),false,b)}
 if(!window._f){window._f=1;$('pn').value=data.name;$('pls').value=b;$('ptype').value=data.type||'other';$('pcountry').value=data.country||'';$('pot').value=data.orderTo||'whatsapp';trSet($('rtrs'),Object.fromEntries(Object.entries(data.names||(data.nameUr?{ur:data.nameUr}:{})).map(([l,v])=>[l,{n:v}])));$('pw').value=data.whatsapp;$('pgl').value=data.gLink||'';$('pgr').value=data.gRating||'';$('pgc').value=data.gCount||'';$('pa').value=data.address||'';$('pl').value=data.logo||'';lpv();$('th').value=data.theme;$('cu').value=data.currency;$('tn').value=data.tables||10;$('tw').value=tr('table',b);$('tl').value=dt('scan',b);$('cc_n').value=data.name;try{$('cc_e').value=auth.currentUser.email||''}catch(e){}$('cem').href='mailto:'+CONTACT_EMAIL;$('cemt').textContent=CONTACT_EMAIL;$('cwa').href='https://wa.me/'+CONTACT_WAN;$('cwat').textContent=CONTACT_WA}
 document.querySelectorAll('[data-pro]').forEach(a=>a.querySelector('.lk').textContent=p?'':'🔒');show('upb',!p);show('prb',p);show('upm',!p);
 $('prt').textContent='PRO ✓'+(data.planUntil?' · '+new Date(data.planUntil).toLocaleDateString():'');
 drawQr();drawBill();checklist();if(newsAll.length)drawNews();if(p&&!ordStarted){ordStarted=true;orders()}if(window._ld)load();go(location.hash.slice(1)||cur)}
$('sv').onclick=async()=>{const gl=$('pgl').value.trim();if(gl&&!/^https:\/\//i.test(gl)){alert(d('g_link'));return}const o={gLink:gl,gRating:Math.min(5,Math.max(0,+$('pgr').value||0)),gCount:Math.max(0,parseInt($('pgc').value)||0),name:$('pn').value,lang:$('pls').value,type:$('ptype').value,country:$('pcountry').value,orderTo:$('pot').value,names:rnGet(),nameUr:rnGet().ur||'',whatsapp:$('pw').value.replace(/\D/g,''),address:$('pa').value,logo:$('pl').value,theme:$('th').value,currency:$('cu').value};await updateDoc(doc(db,'restaurants',slug),o);toast(d('saved'))};
const sl=id=>/^s(\d+)$/.test(id)?+RegExp.$1:9999;
async function load(){const s=await getDocs(collection(db,'restaurants',slug,'items'));items=s.docs;$('sv3').textContent=s.size;renderDishes();checklist()}
function renderDishes(){const q=($('dsq').value||'').trim().toLowerCase();$('list').innerHTML='';
 const ord=[...items].sort((a,b)=>sl(a.id)-sl(b.id)),hid=new Set(pro(data)?[]:ord.slice(FREE_DISHES).map(x=>x.id));let shown=0;
 items.forEach(dd=>{const i=dd.data();if(q&&!(i.name+' '+i.cat+' '+Object.values(i.tr||{}).map(x=>x.n||'').join(' ')).toLowerCase().includes(q))return;shown++;
 const e=document.createElement('div');e.className='it'+(i.avail===false||hid.has(dd.id)?' dim':'');e.innerHTML='<img alt="" loading="lazy"><div><b></b><br><small></small></div><button class="btn sm ghost" data-a="e"></button><button class="btn sm ghost" data-a="v"></button><button class="btn sm ghost" data-a="d"></button>';
 if(i.img)e.querySelector('img').src=i.img;e.querySelector('b').textContent=i.name;e.querySelector('small').textContent=i.cat+' · '+i.price+(hid.has(dd.id)?' · '+d('hidden'):'');
 e.querySelector('[data-a=e]').textContent=d('edit');e.querySelector('[data-a=v]').textContent=i.avail===false?d('sold'):d('avail');e.querySelector('[data-a=d]').textContent=d('del');
 e.querySelector('[data-a=e]').onclick=()=>{editId=dd.id;$('in').value=i.name;trSet($('trs'),i.tr||(i.nameUr?{ur:{n:i.nameUr}}:{}));$('ip').value=i.price;$('ic').value=i.cat;$('iu').value=i.img||'';$('id').value=i.desc||'';$('ft').textContent=d('edit_t');$('add').textContent=d('save_b');show('cancel',1);scrollTo(0,0)};
 e.querySelector('[data-a=v]').onclick=async()=>{await updateDoc(dd.ref,{avail:i.avail===false});load()};
 e.querySelector('[data-a=d]').onclick=async()=>{if(confirm(d('confirm_del'))){await deleteDoc(dd.ref);load()}};$('list').append(e)});
 if(!shown){const e=document.createElement('p');e.className='mut';e.textContent=d(items.length?'nomatch':'no_dishes');$('list').append(e)}}
$('dsq').oninput=renderDishes;
const reset=()=>{editId=null;['in','ip','ic','iu','id','if'].forEach(i=>$(i).value='');trSet($('trs'),{});$('ft').textContent=d('add_t');$('add').textContent=d('add_b');show('cancel',0)};$('cancel').onclick=reset;
$('add').onclick=async()=>{if(!$('in').value||!$('ip').value){alert(d('e_dish'));return}
 const o={name:$('in').value,tr:trGet($('trs')),nameUr:(trGet($('trs')).ur||{}).n||'',price:+$('ip').value,cat:$('ic').value||'Menu',img:$('iu').value,desc:$('id').value};
 if(editId)await updateDoc(doc(db,'restaurants',slug,'items',editId),o);
 else{const used=new Set(items.map(x=>x.id));let n=1;while(used.has('s'+n))n++;if(!pro(data)&&(items.length>=FREE_DISHES||n>FREE_DISHES)){alert(d('e_limit'));return}
  try{await setDoc(doc(db,'restaurants',slug,'items','s'+n),{...o,avail:true})}catch(e){alert(d('e_limit'));return}}
 reset();load()};
// ---------- orders, alerts, analytics ----------
function beep(){try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=880;g.gain.value=.2;o.start();o.stop(audio.currentTime+.4)}catch(e){}}
function alertNew(o){const t0=d('wa_new')+(o.table?' · '+tr('table',LG)+' '+o.table:'');beep();toast(t0+' · '+data.currency+' '+o.total);try{if(window.Notification&&Notification.permission==='granted')new Notification(t0,{body:o.lines.join(', ')})}catch(e){}const t=document.title;document.title='🔔 '+t0;setTimeout(()=>document.title=t,6000)}
$('alert').onclick=async()=>{try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();await Notification.requestPermission()}catch(e){}beep();toast(d('alerts_on'))};
let lastOrd=[],ofil='all';const fresh=new Set();
function drawOrderList(){const nNew=lastOrd.filter(x=>x.data().status==='new').length;
 $('ofn').textContent=d('ord_new')+' ('+nNew+')';$('ofa').textContent=d('ord_all')+' ('+lastOrd.length+')';$('ofd').textContent=d('ord_done')+' ('+(lastOrd.length-nNew)+')';
 [['ofn','new'],['ofa','all'],['ofd','done']].forEach(([i,k])=>$(i).classList.toggle('on',ofil===k));$('ocnt').textContent=nNew;show('ocnt',nNew>0&&pro(data));
 $('orders').innerHTML='';const list=lastOrd.filter(x=>ofil==='all'||(ofil==='new')===(x.data().status==='new'));
 if(!list.length){const e=document.createElement('p');e.className='mut';e.textContent=d('noord');$('orders').append(e)}
 list.slice(0,60).forEach(x=>{const o=x.data(),e=document.createElement('div');e.className='ord '+o.status+(fresh.has(x.id)?' fresh':'');e.innerHTML='<b></b><div></div><br><button class="btn sm"></button>';
  const b0=e.querySelector('b');if(o.status==='new'){const nw=document.createElement('span');nw.className='nw';nw.textContent=d('ord_new').toUpperCase();b0.append(nw)}
  b0.append(document.createTextNode(new Date(o.ts).toLocaleString()+(o.table?' · '+tr('table',LG)+' '+o.table:'')+' · '+data.currency+' '+o.total));
  e.querySelector('div').textContent=o.lines.join(', ');const b=e.querySelector('button');b.textContent=o.status==='new'?d('done_btn'):'✓';b.disabled=o.status!=='new';b.onclick=()=>updateDoc(x.ref,{status:'done'});$('orders').append(e)})}
$('ofn').onclick=()=>{ofil='new';drawOrderList()};$('ofa').onclick=()=>{ofil='all';drawOrderList()};$('ofd').onclick=()=>{ofil='done';drawOrderList()};
function orders(){onSnapshot(query(collection(db,'restaurants',slug,'orders'),orderBy('ts','desc'),limit(300)),s=>{lastOrd=s.docs;ordersAll=s.docs.map(x=>x.data());$('sv2').textContent=s.size+(s.size>=300?'+':'');
 if(!first)s.docChanges().forEach(c=>{if(c.type==='added'){fresh.add(c.doc.id);alertNew(c.doc.data())}});first=false;drawOrderList();drawAnalytics()})}
async function loadViews(){try{(await getDocs(collection(db,'restaurants',slug,'stats'))).forEach(x=>views[x.id]=x.data().views||0)}catch(e){}drawAnalytics()}
const days=n=>Array.from({length:n},(_,k)=>new Date(Date.now()-(n-1-k)*DAY).toISOString().slice(0,10));
function bars(el,vals,labs){const mx=Math.max(1,...vals);el.innerHTML='';vals.forEach((v,i)=>{const b=document.createElement('div');b.className='bar';b.title=labs[i]+': '+v;b.innerHTML='<i></i><span></span>';b.querySelector('i').style.height=Math.round(v/mx*100)+'%';b.querySelector('span').textContent=labs[i];el.append(b)})}
function lineChart(el,series,labs){const W=640,H=220,P=28,NS='http://www.w3.org/2000/svg',mx=Math.max(1,...series.flatMap(s=>s.v)),svg=document.createElementNS(NS,'svg'),mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e};svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 const X=i=>P+i*(W-2*P)/Math.max(1,labs.length-1),Y=v=>H-P-(v/mx)*(H-2*P);
 for(let k=0;k<=4;k++){const y=P+k*(H-2*P)/4;svg.append(mk('line',{x1:P,x2:W-P,y1:y,y2:y,stroke:'#e3dccb'}))}
 series.forEach(s=>{const pts=s.v.map((v,i)=>X(i)+','+Y(v)).join(' ');svg.append(mk('polygon',{points:X(0)+','+Y(0)+' '+pts+' '+X(s.v.length-1)+','+Y(0),fill:s.c,opacity:'.14'}),mk('polyline',{points:pts,fill:'none',stroke:s.c,'stroke-width':'3','stroke-linejoin':'round'}));
  s.v.forEach((v,i)=>{const c=mk('circle',{cx:X(i),cy:Y(v),r:'4',fill:s.c}),t=document.createElementNS(NS,'title');t.textContent=labs[i]+': '+v;c.append(t);svg.append(c)})});
 [0,Math.floor((labs.length-1)/2),labs.length-1].forEach(i=>{const t=mk('text',{x:X(i),y:H-6,'text-anchor':'middle','font-size':'12',fill:'#66756f'});t.textContent=labs[i].slice(5);svg.append(t)});
 const leg=document.createElement('div');leg.className='leg';series.forEach(s=>{const sp=document.createElement('span'),i=document.createElement('i');i.style.background=s.c;sp.append(i,s.n);leg.append(sp)});el.replaceChildren(svg,leg)}
function drawAnalytics(){if(!data||!pro(data))return;const d14=days(14),oc={},rv={},hr=Array(24).fill(0),top={};let rev=0,n30=0;
 ordersAll.forEach(o=>{const k=new Date(o.ts).toISOString().slice(0,10);oc[k]=(oc[k]||0)+1;rv[k]=(rv[k]||0)+o.total;hr[new Date(o.ts).getHours()]++;if(o.ts>Date.now()-30*DAY){rev+=o.total;n30++}(o.items||[]).forEach(x=>top[x.n]=(top[x.n]||0)+x.q)});
 const v=d14.map(k=>views[k]||0),oo=d14.map(k=>oc[k]||0),w7=days(7);
 lineChart($('lc'),[{n:d('views'),v,c:'#b8924a'},{n:d('orders'),v:oo,c:'#14473b'}],d14);
 bars($('hc'),hr,hr.map((_,i)=>i%3===0?String(i):''));bars($('sc'),d14.map(k=>rv[k]||0),d14.map(k=>k.slice(8)));bars($('mch'),w7.map(k=>views[k]||0),w7.map(k=>k.slice(8)));
 $('kv').textContent=v.reduce((a,b)=>a+b,0);$('ko').textContent=oo.reduce((a,b)=>a+b,0);$('kr').textContent=data.currency+' '+rev;$('ka').textContent=data.currency+' '+(n30?Math.round(rev/n30):0);
 const t=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,6),mx=t.length?t[0][1]:1;
 $('top').replaceChildren(...(t.length?t.map(([n,q])=>{const e=document.createElement('div');e.className='hb';const a=document.createElement('span'),b=document.createElement('i'),c=document.createElement('em');a.textContent=n;b.style.width=Math.round(q/mx*100)+'%';c.textContent=q;e.append(a,b,c);return e}):[Object.assign(document.createElement('p'),{className:'mut',textContent:d('noord')})]))}
// ---------- customer reviews (Pro) ----------
async function loadReviews(){const s=await getDocs(query(collection(db,'restaurants',slug,'reviews'),orderBy('ts','desc'),limit(100)));$('rvl').innerHTML='';let sum=0;
 if(s.empty){$('ravg').textContent='';const e=document.createElement('p');e.className='mut';e.textContent=d('rv_none');$('rvl').append(e);return}
 s.forEach(x=>{const r=x.data();sum+=r.rating;const e=document.createElement('div');e.className='rv';e.innerHTML='<div class="stars"></div><p></p><small class="mut"></small><br><button class="btn sm ghost"></button>';e.querySelector('.stars').textContent='★'.repeat(r.rating)+'☆'.repeat(5-r.rating);e.querySelector('p').textContent=r.text||'';e.querySelector('small').textContent=(r.name||'')+' · '+new Date(r.ts).toLocaleDateString();const b=e.querySelector('button');b.textContent=d('del');b.onclick=async()=>{await deleteDoc(x.ref);loadReviews()};$('rvl').append(e)});
 $('ravg').textContent='★ '+(sum/s.size).toFixed(1)+' · '+s.size}
// ---------- feedback to us ----------
$('fbs').replaceChildren(...[1,2,3,4,5].map(n=>{const b=document.createElement('button');b.type='button';b.textContent='★';b.onclick=()=>{fbRating=n;paint()};return b}));
const paint=()=>[...$('fbs').children].forEach((b,i)=>b.classList.toggle('on',i<fbRating));
async function loadFb(){try{const s=await getDoc(doc(db,'feedback',slug));if(s.exists()){fbRating=s.data().rating;$('fbt').value=s.data().text||'';show('fbdel',1);$('fbst').textContent=d(s.data().approved?'fb_live':'fb_wait')}else{show('fbdel',0);$('fbst').textContent=''}}catch(e){}paint()}
$('fbsend').onclick=async()=>{if(!fbRating){$('fbm').textContent='★';return}await setDoc(doc(db,'feedback',slug),{slug,name:data.name,type:data.type||'other',country:data.country||'',rating:fbRating,text:$('fbt').value.trim().slice(0,400),ts:Date.now()});$('fbm').textContent=d('fb_ok');$('fbst').textContent=d('fb_wait');show('fbdel',1)};
$('fbdel').onclick=async()=>{await deleteDoc(doc(db,'feedback',slug));fbRating=0;$('fbt').value='';paint();show('fbdel',0);$('fbm').textContent='';$('fbst').textContent=''};
// ---------- billing: Paddle (the only gateway). The card form is embedded inside this page (Paddle inline checkout) ----------
const money=n=>'$'+(Number.isInteger(n)?n:n.toFixed(2));
const PLOC={en:'en',ar:'ar',zh:'zh-Hans',es:'es',fr:'fr'};
let plan='m12',payBase=0,payWait=false,payTimer=null,chkOpen=false,paddleP=null,subDone=false;
const PLAN=id=>PLANS.find(p=>p.id===id)||PLANS[0],planName=p=>d('pk_m'+p.months);
const cfgOk=()=>PADDLE_ON&&!/PASTE/.test(PADDLE_TOKEN)&&PLANS.every(p=>/^pri_/.test(p.price)&&!/PASTE/.test(p.price));
const setSt=t=>{$('chkst').textContent=t;show('chkst',!!t)};
function onPaddle(ev){if(!ev||!ev.name)return;
 if(ev.name==='checkout.completed'){payWait=true;payBase=data.planUntil||0;subDone=false;setSt(d('pk_ok'));clearTimeout(payTimer);payTimer=setTimeout(()=>{if(payWait)setSt(d('pk_slow'))},90000)}
 if(ev.name==='checkout.error')setSt(d('pk_err'))}
function initPaddle(){if(paddleP)return paddleP;
 return paddleP=new Promise(res=>{const go=()=>{try{if(PADDLE_ENV!=='production')Paddle.Environment.set('sandbox');Paddle.Initialize({token:PADDLE_TOKEN,eventCallback:onPaddle});res(true)}catch(e){console.error(e);paddleP=null;res(false)}};
  if(window.Paddle)return go();const s=document.createElement('script');s.src='https://cdn.paddle.com/paddle/v2/paddle.js';s.onload=go;s.onerror=()=>{paddleP=null;res(false)};document.head.append(s)})}
function renderPlans(){$('plans').replaceChildren(...PLANS.map(pl=>{const b=document.createElement('button');b.type='button';b.className='plano'+(pl.id===plan?' on':'');b.setAttribute('role','radio');b.setAttribute('aria-checked',String(pl.id===plan));b.disabled=chkOpen;
  const n=document.createElement('span');n.className='pn';n.textContent=planName(pl);
  const pr=document.createElement('span');pr.className='pp2';pr.textContent=money(pl.usd);
  const sv=document.createElement('span');sv.className='ps';sv.textContent=(pl.save?d('pk_save').replace('{p}',pl.save)+' · ':'')+money(pl.usd/pl.months)+' '+d('per_month');
  b.append(n,pr,sv);if(pl.save===25||pl.months===12){const t=document.createElement('i');t.className='pbest';t.textContent=d('pk_best');b.append(t)}
  b.onclick=()=>{plan=pl.id;renderPlans()};return b}));show('bgo',cfgOk()&&!chkOpen)}
function closeChk(){try{if(window.Paddle)Paddle.Checkout.close()}catch(e){}chkOpen=false;show('chk',0);setSt('');renderPlans()}
async function loadSub(){if(subDone)return;subDone=true;try{if(!pro(data)){show('bmanage',0);return}const s=await getDoc(doc(db,'subscriptions',slug)),u=s.exists()&&s.data().cancelUrl;if(u){$('bmanage').href=u;show('bmanage',1)}else show('bmanage',0)}catch(e){show('bmanage',0)}}
function drawBill(){const p=pro(data),soon=data.planUntil&&data.planUntil-Date.now()<5*DAY;show('pay',!p||soon);
 $('bs').textContent=(p?'PRO — ':'FREE — ')+(p?d('b_pro')+(data.planUntil?' '+new Date(data.planUntil).toLocaleDateString():' ✓'):(data.plan==='pro'?d('b_exp'):d('b_free')));
 const li=t=>t.split('|').map(x=>{const e=document.createElement('li');e.textContent=x;return e});$('bfl').replaceChildren(...li(tr(p?'pl':'fl',LG)));$('bpl').replaceChildren(...li(tr('pl',LG)));
 show('nog',!cfgOk());show('plans',cfgOk());renderPlans();
 if(chkOpen){const t=PLAN(plan);$('chkt').textContent=d('pk_pay')+' '+planName(t);$('chkp').textContent=' — '+money(t.usd)}
 if(payWait&&p&&(data.planUntil||0)>payBase){payWait=false;clearTimeout(payTimer);setSt(d('pk_act'));setTimeout(closeChk,5000)}
 loadSub()}
$('bgo').onclick=async()=>{if(!cfgOk())return;const pl=PLAN(plan);$('bgo').disabled=true;
 const ok=await initPaddle();$('bgo').disabled=false;if(!ok){alert(d('pk_err'));return}
 const em=(auth.currentUser&&auth.currentUser.email)||'';chkOpen=true;show('chk',1);show('psb',PADDLE_ENV!=='production');setSt('');renderPlans();drawBill();
 try{Paddle.Checkout.open({settings:{displayMode:'inline',variant:'one-page',theme:'light',locale:PLOC[LG]||'en',frameTarget:'paddle-checkout',frameInitialHeight:'450',frameStyle:'width:100%;min-width:312px;background-color:transparent;border:none;',allowLogout:false},items:[{priceId:pl.price,quantity:1}],...(em?{customer:{email:em}}:{}),customData:{slug,plan:pl.id,email:em}});
  $('chk').scrollIntoView({behavior:'smooth',block:'start'})}catch(e){console.error(e);alert(d('pk_err'));closeChk()}};
$('chkc').onclick=closeChk;
if(cfgOk())initPaddle();

$('cp').onclick=()=>{toast(d('copied'));try{localStorage.tb_share=1}catch(e){}checklist();try{navigator.clipboard.writeText($('url').textContent).catch(()=>{})}catch(e){}};
$('cc_s').onclick=async()=>{const n=$('cc_n').value.trim(),e=$('cc_e').value.trim(),m=$('cc_m').value.trim(),o=$('cc_o');o.style.color='var(--coral)';if(n.length<2||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)||m.length<5){o.textContent=d('ct_err');return}
 $('cc_s').disabled=true;try{await addDoc(collection(db,'contacts'),{name:n,email:e,topic:$('cc_t').value,message:m,lang:LG,ts:Date.now()});o.style.color='var(--em)';o.textContent=d('ct_ok');$('cc_m').value=''}catch(x){o.textContent=d('ct_err')}$('cc_s').disabled=false};

// ---------- announcements from the admin ----------
let newsAll=[];const dis=()=>{try{return JSON.parse(localStorage.tb_dis||'[]')}catch(e){return[]}};
async function loadNews(){try{const s=await getDocs(query(collection(db,'announcements'),where('active','==',true)));newsAll=s.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>b.ts-a.ts)}catch(e){newsAll=[]}drawNews()}
function newsCard(a,close){const e=document.createElement('div');e.className='nw2 '+(a.type||'info');const i=document.createElement('span');i.className='ni';i.textContent={promo:'🎁',warn:'⚠️'}[a.type]||'ℹ️';const w=document.createElement('div'),b=document.createElement('b'),p=document.createElement('p');b.textContent=a.title;p.textContent=a.text;w.append(b,p);e.append(i,w);
 if(close){const x=document.createElement('button');x.textContent='×';x.setAttribute('aria-label','Close');x.onclick=()=>{const l=dis();l.push(a.id);try{localStorage.tb_dis=JSON.stringify(l)}catch(e){}drawNews()};e.append(x)}return e}
function drawNews(){if(!data)return;const p=pro(data),vis=newsAll.filter(a=>(!a.until||a.until>Date.now())&&(a.audience==='all'||(a.audience==='pro')===p)&&(!a.lang||a.lang==='all'||a.lang===LG)),dd=dis(),un=vis.filter(a=>!dd.includes(a.id));
 $('news').replaceChildren(...un.slice(0,3).map(a=>newsCard(a,true)));$('ncnt').textContent=un.length;show('ncnt',un.length>0);
 $('nlist').replaceChildren(...(vis.length?vis.map(a=>newsCard(a,false)):[Object.assign(document.createElement('p'),{className:'mut',textContent:d('news_none')})]))}
