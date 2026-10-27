/* EscavaPro - protótipo local.
   Os dados são salvos no localStorage deste navegador.
   Para equipe real, conecte Firebase e configure regras de segurança. */
const STORAGE_KEY = "escavapro_demo_v1";
const initialData = {jobs:[],clients:[],machines:[
  {id:"machine-case",name:"CASE",code:"ESC-01",model:"Case",meter:0,oilDue:15000,status:"Disponível",notes:""},
  {id:"machine-hyundai",name:"Hyundai",code:"ESC-02",model:"Hyundai",meter:0,oilDue:15000,status:"Disponível",notes:""},
  {id:"machine-sany",name:"Sany",code:"ESC-03",model:"Sany",meter:0,oilDue:15000,status:"Disponível",notes:""},
  {id:"machine-caterpillar",name:"Caterpillar",code:"ESC-04",model:"Caterpillar",meter:0,oilDue:15000,status:"Disponível",notes:""}
],hours:[],maintenance:[],users:[
  {id:crypto.randomUUID(),name:"Administrador de exemplo",email:"admin@exemplo.com",role:"Administrador"}
]};
let data = loadData();
// Garante que a frota inicial exista também para quem já abriu a versão anterior.
if (!data.machines || data.machines.length === 0) {
  data.machines = [
    {id:"machine-case",name:"CASE",code:"ESC-01",model:"Case",meter:0,oilDue:15000,status:"Disponível",notes:""},
    {id:"machine-hyundai",name:"Hyundai",code:"ESC-02",model:"Hyundai",meter:0,oilDue:15000,status:"Disponível",notes:""},
    {id:"machine-sany",name:"Sany",code:"ESC-03",model:"Sany",meter:0,oilDue:15000,status:"Disponível",notes:""},
    {id:"machine-caterpillar",name:"Caterpillar",code:"ESC-04",model:"Caterpillar",meter:0,oilDue:15000,status:"Disponível",notes:""}
  ]; localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
let currentView = "dashboard";
let calendarDate = new Date();
let editing = null;
let toastTimer;

function loadData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||structuredClone(initialData)}catch{return structuredClone(initialData)}}
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));renderAll()}
function id(){return crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function dateBR(v){if(!v)return "—";const [y,m,d]=v.split("-");return `${d}/${m}/${y}`}
function hoursTotal(){return data.hours.reduce((s,x)=>s+Number(x.hours||0),0)}
function machineName(machineId){return data.machines.find(m=>m.id===machineId)?.name||"Máquina removida"}
function clientName(clientId, fallback=""){return data.clients.find(c=>c.id===clientId)?.name||fallback||"Cliente não cadastrado"}
function statusClass(s){return (s||"").toLowerCase().replaceAll(" ","-")}
function statusBadge(s){return `<span class="status ${statusClass(s)}">${esc(s||"—")}</span>`}
function emptyRow(cols,msg="Nenhum registro encontrado."){return `<tr><td colspan="${cols}"><div class="empty-state">${msg}</div></td></tr>`}
function table(headers,rows){return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows||""}</tbody></table>`}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
function openView(view){currentView=view;document.querySelectorAll(".view").forEach(el=>el.classList.add("hidden"));document.getElementById(`view-${view}`).classList.remove("hidden");document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));const titles={dashboard:"Painel geral",agenda:"Agenda e serviços",clientes:"Clientes",maquinas:"Escavadeiras",horas:"Horas trabalhadas",manutencao:"Óleo e manutenção",usuarios:"Usuários e permissões"};document.getElementById("pageTitle").textContent=titles[view];renderAll()}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>openView(b.dataset.view)));
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openView(b.dataset.open)));
document.getElementById("todayLabel").textContent=new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"2-digit",month:"long"}).format(new Date()).toUpperCase();

function renderAll(){renderDashboard();renderJobs();renderClients();renderMachines();renderHours();renderMaintenance();renderUsers();renderCalendar();checkOilAlerts()}
function renderDashboard(){
 document.getElementById("statScheduled").textContent=data.jobs.filter(j=>["Agendado","Aguardando"].includes(j.status)).length;
 document.getElementById("statHours").textContent=`${hoursTotal().toLocaleString("pt-BR",{maximumFractionDigits:2})} h`;
 document.getElementById("statDone").textContent=data.jobs.filter(j=>j.status==="Atendido").length;
 document.getElementById("statMachines").textContent=data.machines.length;
 const jobs=[...data.jobs].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5);
 document.getElementById("dashboardJobs").innerHTML=jobs.length?table(["Cliente / serviço","Data","Máquina","Operador","Status"],jobs.map(j=>`<tr><td><strong>${esc(clientName(j.clientId,j.clientName))}</strong><small>${esc(j.service||"Serviço")}</small></td><td>${dateBR(j.date)}<small>${esc(j.time||"Horário não definido")}</small></td><td>${esc(machineName(j.machineId))}</td><td>${esc(j.status==="Atendido"?(j.operator||"Não informado"):"—")}</td><td>${statusBadge(j.status)}</td></tr>`).join("")):`<div class="empty-state">Ainda não há serviços. Use “Agendar serviço” para começar.</div>`;
}
function renderJobs(){
 const q=(document.getElementById("jobSearch")?.value||"").toLowerCase(),st=document.getElementById("jobStatusFilter")?.value||"",dt=document.getElementById("jobDateFilter")?.value||"";
 const jobs=[...data.jobs].filter(j=>(!q||`${clientName(j.clientId,j.clientName)} ${j.service||""} ${j.location||""}`.toLowerCase().includes(q))&&(!st||j.status===st)&&(!dt||j.date===dt)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 document.getElementById("jobsTable").innerHTML=jobs.length?table(["Cliente / serviço","Data e hora","Local","Máquina","Operador","Status","Ações"],jobs.map(j=>`<tr><td><strong>${esc(clientName(j.clientId,j.clientName))}</strong><small>${esc(j.service||"—")}${j.phone?` · ${esc(j.phone)}`:""}</small></td><td>${dateBR(j.date)}<small>${esc(j.time||"—")}</small></td><td>${esc(j.location||"—")}</td><td>${esc(machineName(j.machineId))}</td><td>${esc(j.status==="Atendido"?(j.operator||"Não informado"):"—")}</td><td><select class="inline-status" data-status-job="${j.id}">${["Aguardando","Agendado","Atendido","Recusado"].map(s=>`<option ${s===j.status?"selected":""}>${s}</option>`).join("")}</select></td><td><div class="table-actions"><button class="mini-btn" data-edit-job="${j.id}">Editar</button><button class="mini-btn" data-delete-job="${j.id}">Excluir</button></div></td></tr>`).join("")):`<div class="empty-state">Nenhum serviço cadastrado com esses filtros.</div>`;
 document.querySelectorAll("[data-status-job]").forEach(el=>el.addEventListener("change",()=>{const j=data.jobs.find(x=>x.id===el.dataset.statusJob);if(j){j.status=el.value;saveData();toast("Status atualizado.")}}));
 document.querySelectorAll("[data-edit-job]").forEach(el=>el.addEventListener("click",()=>openJobForm(el.dataset.editJob)));
 document.querySelectorAll("[data-delete-job]").forEach(el=>el.addEventListener("click",()=>removeRecord("jobs",el.dataset.deleteJob,"serviço")));
}
function renderClients(){
 const q=(document.getElementById("clientSearch")?.value||"").toLowerCase();
 const clients=data.clients.filter(c=>`${c.name} ${c.phone||""} ${c.email||""}`.toLowerCase().includes(q));
 document.getElementById("clientsTable").innerHTML=clients.length?table(["Nome","Telefone","E-mail","Observações","Ações"],clients.map(c=>`<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.phone||"—")}</td><td>${esc(c.email||"—")}</td><td>${esc(c.notes||"—")}</td><td><div class="table-actions"><button class="mini-btn" data-edit-client="${c.id}">Editar</button><button class="mini-btn" data-delete-client="${c.id}">Excluir</button></div></td></tr>`).join("")):`<div class="empty-state">Nenhum cliente cadastrado.</div>`;
 document.querySelectorAll("[data-edit-client]").forEach(el=>el.addEventListener("click",()=>openClientForm(el.dataset.editClient)));
 document.querySelectorAll("[data-delete-client]").forEach(el=>el.addEventListener("click",()=>removeRecord("clients",el.dataset.deleteClient,"cliente")));
}
function renderMachines(){
 document.getElementById("machinesGrid").innerHTML=data.machines.length?data.machines.map(m=>`<article class="machine-card"><div class="machine-emoji">🚜</div><h3>${esc(m.name)}</h3><p>${esc(m.model||"Modelo não informado")} · ${esc(m.code||"Sem código")}</p><div class="machine-meta"><div><small>Horímetro atual</small><strong>${Number(m.meter||0).toLocaleString("pt-BR")} h</strong></div><div><small>Situação</small><strong>${esc(m.status||"Disponível")}</strong></div><div><small>Óleo / próxima troca</small><strong>${m.oilDue?`${Number(m.oilDue).toLocaleString("pt-BR")} h`:"Não definido"}</strong></div><div><small>Registros de horas</small><strong>${data.hours.filter(h=>h.machineId===m.id).length}</strong></div></div><div class="table-actions" style="margin-top:15px"><button class="mini-btn" data-edit-machine="${m.id}">Editar</button><button class="mini-btn" data-delete-machine="${m.id}">Excluir</button></div></article>`).join(""):`<div class="panel empty-state">Cadastre sua primeira escavadeira para acompanhar horímetro e manutenção.</div>`;
 document.querySelectorAll("[data-edit-machine]").forEach(el=>el.addEventListener("click",()=>openMachineForm(el.dataset.editMachine)));
 document.querySelectorAll("[data-delete-machine]").forEach(el=>el.addEventListener("click",()=>removeRecord("machines",el.dataset.deleteMachine,"máquina")));
}
function renderHours(){
 document.getElementById("hoursTotal").textContent=`${hoursTotal().toLocaleString("pt-BR",{maximumFractionDigits:2})} h`;
 document.getElementById("hoursCount").textContent=data.hours.length;
 const rows=[...data.hours].sort((a,b)=>b.date.localeCompare(a.date));
 document.getElementById("hoursTable").innerHTML=rows.length?table(["Data","Máquina","Operador","Horímetro inicial","Horímetro final","Horas do registro","Ações"],rows.map(h=>`<tr><td>${dateBR(h.date)}</td><td><strong>${esc(machineName(h.machineId))}</strong></td><td>${esc(h.operator||"—")}</td><td>${Number(h.start||0).toLocaleString("pt-BR")} h</td><td>${Number(h.end||0).toLocaleString("pt-BR")} h</td><td><strong>${Number(h.hours||0).toLocaleString("pt-BR")} h</strong></td><td><button class="mini-btn" data-delete-hours="${h.id}">Excluir</button></td></tr>`).join("")):`<div class="empty-state">Nenhuma hora lançada. Registre o horímetro para começar a acompanhar a produção.</div>`;
 document.querySelectorAll("[data-delete-hours]").forEach(el=>el.addEventListener("click",()=>removeRecord("hours",el.dataset.deleteHours,"lançamento de horas")));
}
function renderMaintenance(){
 const rows=[...data.maintenance].sort((a,b)=>b.date.localeCompare(a.date));
 document.getElementById("maintenanceTable").innerHTML=rows.length?table(["Data","Máquina","Tipo","Quantidade","Horímetro","Observações","Ações"],rows.map(m=>`<tr><td>${dateBR(m.date)}</td><td><strong>${esc(machineName(m.machineId))}</strong></td><td>${esc(m.type)}</td><td>${m.quantity?`${esc(m.quantity)} ${esc(m.unit||"L")}`:"—"}</td><td>${m.meter?`${esc(m.meter)} h`:"—"}</td><td>${esc(m.notes||"—")}</td><td><button class="mini-btn" data-delete-maintenance="${m.id}">Excluir</button></td></tr>`).join("")):`<div class="empty-state">Nenhum registro de óleo ou manutenção.</div>`;
 document.querySelectorAll("[data-delete-maintenance]").forEach(el=>el.addEventListener("click",()=>removeRecord("maintenance",el.dataset.deleteMaintenance,"registro")));
}
function renderUsers(){
 document.getElementById("usersTable").innerHTML=table(["Nome","E-mail","Perfil","O que o perfil deve fazer"],data.users.map(u=>`<tr><td><strong>${esc(u.name)}</strong></td><td>${esc(u.email||"—")}</td><td><span class="status agendado">${esc(u.role)}</span></td><td>${esc(({Administrador:"Gerenciar cadastros e configurações",Operador:"Lançar horas e atualizar serviços",Agendador:"Gerenciar clientes e agenda",Consulta:"Visualizar informações"})[u.role]||"Permissões a configurar")}</td></tr>`).join("")||emptyRow(4));
}
function renderCalendar(){
 const y=calendarDate.getFullYear(),m=calendarDate.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0);
 document.getElementById("monthLabel").textContent=new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(calendarDate);
 const names=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];let html=names.map(n=>`<div class="calendar-day-name">${n}</div>`).join("");
 const start=first.getDay(),today=new Date();
 for(let i=0;i<start;i++){const d=new Date(y,m, i-start+1);html+=`<div class="calendar-cell muted"><span class="day-num">${d.getDate()}</span></div>`}
 for(let day=1;day<=last.getDate();day++){const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const jobs=data.jobs.filter(j=>j.date===ds);const istoday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===day;html+=`<div class="calendar-cell ${istoday?"today":""}"><span class="day-num">${day}</span>${jobs.slice(0,2).map(j=>`<span class="calendar-event" title="${esc(clientName(j.clientId,j.clientName))}">${esc(clientName(j.clientId,j.clientName))}</span>`).join("")}${jobs.length>2?`<span class="calendar-event">+${jobs.length-2} serviço(s)</span>`:""}</div>`}
 const used=start+last.getDate();for(let i=used;i%7!==0;i++)html+=`<div class="calendar-cell muted"><span class="day-num">${i-used+1}</span></div>`;
 document.getElementById("calendar").innerHTML=html;
}
document.getElementById("prevMonth").addEventListener("click",()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar()});
document.getElementById("nextMonth").addEventListener("click",()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar()});
["jobSearch","jobStatusFilter","jobDateFilter"].forEach(id=>document.getElementById(id).addEventListener("input",renderJobs));
document.getElementById("clearJobFilters").addEventListener("click",()=>{["jobSearch","jobStatusFilter","jobDateFilter"].forEach(id=>document.getElementById(id).value="");renderJobs()});
document.getElementById("clientSearch").addEventListener("input",renderClients);

const dialog=document.getElementById("formDialog"),modalForm=document.getElementById("modalForm"),modalFields=document.getElementById("modalFields");
document.getElementById("closeModal").onclick=()=>dialog.close();document.getElementById("cancelModal").onclick=()=>dialog.close();
function field(name,label,type="text",opts={}){const full=opts.full?" full":"";let control="";if(type==="select"){control=`<select name="${name}" ${opts.required?"required":""}>${(opts.options||[]).map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("")}</select>`}else if(type==="textarea"){control=`<textarea name="${name}" placeholder="${esc(opts.placeholder||"")}"></textarea>`}else{control=`<input name="${name}" type="${type}" ${opts.required?"required":""} ${opts.min!==undefined?`min="${opts.min}"`:""} ${opts.step?`step="${opts.step}"`:""} placeholder="${esc(opts.placeholder||"")}">`}return `<div class="field${full}"><label>${label}${opts.required?" *":""}</label>${control}</div>`}
function openForm(title,fields,submit,record={}){editing=record.id||null;document.getElementById("modalTitle").textContent=title;modalFields.innerHTML=fields;for(const [k,v] of Object.entries(record)){const input=modalForm.elements.namedItem(k);if(input)input.value=v??""}modalForm.onsubmit=e=>{e.preventDefault();const obj=Object.fromEntries(new FormData(modalForm).entries());submit(obj);dialog.close()};dialog.showModal()}
function openJobForm(editId=null){const j=data.jobs.find(x=>x.id===editId)||{};const clientOptions=[{value:"",label:"Selecionar cliente"},...data.clients.map(c=>({value:c.id,label:c.name}))];const machineOptions=[{value:"",label:"Selecionar máquina"},...data.machines.map(m=>({value:m.id,label:m.name}))];openForm(editId?"Editar serviço":"Agendar serviço",
 field("clientId","Cliente","select",{options:clientOptions})+field("clientName","Nome do cliente (se ainda não cadastrado)","text")+field("phone","Telefone","tel")+field("service","Tipo de serviço","text",{required:true})+field("date","Data","date",{required:true})+field("time","Horário","time",{required:true})+field("location","Local da obra","text",{full:true})+field("machineId","Escavadeira","select",{options:machineOptions})+field("operator","Nome do operador","text")+field("status","Status","select",{options:["Aguardando","Agendado","Atendido","Recusado"].map(s=>({value:s,label:s}))})+field("notes","Observações","textarea",{full:true}),
 obj=>{const item={...j,...obj,id:j.id||id(),status:obj.status||"Aguardando"};if(item.clientId){item.clientName=clientName(item.clientId)}if(j.id)data.jobs=data.jobs.map(x=>x.id===j.id?item:x);else data.jobs.push(item);saveData();toast("Serviço salvo.")},j)}
function openClientForm(editId=null){const c=data.clients.find(x=>x.id===editId)||{};openForm(editId?"Editar cliente":"Novo cliente",field("name","Nome do cliente","text",{required:true,full:true})+field("phone","Telefone","tel")+field("email","E-mail","email")+field("notes","Observações","textarea",{full:true}),obj=>{const item={...c,...obj,id:c.id||id()};if(c.id)data.clients=data.clients.map(x=>x.id===c.id?item:x);else data.clients.push(item);saveData();toast("Cliente salvo.")},c)}
function openMachineForm(editId=null){const m=data.machines.find(x=>x.id===editId)||{};openForm(editId?"Editar máquina":"Nova escavadeira",field("name","Nome / identificação","text",{required:true})+field("code","Código interno","text")+field("model","Marca e modelo","text")+field("meter","Horímetro atual (h)","number",{min:0,step:"0.1",required:true})+field("oilDue","Horímetro da próxima troca de óleo","number",{min:0,step:"0.1"})+field("status","Situação","select",{options:["Disponível","Em operação","Em manutenção"].map(s=>({value:s,label:s}))})+field("notes","Observações","textarea",{full:true}),obj=>{const item={...m,...obj,id:m.id||id(),meter:Number(obj.meter||0),oilDue:Number(obj.oilDue||0)};if(m.id)data.machines=data.machines.map(x=>x.id===m.id?item:x);else data.machines.push(item);saveData();toast("Máquina salva.")},m)}
function openHoursForm(){if(!data.machines.length){toast("Cadastre uma máquina antes de lançar horas.");return}const today=new Date().toISOString().slice(0,10);openForm("Lançar horas trabalhadas",field("date","Data","date",{required:true})+field("machineId","Máquina","select",{required:true,options:data.machines.map(m=>({value:m.id,label:m.name}))})+field("operator","Operador / funcionário","text",{required:true})+field("start","Horímetro inicial (h)","number",{min:0,step:"0.1",required:true})+field("end","Horímetro final (h)","number",{min:0,step:"0.1",required:true})+field("notes","Observações","textarea",{full:true}),obj=>{const start=Number(obj.start),end=Number(obj.end);if(end<start){toast("O horímetro final não pode ser menor que o inicial.");return}const m=data.machines.find(x=>x.id===obj.machineId);const item={...obj,id:id(),hours:Math.round((end-start)*100)/100};data.hours.push(item);if(m&&end>Number(m.meter||0))m.meter=end;saveData();toast(`Lançadas ${item.hours} horas.`)},{date:today})}
function openMaintenanceForm(){if(!data.machines.length){toast("Cadastre uma máquina antes de registrar manutenção.");return}openForm("Novo registro de óleo / manutenção",field("date","Data","date",{required:true})+field("machineId","Máquina","select",{required:true,options:data.machines.map(m=>({value:m.id,label:m.name}))})+field("type","Tipo de registro","select",{required:true,options:["Troca de óleo","Nível de óleo","Consumo de óleo","Manutenção preventiva","Manutenção corretiva","Outro"].map(s=>({value:s,label:s}))})+field("quantity","Quantidade","number",{min:0,step:"0.1"})+field("unit","Unidade","select",{options:[{value:"L",label:"Litros (L)"},{value:"h",label:"Horas"},{value:"un",label:"Unidades"}]})+field("meter","Horímetro no registro (h)","number",{min:0,step:"0.1"})+field("notes","Detalhes / serviço realizado","textarea",{full:true}),obj=>{data.maintenance.push({...obj,id:id()});saveData();toast("Registro de manutenção salvo.")})}
function openUserForm(){openForm("Adicionar perfil de usuário (demonstração)",field("name","Nome","text",{required:true})+field("email","E-mail","email",{required:true})+field("role","Perfil","select",{required:true,options:["Administrador","Operador","Agendador","Consulta"].map(s=>({value:s,label:s}))})+`<div class="field full"><small>Este cadastro não cria uma conta nem aplica permissões reais. Isso será conectado ao Firebase na próxima etapa.</small></div>`,obj=>{data.users.push({...obj,id:id()});saveData();toast("Perfil demonstrativo adicionado.")})}
function removeRecord(collection,recordId,label){if(!confirm(`Tem certeza que deseja excluir este ${label}?`))return;data[collection]=data[collection].filter(x=>x.id!==recordId);saveData();toast(`${label[0].toUpperCase()+label.slice(1)} excluído.`)}
function checkOilAlerts(){
 const dueMachine=data.machines.find(m=>Number(m.oilDue||0)>0&&Number(m.meter||0)>=Number(m.oilDue)&&Number(m.oilAlertAcknowledgedAt||0)!==Number(m.oilDue));
 const alertDialog=document.getElementById("oilAlertDialog");
 if(!dueMachine||alertDialog.open)return;
 document.getElementById("oilAlertText").textContent=`A máquina ${dueMachine.name} atingiu ${Number(dueMachine.meter).toLocaleString("pt-BR")} horas, o limite configurado para a troca de óleo.`;
 document.getElementById("oilAlertMachine").textContent=`🚜 ${dueMachine.name} · Horímetro ${Number(dueMachine.meter).toLocaleString("pt-BR")} h · Troca prevista em ${Number(dueMachine.oilDue).toLocaleString("pt-BR")} h`;
 alertDialog.dataset.machineId=dueMachine.id;alertDialog.showModal();
}
document.getElementById("oilAlertOk").addEventListener("click",()=>{const m=data.machines.find(x=>x.id===document.getElementById("oilAlertDialog").dataset.machineId);if(m){m.oilAlertAcknowledgedAt=Number(m.oilDue);saveData()}document.getElementById("oilAlertDialog").close();toast("Alerta de óleo confirmado pelo responsável.")});
document.getElementById("addJobBtn").onclick=()=>openJobForm();document.getElementById("addClientBtn").onclick=()=>openClientForm();document.getElementById("addMachineBtn").onclick=()=>openMachineForm();document.getElementById("addHoursBtn").onclick=openHoursForm;document.getElementById("addMaintenanceBtn").onclick=openMaintenanceForm;document.getElementById("addUserBtn").onclick=openUserForm;
renderAll();
