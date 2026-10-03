const seedData = [
  {id:"seed-1",employee:"RAJAN",date:"2026-09-01",customer:"NAVNEET AGARWAL",mobile:"8126988054",application:"821104835642",premium:35849,sum_insured:"10LAC",plan:"ASPIRE GOLD +",addon:"TIERED NETWORK",status:"ISSUED",location:"BIJNOR",credit_factor:1},
  {id:"seed-2",employee:"ROHIT",date:"2026-09-01",customer:null,mobile:"",application:"",premium:8972,sum_insured:"10LAC",plan:"ASPIRE GOLD +",addon:"-",status:"ISSUED",location:"AHMEDABAD",credit_factor:1},
  {id:"seed-3",employee:"RAJAN",date:"2026-09-02",customer:"PRAVEEN",mobile:"",application:"",premium:17909,sum_insured:"10LAC",plan:"ASPIRE GOLD +",addon:"TIERED NETWORK",status:"ISSUED",location:"PRAYAGRAJ",credit_factor:1},
  {id:"seed-4",employee:"PRINCE",date:"2026-09-02",customer:"DEEPAK KUMAR",mobile:"",application:"",premium:26432,sum_insured:"10LAC",plan:"ASPIRE GOLD +",addon:"-",status:"ISSUED",location:"PUNE",credit_factor:1},
  {id:"seed-5",employee:"ROHIT",date:"2026-09-02",customer:"VIJAY KUMAR YADAV",mobile:"7892865084",application:"",premium:19610,sum_insured:"10LAC",plan:"ASPIRE GOLD +",addon:"TIERED NETWORK",status:"ISSUED",location:"GUJRAT",credit_factor:1},
  {id:"seed-6",employee:"RAJAN",date:"2026-09-02",customer:"SONALI",mobile:"8624910864",application:"",premium:19528,sum_insured:"10LAC",plan:"ASPIRE GOLD +",addon:"TIERED NETWORK",status:"ISSUED",location:"PUNE",credit_factor:1},
  {id:"seed-7",employee:"PRINCE",date:"2026-09-03",customer:"SUDHAKAR KUMAR",mobile:"9984266096",application:"",premium:17909,sum_insured:"10LAC",plan:"ASPIRE GOLD +",addon:"TIERED NETWORK",status:"ISSUED",location:"LUCKNOW",credit_factor:1},
  {id:"seed-8",employee:"PRINCE",date:"2026-09-04",customer:"KAMAL HASSAN",mobile:"9706790767",application:"",premium:11498,sum_insured:"10LAC",plan:"ULTIMATE CARE",addon:"-",status:"ISSUED",location:"ASSAM",credit_factor:1},
  {id:"seed-9",employee:"RAJAN",date:null,customer:null,mobile:"",application:"",premium:33048,sum_insured:null,plan:null,addon:null,status:"ISSUED",location:null,credit_factor:1},
  {id:"seed-10",employee:"KAIF",date:null,customer:null,mobile:"",application:"",premium:25939,sum_insured:null,plan:null,addon:null,status:"ISSUED",location:null,credit_factor:1},
  {id:"seed-11",employee:"KAIF",date:null,customer:null,mobile:"",application:"",premium:36338,sum_insured:null,plan:null,addon:null,status:"ISSUED",location:null,credit_factor:1},
  {id:"seed-12",employee:"HIMANSHU",date:null,customer:null,mobile:"",application:"",premium:52487,sum_insured:null,plan:null,addon:null,status:"ISSUED",location:null,credit_factor:1},
  {id:"seed-13",employee:"KAVYANSH",date:null,customer:null,mobile:"",application:"",premium:22546,sum_insured:null,plan:null,addon:null,status:"ISSUED",location:null,credit_factor:1},
  {id:"seed-14",employee:"ROHIT",date:null,customer:null,mobile:"",application:"",premium:39702,sum_insured:null,plan:null,addon:null,status:"ISSUED",location:null,credit_factor:1},
  {id:"seed-15",employee:"NIKHIL",date:null,customer:null,mobile:"",application:"",premium:30371,sum_insured:null,plan:null,addon:null,status:"ISSUED",location:null,credit_factor:1}
];

const CONFIG={url:window.SUPABASE_URL||"",key:window.SUPABASE_ANON_KEY||""};
let rows=[],supabaseClient=null;
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const factorPct=r=>Math.round(Number(r.credit_factor??1)*100);
const creditFor=r=>Number(r.premium||0)*Number(r.credit_factor??1);
const netFor=r=>creditFor(r)/1.18;
const monthKey=()=>$("monthFilter").value||"2026-10";

async function init(){
  if(CONFIG.url&&CONFIG.key){
    supabaseClient=window.supabase.createClient(CONFIG.url,CONFIG.key);
    $("syncStatus").textContent="● CLOUD SYNC"; await loadCloud();
  }else{
    $("syncStatus").textContent="LOCAL DEMO";
    rows=JSON.parse(localStorage.getItem("oct_mis_rows")||"null")||seedData;
    localStorage.setItem("oct_mis_rows",JSON.stringify(rows));
  }
  setupEmployees(); $("fDate").value="2026-10-01"; render(); setupEvents(); updateCalc();
}
async function loadCloud(){
  const {data,error}=await supabaseClient.from("business").select("*").order("date",{ascending:false}).order("created_at",{ascending:false});
  if(error){console.error(error);$("syncStatus").textContent="● CLOUD ERROR";rows=seedData;return}
  rows=data||[];
}
async function saveRow(r){
  if(supabaseClient){
    const {error}=await supabaseClient.from("business").insert([r]);
    if(error){alert("Could not save to cloud: "+error.message);return false}
    await loadCloud();return true;
  }
  r.id="local-"+Date.now(); rows.unshift(r);localStorage.setItem("oct_mis_rows",JSON.stringify(rows));return true;
}
const EMPLOYEE_MASTER=["HIMANSHU","RAJAN","ROHIT","AKASH","KAIF","NIKHIL","KAVYANSH","PRINCE","SUMAN"];
function setupEmployees(){
  const emps=EMPLOYEE_MASTER.slice();
  $("employeeFilter").innerHTML='<option value="ALL">All Employees</option>'+emps.map(e=>`<option>${esc(e)}</option>`).join("");
  $("fEmployee").innerHTML=emps.map(e=>`<option>${esc(e)}</option>`).join("");
}
function filtered(){
  const e=$("employeeFilter").value,s=$("statusFilter").value,q=$("search").value.toLowerCase().trim(),f=$("factorFilter").value,m=monthKey();
  return rows.filter(r=>{
    const dateMatch=r.date&&r.date.startsWith(m);
    const searchMatch=!q||[r.employee,r.customer,r.application,r.plan,r.location,r.mobile,r.sum_insured,r.addon].join(" ").toLowerCase().includes(q);
    return dateMatch&&(e==="ALL"||r.employee===e)&&(s==="ALL"||r.status===s)&&(f==="ALL"||factorPct(r)===Number(f))&&searchMatch;
  });
}
function render(){
  const data=filtered(),gross=data.reduce((a,r)=>a+Number(r.premium||0),0),credit=data.reduce((a,r)=>a+creditFor(r),0),net=data.reduce((a,r)=>a+netFor(r),0);
  $("gross").textContent=money(gross);$("credit").textContent=money(credit);$("net").textContent=money(net);$("avg").textContent=money(data.length?gross/data.length:0);$("dealCount").textContent=`${data.length} deals`;
  $("monthTitle").textContent=new Date(monthKey()+"-01").toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  $("issuedCount").textContent=data.filter(r=>r.status==="ISSUED").length;
  $("pendingCount").textContent=data.filter(r=>r.status==="PENDING"||r.status==="LOGIN").length;
  $("rejectedCount").textContent=data.filter(r=>r.status==="REJECTED").length;
  const totals={};data.forEach(r=>totals[r.employee]=(totals[r.employee]||0)+Number(r.premium||0));
  const ranked=Object.entries(totals).sort((a,b)=>b[1]-a[1]);$("topValue").textContent=ranked.length?`${ranked[0][0]} · ${money(ranked[0][1])}`:"per business";
  renderLeaderboard(data,ranked);renderBars(data);renderFactorMix(data);renderLedger(data);
}
function renderLeaderboard(data,ranked){
  const max=ranked[0]?.[1]||1;
  $("leaderboard").innerHTML='<div class="leader">'+(ranked.length?ranked.map(([n,v],i)=>`<div class="leader-row"><div class="rank">${String(i+1).padStart(2,"0")}</div><div><div class="name">${esc(n)}</div><div class="bar"><i style="width:${Math.max(4,v/max*100)}%"></i></div></div><div class="amount">${money(v)}</div><div class="count">${data.filter(r=>r.employee===n).length}</div></div>`).join(""):'<div style="padding:30px;color:#71809a">No October business yet.</div>')+'</div>';
}
function renderBars(data){
  const [y,mo]=monthKey().split("-").map(Number),days=new Date(y,mo,0).getDate(),vals=Array.from({length:days},(_,i)=>data.filter(r=>r.date&&Number(r.date.slice(8,10))===i+1).reduce((a,r)=>a+Number(r.premium||0),0)),mx=Math.max(...vals,1);
  $("dailyBars").innerHTML=vals.map((v,i)=>`<div class="barcol" title="${i+1} — ${money(v)}"><i style="height:${Math.max(3,v/mx*175)}px"></i><span>${[1,5,10,15,20,25,days].includes(i+1)?i+1:""}</span></div>`).join("");
}
function renderFactorMix(data){
  const factors=[40,50,75,90,100];
  $("factorMix").innerHTML=factors.map(p=>{const d=data.filter(r=>factorPct(r)===p),v=d.reduce((a,r)=>a+Number(r.premium||0),0);return `<div class="factor"><b>${p}%</b><span>${d.length} deals · ${money(v)}</span><i style="opacity:${d.length?1:.3}"></i></div>`}).join("");
}
function renderLedger(data){
  $("ledger").innerHTML=data.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(r=>`<tr>
    <td><b>${esc(r.employee)}</b></td><td>${r.date||"—"}</td>
    <td><b>${esc(r.customer||"—")}</b><span class="sub">${esc(r.plan||"")}</span></td>
    <td>${esc(r.mobile||"—")}</td><td>${esc(r.application||"—")}</td><td>${esc(r.sum_insured||"—")}</td>
    <td>${esc(r.plan||"—")}</td><td>${esc(r.addon||"—")}</td><td>${esc(r.location||"—")}</td>
    <td><span class="badge">${esc(r.status||"—")}</span></td><td class="money">${money(r.premium)}</td>
    <td class="factor-badge">${factorPct(r)}%</td><td class="money credit">${money(creditFor(r))}</td><td class="money net">${money(netFor(r))}</td>
  </tr>`).join("")||'<tr><td colspan="14" style="text-align:center;color:#71809a;padding:30px">No matching October transactions.</td></tr>';
}
function setupEvents(){
  ["employeeFilter","statusFilter","factorFilter","monthFilter"].forEach(id=>$(id).addEventListener("change",render));
  $("search").addEventListener("input",render);
  $("refreshBtn").onclick=async()=>{if(supabaseClient)await loadCloud();setupEmployees();render()};
  $("addBtn").onclick=()=>{$("businessModal").showModal()};
  $("closeModalBtn").onclick=()=>{$("businessModal").close()};
  ["fPremium","fFactor"].forEach(id=>$(id).addEventListener("input",updateCalc));
  $("fLocation").addEventListener("change",()=>{const map={"ALL":"1","CAT B 90%":".9","CAT B 75%":".75","CAT B 50%":".5","CAT A 40%":".4"};$("fFactor").value=map[$("fLocation").value]||"1";updateCalc()});
  $("businessForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const r={employee:$("fEmployee").value,date:$("fDate").value,customer:$("fCustomer").value.trim(),mobile:$("fMobile").value.trim(),application:$("fApp").value.trim(),premium:Number($("fPremium").value),sum_insured:$("fSI").value.trim(),plan:$("fPlan").value.trim(),addon:$("fAddon").value.trim(),status:$("fStatus").value,location:$("fLocation").value,credit_factor:Number($("fFactor").value)};
    if(!r.customer||!r.premium)return alert("Customer name and premium are required.");
    if(!r.date.startsWith("2026-10"))return alert("This October MIS is for October 2026. Please select an October date.");
    const ok=await saveRow(r);if(ok){$("businessModal").close();e.target.reset();$("fDate").value="2026-10-01";$("fFactor").value="1";render();updateCalc()}
  });
  $("exportBtn").onclick=exportCSV;
}
function updateCalc(){const f=Number($("fFactor").value||1),p=Number($("fPremium").value||0);$("factorPreview").textContent=Math.round(f*100)+"%";$("creditPreview").textContent=money(p*f);$("netPreview").textContent=money(p*f/1.18)}
function exportCSV(){
  const data=filtered();const headers=["Employee","Date","Customer","Mobile","Application","Premium","Sum Insured","Plan","Add-On","Status","Location/Category","Factor","Credit","Net Ex-GST"];
  const lines=[headers,...data.map(r=>[r.employee,r.date,r.customer,r.mobile,r.application,r.premium,r.sum_insured,r.plan,r.addon,r.status,r.location,factorPct(r),creditFor(r),netFor(r)])].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(","));
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`October_2026_MIS_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
}
init();
