// Swiss Finance Premium Complete - All Features
(function(){
'use strict';
console.log('🎨 Premium UI Complete lädt...');

// Chart.js laden
if(!window.Chart){
const s=document.createElement('script');
s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
s.onload=()=>console.log('✅ Charts ready');
document.head.appendChild(s);
}

// Dark Mode
class DarkMode{
constructor(app){
this.app=app;
this.dark=app.state.data.settings?.darkMode||false;
this.init();
}
init(){
if(this.dark)document.documentElement.setAttribute('data-theme','dark');
setTimeout(()=>this.addToggle(),500);
}
toggle(){
this.dark=!this.dark;
this.app.state.update(d=>{
if(!d.settings)d.settings={};
d.settings.darkMode=this.dark;
});
document.documentElement[this.dark?'setAttribute':'removeAttribute']('data-theme','dark');
}
addToggle(){
const sb=document.querySelector('.desktop-sidebar');
if(!sb||document.getElementById('theme-toggle'))return;
const pb=sb.querySelector('.profile-box');
if(pb){
pb.insertAdjacentHTML('afterend',`
<div class="theme-toggle" id="theme-toggle" style="margin-top:16px;padding:12px;background:rgba(255,255,255,0.05);border-radius:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
<span style="color:rgba(255,255,255,0.8);font-size:13px;font-weight:500;">
<span id="theme-icon">${this.dark?'🌙':'☀️'}</span> Dark Mode
</span>
<div class="theme-toggle-switch" style="width:44px;height:24px;background:${this.dark?'#d4af37':'rgba(255,255,255,0.2)'};border-radius:20px;position:relative;">
<div style="position:absolute;width:18px;height:18px;background:white;border-radius:50%;top:3px;left:${this.dark?'23px':'3px'};transition:all 0.25s;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>
</div>
</div>
`);
document.getElementById('theme-toggle').onclick=()=>{
this.toggle();
const icon=document.getElementById('theme-icon');
const sw=document.querySelector('.theme-toggle-switch');
const dot=sw.querySelector('div');
if(icon)icon.textContent=this.dark?'🌙':'☀️';
if(sw)sw.style.background=this.dark?'#d4af37':'rgba(255,255,255,0.2)';
if(dot)dot.style.left=this.dark?'23px':'3px';
};
}
}
}

// Smart Recommendations
class SmartRec{
constructor(app){this.app=app;}
get(){
const recs=[];
const d=this.app.state.data;
const p=d.currentProfile;
const inc=d.profiles[p].income;
if(inc>0){
const sav=d.expenses.filter(e=>e.active&&e.account===p&&(e.category.includes('Säule')||e.category.includes('Spark'))).reduce((s,e)=>s+e.amount,0);
const rate=(sav/inc)*100;
if(rate<15)recs.push({type:'warning',icon:'📊',title:'Sparquote zu niedrig',msg:`${rate.toFixed(1)}% - Empfohlen: 15-20%`,action:`Erhöhen Sie auf CHF ${(inc*0.15).toLocaleString()} (+CHF ${((inc*0.15)-sav).toLocaleString()})`,save:((inc*0.15)-sav)*12});
else if(rate>=30)recs.push({type:'success',icon:'🌟',title:'Exzellente Sparquote!',msg:`${rate.toFixed(1)}% - Weit über Durchschnitt`,action:'Weiter so! Überlegen Sie zusätzliche Investments.'});
}
const debts=d.debts.filter(dt=>dt.account===p);
if(debts.length>1){
const sorted=debts.sort((a,b)=>(b.interest||0)-(a.interest||0));
recs.push({type:'info',icon:'💳',title:'Schulden-Optimierung',msg:`Zahlen Sie zuerst "${sorted[0].name}" (höchster Zins)`,action:'Avalanche-Methode spart Zinsen'});
}
const y=new Date().getFullYear();
const p3a=d.savings.pillar3a.deposits.filter(dp=>dp.year===y).reduce((s,dp)=>s+dp.amount,0);
if(p3a<7258){
const left=7258-p3a;
const mLeft=12-new Date().getMonth();
recs.push({type:'info',icon:'🏛️',title:'Säule 3a Potenzial',msg:`Noch CHF ${left.toLocaleString()} möglich (Max ${y})`,action:`CHF ${(left/mLeft).toFixed(2)}/Monat bis Jahresende`,save:left*0.15});
}
return recs.slice(0,5);
}
}

// Chart Renderer
class Charts{
constructor(){this.ch={};}
destroy(id){if(this.ch[id]){this.ch[id].destroy();delete this.ch[id];}}
destroyAll(){Object.keys(this.ch).forEach(id=>this.destroy(id));}
pie(id,data){
this.destroy(id);
const ctx=document.getElementById(id);
if(!ctx||!window.Chart)return null;
this.ch[id]=new Chart(ctx,{
type:'doughnut',
data:{
labels:data.labels,
datasets:[{
data:data.values,
backgroundColor:data.colors||['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'],
borderWidth:2,
borderColor:getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary')||'#fff'
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{position:'right',labels:{padding:15,font:{size:12,family:'Inter'},color:getComputedStyle(document.documentElement).getPropertyValue('--text-primary')||'#111'}},
tooltip:{backgroundColor:'rgba(0,0,0,0.8)',padding:12,callbacks:{label:c=>`${c.label}: CHF ${c.parsed.toLocaleString()} (${((c.parsed/c.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`}}
}
}
});
return this.ch[id];
}
line(id,data){
this.destroy(id);
const ctx=document.getElementById(id);
if(!ctx||!window.Chart)return null;
this.ch[id]=new Chart(ctx,{
type:'line',
data:{
labels:data.labels,
datasets:data.datasets.map(ds=>({
label:ds.label,
data:ds.values,
borderColor:ds.color,
backgroundColor:ds.color.replace(')',', 0.1)').replace('rgb','rgba'),
borderWidth:3,
fill:true,
tension:0.4
}))
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{legend:{display:data.datasets.length>1},tooltip:{backgroundColor:'rgba(0,0,0,0.8)'}},
scales:{y:{beginAtZero:true,ticks:{callback:v=>'CHF '+v.toLocaleString()}},x:{}}
}
});
return this.ch[id];
}
bar(id,data){
this.destroy(id);
const ctx=document.getElementById(id);
if(!ctx||!window.Chart)return null;
this.ch[id]=new Chart(ctx,{
type:'bar',
data:{
labels:data.labels,
datasets:data.datasets.map(ds=>({
label:ds.label,
data:ds.values,
backgroundColor:ds.color,
borderRadius:8
}))
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{legend:{display:data.datasets.length>1},tooltip:{backgroundColor:'rgba(0,0,0,0.8)'}},
scales:{y:{beginAtZero:true,ticks:{callback:v=>'CHF '+v.toLocaleString()}}}
}
});
return this.ch[id];
}
}

// Renderer
class Renderer{
constructor(app){
this.app=app;
this.charts=new Charts();
this.rec=new SmartRec(app);
}

profiles(){
const d=this.app.state.data;
const profs=[
{id:'sven',name:'Sven',icon:'👤',emoji:'💼',color:'#3b82f6'},
{id:'franzi',name:'Franzi',icon:'👤',emoji:'🌸',color:'#ec4899'},
{id:'family',name:'Familie',icon:'👥',emoji:'🏠',color:'#10b981'}
];
return `
<div style="margin-bottom:32px;">
<h2 style="font-size:28px;font-weight:800;margin-bottom:8px;">👥 Profile & Konten</h2>
<p style="color:var(--text-tertiary);font-size:14px;">Verwalten Sie Ihre 3 Konten</p>
</div>
<div class="dashboard-grid" style="margin-bottom:32px;">
${profs.map(pr=>{
const stats=this.getProfileStats(pr.id);
const active=pr.id===d.currentProfile;
return `
<div class="account-card" style="cursor:pointer;position:relative;overflow:hidden;background:linear-gradient(135deg,${pr.color}15,${pr.color}05);${active?'border:2px solid '+pr.color+';':''}" onclick="app.switchProfile('${pr.id}')">
<div style="position:absolute;top:-50px;right:-50px;font-size:120px;opacity:0.05;">${pr.emoji}</div>
<div class="account-header" style="position:relative;z-index:1;">
<div>
<div style="font-size:32px;margin-bottom:8px;">${pr.emoji}</div>
<div class="account-title">${pr.name}</div>
<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">${d.accounts[pr.id].name}</div>
</div>
${active?`<div style="background:${pr.color};color:white;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;">AKTIV</div>`:''}
</div>
<div style="margin:24px 0;position:relative;z-index:1;">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
<div>
<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px;font-weight:600;">💰 KONTOSTAND</div>
<div style="font-size:24px;font-weight:700;color:var(--text-primary);">CHF ${stats.balance.toLocaleString()}</div>
</div>
<div>
<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px;font-weight:600;">📊 EINKOMMEN</div>
<div style="font-size:24px;font-weight:700;color:var(--success);">CHF ${stats.income.toLocaleString()}</div>
</div>
</div>
</div>
<div style="padding-top:16px;border-top:1px solid var(--glass-border);position:relative;z-index:1;">
<div style="display:flex;justify-content:space-between;font-size:13px;">
<span style="color:var(--text-tertiary);">Ausgaben</span>
<span style="color:var(--error);font-weight:700;">CHF ${stats.expenses.toLocaleString()}</span>
</div>
</div>
</div>
`;
}).join('')}
</div>
<div class="glass-card">
<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;">💡 Multi-Konto-System</h3>
<p style="font-size:14px;color:var(--text-secondary);line-height:1.8;">
<strong>Sven & Franzi:</strong> Persönliche Konten für individuelle Finanzen<br>
<strong>Familie:</strong> Gemeinsames Konto für Haushaltsausgaben<br>
<strong>Transfers:</strong> Überweisen Sie Geld zwischen Konten<br>
<strong>Wechseln:</strong> Klicken Sie auf ein Profil zum Aktivieren
</p>
</div>
`;
}

getProfileStats(pid){
const d=this.app.state.data;
const inc=d.profiles[pid].income||0;
const bal=d.accounts[pid].balance||0;
const exp=d.expenses.filter(e=>e.active&&e.account===pid).reduce((s,e)=>s+e.amount,0);
return{income:inc,balance:bal,expenses:exp};
}

goals(){
const d=this.app.state.data;
const goals=d.goals||[];
return `
<div style="margin-bottom:32px;">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
<div>
<h2 style="font-size:28px;font-weight:800;margin-bottom:8px;">🎯 Finanz-Ziele</h2>
<p style="color:var(--text-tertiary);font-size:14px;">Erreichen Sie Ihre finanziellen Meilensteine</p>
</div>
<button class="btn btn-primary" onclick="app.showAddGoalModal()">+ Neues Ziel</button>
</div>
</div>
${goals.length===0?`
<div class="glass-card" style="text-align:center;padding:60px 20px;">
<div style="font-size:64px;margin-bottom:16px;">🎯</div>
<h3 style="font-size:20px;font-weight:700;margin-bottom:12px;">Noch keine Ziele definiert</h3>
<p style="color:var(--text-tertiary);margin-bottom:24px;">Erstellen Sie Ihr erstes Finanz-Ziel</p>
<button class="btn btn-gold" onclick="app.showAddGoalModal()">✨ Erstes Ziel erstellen</button>
</div>
`:`
<div style="display:grid;gap:24px;">
${goals.map(g=>this.renderGoal(g)).join('')}
</div>
`}
<div class="glass-card" style="margin-top:32px;">
<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;">💡 Beispiel-Ziele</h3>
<ul style="font-size:14px;color:var(--text-secondary);line-height:2;">
<li>🏛️ Säule 3a Maximum (CHF 7.258 / Jahr)</li>
<li>💰 Notgroschen aufbauen (CHF 10.000)</li>
<li>🏖️ Ferien sparen (CHF 5.000)</li>
<li>🚗 Auto kaufen (CHF 25.000)</li>
<li>💳 Schulden abbauen (CHF 0)</li>
</ul>
</div>
`;
}

renderGoal(g){
const progress=(g.current/g.target)*100;
const left=g.target-g.current;
const color=progress>=100?'var(--success)':progress>=75?'var(--info)':progress>=50?'var(--warning)':'var(--error)';
return `
<div class="glass-card">
<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;">
<div>
<h3 style="font-size:20px;font-weight:700;margin-bottom:4px;">${g.icon||'🎯'} ${g.name}</h3>
<p style="font-size:13px;color:var(--text-tertiary);">${g.description||''}</p>
</div>
<button class="action-btn delete" onclick="app.deleteGoal(${g.id})" title="Löschen">🗑️</button>
</div>
<div style="margin-bottom:20px;">
<div style="display:flex;justify-content:space-between;margin-bottom:8px;">
<span style="font-size:13px;font-weight:600;color:var(--text-secondary);">Fortschritt</span>
<span style="font-size:13px;font-weight:700;color:${color};">${progress.toFixed(1)}%</span>
</div>
<div style="background:var(--bg-tertiary);height:24px;border-radius:12px;overflow:hidden;">
<div style="background:linear-gradient(90deg,${color},${color}aa);height:100%;width:${Math.min(progress,100)}%;transition:width 0.5s;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">
${progress>=10?progress.toFixed(0)+'%':''}
</div>
</div>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-top:16px;border-top:1px solid var(--glass-border);">
<div>
<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px;">Aktuell</div>
<div style="font-size:18px;font-weight:700;">CHF ${g.current.toLocaleString()}</div>
</div>
<div>
<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px;">Ziel</div>
<div style="font-size:18px;font-weight:700;">CHF ${g.target.toLocaleString()}</div>
</div>
<div>
<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px;">Noch fehlen</div>
<div style="font-size:18px;font-weight:700;color:${color};">CHF ${left.toLocaleString()}</div>
</div>
</div>
${progress>=100?`
<div style="margin-top:16px;padding:16px;background:var(--success-light);border-radius:12px;text-align:center;">
<div style="font-size:32px;margin-bottom:8px;">🎉</div>
<div style="font-weight:700;color:var(--success-dark);">Ziel erreicht!</div>
</div>
`:''}
</div>
`;
}

analytics(){
const d=this.app.state.data;
const p=d.currentProfile;
setTimeout(()=>this.renderCharts(),100);
const recs=this.rec.get();
return `
<div style="margin-bottom:32px;">
<h2 style="font-size:28px;font-weight:800;margin-bottom:8px;">📈 Analytics Dashboard</h2>
<p style="color:var(--text-tertiary);font-size:14px;">Detaillierte Finanz-Analysen & Insights</p>
</div>

${recs.length>0?`
<div class="glass-card" style="margin-bottom:32px;background:var(--info-light);border:1px solid var(--info);">
<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:var(--info-dark);">💡 Smart Recommendations</h3>
<div style="display:grid;gap:12px;">
${recs.map(r=>`
<div class="recommendation-card ${r.type}" style="margin:0;">
<div class="recommendation-title">${r.icon} ${r.title}</div>
<div class="recommendation-text">
<strong>${r.msg}</strong><br>
💡 ${r.action}
${r.save?`<br>💰 Potenzial: CHF ${r.save.toLocaleString()}/Jahr`:''}
</div>
</div>
`).join('')}
</div>
</div>
`:''}

<div style="display:grid;gap:24px;margin-bottom:32px;">
<div class="glass-card">
<h3 style="font-size:18px;font-weight:700;margin-bottom:20px;">📊 Ausgaben nach Kategorien</h3>
<div style="height:300px;"><canvas id="chart-expenses-pie"></canvas></div>
</div>
<div class="glass-card">
<h3 style="font-size:18px;font-weight:700;margin-bottom:20px;">📈 Vermögens-Entwicklung</h3>
<div style="height:300px;"><canvas id="chart-wealth-line"></canvas></div>
</div>
</div>

<div class="glass-card">
<h3 style="font-size:18px;font-weight:700;margin-bottom:20px;">💰 Einkommen vs. Ausgaben</h3>
<div style="height:300px;"><canvas id="chart-income-bar"></canvas></div>
</div>
`;
}

renderCharts(){
if(!window.Chart)return setTimeout(()=>this.renderCharts(),500);
const d=this.app.state.data;
const p=d.currentProfile;

// Expenses Pie
const expCats={};
d.expenses.filter(e=>e.active&&e.account===p).forEach(e=>{
expCats[e.category]=(expCats[e.category]||0)+e.amount;
});
if(Object.keys(expCats).length>0){
this.charts.pie('chart-expenses-pie',{
labels:Object.keys(expCats),
values:Object.values(expCats)
});
}

// Wealth Line
const hist=d.wealthHistory.filter(h=>h.profile===p).slice(-12);
if(hist.length>1){
this.charts.line('chart-wealth-line',{
labels:hist.map(h=>h.month.split(' ')[0]),
datasets:[{
label:'Vermögen',
values:hist.map(h=>h.totalBalance||h.balance),
color:'rgb(16, 185, 129)'
}]
});
}

// Income Bar
const inc=d.profiles[p].income;
const exp=d.expenses.filter(e=>e.active&&e.account===p).reduce((s,e)=>s+e.amount,0);
this.charts.bar('chart-income-bar',{
labels:['Monatlich'],
datasets:[
{label:'Einkommen',values:[inc],color:'rgb(16, 185, 129)'},
{label:'Ausgaben',values:[exp],color:'rgb(239, 68, 68)'},
{label:'Verfügbar',values:[inc-exp],color:'rgb(59, 130, 246)'}
]
});
}
}

// Renderer End
const renderer=new Renderer(window.app);

// Integrate
const checkApp=setInterval(()=>{
if(typeof app==='undefined'||!app.state)return;
clearInterval(checkApp);

// Dark Mode
window.darkModeManager=new DarkMode(app);

// Override render
const origRender=app.render.bind(app);
app.render=function(){
origRender();
const tab=this.currentTab;
const content=document.getElementById('tab-content');
if(!content)return;

if(tab==='profiles')content.innerHTML=renderer.profiles();
else if(tab==='goals')content.innerHTML=renderer.goals();
else if(tab==='analytics'){
content.innerHTML=renderer.analytics();
}
};

// Add Goal Modal
app.showAddGoalModal=function(){
this.showModal('🎯 Neues Ziel erstellen',`
<div class="form-row">
<label class="form-label">Name</label>
<input type="text" id="goal-name" class="form-input" placeholder="z.B. Notgroschen">
</div>
<div class="form-row">
<label class="form-label">Zielbetrag (CHF)</label>
<input type="number" id="goal-target" class="form-input" placeholder="10000">
</div>
<div class="form-row">
<label class="form-label">Aktueller Stand (CHF)</label>
<input type="number" id="goal-current" class="form-input" placeholder="0" value="0">
</div>
<div class="form-row">
<label class="form-label">Beschreibung (optional)</label>
<input type="text" id="goal-desc" class="form-input" placeholder="Für Notfälle">
</div>
<div class="form-row">
<label class="form-label">Icon (optional)</label>
<input type="text" id="goal-icon" class="form-input" placeholder="💰" value="🎯">
</div>
`,[
{label:'Abbrechen',action:'app.closeModal()'},
{label:'✅ Erstellen',action:'app.createGoal()',primary:true}
]);
};

app.createGoal=function(){
const name=document.getElementById('goal-name').value;
const target=parseFloat(document.getElementById('goal-target').value);
const current=parseFloat(document.getElementById('goal-current').value)||0;
const desc=document.getElementById('goal-desc').value;
const icon=document.getElementById('goal-icon').value||'🎯';

if(!name||!target||target<=0){
alert('Bitte Namen und Zielbetrag eingeben');
return;
}

this.state.update(d=>{
if(!d.goals)d.goals=[];
d.goals.push({
id:Date.now(),
name,
target,
current,
description:desc,
icon,
created:new Date().toISOString()
});
});

this.closeModal();
alert('✅ Ziel erstellt!');
this.render();
};

app.deleteGoal=function(id){
if(!confirm('Ziel wirklich löschen?'))return;
this.state.update(d=>{
d.goals=d.goals.filter(g=>g.id!==id);
});
this.render();
};

// Initial render
app.render();
console.log('✅ Premium Complete aktiv');
},100);

})();
