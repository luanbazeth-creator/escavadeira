/* 3ª Geração Terraplenagem — protótipo mobile-first.
   Nesta versão, os dados ficam no navegador. Login/permissões compartilhadas
   exigem Firebase Authentication + Cloud Firestore e regras de segurança. */
const KEY="terceira_geracao_mobile_v2";
const machineDefaults=[
 {id:"case-01",name:"CASE",code:"ESC-01",model:"CASE",meter:0,oilInterval:15000,lastOilAt:0,status:"Disponível"},
 {id:"hyundai-02",name:"Hyundai",code:"ESC-02",model:"Hyundai",meter:0,oilInterval:15000,lastOilAt:0,status:"Disponível"},
 {id:"sany-03",name:"Sany",code:"ESC-03",model:"Sany",meter:0,oilInterval:15000,lastOilAt:0,status:"Disponível"}
];
const defaults={clients:[],machines:machineDefaults,hours:[],maintenance:[],jobs:[],profile:{name:"Seja bem-vindo!"},acknowledgedOil:[]};
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){try{const saved=JSON.parse(localStorage.getItem(KEY));if(!saved)return clone(defaults);return {...clone(defaults),...saved,machines:(saved.machines?.length?saved.machines:clone(machineDefaults)).filter(m=>!String(m.name||"").toLowerCase().includes("caterpillar")),profile:{...defaults.profile,...saved.profile}}}catch{return clone(defaults)}}
let db=load(),activeFilter="",selectedClientId=null,toastTimer=null,pendingOilId=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
const num=v=>Number(v||0);
const dateNow=()=>new Date().toISOString().slice(0,10);
const dateBR=v=>{if(!v)return "—";const [y,m,d]=v.split("-");return `${d}/${m}/${y}`};
const fmtHours=v=>`${num(v).toLocaleString("pt-BR",{maximumFractionDigits:2})} h`;
const machine=id=>db.machines.find(m=>m.id===id);
const client=id=>db.clients.find(c=>c.id===id);
const machineLabel=id=>machine(id)?.name||"Máquina não definida";
const clientLabel=j=>client(j.clientId)?.name||j.clientName||"Cliente";
function save(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function notify(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400)}
function go(view){document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));$("view-"+view).classList.remove("hidden");document.querySelectorAll("[data-go]").forEach(b=>{if(b.classList.contains("bottom-link"))b.classList.toggle("active",b.dataset.go===view)});window.scrollTo({top:0,behavior:"smooth"});renderAll()}
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
function totalHours(){return db.hours.reduce((sum,h)=>sum+num(h.hours),0)}
function activeOilAlerts(){return db.machines.filter(m=>num(m.oilInterval)>0&&num(m.meter)-num(m.lastOilAt)>=num(m.oilInterval))}
function money(v){return num(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function statusClass(s){return "status-"+String(s||"").replaceAll(" ","-")}
function initials(name){return String(name||"?").trim().split(/\s+/).slice(0,2).map(p=>p[0]||"").join("").toUpperCase()}
function renderAll(){renderHome();renderClients();renderMachines();renderHours();renderMaintenance();renderProfile();checkOilAlerts()}
function renderHome(){
 $("greetingName").textContent=db.profile.name||"Seja bem-vindo!";
 $("homeClients").textContent=db.clients.length;
 $("homeHours").textContent=fmtHours(totalHours());
 $("homeMachines").textContent=db.machines.length;
 const alerts=activeOilAlerts();$("homeOilAlert").classList.toggle("hidden",!alerts.length);
 if(alerts.length)$("homeOilText").textContent=alerts.map(m=>m.name).join(", ")+" atingiu o intervalo de troca de óleo.";
 const jobs=[...db.jobs].sort((a,b)=>(b.endDate||b.date||"").localeCompare(a.endDate||a.date||"")).slice(0,4);
 $("recentJobs").innerHTML=jobs.length?jobs.map(j=>`<div class="recent-item"><span class="row-symbol">✓</span><div class="row-main"><b>${esc(clientLabel(j))}</b><small>${esc(machineLabel(j.machineId))} · ${esc(j.operator||"Operador não informado")}<br>${dateBR(j.startDate||j.date)}–${dateBR(j.endDate||j.date)} · ${fmtHours(j.hours)}</small></div><span class="status-badge ${statusClass(j.status)}">${esc(j.status)}</span></div>`).join(""):`<div class="empty-state">Nenhum atendimento registrado ainda.<br>Entre em Clientes e cadastre o primeiro serviço.</div>`;
}
function renderClients(){
 const q=($("clientSearch")?.value||"").toLowerCase();
 const list=db.clients.filter(c=>`${c.name} ${c.phone||""} ${c.notes||""} ${db.jobs.filter(j=>j.clientId===c.id).map(j=>machineLabel(j.machineId)+" "+(j.operator||"")).join(" ")}`.toLowerCase().includes(q)).filter(c=>!activeFilter||latestJob(c.id)?.status===activeFilter);
 $("clientsCards").innerHTML=list.length?list.map(c=>{
  const j=latestJob(c.id)||{},s=j.status||"Aguardando",pay=j.paymentMethod||"À vista";
  return `<article class="client-card"><div class="client-top"><div class="client-avatar">${esc(initials(c.name))}</div><div class="client-name-block"><h3>${esc(c.name)}</h3><button class="edit-under-name" data-edit-client="${c.id}">✎ Editar cliente</button></div><span class="status-badge ${statusClass(s)}">${esc(s)}</span></div><div class="client-meta"><div><span class="meta-label">MÁQUINA</span><span class="meta-value">${esc(j.machineId?machineLabel(j.machineId):"Não definida")}</span></div><div><span class="meta-label">OPERADOR</span><span class="meta-value">${esc(j.operator||"Não informado")}</span></div><div><span class="meta-label">HORAS DO SERVIÇO</span><span class="meta-value">${fmtHours(j.hours)}</span></div><div><span class="meta-label">PERÍODO DO SERVIÇO</span><span class="meta-value">${dateBR(j.startDate||j.date)} até ${dateBR(j.endDate||j.date)}</span></div><div><span class="meta-label">VALOR DO SERVIÇO</span><span class="meta-value">${money(j.totalValue||0)}</span></div></div><div class="status-line"><label for="status-${c.id}">Status do serviço</label><select id="status-${c.id}" data-status-client="${c.id}">${["Aguardando","Agendado","Atendido","Recusado"].map(v=>`<option ${s===v?"selected":""}>${v}</option>`).join("")}</select></div><div class="status-line" style="margin-top:8px"><label for="payment-${c.id}">Pagamento</label><select id="payment-${c.id}" data-payment-client="${c.id}"><option value="À vista" ${pay==="À vista"?"selected":""}>À vista</option><option value="Parcelado" ${pay==="Parcelado"?"selected":""}>Parcelado</option></select></div><div class="card-actions"><button class="small-action primary" data-profile-client="${c.id}">Ver perfil completo</button><button class="small-action" data-add-job="${c.id}">＋ Serviço</button></div></article>`
 }).join(""):`<div class="empty-state">Nenhum cliente encontrado.<br>Toque em “＋ Novo” para cadastrar o primeiro cliente.</div>`;
 document.querySelectorAll("[data-edit-client]").forEach(b=>b.onclick=()=>clientForm(b.dataset.editClient));
 document.querySelectorAll("[data-status-client]").forEach(s=>s.onchange=()=>{const c=client(s.dataset.statusClient);let j=latestJob(c.id);if(!j){j={id:uid(),clientId:c.id,clientName:c.name,date:dateNow(),status:s.value,hours:0};db.jobs.push(j)}else j.status=s.value;save();notify("Status do cliente atualizado.")});
 document.querySelectorAll("[data-payment-client]").forEach(el=>el.onchange=()=>{const c=client(el.dataset.paymentClient);let j=latestJob(c.id);if(!j){notify("Registre um serviço primeiro para configurar o pagamento.");renderClients();return}j.paymentMethod=el.value;if(el.value==="À vista"){j.installments=1;j.payments=[{number:1,amount:num(j.totalValue),dueDate:j.endDate||j.date||dateNow(),paid:!!j.payments?.[0]?.paid,paidDate:j.payments?.[0]?.paidDate||""}]}else{const rawCount=prompt("Em quantas vezes? (1 a 12)",String(j.installments||2));if(rawCount===null){renderClients();return}const parsed=parseInt(rawCount,10);if(!Number.isInteger(parsed)||parsed<1||parsed>12){notify("Escolha de 1 a 12 parcelas.");renderClients();return}const count=parsed;j.installments=count;const total=num(j.totalValue),base=Math.round((total/count)*100)/100;j.payments=Array.from({length:count},(_,i)=>{const d=new Date(`${j.endDate||j.date||dateNow()}T12:00:00`);d.setMonth(d.getMonth()+i+1);return {number:i+1,amount:i===count-1?Math.round((total-base*(count-1))*100)/100:base,dueDate:d.toISOString().slice(0,10),paid:false,paidDate:""}})}save();notify("Forma de pagamento atualizada.")});
 document.querySelectorAll("[data-profile-client]").forEach(b=>b.onclick=()=>showClientProfile(b.dataset.profileClient));
 document.querySelectorAll("[data-add-job]").forEach(b=>b.onclick=()=>jobForm(null,b.dataset.addJob));
}
function latestJob(clientId){return db.jobs.filter(j=>j.clientId===clientId).sort((a,b)=>(b.endDate||b.date||"").localeCompare(a.endDate||a.date||""))[0]}
function renderMachines(){
 $("machinesList").innerHTML=db.machines.map(m=>`<article class="machine-card"><div class="machine-head"><div class="machine-icon">🚜</div><div><h3>${esc(m.name)}</h3><p>${esc(m.code||"Sem código")} · ${esc(m.model||"Modelo não informado")}</p></div><span class="machine-badge">${esc(m.status||"Disponível")}</span></div><div class="machine-stats"><div class="machine-stat"><small>HORÍMETRO ATUAL</small><strong>${fmtHours(m.meter)}</strong></div><div class="machine-stat"><small>PRÓXIMA TROCA DE ÓLEO</small><strong>${fmtHours(num(m.lastOilAt)+num(m.oilInterval))}</strong></div></div><div class="machine-actions"><button class="small-action primary" data-edit-machine="${m.id}">Editar máquina</button><button class="small-action" data-machine-hours="${m.id}">＋ Lançar horas</button></div></article>`).join("")||`<div class="empty-state">Nenhuma máquina cadastrada.</div>`;
 document.querySelectorAll("[data-edit-machine]").forEach(b=>b.onclick=()=>machineForm(b.dataset.editMachine));
 document.querySelectorAll("[data-machine-hours]").forEach(b=>b.onclick=()=>hoursForm(null,b.dataset.machineHours));
}
function renderHours(){
 $("hoursGrandTotal").textContent=fmtHours(totalHours());$("hoursRecordCount").textContent=`${db.hours.length} registro(s)`;
 const rows=[...db.hours].sort((a,b)=>(b.endDate||b.date||"").localeCompare(a.endDate||a.date||""));
 $("hoursList").innerHTML=rows.length?rows.map(h=>`<article class="data-row"><span class="row-symbol">◷</span><div class="row-main"><b>${esc(client(h.clientId)?.name||"Cliente não vinculado")} · ${fmtHours(h.hours)}</b><small>${esc(machineLabel(h.machineId))} · ${dateBR(h.date)} · Operador: ${esc(h.operator||"—")}<br>Horímetro ${num(h.start).toLocaleString("pt-BR")} → ${num(h.end).toLocaleString("pt-BR")}${h.notes?`<br>${esc(h.notes)}`:""}</small></div><button class="small-action" data-delete-hours="${h.id}">Excluir</button></article>`).join(""):`<div class="empty-state">Ainda não há horas registradas.<br>Use “Registrar horas” para lançar o horímetro.</div>`;
 document.querySelectorAll("[data-delete-hours]").forEach(b=>b.onclick=()=>remove("hours",b.dataset.deleteHours,"registro de horas"));
}
function renderMaintenance(){
 const alerts=activeOilAlerts();
 $("oilAlerts").innerHTML=alerts.map(m=>`<article class="oil-warning"><h3>⚠ Troca de óleo pendente — ${esc(m.name)}</h3><p>Horímetro atual: ${fmtHours(m.meter)}. Intervalo configurado: ${fmtHours(m.oilInterval)} desde a última troca em ${fmtHours(m.lastOilAt)}.</p><button data-oil-ack="${m.id}">Ver alerta</button> <button data-oil-done="${m.id}">Registrar troca realizada</button></article>`).join("");
 document.querySelectorAll("[data-oil-ack]").forEach(b=>b.onclick=()=>showOilAlert(machine(b.dataset.oilAck)));
 document.querySelectorAll("[data-oil-done]").forEach(b=>b.onclick=()=>recordOilChange(b.dataset.oilDone));
 const rows=[...db.maintenance].sort((a,b)=>(b.endDate||b.date||"").localeCompare(a.endDate||a.date||""));
 $("maintenanceList").innerHTML=rows.length?rows.map(m=>`<article class="maintenance-card"><h3>${esc(m.type)} · ${esc(machineLabel(m.machineId))}</h3><p>${dateBR(m.date)} · ${m.quantity?esc(m.quantity)+" "+esc(m.unit||"L")+" · ":""}${m.meter?fmtHours(m.meter)+" · ":""}${esc(m.notes||"Sem observações")}</p></article>`).join(""):`<div class="empty-state">Nenhum registro de manutenção.<br>Registre as trocas para atualizar os alertas da frota.</div>`;
}
function renderProfile(){$("userName").value=db.profile.name||""}
function checkOilAlerts(){
 const alerts=activeOilAlerts();$("notificationDot").style.display=alerts.length?"block":"none";
 const unseen=alerts.find(m=>!db.acknowledgedOil.includes(m.id));if(unseen&&!$("oilDialog").open)showOilAlert(unseen);
}
function showOilAlert(m){if(!m)return;pendingOilId=m.id;$("oilDialogTitle").textContent=`Hora de trocar o óleo — ${m.name}`;$("oilDialogText").textContent=`O horímetro de ${m.name} chegou a ${fmtHours(m.meter)}. O intervalo de troca configurado é ${fmtHours(m.oilInterval)}.`;if(!$("oilDialog").open)$("oilDialog").showModal()}
$("ackOilBtn").onclick=()=>{if(pendingOilId&&!db.acknowledgedOil.includes(pendingOilId))db.acknowledgedOil.push(pendingOilId);$("oilDialog").close();save();notify("Aviso confirmado. Registre a troca quando o serviço for realizado.")};
function recordOilChange(machineId){const m=machine(machineId);if(!m)return;const rec={id:uid(),machineId,type:"Troca de óleo",date:dateNow(),meter:num(m.meter),quantity:"",unit:"L",notes:"Troca registrada"};db.maintenance.push(rec);m.lastOilAt=num(m.meter);db.acknowledgedOil=db.acknowledgedOil.filter(x=>x!==machineId);save();notify("Troca registrada; próximo alerta atualizado.")}
function field(name,label,type="text",options={}){let input="";if(type==="select")input=`<select name="${name}" ${options.required?"required":""}>${(options.items||[]).map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join("")}</select>`;else if(type==="textarea")input=`<textarea name="${name}" placeholder="${esc(options.placeholder||"")}"></textarea>`;else input=`<input name="${name}" type="${type}" ${options.required?"required":""} ${options.min!==undefined?`min="${options.min}"`:""} ${options.step?`step="${options.step}"`:""} placeholder="${esc(options.placeholder||"")}">`;return `<div class="field${options.full?" full":""}"><label>${label}${options.required?" *":""}</label>${input}</div>`}
function openForm(title,markup,record,callback){$("modalTitle").textContent=title;$("modalFields").innerHTML=markup;for(const [k,v] of Object.entries(record||{})){const el=$("modalForm").elements.namedItem(k);if(el)el.value=v??""}const dlg=$("formDialog");$("modalForm").onsubmit=e=>{e.preventDefault();const obj=Object.fromEntries(new FormData($("modalForm")).entries());if(!callback(obj))return;dlg.close();save()};dlg.showModal()}
function clientForm(editId=null){const c=client(editId)||{};openForm(editId?"Editar cliente":"Novo cliente",field("name","Nome do cliente","text",{required:true,full:true})+field("phone","Telefone / WhatsApp","tel")+field("notes","Endereço ou observações","textarea",{full:true}),c,obj=>{if(!obj.name.trim()){notify("Informe o nome do cliente.");return false}if(c.id)Object.assign(c,obj);else db.clients.push({...obj,id:uid()});return true})}
function jobForm(jobId=null,clientId=null){
 const j=db.jobs.find(x=>x.id===jobId)||{};
 if(!db.clients.length){notify("Cadastre um cliente antes de registrar um serviço.");go("clientes");return}
 const machines=db.machines.map(m=>({value:m.id,label:m.name}));
 const paymentItems=[{value:"À vista",label:"À vista"},{value:"Parcelado",label:"Parcelado"}];
 const installItems=Array.from({length:12},(_,i)=>({value:String(i+1),label:`${i+1} vez(es)`}));
 const markup=field("clientId","Cliente","select",{required:true,items:db.clients.map(c=>({value:c.id,label:c.name}))})+
 field("machineId","Máquina","select",{required:true,items:machines})+
 field("operator","Nome do operador","text",{required:true,full:true})+
 field("startDate","Data inicial do serviço","date",{required:true})+
 field("meterStart","Horímetro inicial (h)","number",{required:true,min:0,step:"0.1"})+
 field("endDate","Data final do serviço","date",{required:true})+
 field("meterEnd","Horímetro final (h)","number",{required:true,min:0,step:"0.1"})+
 `<div class="field full"><label>Horas trabalhadas (calculado automaticamente)</label><input name="hoursDisplay" value="0 h" readonly><small style="color:#aab3c1">Horímetro final menos horímetro inicial.</small></div>`+
 field("hourlyRate","Valor por hora da máquina (R$)","number",{required:true,min:0,step:"0.01"})+
 `<div class="field full"><label>Valor total do serviço</label><input name="totalValueDisplay" value="R$ 0,00" readonly style="font-size:18px;font-weight:700;color:#8fc6ff"><small style="color:#aab3c1">Horas trabalhadas × valor da hora.</small></div>`+
 field("paymentMethod","Forma de pagamento","select",{required:true,items:paymentItems})+
 field("installments","Quantidade de parcelas","select",{items:installItems})+
 field("status","Status do serviço","select",{required:true,items:["Aguardando","Agendado","Atendido","Recusado"].map(v=>({value:v,label:v}))})+
 field("notes","Observações do serviço","textarea",{full:true});
 const defaultsJ={...j,clientId:clientId||j.clientId||"",startDate:j.startDate||j.date||dateNow(),endDate:j.endDate||j.date||dateNow(),meterStart:j.meterStart??0,meterEnd:j.meterEnd??0,hourlyRate:j.hourlyRate??0,paymentMethod:j.paymentMethod||"À vista",installments:j.installments||1,status:j.status||"Aguardando"};
 openForm(jobId?"Editar serviço":"Registrar serviço",markup,defaultsJ,obj=>{
  if(!obj.clientId||!obj.machineId){notify("Selecione o cliente e a máquina.");return false}
  const start=num(obj.meterStart),end=num(obj.meterEnd),rate=num(obj.hourlyRate);
  if(obj.endDate<obj.startDate){notify("A data final não pode ser anterior à data inicial.");return false}
  if(end<start){notify("O horímetro final não pode ser menor que o inicial.");return false}
  const hours=Math.round((end-start)*100)/100;
  const totalValue=Math.round(hours*rate*100)/100;
  const count=obj.paymentMethod==="Parcelado"?Math.min(12,Math.max(1,parseInt(obj.installments||"2",10))):1;
  const oldPayments=Array.isArray(j.payments)?j.payments:[];
  const payments=Array.from({length:count},(_,i)=>{const old=oldPayments[i];const d=new Date(`${obj.endDate}T12:00:00`);if(obj.paymentMethod==="Parcelado")d.setMonth(d.getMonth()+i+1);return {number:i+1,amount:Math.round((totalValue/count)*100)/100,dueDate:d.toISOString().slice(0,10),paid:!!old?.paid,paidDate:old?.paidDate||""}});
  if(count>1&&payments.length)payments[payments.length-1].amount=Math.round((totalValue-payments.slice(0,-1).reduce((sum,p)=>sum+p.amount,0))*100)/100;
  const item={...j,...obj,id:j.id||uid(),date:obj.startDate,startDate:obj.startDate,endDate:obj.endDate,meterStart:start,meterEnd:end,hours,hourlyRate:rate,totalValue,paymentMethod:obj.paymentMethod,installments:count,payments,clientName:client(obj.clientId)?.name||""};
  delete item.hoursDisplay;delete item.totalValueDisplay;
  if(j.id)db.jobs=db.jobs.map(x=>x.id===j.id?item:x);else db.jobs.push(item);
  const m=machine(item.machineId);if(m)m.meter=Math.max(num(m.meter),end);
  return true
 });
 const form=$("modalForm"),hoursEl=form.elements.namedItem("hoursDisplay"),totalEl=form.elements.namedItem("totalValueDisplay");
 const updateTotals=()=>{const a=num(form.elements.namedItem("meterStart")?.value),b=num(form.elements.namedItem("meterEnd")?.value),r=num(form.elements.namedItem("hourlyRate")?.value),h=Math.max(0,b-a);hoursEl.value=`${h.toLocaleString("pt-BR",{maximumFractionDigits:2})} h`;totalEl.value=money(h*r)};
 ["meterStart","meterEnd","hourlyRate"].forEach(n=>form.elements.namedItem(n)?.addEventListener("input",updateTotals));
 const payment=form.elements.namedItem("paymentMethod"),install=form.elements.namedItem("installments");
 const updateInstallments=()=>{install.closest(".field").style.display=payment.value==="Parcelado"?"grid":"none"};payment.addEventListener("change",updateInstallments);updateTotals();updateInstallments();
}
function machineForm(editId=null){const m=machine(editId)||{};openForm(editId?"Editar máquina":"Cadastrar máquina",field("name","Nome da máquina","text",{required:true})+field("code","Código interno","text")+field("model","Modelo","text")+field("meter","Horímetro atual (h)","number",{min:0,step:"0.1",required:true})+field("oilInterval","Intervalo de troca de óleo (h)","number",{min:0,step:"1",required:true})+field("lastOilAt","Horímetro da última troca (h)","number",{min:0,step:"0.1",required:true})+field("status","Situação","select",{items:["Disponível","Em operação","Em manutenção"].map(s=>({value:s,label:s}))}),{...m,meter:m.meter??0,oilInterval:m.oilInterval??15000,lastOilAt:m.lastOilAt??0,status:m.status||"Disponível"},obj=>{const item={...m,...obj,id:m.id||uid(),meter:num(obj.meter),oilInterval:num(obj.oilInterval),lastOilAt:num(obj.lastOilAt)};if(m.id)db.machines=db.machines.map(x=>x.id===m.id?item:x);else db.machines.push(item);return true})}
function hoursForm(machineId=null,clientId=null){if(!db.clients.length){notify("Cadastre um cliente antes de lançar horas.");go("clientes");return}openForm("Registrar horas para cliente",field("clientId","Cliente","select",{required:true,items:db.clients.map(c=>({value:c.id,label:c.name}))})+field("machineId","Máquina","select",{required:true,items:db.machines.map(m=>({value:m.id,label:m.name}))})+field("date","Data","date",{required:true})+field("operator","Nome do operador","text",{required:true})+field("start","Horímetro inicial (h)","number",{min:0,step:"0.1",required:true})+field("end","Horímetro final (h)","number",{min:0,step:"0.1",required:true})+field("notes","Observações","textarea",{full:true}),{clientId:clientId||db.clients[0]?.id||"",machineId:machineId||db.machines[0]?.id||"",date:dateNow()},obj=>{const start=num(obj.start),end=num(obj.end);if(end<start){notify("O horímetro final não pode ser menor que o inicial.");return false}const m=machine(obj.machineId);if(m&&start<num(m.meter)&&end<=num(m.meter)){notify("Confira o horímetro: esse lançamento parece anterior ao valor atual da máquina.");return false}db.hours.push({...obj,id:uid(),start,end,hours:Math.round((end-start)*100)/100});if(m)m.meter=Math.max(num(m.meter),end);return true})}
function maintenanceForm(){openForm("Registrar óleo / manutenção",field("machineId","Máquina","select",{required:true,items:db.machines.map(m=>({value:m.id,label:m.name}))})+field("type","Tipo de registro","select",{required:true,items:["Troca de óleo","Nível de óleo","Consumo de óleo","Manutenção preventiva","Manutenção corretiva","Outro"].map(s=>({value:s,label:s}))})+field("date","Data","date",{required:true})+field("quantity","Quantidade","number",{min:0,step:"0.1"})+field("unit","Unidade","select",{items:[{value:"L",label:"Litros"},{value:"un",label:"Unidades"},{value:"h",label:"Horas"}]})+field("meter","Horímetro do serviço (h)","number",{min:0,step:"0.1"})+field("notes","Observações","textarea",{full:true}),{date:dateNow(),unit:"L"},obj=>{const m=machine(obj.machineId);if(obj.type==="Troca de óleo"&&m){m.lastOilAt=num(obj.meter)||num(m.meter);db.acknowledgedOil=db.acknowledgedOil.filter(x=>x!==m.id)}db.maintenance.push({...obj,id:uid()});return true})}
function paymentSummary(j){const payments=Array.isArray(j.payments)?j.payments:[];if(!payments.length)return "Pagamento ainda não detalhado.";const paid=payments.filter(p=>p.paid).length;return `Parcelas pagas: ${paid}/${payments.length}`}
function managePayments(jobId){const j=db.jobs.find(x=>x.id===jobId);if(!j)return;const payments=Array.isArray(j.payments)?j.payments:[];if(!payments.length){notify("Este serviço ainda não tem parcelas registradas. Edite o serviço e salve novamente.");return}const options=payments.map(p=>`${p.number}. parcela — ${money(p.amount)} — vencimento ${dateBR(p.dueDate)} — ${p.paid?"PAGA em "+dateBR(p.paidDate):"PENDENTE"}`).join("\n");const pending=payments.filter(p=>!p.paid);if(!pending.length){notify("Todas as parcelas deste serviço já estão marcadas como pagas.");return}const chosen=prompt(`Parcelas do serviço:\n${options}\n\nDigite o número da parcela que o cliente pagou:`);if(chosen===null)return;const n=parseInt(chosen,10);const p=payments.find(x=>x.number===n);if(!p||p.paid){notify("Número de parcela inválido ou já pago.");return}const paidDate=prompt("Data em que o cliente pagou (AAAA-MM-DD):",dateNow());if(paidDate===null)return;if(!/^\d{4}-\d{2}-\d{2}$/.test(paidDate)){notify("Informe a data no formato AAAA-MM-DD.");return}p.paid=true;p.paidDate=paidDate;save();showClientProfile(j.clientId);notify(`Parcela ${n} marcada como paga.`)}
function showClientProfile(id){selectedClientId=id;const c=client(id);if(!c)return;const jobs=db.jobs.filter(j=>j.clientId===id).sort((a,b)=>(b.endDate||b.date||"").localeCompare(a.endDate||a.date||""));const clientHourRecords=db.hours.filter(h=>h.clientId===id).sort((a,b)=>(b.endDate||b.date||"").localeCompare(a.endDate||a.date||""));const hours=clientHourRecords.reduce((s,h)=>s+num(h.hours),0)+jobs.reduce((s,j)=>s+num(j.hours),0);$("clientProfileContent").innerHTML=`<div class="client-profile-hero"><span class="section-kicker">FICHA DO CLIENTE</span><h2>${esc(c.name)}</h2><p>${esc(c.phone||"Telefone não cadastrado")}</p><button class="edit-under-name" data-profile-edit="${c.id}">✎ Editar cliente</button></div><div class="profile-metrics"><div class="metric-box"><small>TOTAL DE HORAS DE SERVIÇO</small><strong>${fmtHours(hours)}</strong></div><div class="metric-box"><small>SERVIÇOS REGISTRADOS</small><strong>${jobs.length}</strong></div></div><div class="profile-section"><h3>Informações do cliente</h3><div class="machine-stat"><small>TELEFONE</small><strong>${esc(c.phone||"—")}</strong></div><div class="machine-stat" style="margin-top:8px"><small>OBSERVAÇÕES / LOCAL</small><strong>${esc(c.notes||"—")}</strong></div></div><div class="profile-section"><h3>Horas lançadas para este cliente</h3>${clientHourRecords.length?clientHourRecords.map(h=>`<div class="data-row" style="margin-bottom:8px"><span class="row-symbol">◷</span><div class="row-main"><b>${esc(machineLabel(h.machineId))} · ${fmtHours(h.hours)}</b><small>${dateBR(h.date)} · Operador: ${esc(h.operator||"—")}<br>Horímetro ${num(h.start).toLocaleString("pt-BR")} → ${num(h.end).toLocaleString("pt-BR")}${h.notes?`<br>${esc(h.notes)}`:""}</small></div></div>`).join(""):`<div class="empty-state">Nenhuma hora lançada diretamente para este cliente.</div>`}<button class="primary-button wide-button" data-profile-add-hours="${c.id}">＋ Lançar horas para este cliente</button></div><div class="profile-section"><h3>Serviços e máquinas</h3>${jobs.length?jobs.map(j=>`<div class="data-row" style="margin-bottom:8px"><span class="row-symbol">🚜</span><div class="row-main"><b>${esc(machineLabel(j.machineId))} · ${fmtHours(j.hours)}</b><small>${dateBR(j.startDate||j.date)} até ${dateBR(j.endDate||j.date)} · Operador: ${esc(j.operator||"—")}<br>Horímetro ${num(j.meterStart).toLocaleString("pt-BR")} → ${num(j.meterEnd).toLocaleString("pt-BR")} · ${fmtHours(j.hours)}<br>Hora: ${money(j.hourlyRate||0)} · Total: ${money(j.totalValue||0)}<br>Pagamento: ${esc(j.paymentMethod||"À vista")}${j.paymentMethod==="Parcelado"?` (${num(j.installments)||2}x)`:""}<br>${esc(j.notes||"Sem observações")}<br>${paymentSummary(j)}<button class="small-action primary" data-payments-job="${j.id}" style="margin-top:8px">Registrar pagamento</button></small></div><span class="status-badge ${statusClass(j.status)}">${esc(j.status)}</span></div>`).join(""):`<div class="empty-state">Nenhum serviço registrado para este cliente.</div>`}<button class="primary-button wide-button" data-profile-add-job="${c.id}" style="margin-top:12px">＋ Adicionar serviço</button></div>`;$("clientProfileContent").querySelector("[data-profile-edit]").onclick=()=>clientForm(c.id);$("clientProfileContent").querySelector("[data-profile-add-job]").onclick=()=>jobForm(null,c.id);$("clientProfileContent").querySelector("[data-profile-add-hours]").onclick=()=>hoursForm(null,c.id);document.querySelectorAll("[data-payments-job]").forEach(b=>b.onclick=()=>managePayments(b.dataset.paymentsJob));go("cliente-perfil")}
function remove(collection,id,label){if(!confirm(`Excluir este ${label}?`))return;db[collection]=db[collection].filter(x=>x.id!==id);save();notify(`${label[0].toUpperCase()+label.slice(1)} excluído.`)}
$("addClientBtn").onclick=()=>clientForm();$("addMachineBtn").onclick=()=>machineForm();$("addHoursBtn").onclick=()=>hoursForm();$("addMaintenanceBtn").onclick=()=>maintenanceForm();
$("clientSearch").addEventListener("input",renderClients);
$("clientStatusFilters").querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{activeFilter=b.dataset.filter;$("clientStatusFilters").querySelectorAll(".filter-chip").forEach(x=>x.classList.toggle("selected",x===b));renderClients()});
$("saveProfileBtn").onclick=()=>{db.profile.name=$("userName").value.trim()||"Seja bem-vindo!";save();notify("Perfil atualizado.")};
$("backToClients").onclick=()=>go("clientes");
$("notificationsBtn").onclick=()=>{const m=activeOilAlerts()[0];if(m)showOilAlert(m);else{go("manutencao");notify("Nenhum alerta de óleo pendente.")}};
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="3a-geracao-backup.json";a.click();URL.revokeObjectURL(url);notify("Backup preparado para baixar.")};
$("closeModal").onclick=()=>$("formDialog").close();$("cancelModal").onclick=()=>$("formDialog").close();
renderAll();
