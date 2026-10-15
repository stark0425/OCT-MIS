const seedData = [];
const CONFIG={url:window.SUPABASE_URL||"",key:window.SUPABASE_ANON_KEY||""};
let rows=[],supabaseClient=null;
const TARGET_NET=200000;
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const factorPct=r=>Math.round(Number(r.credit_factor??1)*100);
const creditFor=r=>Number(r.premium||0)*Number(r.credit_factor??1);
const netFor=r=>creditFor(r)/1.18;
const isCancelled=r=>Boolean(r.cancelled_from_net);
const netCountedFor=r=>isCancelled(r)?0:netFor(r);
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
  const {data,error}=await supabaseClient
  .from("business_oct")
  .select("*")
  .order("date", { ascending: false });
  if(error){console.error(error);$("syncStatus").textContent="● CLOUD ERROR";rows=[];return}
  rows=data||[];
}
async function saveRow(r){
  if(supabaseClient){
    const {error}=await supabaseClient.from("business_oct").insert([r]);
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
    const statusMatch=s==="ALL"||(s==="CANCELLED"?isCancelled(r):!isCancelled(r)&&r.status===s);
    return dateMatch&&(e==="ALL"||r.employee===e)&&statusMatch&&(f==="ALL"||factorPct(r)===Number(f))&&searchMatch;
  });
}
function render(){
  const data=filtered(),gross=data.reduce((a,r)=>a+Number(r.premium||0),0),credit=data.reduce((a,r)=>a+creditFor(r),0),net=data.reduce((a,r)=>a+netCountedFor(r),0);
  $("gross").textContent=money(gross);$("credit").textContent=money(credit);$("net").textContent=money(net);$("avg").textContent=money(data.length?gross/data.length:0);$("dealCount").textContent=`${data.length} deals`;
  $("monthTitle").textContent=new Date(monthKey()+"-01").toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  $("issuedCount").textContent=data.filter(r=>!isCancelled(r)&&r.status==="ISSUED").length;
  $("pendingCount").textContent=data.filter(r=>!isCancelled(r)&&(r.status==="PENDING"||r.status==="LOGIN")).length;
  $("rejectedCount").textContent=data.filter(r=>!isCancelled(r)&&r.status==="REJECTED").length;
  $("cancelledCount").textContent=data.filter(isCancelled).length;
  const totals={};data.forEach(r=>totals[r.employee]=(totals[r.employee]||0)+Number(r.premium||0));
  const ranked=EMPLOYEE_MASTER.map(n=>[n,data.filter(r=>r.employee===n).reduce((a,r)=>a+netCountedFor(r),0)]).sort((a,b)=>b[1]-a[1]);
  $("topValue").textContent=ranked.length?`${ranked[0][0]} · ${money(ranked[0][1])} net`:"per business";
  renderLeaderboard(data,ranked);renderBars(data);renderFactorMix(data);renderLedger(data);
}
function renderLeaderboard(data,ranked){
  const list=ranked.map(([n])=>({name:n,net:data.filter(r=>r.employee===n).reduce((a,r)=>a+netCountedFor(r),0)}));
  $("leaderboard").innerHTML='<div class="leader">'+list.map((item,i)=>{
    const pending=Math.max(0,TARGET_NET-item.net),pct=Math.min(100,item.net/TARGET_NET*100);
    return `<div class="leader-row target-row"><div class="rank">${String(i+1).padStart(2,"0")}</div><div><div class="name">${esc(item.name)}</div><div class="bar"><i style="width:${Math.max(0,pct)}%"></i></div><div class="target-meta">Target ${money(TARGET_NET)} · ${pct.toFixed(1)}% achieved</div></div><div class="employee-stats"><div class="amount">${money(item.net)}</div><div class="count">Net achieved</div><div class="pending-amount">${money(pending)}</div><div class="count">Pending to target</div></div></div>`;
  }).join("")+'</div>';
}
function renderBars(data){
  const [y,mo]=monthKey().split("-").map(Number),days=new Date(y,mo,0).getDate(),vals=Array.from({length:days},(_,i)=>data.filter(r=>r.date&&Number(r.date.slice(8,10))===i+1).reduce((a,r)=>a+netCountedFor(r),0)),mx=Math.max(...vals,1);
  $("dailyBars").innerHTML=vals.map((v,i)=>`<div class="barcol" title="${i+1} — ${money(v)} net"><i style="height:${Math.max(3,v/mx*175)}px"></i><span>${[1,5,10,15,20,25,days].includes(i+1)?i+1:""}</span></div>`).join("");
}
function renderFactorMix(data){
  const factors=[40,50,75,90,100];
  $("factorMix").innerHTML=factors.map(p=>{const d=data.filter(r=>factorPct(r)===p),v=d.reduce((a,r)=>a+Number(r.premium||0),0);return `<div class="factor"><b>${p}%</b><span>${d.length} deals · ${money(v)}</span><i style="opacity:${d.length?1:.3}"></i></div>`}).join("");
}
function renderLedger(data){
  $("ledger").innerHTML=data.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(r=>`<tr class="${isCancelled(r)?"cancelled-row":""}">
    <td><b>${esc(r.employee)}</b></td><td>${r.date||"—"}</td>
    <td><b>${esc(r.customer||"—")}</b><span class="sub">${esc(r.plan||"")}</span></td>
    <td>${esc(r.mobile||"—")}</td><td>${esc(r.application||"—")}</td><td>${esc(r.sum_insured||"—")}</td>
    <td>${esc(r.plan||"—")}</td><td>${esc(r.addon||"—")}</td><td>${esc(r.location||"—")}</td>
    <td><span class="badge ${isCancelled(r)?"cancelled-badge":""}">${isCancelled(r)?"CANCELLED — EXCLUDED FROM NET":esc(r.status||"—")}</span></td>
    <td class="money">${money(r.premium)}</td><td class="factor-badge">${factorPct(r)}%</td><td class="money credit">${money(creditFor(r))}</td><td class="money net">${money(netCountedFor(r))}</td>
    <td><button class="row-action ${isCancelled(r)?"restore-action":"cancel-action"}" data-id="${esc(r.id??"")}" data-action="${isCancelled(r)?"restore":"cancel"}">${isCancelled(r)?"Restore to Net":"Cancel for Net"}</button></td>
  </tr>`).join("")||'<tr><td colspan="15" style="text-align:center;color:#71809a;padding:30px">No matching transactions.</td></tr>';
  document.querySelectorAll(".row-action").forEach(btn=>btn.addEventListener("click",()=>toggleCancelled(btn.dataset.id,btn.dataset.action)));
}
async function toggleCancelled(id,action){
  const row=rows.find(r=>String(r.id??"")===String(id));
  if(!row)return alert("This transaction has no row ID. Refresh and try again.");
  const next=action==="cancel";
  const msg=next
    ?"Mark this policy as cancelled for net business? Gross business will remain counted, but its net business will be excluded."
    :"Restore this policy to net business? Its net amount will be counted again.";
  if(!confirm(msg))return;
  if(supabaseClient){
    const {error}=await supabaseClient.from("business_oct").update({cancelled_from_net:next}).eq("id",row.id);
    if(error){alert("Could not update cancellation status: "+error.message+"\nPlease confirm the Supabase SQL migration has been run.");return}
    await loadCloud();
  }else{
    row.cancelled_from_net=next;localStorage.setItem("oct_mis_rows",JSON.stringify(rows));
  }
  render();
}
function setupEvents(){
  ["employeeFilter","statusFilter","factorFilter","monthFilter"].forEach(id=>$(id).addEventListener("change",render));
  $("search").addEventListener("input",render);
  $("refreshBtn").onclick=async()=>{if(supabaseClient)await loadCloud();setupEmployees();render()};
  $("addBtn").onclick=()=>$("businessModal").showModal();
  $("closeModalBtn").onclick=()=>$("businessModal").close();
  ["fPremium","fFactor"].forEach(id=>$(id).addEventListener("input",updateCalc));
  $("fLocation").addEventListener("change",()=>{const map={"ALL":"1","CAT B 90%":".9","CAT B 75%":".75","CAT B 50%":".5","CAT A 40%":".4"};$("fFactor").value=map[$("fLocation").value]||"1";updateCalc()});
  $("businessForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const r={employee:$("fEmployee").value,date:$("fDate").value,customer:$("fCustomer").value.trim(),mobile:$("fMobile").value.trim(),application:$("fApp").value.trim(),premium:Number($("fPremium").value),sum_insured:$("fSI").value.trim(),plan:$("fPlan").value.trim(),addon:$("fAddon").value.trim(),status:$("fStatus").value,location:$("fLocation").value,credit_factor:Number($("fFactor").value),cancelled_from_net:false};
    if(!r.customer||!r.premium)return alert("Customer name and premium are required.");
    if(!r.date.startsWith("2026-10"))return alert("This October MIS is for October 2026. Please select an October date.");
    const ok=await saveRow(r);if(ok){$("businessModal").close();e.target.reset();$("fDate").value="2026-10-01";$("fFactor").value="1";render();updateCalc()}
  });
  $("exportBtn").onclick=exportCSV;
}
function updateCalc(){const f=Number($("fFactor").value||1),p=Number($("fPremium").value||0);$("factorPreview").textContent=Math.round(f*100)+"%";$("creditPreview").textContent=money(p*f);$("netPreview").textContent=money(p*f/1.18)}
function exportCSV(){
  const data=filtered();const headers=["Employee","Date","Customer","Mobile","Application","Premium/Gross","Sum Insured","Plan","Add-On","Status","Location/Category","Factor","Credit","Net Ex-GST Counted","Cancelled From Net"];
  const lines=[headers,...data.map(r=>[r.employee,r.date,r.customer,r.mobile,r.application,r.premium,r.sum_insured,r.plan,r.addon,isCancelled(r)?"CANCELLED FROM NET":r.status,r.location,factorPct(r),creditFor(r),netCountedFor(r),isCancelled(r)?"YES":"NO"])].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(","));
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`October_2026_MIS_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
}
init();
