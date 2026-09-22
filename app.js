const CONFIG = window.VIVA_CONFIG || {};
const DEFAULT_DATA = {
  company:{month:'Setembro 2026', meta:16000, realized:4716.59},
  products:[
    {name:'Móvel Alta',meta:0,realized:13,color:'#3f7dff'},
    {name:'Móvel Portabilidade',meta:0,realized:14,color:'#70d264'},
    {name:'MDM / Office',meta:0,realized:24.90,color:'#ff8a3d',money:true},
    {name:'Aparelhos Celular',meta:0,realized:0,color:'#bc4cff',money:true},
    {name:'Renovações Móvel',meta:0,realized:31,color:'#27cfc0'},
    {name:'Renovações Fixa',meta:0,realized:11,color:'#ffd04d'},
    {name:'Renov. Avançado',meta:0,realized:0,color:'#ff4d75',money:true},
    {name:'Banda Larga',meta:0,realized:14,color:'#3f8cff'},
    {name:'Link Dedicado',meta:0,realized:700,color:'#29d7ff',money:true},
    {name:'TV',meta:0,realized:794.95,color:'#8e45ff',money:true},
    {name:'Dados Avançados',meta:0,realized:0,color:'#2f9cff',money:true},
    {name:'Voz Avançada',meta:0,realized:0,color:'#ff8a3d',money:true},
    {name:'VVN',meta:0,realized:225,color:'#ff4c83',money:true}
  ],
  year:[9048,9213.65,10399.51,13552.24,12496.89,14445.41,19359.50,8689.86,5763.25,8310.69,5024.17,9265.16],
  teams:[
    {name:'Time Start',supervisor:'',meta:4000,realized:0},
    {name:'Time Hunter Ativo',supervisor:'Kaua',meta:4550,realized:574.91},
    {name:'Time Hunter Consultivo',supervisor:'Mayara',meta:2001,realized:0},
    {name:'Time Carteira 1',supervisor:'Kelly',meta:5000,realized:472.66},
    {name:'Time Carteira 2',supervisor:'Nathalia',meta:2500,realized:719.89},
    {name:'Time Avançados',supervisor:'Luciana',meta:8500,realized:1214.27},
    {name:'Time Valle',supervisor:'Gabriel',meta:3000,realized:1679.87}
  ],
  productionHistory:[],
  migrations:{spreadsheetSeptember2026:true,tvEquipeNames16000Sep2026:true},
  people:[
    {name:'Edgar',team:'Time Start',meta:2000,realized:0,active:true},
    {name:'Bianca',team:'Time Start',meta:2000,realized:0,active:true},
    {name:'Vitor',team:'Time Start',meta:1400,realized:0,active:true},
    {name:'Pedro',team:'Time Start',meta:1000,realized:54.99,active:true},
    {name:'Kaua',team:'Time Hunter Ativo',meta:1500,realized:299.95,active:true},
    {name:'Samuel',team:'Time Hunter Ativo',meta:1200,realized:54.99,active:true},
    {name:'Leonardo',team:'Time Hunter Ativo',meta:850,realized:119.98,active:true},
    {name:'Millena',team:'Time Hunter Ativo',meta:1000,realized:99.99,active:true},
    {name:'Mayara',team:'Time Hunter Consultivo',meta:1600,realized:0,active:true},
    {name:'Arthur',team:'Time Hunter Consultivo',meta:1000,realized:0,active:true},
    {name:'Kelly',team:'Time Carteira 1',meta:3000,realized:242.79,active:true},
    {name:'Larissa',team:'Time Carteira 1',meta:800,realized:79.98,active:true},
    {name:'Tiago Fernandes',team:'Time Carteira 1',meta:1000,realized:149.89,active:true},
    {name:'Nathalia',team:'Time Carteira 2',meta:500,realized:0,active:true},
    {name:'Clara',team:'Time Carteira 2',meta:500,realized:299.95,active:true},
    {name:'Guilherme',team:'Time Carteira 2',meta:1500,realized:419.94,active:true},
    {name:'Luciana',team:'Time Avançados',meta:2500,realized:564.28,active:true},
    {name:'Tiago Baltor',team:'Time Avançados',meta:6000,realized:649.99,active:true},
    {name:'Gabriel',team:'Time Valle',meta:3000,realized:1679.87,active:true,excludeFromTop3:true}

  ]
};
let data = clone(DEFAULT_DATA);
let remoteEnabled = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
let lastRemoteJson = '';
const ADMIN_VIEWS = new Set(['admin','producao','metas','produtos','pessoas','individual','times','relatorios','configuracoes']);
const AUTH_STORAGE_KEY = 'vivaAdminAuthV1';
let dashboardAccess = null;
const VIEWER_VIEWS = new Set(['admin','individual','relatorios']);
function isDashboardAdmin(){return dashboardAccess?.active===true && dashboardAccess?.role==='admin'}
function isDashboardViewer(){return dashboardAccess?.active===true && dashboardAccess?.role==='viewer'}
function authSession(){try{return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)||'null')}catch{return null}}
function setAuthSession(s){if(s)localStorage.setItem(AUTH_STORAGE_KEY,JSON.stringify(s));else localStorage.removeItem(AUTH_STORAGE_KEY)}
function authToken(){return authSession()?.access_token||''}
function jwtExp(token){try{const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(part)).exp||0}catch{return 0}}
async function refreshAuth(){
 const s=authSession(); if(!s?.refresh_token||!remoteEnabled)return false;
 try{const r=await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:CONFIG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});if(!r.ok)throw 0;const n=await r.json();setAuthSession(n);return true}catch{setAuthSession(null);return false}
}
async function ensureAuth(){const s=authSession();if(!s?.access_token)return false;if(jwtExp(s.access_token)*1000>Date.now()+60000)return true;const ok=await refreshAuth();if(ok)await loadDashboardAccess();return ok}
async function loadDashboardAccess(){
 dashboardAccess=null;if(!remoteEnabled||!authToken())return null;
 try{
  const r=await fetch(`${CONFIG.supabaseUrl}/rest/v1/dashboard_access?user_id=eq.${authSession()?.user?.id||''}&select=role,active`,{headers:{apikey:CONFIG.supabaseAnonKey,Authorization:`Bearer ${authToken()}`}});
  if(!r.ok)throw new Error('Falha ao consultar acesso');
  const rows=await r.json();dashboardAccess=rows?.[0]||null;return dashboardAccess;
 }catch(e){console.warn(e);dashboardAccess=null;return null}
}
function renderAccessDenied(){app.innerHTML=`<div class="login-shell"><div class="login-card"><img src="logo-viva.png" alt="Viva Conecta"><div class="login-kicker">ACESSO NÃO AUTORIZADO</div><h1>Sem acesso ao Dashboard</h1><p>Este usuário existe no Supabase, mas ainda não possui permissão ativa no Dashboard Viva Conecta.</p><button class="btn primary login-btn" onclick="logoutAdmin()">Sair</button></div></div>`}
async function loginAdmin(ev){
 ev?.preventDefault(); const email=document.getElementById('loginEmail')?.value?.trim();const password=document.getElementById('loginPassword')?.value||'';const err=document.getElementById('loginError');
 if(err)err.textContent=''; if(!email||!password){if(err)err.textContent='Preencha e-mail e senha.';return}
 const btn=document.getElementById('loginBtn');if(btn){btn.disabled=true;btn.textContent='Entrando...'}
 try{const r=await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:CONFIG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});const body=await r.json();if(!r.ok)throw new Error(body?.error_description||body?.msg||'E-mail ou senha inválidos.');setAuthSession(body);await loadDashboardAccess();if(!dashboardAccess?.active){renderAccessDenied();return}toast(isDashboardViewer()?'Acesso de visualização liberado ✓':'Acesso liberado ✓');render(new URLSearchParams(location.search).get('view')||'admin')}
 catch(e){if(err)err.textContent=e.message||'Não foi possível entrar.'}
 finally{if(btn){btn.disabled=false;btn.textContent='Entrar'}}
}
function logoutAdmin(){setAuthSession(null);dashboardAccess=null;toast('Sessão encerrada');render('admin')}
function renderLogin(){
 app.innerHTML=`<div class="login-shell"><div class="login-card"><img src="logo-viva.png" alt="Viva Conecta"><div class="login-kicker">ACESSO ADMINISTRATIVO</div><h1>Painel Viva Conecta</h1><p>Entre com o usuário autorizado para acessar Produção, Metas, Colaboradores, Times e Dashboard.</p><form onsubmit="loginAdmin(event)"><label>E-mail</label><input id="loginEmail" type="email" autocomplete="username" placeholder="seuemail@empresa.com" required><label>Senha</label><input id="loginPassword" type="password" autocomplete="current-password" placeholder="••••••••" required><div id="loginError" class="login-error"></div><button id="loginBtn" class="btn primary login-btn" type="submit">Entrar</button></form><div class="login-public"><span>As TVs continuam públicas para visualização.</span><div><button class="btn" onclick="go('torres')">TV Torres</button><button class="btn" onclick="go('equipe')">TV Equipe</button></div></div></div></div>`;
}
function clone(x){return JSON.parse(JSON.stringify(x))}
function normalizeData(d){
 d=d||clone(DEFAULT_DATA);
 if(!Array.isArray(d.productionHistory))d.productionHistory=[];
 if(!d.migrations)d.migrations={};
 if(!Array.isArray(d.products))d.products=[];
 // Preserva a lista administrada pelo usuário; produtos excluídos não reaparecem ao recarregar.
 d.products.forEach((p,i)=>{if(typeof p.money!=='boolean')p.money=false;if(!p.color)p.color='#8e45ff';if(typeof p.showOnTv!=='boolean')p.showOnTv=true;if(!Number.isFinite(Number(p.order)))p.order=i});
 if(!Array.isArray(d.year))d.year=clone(DEFAULT_DATA.year);
 d.people.forEach(p=>{if(typeof p.showOnTv!=='boolean')p.showOnTv=true;if(typeof p.excludeFromTop3!=='boolean')p.excludeFromTop3=false});
 if(!d.tvSettings)d.tvSettings={showTop3:true};
 if(!d.monthlySnapshots||typeof d.monthlySnapshots!=='object')d.monthlySnapshots={};
 return d
}
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});
const num=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
const metaMoney=v=>Number(v||0)>0?money(v):'A definir';
const metaNum=v=>Number(v||0)>0?num(v):'A definir';
const pct=(a,b)=>b?Math.max(0,(Number(a||0)/Number(b))*100):0;
function colorFor(p){if(p<30)return '#ff4d69';if(p<=50)return '#ff8a3d';if(p<=70)return '#ffd04d';if(p<=89)return '#3979ff';if(p<=99)return '#168a45';return '#a84dff'}
function localLoad(){try{return JSON.parse(localStorage.getItem('vivaDashboardDataV3')||'null')}catch{return null}}
function localSave(){localStorage.setItem('vivaDashboardDataV3',JSON.stringify(data))}
function applySeptemberSpreadsheetSnapshot(remote){
  if(!remote || remote?.migrations?.tvEquipeNames16000Sep2026) return remote;
  // Migração única: troca os números antigos pelo fechamento atual da aba Fórmulas.
  // Depois que o painel for salvo pelo admin, a flag fica no Supabase e lançamentos futuros são preservados.
  return clone(DEFAULT_DATA);
}
async function remoteLoad(){
  if(!remoteEnabled)return null;
  try{
    const token=authToken()||CONFIG.supabaseAnonKey;
    const r=await fetch(`${CONFIG.supabaseUrl}/rest/v1/viva_state?id=eq.1&select=data`,{headers:{apikey:CONFIG.supabaseAnonKey,Authorization:`Bearer ${token}`}});
    if(!r.ok)throw new Error('Falha Supabase');
    const rows=await r.json();
    if(rows?.[0]?.data && Object.keys(rows[0].data).length){return applySeptemberSpreadsheetSnapshot(rows[0].data);}
    return clone(DEFAULT_DATA);
  }catch(e){console.warn(e);return null}
}
async function remoteSave(payload=data){
  if(!remoteEnabled)return false;
  if(!isDashboardAdmin()){toast('Acesso somente para visualização');return false}
  if(!await ensureAuth()){toast('Faça login para salvar alterações');renderLogin();return false}
  let token=authToken();
  let r=await fetch(`${CONFIG.supabaseUrl}/rest/v1/viva_state`,{method:'POST',headers:{apikey:CONFIG.supabaseAnonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:1,data:payload,updated_at:new Date().toISOString()})});
  if(r.status===401 && await refreshAuth()){token=authToken();r=await fetch(`${CONFIG.supabaseUrl}/rest/v1/viva_state`,{method:'POST',headers:{apikey:CONFIG.supabaseAnonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:1,data:payload,updated_at:new Date().toISOString()})})}
  if(!r.ok){toast('Não foi possível salvar no banco');return false}
  return true
}
async function save(){if(remoteEnabled&&!isDashboardAdmin()){toast('Acesso somente para visualização');const remote=await remoteLoad();if(remote){data=normalizeData(remote);localSave()}return false}localSave();if(remoteEnabled){const ok=await remoteSave();if(!ok)return false}toast('Alteração salva ✓');return true}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
function progress(p,c){return `<div class="progress"><i style="width:${Math.min(p,100)}%;background:${c||colorFor(p)}"></i></div>`}
function navButton(label,icon,view,current){return `<button class="${view===current?'active':''}" onclick="go('${view}')"><span class="ico">${icon}</span>${label}</button>`}
function shell(inner,current='admin'){
 const nav=isDashboardViewer()?`${navButton('Dashboard','▦','admin',current)}${navButton('TV Torres','▣','torres',current)}${navButton('TV Equipe','▤','equipe',current)}${navButton('Desempenho Individual','◫','individual',current)}${navButton('Relatórios','▧','relatorios',current)}`:`${navButton('Dashboard','▦','admin',current)}${navButton('TV Torres','▣','torres',current)}${navButton('TV Equipe','▤','equipe',current)}${navButton('Produção','◎','producao',current)}${navButton('Metas','◉','metas',current)}${navButton('Produtos / Torres','◇','produtos',current)}${navButton('Colaboradores','♙','pessoas',current)}${navButton('Desempenho Individual','◫','individual',current)}${navButton('Times','♟','times',current)}${navButton('Relatórios','▧','relatorios',current)}${navButton('Configurações TVs','⚙','configuracoes',current)}`;
 return `<div class="shell"><aside class="sidebar"><div class="brand-wrap"><img src="logo-viva.png" alt="Viva Conecta Telecom"></div><div class="nav">${nav}</div><div class="sidebar-foot"><b>Viva Conecta Telecom</b><br><span class="status-dot"></span>${isDashboardViewer()?'Somente visualização':remoteEnabled?'Sincronização online':'Modo local de teste'}<br>${isDashboardViewer()?'Sem permissão para alterações':'Atualização automática nas TVs'}</div></aside><main class="content">${topbar()}${inner}</main></div>`
}
function topbar(){return `<div class="topbar"><div class="headline"><h1>Bem-vinda ao Painel Viva Conecta 👋</h1><p>${isDashboardViewer()?'Acompanhe a performance e gere relatórios. Este acesso não permite alterações.':'Alimente os dados uma vez e acompanhe a performance em tempo real.'}</p></div><div class="top-actions">${isDashboardViewer()?'<div class="pill">👁 Somente visualização</div>':''}<div class="pill"><span class="status-dot"></span>${remoteEnabled?'Banco conectado':'Local'}</div><div class="pill">${data.company.month}</div><button class="btn logout-btn" onclick="logoutAdmin()">Sair</button></div></div>`}
function chart(vals,height=270){
 const clean=vals.map(v=>Number(v||0));const max=Math.max(...clean,1),w=900,h=300,p=22;
 const pts=clean.map((v,i)=>({x:p+i*(w-p*2)/(clean.length-1),y:h-p-v/max*(h-p*2)}));
 const points=pts.map(o=>`${o.x},${o.y}`).join(' ');const area=`${p},${h-p} ${points} ${w-p},${h-p}`;const last=pts[pts.length-1];
 return `<div class="chart-wrap" style="height:${height}px"><div class="chart-grid"></div><svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="lineGradient" x1="0" x2="1"><stop offset="0" stop-color="#9b35ff"/><stop offset=".55" stop-color="#d14cff"/><stop offset="1" stop-color="#4e8bff"/></linearGradient><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a13cff" stop-opacity=".38"/><stop offset="1" stop-color="#a13cff" stop-opacity="0"/></linearGradient></defs><polygon class="chart-area" points="${area}" fill="url(#areaGradient)"/><polyline class="chart-line" points="${points}"/><circle class="chart-dot moving-dot" cx="${last.x}" cy="${last.y}" r="7" fill="#fff" stroke="#a640ff" stroke-width="4"/></svg></div><div class="axis">${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map(x=>`<span>${x}</span>`).join('')}</div>`
}
function productCard(p){const x=pct(p.realized,p.meta),hm=Number(p.meta||0)>0;return `<div class="card product" style="--accent:${p.color}"><div class="product-name">${p.name}</div><div class="product-value">${p.money?money(p.realized):num(p.realized)}</div><div class="product-meta">meta ${hm?(p.money?money(p.meta):num(p.meta)):'A definir'}${hm?' • '+x.toFixed(1)+'%':''}</div><div class="mini-progress"><i style="width:${hm?Math.min(x,100):0}%"></i></div></div>`}
function renderAdmin(){
 const hasCompanyMeta=Number(data.company.meta||0)>0,p=pct(data.company.realized,data.company.meta),gap=hasCompanyMeta?Math.max(0,data.company.meta-data.company.realized):null,sorted=[...data.people].filter(x=>x.active).sort((a,b)=>b.realized-a.realized);
 const missingProducts=data.products.filter(x=>Number(x.meta||0)<=0).length,missingTeams=data.teams.filter(x=>Number(x.meta||0)<=0).length,missingPeople=data.people.filter(x=>x.active&&Number(x.meta||0)<=0).length;
 const setupReady=hasCompanyMeta&&missingProducts===0&&missingTeams===0&&missingPeople===0;
 const inner=`<div class="sync-banner ${remoteEnabled?'ok':'warn'}"><span>${isDashboardViewer()?'● Modo somente visualização: você pode consultar e exportar dados, mas não alterar.':remoteEnabled?'● Supabase conectado: alterações podem aparecer nas TVs automaticamente.':'● Versão pronta para testar. Falta conectar o Supabase para sincronizar computador + TVs.'}</span><span>${isDashboardViewer()?'VIEWER':remoteEnabled?'ONLINE':'LOCAL'}</span></div>
 ${isDashboardViewer()?'':`<div class="card admin-card dashboard-guide"><div class="section-title"><span>Como usar o painel no mês</span><span class="setup-badge ${setupReady?'ready':''}">${setupReady?'Pronto para produzir ✓':'Configuração pendente'}</span></div><div class="guide-steps"><button onclick="go('metas')"><b>1</b><span><strong>Definir período e metas</strong><small>${hasCompanyMeta&&missingProducts===0?'Concluído':'Aguardando metas oficiais'}</small></span></button><button onclick="go('times')"><b>2</b><span><strong>Conferir times</strong><small>${missingTeams?'Há metas a definir':'Concluído'}</small></span></button><button onclick="go('pessoas')"><b>3</b><span><strong>Conferir colaboradores</strong><small>${missingPeople?'Há metas a definir':'Concluído'}</small></span></button><button onclick="go('producao')"><b>4</b><span><strong>Lançar produção</strong><small>Uso diário</small></span></button><button onclick="go('torres')"><b>5</b><span><strong>Acompanhar TVs</strong><small>Atualização automática</small></span></button></div>${!setupReady?`<div class="setup-warning">⚠️ As metas de ${data.company.month} ainda não estão completas. Isso é normal enquanto os números oficiais não chegaram. Os lançamentos podem ser registrados, mas percentuais e GAP só ficam corretos após preencher as metas.</div>`:''}</div>`}
 <div class="grid kpis"><div class="card kpi"><div class="kpi-label">Meta Geral</div><div class="kpi-value">${hasCompanyMeta?money(data.company.meta):'A definir'}</div><div class="kpi-sub">Objetivo mensal da empresa</div></div><div class="card kpi"><div class="kpi-label">Realizado</div><div class="kpi-value">${money(data.company.realized)}</div><div class="kpi-sub">Receita até o momento</div></div><div class="card kpi"><div class="kpi-label">Atingimento</div><div class="kpi-value" style="color:${hasCompanyMeta?colorFor(p):'#9b96b6'}">${hasCompanyMeta?p.toFixed(1)+'%':'A definir'}</div>${hasCompanyMeta?progress(p):'<div class="kpi-sub">Preencha a meta geral</div>'}</div><div class="card kpi"><div class="kpi-label">GAP</div><div class="kpi-value">${hasCompanyMeta?money(gap):'A definir'}</div><div class="kpi-sub">Falta para a meta</div></div></div>
 <div class="grid main-grid"><div class="card chart-card"><div class="section-title"><span>Evolução anual</span><small>animação ao abrir</small></div>${chart(data.year)}</div><div class="card team-list"><div class="section-title">Desempenho por equipe</div>${[...data.teams].sort((a,b)=>b.realized-a.realized).map(t=>{const x=pct(t.realized,t.meta);return `<div class="team-item"><div class="team-row"><div><div class="team-name" style="color:${colorFor(x)}">${t.name}</div><div class="team-meta">Meta ${money(t.meta)}</div></div><div><div class="team-pct">${money(t.realized)}</div><div class="team-meta" style="text-align:right;color:${colorFor(x)}">${x.toFixed(0)}%</div></div></div><div class="mini-progress"><i style="width:${Math.min(x,100)}%;background:${colorFor(x)}"></i></div></div>`}).join('')}</div></div>
 <div class="grid products">${data.products.map(productCard).join('')}</div>`;
 app.innerHTML=shell(inner,'admin')
}

// Ajuste de escala independente por TV/aparelho.
const TV_SCALE_MIN=0.75,TV_SCALE_MAX=1.30,TV_SCALE_STEP=0.05;
function tvScaleKey(view){return `vivaTvScale:${view}`}
function getTvScale(view){
 try{const n=Number(localStorage.getItem(tvScaleKey(view))||1);return Number.isFinite(n)?Math.min(TV_SCALE_MAX,Math.max(TV_SCALE_MIN,n)):1}catch{return 1}
}
function applyTvScale(view,scale=getTvScale(view)){
 const shell=document.querySelector('.tv-shell');if(!shell)return;
 const s=Math.min(TV_SCALE_MAX,Math.max(TV_SCALE_MIN,Number(scale)||1));
 shell.style.transform=`scale(${s})`;
 shell.style.transformOrigin='top left';
 shell.style.width=`${100/s}%`;
 shell.style.minHeight=`${100/s}vh`;
 const value=document.querySelector('#tvScaleValue');if(value)value.textContent=`${Math.round(s*100)}%`;
}
function setTvScale(view,delta){
 const current=getTvScale(view),next=Math.round(Math.min(TV_SCALE_MAX,Math.max(TV_SCALE_MIN,current+delta))*100)/100;
 try{localStorage.setItem(tvScaleKey(view),String(next))}catch{}
 applyTvScale(view,next)
}
function resetTvScale(view){try{localStorage.setItem(tvScaleKey(view),'1')}catch{}applyTvScale(view,1)}
function toggleTvScalePanel(){const panel=document.querySelector('.tv-scale-panel');if(panel)panel.classList.toggle('open')}
function mountTvScaleControls(view){
 document.querySelector('.tv-scale-dock')?.remove();
 const dock=document.createElement('div');dock.className='tv-scale-dock';
 dock.innerHTML=`<button class="tv-scale-gear" type="button" onclick="toggleTvScalePanel()" title="Ajustar tamanho desta TV">⚙</button><div class="tv-scale-panel"><div class="tv-scale-title">Tamanho desta TV</div><div class="tv-scale-row"><button type="button" onclick="setTvScale('${view}',-TV_SCALE_STEP)">−</button><strong id="tvScaleValue">100%</strong><button type="button" onclick="setTvScale('${view}',TV_SCALE_STEP)">+</button></div><button class="tv-scale-reset" type="button" onclick="resetTvScale('${view}')">Voltar para 100%</button><small>Salvo somente neste aparelho</small></div>`;
 document.body.appendChild(dock);applyTvScale(view)
}

function renderTorres(){
 const p=pct(data.company.realized,data.company.meta),gap=Math.max(0,data.company.meta-data.company.realized);
 app.innerHTML=`<div class="tv-shell tv-torres-screen"><div class="tv-meta tv-meta-only"><span class="live-bullet"></span>ATUALIZAÇÃO AUTOMÁTICA • ${data.company.month}</div>
 <div class="tv-main tv-main-chart-only tv-main-no-kpis"><div class="card tv-card tv-chart-full"><div class="section-title"><span>Evolução anual de vendas</span></div>${chart(data.year,285)}</div></div>
 <div class="grid tv-products">${[...data.products].filter(p=>p.showOnTv!==false).sort((a,b)=>(a.order??0)-(b.order??0)).map(productCard).join('')}</div>
 <div class="live-ticker"><span><span class="live-bullet"></span>Dashboard conectado • dados centralizados</span><span>Viva Conecta Telecom</span><span>${data.company.month}</span></div></div>`
 mountTvScaleControls('torres')
}
function renderEquipe(){
 const p=pct(data.company.realized,data.company.meta),active=data.people.filter(x=>x.active&&x.showOnTv!==false),sorted=[...active].sort((a,b)=>b.realized-a.realized),eligibleTop=sorted.filter(x=>!x.excludeFromTop3),top=eligibleTop.slice(0,3),topNames=new Set(top.map(x=>x.name)),remaining=sorted.filter(x=>!topNames.has(x.name));
 const podium=[top[1],top[0],top[2]];
 app.innerHTML=`<div class="tv-shell tv-equipe-screen"><div class="tv-meta tv-meta-only"><span class="live-bullet"></span>ATUALIZAÇÃO AUTOMÁTICA • ${data.company.month}</div>
 <div class="grid tv-top"><div class="card kpi"><div class="kpi-label">Meta empresa</div><div class="kpi-value">${money(data.company.meta)}</div></div><div class="card kpi"><div class="kpi-label">Realizado</div><div class="kpi-value">${money(data.company.realized)}</div></div><div class="card kpi"><div class="kpi-label">Atingido</div><div class="kpi-value" style="color:${colorFor(p)}">${p.toFixed(1)}%</div>${progress(p)}</div><div class="card kpi"><div class="kpi-label">GAP</div><div class="kpi-value" style="color:#ff5b73">${money(Math.max(0,data.company.meta-data.company.realized))}</div></div></div>
 <div class="card podium-card podium-card-wide"><div class="section-title"><span>🏆 Top 3 • Ranking Geral</span><small>por receita</small></div><div class="podium-stage">${podium.map((u,idx)=>{if(!u)return '<div class="podium-col"></div>';const realRank=idx===0?2:idx===1?1:3;return `<div class="podium-col p${realRank}"><div class="podium-avatar">${u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div><div class="podium-base">${realRank===1?'<div class="crown">👑</div>':''}<div class="podium-rank">${realRank}º</div><div class="podium-name">${u.name}</div><div class="podium-value">${money(u.realized)}</div><div class="podium-pct" style="color:${colorFor(pct(u.realized,u.meta))}">${pct(u.realized,u.meta).toFixed(0)}% da meta</div></div></div>`}).join('')}</div></div>
 <div class="card people-card people-card-bottom"><div class="section-title"><span>Demais consultores</span><small>ranking por receita</small></div><div class="remaining-people-grid">${remaining.map((u,i)=>{const x=pct(u.realized,u.meta),c=colorFor(x);return `<div class="remaining-person" style="--perf:${c};border-color:${c}55"><div class="person-info"><div class="avatar" style="background:${c}">${u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div><div><div class="person-name" style="color:${c}">${u.name}</div><div class="tiny">${u.team}</div></div></div><div class="remaining-money"><b>${money(u.realized)}</b><span>de ${money(u.meta)}</span></div><div class="remaining-pct" style="color:${c}">${x.toFixed(0)}%</div><div class="remaining-progress"><div class="mini-progress"><i style="width:${Math.min(x,100)}%;background:${c}"></i></div></div></div>`}).join('')}</div><div class="performance-legend"><b>Faixas de performance</b><span><i style="background:#ff4d69"></i> abaixo de 30%</span><span><i style="background:#ff8a3d"></i> 30%–50%</span><span><i style="background:#ffd04d"></i> 51%–70%</span><span><i style="background:#3979ff"></i> 71%–89%</span><span><i style="background:#168a45"></i> 90%–99%</span><span><i style="background:#a84dff"></i> 100%</span></div></div>
 <div class="live-ticker"><span><span class="live-bullet"></span>Ranking recalculado automaticamente</span><span>Viva Conecta Telecom</span><span>${data.company.month}</span></div></div>`
 mountTvScaleControls('equipe')
}
function renderProducao(){
 const hist=[...(data.productionHistory||[])].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 app.innerHTML=shell(`<div class="grid admin-grid"><div class="card admin-card"><div class="section-title">Lançar produção</div><div class="form-grid"><div class="field"><label>Consultor</label><select id="personSel">${data.people.filter(x=>x.active).map((p)=>`<option value="${data.people.indexOf(p)}">${p.name} • ${p.team}</option>`).join('')}</select></div><div class="field"><label>Receita produzida (R$)</label><input id="addRevenue" type="number" step="0.01" value="0"></div><div class="field"><label>Produto</label><select id="productSel">${data.products.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('')}</select></div><div class="field"><label>Quantidade / valor do produto</label><input id="addQty" type="number" step="0.01" value="1"></div></div><div class="actions"><button class="btn primary" onclick="launchProduction()">Registrar produção</button></div></div><div class="card admin-card"><div class="section-title">Como funciona</div><p class="kpi-sub" style="line-height:1.8">Cada lançamento fica registrado no histórico. Se houver erro, você pode editar ou excluir e todos os totais são recalculados automaticamente.</p><div class="actions"><button class="btn" onclick="go('torres')">Ver TV Torres</button><button class="btn" onclick="go('equipe')">Ver TV Equipe</button></div></div></div><div class="card admin-card history-card"><div class="section-title"><span>Histórico de produção</span><small>${hist.length} lançamento(s)</small></div>${hist.length?`<div class="table-wrap"><table class="table-admin"><thead><tr><th>Data</th><th>Consultor</th><th>Produto</th><th>Qtd/Valor</th><th>Receita</th><th>Ações</th></tr></thead><tbody>${hist.map(h=>`<tr><td>${new Date(h.createdAt).toLocaleString('pt-BR')}</td><td>${h.personName}</td><td>${h.productName}</td><td>${num(h.qty)}</td><td>${money(h.revenue)}</td><td class="history-actions"><button type="button" class="btn history-edit" data-id="${h.id}">Editar</button><button type="button" class="btn danger history-delete" data-id="${h.id}">Excluir</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-history">Os próximos lançamentos aparecerão aqui.</div>`}</div>`,'producao');
 bindHistoryActions();
}
function bindHistoryActions(){
 document.querySelectorAll('.history-edit').forEach(btn=>{btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();editProduction(btn.dataset.id)},{passive:false})});
 document.querySelectorAll('.history-delete').forEach(btn=>{btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();deleteProduction(btn.dataset.id)},{passive:false})});
}
function renderMetas(){
 const pendentes=(Number(data.company.meta||0)<=0?1:0)+data.products.filter(p=>Number(p.meta||0)<=0).length+data.teams.filter(t=>Number(t.meta||0)<=0).length+data.people.filter(p=>p.active&&Number(p.meta||0)<=0).length;
 app.innerHTML=shell(`<div class="card admin-card handoff-card"><div class="section-title"><span>Configuração do mês • responsável pelo painel</span><span class="setup-badge">${pendentes?pendentes+' item(ns) a definir':'Configuração completa ✓'}</span></div><p class="kpi-sub admin-help">Ordem recomendada: <b>1. Período e metas</b> → <b>2. Times</b> → <b>3. Colaboradores</b> → <b>4. Produção</b> → <b>5. TVs</b>. Campos com valor 0 são tratados como <b>A definir</b> e podem ser preenchidos quando as metas oficiais chegarem.</p><div class="actions"><button class="btn secondary" onclick="clearDemoGoals()">Limpar metas de exemplo</button></div></div><div class="grid admin-grid"><div class="card admin-card"><div class="section-title">Meta geral</div><div class="form-grid"><div class="field"><label>Período</label><input id="month" value="${data.company.month}"></div><div class="field"><label>Meta empresa (R$) • 0 = A definir</label><input id="companyMeta" type="number" step="0.01" value="${data.company.meta}"></div><div class="field"><label>Realizado atual (automático)</label><input type="number" step="0.01" value="${data.company.realized}" readonly></div></div><div class="actions"><button class="btn primary" onclick="updateCompany()">Salvar meta/período</button><button class="btn danger" onclick="resetRealized()">Iniciar novo período / zerar realizados</button></div><p class="danger-note">⚠️ O botão vermelho apaga os realizados e o histórico do período atual. Ele sempre pede duas confirmações antes de executar.</p></div><div class="card admin-card"><div class="section-title">Metas por produto</div><div class="table-wrap"><table class="table-admin"><thead><tr><th>Produto</th><th>Meta (0 = A definir)</th><th>Realizado automático</th></tr></thead><tbody>${data.products.map((p,i)=>`<tr><td>${p.name}</td><td><input type="number" step="0.01" value="${p.meta}" onchange="editProduct(${i},'meta',this.value)"></td><td><input type="number" step="0.01" value="${p.realized}" readonly></td></tr>`).join('')}</tbody></table></div></div></div>`,'metas')
}
function renderProdutos(){
 app.innerHTML=shell(`<div class="card admin-card"><div class="section-title"><span>Produtos / Torres</span><button class="btn primary" onclick="addProduct()">+ Novo produto</button></div><p class="kpi-sub admin-help">Controle aqui os quadrados exibidos na TV Torres. Você pode alterar nome, tipo, meta e realizado, adicionar novos produtos ou excluir os que não quiser mostrar.</p><div class="table-wrap"><table class="table-admin"><thead><tr><th>Produto</th><th>Tipo</th><th>Meta</th><th>Realizado</th><th>Exibir TV</th><th>Ordem</th><th>Ações</th></tr></thead><tbody>${data.products.map((p,i)=>`<tr><td><input value="${p.name}" onchange="editProductField(${i},'name',this.value)"></td><td><select onchange="editProductField(${i},'money',this.value==='money')"><option value="qty" ${!p.money?'selected':''}>Quantidade</option><option value="money" ${p.money?'selected':''}>R$</option></select></td><td><input type="number" step="0.01" value="${p.meta}" onchange="editProductField(${i},'meta',this.value)"></td><td><input type="number" step="0.01" value="${p.realized}" onchange="editProductField(${i},'realized',this.value)"></td><td><select onchange="editProductField(${i},'showOnTv',this.value==='true')"><option value="true" ${p.showOnTv!==false?'selected':''}>Sim</option><option value="false" ${p.showOnTv===false?'selected':''}>Não</option></select></td><td><input type="number" min="1" value="${Number(p.order??i)+1}" onchange="editProductField(${i},'order',Number(this.value)-1)"></td><td><button type="button" class="btn danger" onclick="removeProduct(${i})">Excluir</button></td></tr>`).join('')}</tbody></table></div><div class="actions"><button class="btn" onclick="go('torres')">Ver TV Torres</button></div></div>`,'produtos')
}
function renderPessoas(){
 app.innerHTML=shell(`<div class="card admin-card"><div class="section-title"><span>Colaboradores</span><button class="btn primary" onclick="addPerson()">+ Novo colaborador</button></div><p class="kpi-sub admin-help">Cadastre, altere o time e a meta ou desative um colaborador. As alterações ficam salvas no banco e refletem na Produção e nas TVs.</p><div class="table-wrap"><table class="table-admin"><thead><tr><th>Nome</th><th>Time</th><th>Meta mensal</th><th>Realizado</th><th>Na TV</th><th>Top 3</th><th>Ativo</th><th>Ações</th></tr></thead><tbody>${data.people.map((p,i)=>`<tr><td><input value="${p.name}" onchange="editPerson(${i},'name',this.value)"></td><td><select onchange="editPerson(${i},'team',this.value)">${data.teams.map(t=>`<option value="${t.name}" ${p.team===t.name?'selected':''}>${t.name}</option>`).join('')}</select></td><td><input type="number" step="0.01" value="${p.meta}" onchange="editPerson(${i},'meta',this.value)"></td><td><input type="number" step="0.01" value="${p.realized}" readonly></td><td><select onchange="editPerson(${i},'showOnTv',this.value==='true')"><option value="true" ${p.showOnTv!==false?'selected':''}>Sim</option><option value="false" ${p.showOnTv===false?'selected':''}>Não</option></select></td><td><select onchange="editPerson(${i},'excludeFromTop3',this.value==='false')"><option value="false" ${!p.excludeFromTop3?'selected':''}>Participa</option><option value="true" ${p.excludeFromTop3?'selected':''}>Fora do Top 3</option></select></td><td><select onchange="editPerson(${i},'active',this.value==='true')"><option value="true" ${p.active?'selected':''}>Sim</option><option value="false" ${!p.active?'selected':''}>Não</option></select></td><td><button type="button" class="btn danger" onclick="removePerson(${i})">Excluir</button></td></tr>`).join('')}</tbody></table></div></div>`,'pessoas')
}
function renderTimes(){
 app.innerHTML=shell(`<div class="card admin-card"><div class="section-title"><span>Times e supervisores</span><button class="btn primary" onclick="addTeam()">+ Novo time</button></div><p class="kpi-sub admin-help">Você pode criar novos times, trocar supervisor e ajustar metas. Ao renomear um time, os colaboradores vinculados acompanham automaticamente.</p><div class="table-wrap"><table class="table-admin"><thead><tr><th>Time</th><th>Supervisor</th><th>Meta</th><th>Realizado automático</th><th>Ações</th></tr></thead><tbody>${data.teams.map((t,i)=>`<tr><td><input value="${t.name}" onchange="editTeam(${i},'name',this.value)"></td><td><input value="${t.supervisor}" onchange="editTeam(${i},'supervisor',this.value)"></td><td><input type="number" step="0.01" value="${t.meta}" onchange="editTeam(${i},'meta',this.value)"></td><td><input type="number" step="0.01" value="${t.realized}" readonly></td><td><button type="button" class="btn danger" onclick="removeTeam(${i})">Excluir</button></td></tr>`).join('')}</tbody></table></div></div>`,'times')
}
function renderConfiguracoes(){
 const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
 app.innerHTML=shell(`<div class="card admin-card"><div class="section-title"><span>Configurações das TVs</span></div><p class="kpi-sub admin-help">Aqui você controla a evolução anual e o que aparece nas TVs sem alterar o código ou publicar uma nova versão.</p><div class="section-title"><span>Evolução anual de vendas</span></div><div class="year-admin-grid">${months.map((m,i)=>`<div class="field"><label>${m}</label><input type="number" step="0.01" value="${data.year[i]||0}" onchange="editYear(${i},this.value)"></div>`).join('')}</div><div class="actions"><button class="btn" onclick="go('torres')">Ver TV Torres</button><button class="btn" onclick="go('equipe')">Ver TV Equipe</button></div><div class="setup-warning">Produtos e ordem dos quadrados: use <b>Produtos / Torres</b>. Quem aparece na TV e quem participa do Top 3: use <b>Colaboradores</b>. Meta geral: use <b>Metas</b>.</div></div>`,'configuracoes')
}

function snapshotKey(label){return String(label||'Período').trim().replace(/\s+/g,' ')}
function makeSnapshot(){return {closedAt:new Date().toISOString(),company:clone(data.company),people:clone(data.people),teams:clone(data.teams),products:clone(data.products),productionHistory:clone(data.productionHistory||[]),year:clone(data.year||[])}}
function reportSource(key){if(key==='__current__')return makeSnapshot();return data.monthlySnapshots?.[key]||makeSnapshot()}
function reportRowsPeople(src){return (src.people||[]).filter(p=>p.active!==false).sort((a,b)=>Number(b.realized||0)-Number(a.realized||0))}
function reportHtml(src,label){
 const people=reportRowsPeople(src), products=(src.products||[]), meta=Number(src.company?.meta||0), realized=Number(src.company?.realized||0), ating=pct(realized,meta), gap=meta-realized;
 const eligible=people.filter(p=>!p.excludeFromTop3).slice(0,3);
 return `<div class="report-print-head"><h1>Viva Conecta Telecom</h1><h2>Relatório Comercial • ${label}</h2></div>
 <div class="report-summary"><div class="report-kpi"><small>Meta geral</small><b>${metaMoney(meta)}</b></div><div class="report-kpi"><small>Realizado</small><b>${money(realized)}</b></div><div class="report-kpi"><small>Atingimento</small><b>${ating.toFixed(1)}%</b></div><div class="report-kpi"><small>${gap>=0?'Falta para meta':'Acima da meta'}</small><b>${money(Math.abs(gap))}</b></div></div>
 <div class="report-section"><h3>Top 3 do período</h3><div class="table-wrap"><table class="table-admin"><thead><tr><th>Posição</th><th>Colaborador</th><th>Time</th><th>Meta</th><th>Realizado</th><th>Atingimento</th></tr></thead><tbody>${eligible.map((p,i)=>`<tr><td>${i+1}º</td><td>${p.name}</td><td>${p.team||'-'}</td><td>${metaMoney(p.meta)}</td><td>${money(p.realized)}</td><td>${pct(p.realized,p.meta).toFixed(1)}%</td></tr>`).join('')||'<tr><td colspan="6">Sem dados</td></tr>'}</tbody></table></div></div>
 <div class="report-section"><h3>Desempenho por colaborador</h3><div class="table-wrap"><table class="table-admin"><thead><tr><th>Colaborador</th><th>Time</th><th>Meta</th><th>Realizado</th><th>%</th><th>Diferença</th><th>Top 3?</th></tr></thead><tbody>${people.map(p=>`<tr><td>${p.name}</td><td>${p.team||'-'}</td><td>${metaMoney(p.meta)}</td><td>${money(p.realized)}</td><td>${pct(p.realized,p.meta).toFixed(1)}%</td><td>${money(Number(p.realized||0)-Number(p.meta||0))}</td><td>${p.excludeFromTop3?'Não':'Sim'}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="report-section"><h3>Produção por produto</h3><div class="table-wrap"><table class="table-admin"><thead><tr><th>Produto</th><th>Tipo</th><th>Meta</th><th>Realizado</th><th>Atingimento</th><th>Diferença</th></tr></thead><tbody>${products.map(p=>{let pm=Number(p.meta||0),pr=Number(p.realized||0);return `<tr><td>${p.name}</td><td>${p.money?'R$':'Quantidade'}</td><td>${p.money?metaMoney(pm):metaNum(pm)}</td><td>${p.money?money(pr):num(pr)}</td><td>${pct(pr,pm).toFixed(1)}%</td><td>${p.money?money(pr-pm):num(pr-pm)}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="report-section"><h3>Desempenho por equipe</h3><div class="table-wrap"><table class="table-admin"><thead><tr><th>Equipe</th><th>Supervisor</th><th>Meta</th><th>Realizado</th><th>Atingimento</th></tr></thead><tbody>${(src.teams||[]).map(t=>`<tr><td>${t.name}</td><td>${t.supervisor||'-'}</td><td>${metaMoney(t.meta)}</td><td>${money(t.realized)}</td><td>${pct(t.realized,t.meta).toFixed(1)}%</td></tr>`).join('')}</tbody></table></div></div>
 <div class="report-section"><h3>Detalhamento dos lançamentos</h3><div class="table-wrap"><table class="table-admin"><thead><tr><th>Data</th><th>Colaborador</th><th>Produto</th><th>Qtd/Valor</th><th>Receita</th></tr></thead><tbody>${(src.productionHistory||[]).map(h=>`<tr><td>${new Date(h.createdAt).toLocaleString('pt-BR')}</td><td>${h.personName}</td><td>${h.productName}</td><td>${num(h.qty)}</td><td>${money(h.revenue)}</td></tr>`).join('')||'<tr><td colspan="5">Sem lançamentos registrados no histórico.</td></tr>'}</tbody></table></div></div>`
}
function renderRelatorios(){
 const keys=Object.keys(data.monthlySnapshots||{}).sort((a,b)=>String(data.monthlySnapshots[b]?.closedAt||'').localeCompare(String(data.monthlySnapshots[a]?.closedAt||'')));
 const selected=document.getElementById('reportPeriod')?.value||'__current__', src=reportSource(selected), label=selected==='__current__'?`${data.company.month} • em andamento`:selected;
 app.innerHTML=shell(`<div class="card admin-card"><div class="section-title"><span>Relatórios mensais</span><small>histórico comercial</small></div><div class="report-toolbar"><div class="field"><label>Competência</label><select id="reportPeriod" onchange="renderRelatorios()"><option value="__current__" ${selected==='__current__'?'selected':''}>${data.company.month} • em andamento</option>${keys.map(k=>`<option value="${k}" ${selected===k?'selected':''}>${k} • fechado</option>`).join('')}</select></div><div class="report-actions">${isDashboardAdmin()?'<button class="btn primary" onclick="closeCurrentMonth()">Fechar mês atual</button>':''}<button class="btn" onclick="printGeneralReport()">Imprimir / Salvar PDF</button><button class="btn" onclick="exportReportExcel()">Exportar Excel</button></div></div><div class="report-note">${isDashboardViewer()?'Modo consulta: você pode visualizar, imprimir e exportar os relatórios. O fechamento mensal é exclusivo do administrador.':'Ao fechar um mês, o sistema guarda uma cópia completa dos resultados daquele período. O fechamento <b>não zera</b> os números automaticamente; depois você decide quando iniciar o próximo período em Metas.'}</div><div id="reportBody">${reportHtml(src,label)}</div><p class="report-status">${selected==='__current__'?'Relatório baseado nos dados atuais do painel.':`Fechado em ${new Date(src.closedAt).toLocaleString('pt-BR')}.`}</p></div>`,'relatorios');
 setTimeout(()=>{const el=document.getElementById('reportPeriod');if(el)el.value=selected},0)
}
async function closeCurrentMonth(){const key=snapshotKey(data.company.month);if(!key)return toast('Defina o período em Metas');if(data.monthlySnapshots?.[key]&&!confirm(`${key} já possui um fechamento. Deseja substituir pelo estado atual?`))return;if(!confirm(`Fechar ${key} com os números atuais? O histórico ficará salvo e os realizados NÃO serão zerados.`))return;data.monthlySnapshots[key]=makeSnapshot();await save();renderRelatorios();toast(`${key} fechado e salvo ✓`)}
function xmlSafe(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function fileSafe(v){return String(v||'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'relatorio'}
function downloadBlob(content,type,filename){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function excelCell(v,type='String'){const value=type==='Number'?(Number(v)||0):xmlSafe(v);return `<Cell><Data ss:Type="${type}">${value}</Data></Cell>`}
function excelSheet(name,headers,rows){const safeName=xmlSafe(String(name).slice(0,31));return `<Worksheet ss:Name="${safeName}"><Table>${headers.length?`<Row>${headers.map(h=>excelCell(h)).join('')}</Row>`:''}${rows.map(r=>`<Row>${r.map(c=>excelCell(c?.value??c,c?.type||'String')).join('')}</Row>`).join('')}</Table></Worksheet>`}
function excelWorkbook(sheets){return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheets.join('')}</Workbook>`}
function printReportDocument(title,subtitle,body){const w=window.open('','_blank','width=1100,height=800');if(!w)return toast('O navegador bloqueou a janela de impressão. Libere pop-ups e tente novamente.');w.document.open();w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${xmlSafe(title)}</title><style>*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1f1630;margin:28px;background:#fff}h1{color:#6f2bd9;margin:0;font-size:26px}h2{margin:5px 0 22px;font-size:16px;color:#625a70;font-weight:600}.report-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0 20px}.report-kpi{border:1px solid #ddd4eb;border-radius:12px;padding:14px}.report-kpi small{display:block;color:#6e6678;text-transform:uppercase;font-size:10px}.report-kpi b{display:block;margin-top:5px;font-size:18px}.report-section{margin:20px 0}.report-section h3{font-size:15px;margin:0 0 8px;color:#4e276f}.table-wrap{overflow:visible}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #ddd;padding:7px 8px;text-align:left}th{background:#f4effa;color:#47245f}.report-print-head{display:none}.print-brand{border-bottom:2px solid #7d35df;padding-bottom:12px;margin-bottom:16px}.print-note{font-size:10px;color:#777;margin-top:20px}@page{size:A4 landscape;margin:10mm}@media print{body{margin:0}.no-print{display:none!important}.report-section{break-inside:avoid}tr{break-inside:avoid}}</style></head><body><div class="print-brand"><h1>Viva Conecta Telecom</h1><h2>${xmlSafe(subtitle)}</h2></div>${body}<p class="print-note">Relatório gerado pelo Dashboard Viva Conecta.</p><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);w.document.close()}
function printGeneralReport(){const sel=document.getElementById('reportPeriod')?.value||'__current__',src=reportSource(sel),label=sel==='__current__'?data.company.month:sel;printReportDocument('Relatório Comercial',`Relatório Comercial • ${label}`,reportHtml(src,label))}
function makeXlsxSheet(headers,rows,widths=[]){
 const aoa=[headers,...rows.map(r=>r.map(c=>c?.value??c))];
 const ws=XLSX.utils.aoa_to_sheet(aoa);
 ws['!cols']=headers.map((h,i)=>({wch:widths[i]||Math.max(12,String(h).length+3)}));
 return ws;
}
function downloadXlsx(filename,sheets){
 if(typeof XLSX==='undefined'){toast('Não foi possível carregar o gerador de Excel. Atualize a página e tente novamente.');return;}
 const wb=XLSX.utils.book_new();
 sheets.forEach(s=>XLSX.utils.book_append_sheet(wb,makeXlsxSheet(s.headers,s.rows,s.widths),s.name.slice(0,31)));
 XLSX.writeFile(wb,filename,{bookType:'xlsx',compression:true});
}
function exportReportExcel(){
 const sel=document.getElementById('reportPeriod')?.value||'__current__',src=reportSource(sel),label=sel==='__current__'?data.company.month:sel;
 const people=reportRowsPeople(src),products=src.products||[],teams=src.teams||[],hist=src.productionHistory||[],meta=Number(src.company?.meta||0),realized=Number(src.company?.realized||0);
 const sheets=[
  {name:'Resumo',headers:['Indicador','Valor'],widths:[24,22],rows:[['Período',label],['Meta geral',meta],['Realizado',realized],['Atingimento %',pct(realized,meta)],['Lançamentos',hist.length]]},
  {name:'Colaboradores',headers:['Colaborador','Equipe','Meta','Realizado','Atingimento %','Diferença','Participa Top 3'],widths:[24,20,16,16,16,16,18],rows:people.map(p=>[p.name,p.team||'',Number(p.meta||0),Number(p.realized||0),pct(p.realized,p.meta),Number(p.realized||0)-Number(p.meta||0),p.excludeFromTop3?'Não':'Sim'])},
  {name:'Produtos',headers:['Produto','Tipo','Meta','Realizado','Atingimento %','Diferença'],widths:[28,14,16,16,16,16],rows:products.map(p=>[p.name,p.money?'R$':'Quantidade',Number(p.meta||0),Number(p.realized||0),pct(p.realized,p.meta),Number(p.realized||0)-Number(p.meta||0)])},
  {name:'Equipes',headers:['Equipe','Supervisor','Meta','Realizado','Atingimento %'],widths:[22,22,16,16,16],rows:teams.map(t=>[t.name,t.supervisor||'',Number(t.meta||0),Number(t.realized||0),pct(t.realized,t.meta)])},
  {name:'Lancamentos',headers:['Data','Colaborador','Equipe','Produto','Qtd/Valor','Receita'],widths:[22,24,20,28,14,16],rows:hist.map(h=>[new Date(h.createdAt).toLocaleString('pt-BR'),h.personName||'',h.teamName||'',h.productName||'',Number(h.qty||0),Number(h.revenue||0)])}
 ];
 downloadXlsx(`Relatorio-Geral-Viva-Conecta-${fileSafe(label)}.xlsx`,sheets);
 toast('Relatório geral exportado em .xlsx ✓');
}

function individualProductRows(src,personName){
 const hist=(src.productionHistory||[]).filter(h=>h.personName===personName);
 const by={};
 hist.forEach(h=>{const key=h.productName||'Sem produto';if(!by[key])by[key]={name:key,qty:0,revenue:0,count:0};by[key].qty+=Number(h.qty||0);by[key].revenue+=Number(h.revenue||0);by[key].count++});
 return Object.values(by).sort((a,b)=>b.revenue-a.revenue||b.qty-a.qty||a.name.localeCompare(b.name,'pt-BR'));
}
function selectedIndividualData(){const period=document.getElementById('individualPeriod')?.value||'__current__',personName=document.getElementById('individualPerson')?.value||'';const src=reportSource(period),label=period==='__current__'?data.company.month:period,person=(src.people||[]).find(p=>p.name===personName)||(src.people||[]).find(p=>p.active!==false||Number(p.realized||0)>0);if(!person)return null;const hist=(src.productionHistory||[]).filter(h=>h.personName===person.name),rows=individualProductRows(src,person.name),meta=Number(person.meta||0),realized=Number(person.realized||0),ating=pct(realized,meta),ranked=[...(src.people||[])].filter(p=>p.active!==false).sort((a,b)=>Number(b.realized||0)-Number(a.realized||0)),pos=ranked.findIndex(p=>p.name===person.name)+1,totalQty=hist.reduce((sum,h)=>sum+Number(h.qty||0),0),totalRevenue=hist.reduce((sum,h)=>sum+Number(h.revenue||0),0);return {period,src,label,person,hist,rows,meta,realized,ating,pos,totalQty,totalRevenue}}
function individualReportHtml(d){const products=d.src.products||[],diff=d.realized-d.meta,productRows=d.rows.length?d.rows.map(r=>{const def=products.find(p=>normalizeName(p.name)===normalizeName(r.name));return `<tr><td>${r.name}</td><td>${def?.money?money(r.qty):num(r.qty)}</td><td>${money(r.revenue)}</td><td>${r.count}</td></tr>`}).join(''):'<tr><td colspan="4">Sem vendas registradas.</td></tr>',histRows=d.hist.length?d.hist.map(h=>`<tr><td>${new Date(h.createdAt).toLocaleString('pt-BR')}</td><td>${h.productName||'-'}</td><td>${num(h.qty)}</td><td>${money(h.revenue)}</td></tr>`).join(''):'<tr><td colspan="4">Sem lançamentos registrados.</td></tr>';return `<div class="report-summary"><div class="report-kpi"><small>Colaborador</small><b>${d.person.name}</b></div><div class="report-kpi"><small>Equipe</small><b>${d.person.team||'-'}</b></div><div class="report-kpi"><small>Meta</small><b>${d.meta>0?money(d.meta):'A definir'}</b></div><div class="report-kpi"><small>Realizado</small><b>${money(d.realized)}</b></div></div><div class="report-summary"><div class="report-kpi"><small>Atingimento</small><b>${d.meta>0?d.ating.toFixed(1)+'%':'A definir'}</b></div><div class="report-kpi"><small>${d.meta<=0?'Meta':diff>=0?'Acima da meta':'Falta para meta'}</small><b>${d.meta<=0?'A definir':money(Math.abs(diff))}</b></div><div class="report-kpi"><small>Posição</small><b>${d.pos?d.pos+'º':'-'}</b></div><div class="report-kpi"><small>Lançamentos</small><b>${d.hist.length}</b></div></div><div class="report-section"><h3>Vendas por produto</h3><div class="table-wrap"><table><thead><tr><th>Produto</th><th>Qtd./Valor</th><th>Receita</th><th>Lançamentos</th></tr></thead><tbody>${productRows}</tbody></table></div></div><div class="report-section"><h3>Histórico do colaborador</h3><div class="table-wrap"><table><thead><tr><th>Data</th><th>Produto</th><th>Qtd./Valor</th><th>Receita</th></tr></thead><tbody>${histRows}</tbody></table></div></div><div class="report-summary"><div class="report-kpi"><small>Quantidade total</small><b>${num(d.totalQty)}</b></div><div class="report-kpi"><small>Receita total</small><b>${money(d.totalRevenue)}</b></div></div>`}
function printIndividualReport(){const d=selectedIndividualData();if(!d)return toast('Selecione um colaborador');printReportDocument(`Desempenho - ${d.person.name}`,`Desempenho Individual • ${d.person.name} • ${d.label}`,individualReportHtml(d))}
function exportIndividualExcel(){
 const d=selectedIndividualData();if(!d)return toast('Selecione um colaborador');
 const diff=d.realized-d.meta;
 const sheets=[
  {name:'Resumo',headers:['Indicador','Valor'],widths:[24,24],rows:[['Colaborador',d.person.name],['Equipe',d.person.team||''],['Período',d.label],['Meta',d.meta],['Realizado',d.realized],['Atingimento %',d.ating],['Diferença',diff],['Posição',d.pos||0],['Lançamentos',d.hist.length],['Quantidade total',d.totalQty],['Receita total',d.totalRevenue]]},
  {name:'Vendas por produto',headers:['Produto','Qtd/Valor','Receita','Lançamentos'],widths:[30,16,16,14],rows:d.rows.map(r=>[r.name,Number(r.qty||0),Number(r.revenue||0),Number(r.count||0)])},
  {name:'Lancamentos',headers:['Data','Produto','Qtd/Valor','Receita'],widths:[22,30,16,16],rows:d.hist.map(h=>[new Date(h.createdAt).toLocaleString('pt-BR'),h.productName||'',Number(h.qty||0),Number(h.revenue||0)])}
 ];
 downloadXlsx(`Desempenho-${fileSafe(d.person.name)}-${fileSafe(d.label)}.xlsx`,sheets);
 toast('Desempenho individual exportado em .xlsx ✓');
}

function renderIndividual(){
 const keys=Object.keys(data.monthlySnapshots||{}).sort((a,b)=>String(data.monthlySnapshots[b]?.closedAt||'').localeCompare(String(data.monthlySnapshots[a]?.closedAt||'')));
 const oldPeriod=document.getElementById('individualPeriod')?.value||'__current__';
 const oldPerson=document.getElementById('individualPerson')?.value||'';
 const src=reportSource(oldPeriod), label=oldPeriod==='__current__'?`${data.company.month} • em andamento`:oldPeriod;
 const people=[...(src.people||[])].filter(p=>p.active!==false||Number(p.realized||0)>0).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 const person=people.find(p=>p.name===oldPerson)||people[0];
 if(!person){
  app.innerHTML=shell(`<div class="card admin-card"><div class="section-title"><span>Desempenho Individual</span><small>consulta por colaborador</small></div><div class="empty-history">Nenhum colaborador cadastrado para este período.</div></div>`,'individual');return;
 }
 const meta=Number(person.meta||0),realized=Number(person.realized||0),ating=pct(realized,meta),diff=realized-meta;
 const hist=(src.productionHistory||[]).filter(h=>h.personName===person.name);
 const rows=individualProductRows(src,person.name);
 const ranked=[...(src.people||[])].filter(p=>p.active!==false).sort((a,b)=>Number(b.realized||0)-Number(a.realized||0));
 const pos=ranked.findIndex(p=>p.name===person.name)+1;
 const products=(src.products||[]);
 const productBody=rows.length?rows.map(r=>{const def=products.find(p=>p.name===r.name),display=def?.money?money(r.qty):num(r.qty);return `<tr><td><b>${r.name}</b></td><td>${display}</td><td>${money(r.revenue)}</td><td>${r.count}</td></tr>`}).join(''):'<tr><td colspan="4">Nenhum lançamento registrado para este colaborador neste período.</td></tr>';
 const launchBody=hist.length?hist.map(h=>`<tr><td>${new Date(h.createdAt).toLocaleString('pt-BR')}</td><td>${h.productName}</td><td>${num(h.qty)}</td><td>${money(h.revenue)}</td></tr>`).join(''):'<tr><td colspan="4">Sem lançamentos no histórico.</td></tr>';
 const gapLabel=meta<=0?'Meta a definir':diff>=0?'Acima da meta':'Falta para meta';
 const gapValue=meta<=0?'A definir':money(Math.abs(diff));
 app.innerHTML=shell(`<div class="card admin-card individual-head"><div class="section-title"><span>Desempenho Individual</span><small>visão detalhada por colaborador</small></div><div class="individual-export-actions"><button class="btn" onclick="printIndividualReport()">Imprimir / Salvar PDF</button><button class="btn" onclick="exportIndividualExcel()">Exportar Excel</button></div><div class="individual-filters"><div class="field"><label>Período</label><select id="individualPeriod" onchange="renderIndividual()"><option value="__current__" ${oldPeriod==='__current__'?'selected':''}>${data.company.month} • em andamento</option>${keys.map(k=>`<option value="${k}" ${oldPeriod===k?'selected':''}>${k} • fechado</option>`).join('')}</select></div><div class="field"><label>Colaborador</label><select id="individualPerson" onchange="renderIndividual()">${people.map(p=>`<option value="${p.name.replace(/"/g,'&quot;')}" ${p.name===person.name?'selected':''}>${p.name}</option>`).join('')}</select></div></div><div class="individual-person"><div><span class="individual-avatar">${person.name.trim().charAt(0).toUpperCase()}</span><div><h2>${person.name}</h2><p>${person.team||'Sem equipe'} • ${label}</p></div></div><span class="individual-rank">${pos?`${pos}º por realizado`:'Sem posição'}</span></div></div>
 <div class="grid individual-kpis"><div class="card kpi"><div class="kpi-label">Meta individual</div><div class="kpi-value">${meta>0?money(meta):'A definir'}</div><div class="kpi-sub">Objetivo do período</div></div><div class="card kpi"><div class="kpi-label">Realizado</div><div class="kpi-value">${money(realized)}</div><div class="kpi-sub">Total vendido</div></div><div class="card kpi"><div class="kpi-label">Atingimento</div><div class="kpi-value" style="color:${meta>0?colorFor(ating):'#9b96b6'}">${meta>0?ating.toFixed(1)+'%':'A definir'}</div>${meta>0?progress(ating):'<div class="kpi-sub">Preencha a meta individual</div>'}</div><div class="card kpi"><div class="kpi-label">${gapLabel}</div><div class="kpi-value">${gapValue}</div><div class="kpi-sub">${hist.length} lançamento(s) no período</div></div></div>
 <div class="grid individual-grid"><div class="card admin-card"><div class="section-title"><span>Vendas por produto</span><small>o que ${person.name} vendeu</small></div><div class="table-wrap"><table class="table-admin"><thead><tr><th>Produto</th><th>Qtd./Valor</th><th>Receita</th><th>Lançamentos</th></tr></thead><tbody>${productBody}</tbody></table></div></div><div class="card admin-card individual-summary"><div class="section-title">Resumo</div><div class="individual-summary-row"><span>Colaborador</span><b>${person.name}</b></div><div class="individual-summary-row"><span>Equipe</span><b>${person.team||'-'}</b></div><div class="individual-summary-row"><span>Período</span><b>${label}</b></div><div class="individual-summary-row"><span>Total de lançamentos</span><b>${hist.length}</b></div><div class="individual-summary-row"><span>Posição por realizado</span><b>${pos?pos+'º':'-'}</b></div><div class="individual-summary-row"><span>Status da meta</span><b style="color:${meta>0?colorFor(ating):'#9b96b6'}">${meta>0?ating.toFixed(1)+'%':'A definir'}</b></div></div></div>
 <div class="card admin-card history-card"><div class="section-title"><span>Histórico do colaborador</span><small>${hist.length} lançamento(s)</small></div><div class="table-wrap"><table class="table-admin"><thead><tr><th>Data</th><th>Produto</th><th>Qtd./Valor</th><th>Receita</th></tr></thead><tbody>${launchBody}</tbody></table></div></div><div class="grid individual-kpis"><div class="card kpi"><div class="kpi-label">Quantidade total</div><div class="kpi-value">${num(hist.reduce((sum,h)=>sum+Number(h.qty||0),0))}</div><div class="kpi-sub">Soma das quantidades do período</div></div><div class="card kpi"><div class="kpi-label">Receita total</div><div class="kpi-value">${money(hist.reduce((sum,h)=>sum+Number(h.revenue||0),0))}</div><div class="kpi-sub">Soma de todas as receitas do período</div></div></div>`,'individual');
 setTimeout(()=>{const pe=document.getElementById('individualPeriod'),pp=document.getElementById('individualPerson');if(pe)pe.value=oldPeriod;if(pp)pp.value=person.name},0)
}

async function editYear(i,v){data.year[i]=Number(v||0);await save()}
async function updateCompany(){data.company.month=month.value;data.company.meta=+companyMeta.value;await save();renderMetas()}
async function clearDemoGoals(){if(!confirm('Isso vai limpar SOMENTE as metas atuais (empresa, produtos, times e colaboradores). Os nomes, times e realizados não serão apagados. Deseja continuar?'))return;data.company.meta=0;data.products.forEach(p=>p.meta=0);data.teams.forEach(t=>t.meta=0);data.people.forEach(p=>p.meta=0);await save();renderMetas();toast('Metas limpas • prontas para preencher ✓')}
async function resetRealized(){if(!confirm('Isso vai zerar todos os REALIZADOS e limpar o histórico de produção para iniciar um novo período. As metas, colaboradores, times e evolução anual serão mantidos. Deseja continuar?'))return;if(!confirm('Confirma novamente? Os realizados atuais serão zerados.'))return;data.company.realized=0;data.people.forEach(p=>p.realized=0);data.teams.forEach(t=>t.realized=0);data.products.forEach(p=>p.realized=0);data.productionHistory=[];await save();renderMetas();toast('Novo período iniciado ✓')}
function normalizeName(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase()}
function findProductIndexByName(name){const key=normalizeName(name);return data.products.findIndex(p=>normalizeName(p.name)===key)}
function applyProduction(h,sign=1){const pi=data.people.findIndex(p=>normalizeName(p.name)===normalizeName(h.personName)),pr=findProductIndexByName(h.productName);if(pi>=0)data.people[pi].realized=Number(data.people[pi].realized||0)+sign*Number(h.revenue||0);if(pr>=0){const product=data.products[pr];const productValue=product.money?Number(h.revenue||0):Number(h.qty||0);product.realized=Number(product.realized||0)+sign*productValue;}data.company.realized=Number(data.company.realized||0)+sign*Number(h.revenue||0);const team=h.teamName||(pi>=0?data.people[pi].team:'');const ti=data.teams.findIndex(t=>normalizeName(t.name)===normalizeName(team));if(ti>=0)data.teams[ti].realized=Number(data.teams[ti].realized||0)+sign*Number(h.revenue||0)}
async function launchProduction(){const pi=+personSel.value,pr=+productSel.value,rev=+(addRevenue.value||0),qty=+(addQty.value||0);if(!data.people[pi]||!data.products[pr])return toast('Selecione consultor e produto');const h={id:(crypto.randomUUID?crypto.randomUUID():Date.now().toString()),createdAt:new Date().toISOString(),personName:data.people[pi].name,teamName:data.people[pi].team,productName:data.products[pr].name,revenue:rev,qty};applyProduction(h,1);data.productionHistory.unshift(h);await save();renderProducao()}
async function deleteProduction(id){const h=data.productionHistory.find(x=>x.id===id);if(!h)return;if(!confirm(`Excluir o lançamento de ${h.personName} • ${h.productName}?`))return;applyProduction(h,-1);data.productionHistory=data.productionHistory.filter(x=>x.id!==id);await save();renderProducao()}
async function editProduction(id){const h=data.productionHistory.find(x=>x.id===id);if(!h)return;const rev=prompt('Receita produzida (R$):',h.revenue);if(rev===null)return;const qty=prompt('Quantidade / valor do produto:',h.qty);if(qty===null)return;const nr=Number(String(rev).replace(',','.')),nq=Number(String(qty).replace(',','.'));if(!Number.isFinite(nr)||!Number.isFinite(nq))return toast('Digite valores válidos');applyProduction(h,-1);h.revenue=nr;h.qty=nq;h.updatedAt=new Date().toISOString();applyProduction(h,1);await save();renderProducao()}
async function editPerson(i,k,v){data.people[i][k]=['meta','realized'].includes(k)?+v:v;await save()}
async function editTeam(i,k,v){const old=data.teams[i].name;data.teams[i][k]=['meta','realized'].includes(k)?+v:v;if(k==='name')data.people.forEach(p=>{if(p.team===old)p.team=v});await save()}
async function editProduct(i,k,v){data.products[i][k]=+v;await save()}
async function editProductField(i,k,v){
 const p=data.products[i];if(!p)return;
 if(k==='meta'||k==='realized'||k==='order')p[k]=Number(v||0);else if(k==='money'||k==='showOnTv')p[k]=Boolean(v);else p[k]=String(v).trim()||p[k];
 await save();
}
async function addProduct(){
 const name=prompt('Nome do novo produto:','');if(name===null)return;const clean=name.trim();if(!clean)return toast('Digite o nome do produto');
 if(data.products.some(p=>p.name.toLowerCase()===clean.toLowerCase()))return toast('Esse produto já existe');
 const isMoney=confirm('A meta e o realizado deste produto serão em R$?\nOK = R$ | Cancelar = quantidade');
 data.products.push({name:clean,meta:0,realized:0,color:'#8e45ff',money:isMoney,showOnTv:true,order:data.products.length});await save();renderProdutos();toast('Produto cadastrado ✓')
}
async function removeProduct(i){
 const p=data.products[i];if(!p)return;
 const hasHistory=(data.productionHistory||[]).some(h=>normalizeName(h.productName)===normalizeName(p.name));
 const msg=hasHistory?`${p.name} possui lançamentos no histórico. Excluir o produto da TV Torres não apaga o histórico antigo. Deseja continuar?`:`Excluir ${p.name} da TV Torres?`;
 if(!confirm(msg))return;data.products.splice(i,1);await save();renderProdutos();toast('Produto excluído da TV Torres ✓')
}
async function addPerson(){
 const name=prompt('Nome do novo colaborador:','');if(name===null)return;const clean=name.trim();if(!clean)return toast('Digite o nome do colaborador');
 if(data.people.some(p=>p.name.toLowerCase()===clean.toLowerCase()))return toast('Esse colaborador já existe');
 data.people.push({name:clean,team:data.teams[0]?.name||'',meta:0,realized:0,active:true,showOnTv:true,excludeFromTop3:false});await save();renderPessoas();toast('Colaborador cadastrado ✓')
}
async function removePerson(i){
 const p=data.people[i];if(!p)return;
 const hasHistory=(data.productionHistory||[]).some(h=>h.personName===p.name);
 if(hasHistory){if(!confirm(`${p.name} possui lançamentos no histórico. Em vez de apagar, recomendamos desativar. Deseja desativar agora?`))return;p.active=false;await save();renderPessoas();return toast('Colaborador desativado ✓')}
 if(!confirm(`Excluir ${p.name} do cadastro?`))return;data.people.splice(i,1);await save();renderPessoas();toast('Colaborador excluído ✓')
}
async function addTeam(){
 const name=prompt('Nome do novo time:','');if(name===null)return;const clean=name.trim();if(!clean)return toast('Digite o nome do time');
 if(data.teams.some(t=>t.name.toLowerCase()===clean.toLowerCase()))return toast('Esse time já existe');
 const supervisor=prompt('Nome do supervisor:','')||'';data.teams.push({name:clean,supervisor:supervisor.trim(),meta:0,realized:0});await save();renderTimes();toast('Time cadastrado ✓')
}
async function removeTeam(i){
 const t=data.teams[i];if(!t)return;const linked=data.people.filter(p=>p.team===t.name);
 if(linked.length)return alert(`Não é possível excluir ${t.name} porque há ${linked.length} colaborador(es) vinculado(s). Mude essas pessoas para outro time primeiro.`);
 if(!confirm(`Excluir o time ${t.name}?`))return;data.teams.splice(i,1);await save();renderTimes();toast('Time excluído ✓')
}
function go(view){const url=new URL(location.href);url.searchParams.set('view',view);history.pushState({},'',url);render(view)}
function render(view){view=view||'admin';if(view==='torres')return renderTorres();if(view==='equipe')return renderEquipe();if(ADMIN_VIEWS.has(view)&&!authToken())return renderLogin();if(ADMIN_VIEWS.has(view)&&authToken()&&!dashboardAccess)return renderAccessDenied();if(isDashboardViewer()&&!VIEWER_VIEWS.has(view))view='admin';if(view==='producao')renderProducao();else if(view==='metas')renderMetas();else if(view==='produtos')renderProdutos();else if(view==='pessoas')renderPessoas();else if(view==='individual')renderIndividual();else if(view==='times')renderTimes();else if(view==='relatorios')renderRelatorios();else if(view==='configuracoes')renderConfiguracoes();else renderAdmin()}
async function bootstrap(){
 const local=localLoad();if(local)data=normalizeData(local);
 if(authSession()){const ok=await ensureAuth();if(ok)await loadDashboardAccess();}
 const remote=await remoteLoad();if(remote){data=normalizeData(remote);localSave();lastRemoteJson=JSON.stringify(data)}
 const initial=new URLSearchParams(location.search).get('view')||'admin';render(initial);
 if(remoteEnabled){setInterval(async()=>{const r=await remoteLoad();if(!r)return;const normalized=normalizeData(r),s=JSON.stringify(normalized);if(s!==lastRemoteJson){lastRemoteJson=s;data=normalized;localSave();const view=new URLSearchParams(location.search).get('view')||'admin';if(['torres','equipe'].includes(view))render(view)}},CONFIG.refreshMs||5000)}
}
window.addEventListener('popstate',()=>render(new URLSearchParams(location.search).get('view')||'admin'));
bootstrap();
