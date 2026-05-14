function checkFrotaPerm(e){return!(window.perm&&!window.perm("frota",e))||(alert("Você não tem permissão para "+e+" na Frota."),!1)}function applyFrotaPermissions(){const e=!window.perm||window.perm("frota","incluir"),t=!window.perm||window.perm("frota","editar"),a=!window.perm||window.perm("frota","excluir");if(["addVehicleBtn","addVehicle","btnAddVehicle"].forEach(t=>{const a=document.getElementById(t);a&&(a.style.display=e?"":"none")}),!(t&&a||document.getElementById("frotaPermStyle"))){const e=document.createElement("style");e.id="frotaPermStyle",e.textContent=`\n                ${t?"":".btn-edit-vehicle, .vehicle-edit-btn { display:none!important; }"}\n                ${a?"":".btn-delete-vehicle, .vehicle-delete-btn { display:none!important; }"}\n                ${t||a?"":".vehicle-actions { display:none!important; }"}\n            `,document.head.appendChild(e)}}const FLEET_STORAGE_KEY="fleetData";"function"!=typeof window.addExpenseFromExternal&&(window.addExpenseFromExternal=async function(e){try{if(console.log("📝 [Frota] Adicionando despesa ao Dashboard:",e),!e.date||!e.description||!e.amount)throw new Error("Campos obrigatórios faltando: date, description, amount");const t={date:e.date,description:e.description,category:e.category||"Outros",supplier:e.supplier||"",amount:parseFloat(e.amount),paymentMethod:e.paymentMethod||"Pix",dueDate:e.dueDate||e.date,notes:e.notes||"",receiptPDF:e.receiptPDF||null},a=t.date?parseInt(t.date.substring(5,7))-1:(new Date).getMonth();if(console.log("📅 Mês calculado:",a,"(índice do mês no array)"),window.CloudStorage){console.log("☁️ Usando CloudStorage para salvar despesa");const e=await window.CloudStorage.loadAll();if(!e)throw new Error("Erro ao carregar dados financeiros da nuvem");if(!e.expenses){e.expenses={};for(let t=0;t<12;t++)e.expenses[t]=[]}e.expenses[a]||(console.log("🆕 Criando array para mês",a),e.expenses[a]=[]),e.expenses[a].push(t),console.log("✅ Despesa adicionada ao mês",a),console.log("📊 Total de despesas no mês:",e.expenses[a].length);if(await window.CloudStorage.saveAll(e))return console.log("☁️ Despesa salva na nuvem com sucesso!"),!0;throw new Error("Erro ao salvar despesa na nuvem")}{console.warn("⚠️ CloudStorage não disponível, usando localStorage");let e=JSON.parse(localStorage.getItem("financialData")||"{}");if(!e.expenses){e.expenses={};for(let t=0;t<12;t++)e.expenses[t]=[]}return e.expenses[a]||(e.expenses[a]=[]),e.expenses[a].push(t),localStorage.setItem("financialData",JSON.stringify(e)),console.log("💾 Despesa salva no localStorage (fallback)"),!0}}catch(e){throw console.error("❌ Erro ao adicionar despesa externa:",e),e}},console.log("✅ Função addExpenseFromExternal registrada no módulo Frota"));const initialFleetData={updateDate:"10/01/2026",vehicles:[{marca:"TOYOTA",modelo:"COROLLA XEI 2.0",ano:"2018/2019",placa:"BZA1B19",chassi:"9BRBD3HE9K0398237",renavam:"1163141116",proxRevisao:"2026-03-26",proxRevisaoKm:"86.500",oficina:"RIOZEN BARRA (21) 96499-7752 EDMILSON",blindagem:"SIM",revBlindagem:"2025-01-18",seguradora:"YELUM",kmAtual:"82.322",observacoes:"",kmHistory:[]},{marca:"TOYOTA",modelo:"HILUX SW4",ano:"2016/2016",placa:"QEU9B00",chassi:"8AJBU3FS5G0020177",renavam:"1095333574",proxRevisao:"2025-10-01",proxRevisaoKm:"98.920",oficina:"",blindagem:"SIM",revBlindagem:"2024-12-26",seguradora:"YELUM",kmAtual:"97.352",observacoes:"EMPRESTADO KDW EM 08/12/2025",kmHistory:[]},{marca:"MERCEDES",modelo:"EQC400 4M (100% ELÉTRICO)",ano:"2020/2020",placa:"AKD5A19",chassi:"W1K8P9AW2LF012258",renavam:"1249166591",proxRevisao:"2026-07-30",proxRevisaoKm:"51.119",oficina:"AB INTERCAR (21) 96445-6627 ALEXANDRE",blindagem:"SIM",revBlindagem:"2025-05-09",seguradora:"YELUM",kmAtual:"42.282",observacoes:"OFICINA MERCEDES 26/11/2025",kmHistory:[]},{marca:"MERCEDES",modelo:"GLB200 PROGRESSIVE 1.3",ano:"2020/2021",placa:"FPD4C08",chassi:"W1N4M8HW3MW106970",renavam:"1256798352",proxRevisao:"2027-01-05",proxRevisaoKm:"39.411",oficina:"",blindagem:"SIM",revBlindagem:"2025-04-18",seguradora:"PORTO SEGURO",kmAtual:"29.445",observacoes:"",kmHistory:[]},{marca:"HYUNDAI",modelo:"PALISADE 38GDI SIG",ano:"2024/2025",placa:"SSB9G10",chassi:"KMHR381EDSU828694",renavam:"1407401340",proxRevisao:"2026-10-30",proxRevisaoKm:"20.000",oficina:"CAOA (21) 99863-6432 MARLI",blindagem:"SIM",revBlindagem:"2025-10-29",seguradora:"PORTO SEGURO",kmAtual:"12.672",observacoes:"",kmHistory:[]},{marca:"CHERY",modelo:"TIGGO 8 PRO (HÍBRIDO)",ano:"2024/2025",placa:"TJY7G62",chassi:"LNNBBDAT5SD021172",renavam:"1418998394",proxRevisao:"2026-12-26",proxRevisaoKm:"20.000",oficina:"CHERY (21) 96903-3405 Melissa",blindagem:"SIM",revBlindagem:"2024-12-28",seguradora:"TOKIO MARINE",kmAtual:"9.122",observacoes:"",kmHistory:[]}]};let fleetData=JSON.parse(JSON.stringify(initialFleetData)),currentHistoryIndex=-1,currentInvoices=[],currentAbastecimentos=[];function showFrotaLoading(){if(document.querySelector(".frota-container")&&!document.getElementById("frotaLoadingOverlay")){const e=document.createElement("div");e.id="frotaLoadingOverlay",e.style.cssText="\n            position: fixed;\n            top: 0;\n            left: 0;\n            width: 100vw;\n            height: 100vh;\n            background: rgba(0, 0, 0, 0.7);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            z-index: 10000;\n            backdrop-filter: blur(4px);\n        ",e.innerHTML='\n            <div style="text-align: center; color: white;">\n                <i class="fas fa-spinner fa-spin fa-3x" style="margin-bottom: 20px;"></i>\n                <p style="font-size: 18px; font-weight: 500;">Carregando frota...</p>\n            </div>\n        ',document.body.appendChild(e)}}function hideFrotaLoading(){const e=document.getElementById("frotaLoadingOverlay");e&&e.remove()}function setupEventListeners(){console.log("Setting up event listeners...");const e=document.getElementById("btnNovoVeiculo"),t=document.getElementById("btnExportar"),a=document.getElementById("btnImprimir"),n=document.getElementById("btnVoltar");console.log("Header buttons found:",{btnNovoVeiculo:!!e,btnExportar:!!t,btnImprimir:!!a,btnVoltar:!!n}),e&&e.addEventListener("click",function(e){console.log("Novo Veículo clicked!"),e.preventDefault(),openVehicleModal()}),t&&t.addEventListener("click",function(e){console.log("Exportar clicked!"),e.preventDefault(),exportFleet()}),a&&a.addEventListener("click",function(e){console.log("Imprimir clicked!"),window.print()}),n&&n.addEventListener("click",function(e){console.log("Voltar clicked!"),window.location.href="index.html"});const o=document.querySelectorAll("#btnCloseVehicleModal"),s=document.getElementById("btnSaveVehicle"),i=document.querySelectorAll("#btnCloseDetailModal"),l=document.querySelectorAll("#btnCloseHistoryModal"),c=document.getElementById("btnAddKmHistory"),r=document.getElementById("vDocumento");r&&r.addEventListener("change",function(e){handleFileUpload(e,"documentoFileName")}),console.log("Modal buttons found:",{btnCloseVehicleModal:o.length,btnSaveVehicle:!!s,btnCloseDetailModal:i.length,btnCloseHistoryModal:l.length,btnAddKmHistory:!!c}),o.forEach(e=>{e.addEventListener("click",function(e){console.log("Close Vehicle Modal clicked!"),e.preventDefault(),closeVehicleModal()})}),s&&s.addEventListener("click",function(e){console.log("Save Vehicle clicked!"),e.preventDefault(),saveVehicle()}),i.forEach(e=>{e.addEventListener("click",function(e){console.log("Close Detail Modal clicked!"),e.preventDefault(),closeDetailModal()})}),l.forEach(e=>{e.addEventListener("click",function(e){console.log("Close History Modal clicked!"),e.preventDefault(),closeHistoryModal()})}),c&&c.addEventListener("click",function(e){console.log("Add KM History clicked!"),e.preventDefault(),addKmHistory()});const d=document.getElementById("searchFilter");d&&d.addEventListener("input",applyFilters);document.querySelectorAll(".filter-select").forEach(e=>{e.addEventListener("change",applyFilters)}),console.log("Event listeners setup complete")}async function loadFleetData(){try{if(console.log("☁️ Carregando dados da frota da nuvem..."),window.CloudStorage){var e=await window.CloudStorage.loadAll();if(console.log("📦 CloudStorage retornou:",e?"dados válidos":"null/undefined"),e&&e.fleet&&e.fleet.vehicles&&e.fleet.vehicles.length>0){fleetData.updateDate=e.fleet.updateDate||fleetData.updateDate,fleetData.vehicles=e.fleet.vehicles;for(var t=0;t<fleetData.vehicles.length;t++){var a=fleetData.vehicles[t];a.kmHistory||(a.kmHistory=[]),a.abastecimentos||(a.abastecimentos=[]),a.invoices||(a.invoices=[])}console.log("✅ Dados da frota carregados da nuvem!"),console.log("📊 Total de veículos:",fleetData.vehicles.length),applyFrotaPermissions()}else{console.warn("⚠️ Nenhum dado de frota na nuvem ou erro ao carregar."),console.warn("⚠️ Usando dados iniciais apenas localmente (SEM salvar na nuvem).");var n=JSON.parse(JSON.stringify(initialFleetData));fleetData.updateDate=n.updateDate,fleetData.vehicles=n.vehicles}}else{console.warn("⚠️ CloudStorage não disponível, usando dados iniciais");var o=JSON.parse(JSON.stringify(initialFleetData));fleetData.updateDate=o.updateDate,fleetData.vehicles=o.vehicles}}catch(e){console.error("❌ Erro ao carregar frota:",e.message),console.log("✅ Usando dados iniciais como fallback")}document.getElementById("updateDate").textContent="ATUALIZADO: "+fleetData.updateDate}async function saveFleetData(){const e=new Date,t=String(e.getDate()).padStart(2,"0"),a=String(e.getMonth()+1).padStart(2,"0"),n=e.getFullYear();fleetData.updateDate=`${t}/${a}/${n}`,document.getElementById("updateDate").textContent="ATUALIZADO: "+fleetData.updateDate,await saveFleetDataToCloud()}async function saveFleetDataSilent(){await saveFleetDataToCloud()}async function saveFleetDataToCloud(){try{console.log("☁️ Salvando dados da frota na nuvem...");const e=window.getUserId?window.getUserId():null,t=window.APP_CONFIG?.API_URL;if(console.log("🔑 UserID:",e),console.log("🌐 API URL:",t),console.log("📊 Veículos a salvar:",fleetData.vehicles.length),!e||!t)return console.error("❌ USER_ID ou API_URL não definido"),console.error("   getUserId:",window.getUserId),console.error("   APP_CONFIG:",window.APP_CONFIG),alert("Erro: usuário não identificado. Faça login novamente."),!1;if(!fleetData.vehicles||0===fleetData.vehicles.length)return console.error("BLOQUEADO: Tentativa de salvar frota com 0 veiculos. Isso apagaria todos os dados!"),!1;const a=JSON.parse(JSON.stringify(fleetData));console.log("📦 Dados preparados para envio:",{userId:e,vehicles:a.vehicles.length,updateDate:a.updateDate});const n=await fetch(`${t}/api/sync`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:e,fleet:a})});if(n.ok){const e=await n.json();return console.log("✅ Dados da frota salvos na nuvem com sucesso!"),console.log("📝 Resposta do servidor:",e),!0}{const e=await n.text();return console.error("❌ Erro ao salvar dados da frota:",n.status),console.error("📄 Resposta do servidor:",e),alert("Erro ao salvar dados da frota na nuvem. Status: "+n.status),!1}}catch(e){return console.error("❌ Erro ao salvar frota:",e),console.error("📍 Stack trace:",e.stack),alert("Erro ao salvar dados da frota: "+e.message),!1}}function populateFilters(){const e=[...new Set(fleetData.vehicles.map(e=>e.marca))].sort(),t=[...new Set(fleetData.vehicles.map(e=>e.seguradora).filter(e=>e))].sort(),a=document.getElementById("marcaFilter");a.innerHTML='<option value="">Todas</option>',e.forEach(e=>{a.innerHTML+=`<option value="${e}">${e}</option>`});const n=document.getElementById("seguradoraFilter");n.innerHTML='<option value="">Todas</option>',t.forEach(e=>{n.innerHTML+=`<option value="${e}">${e}</option>`})}function applyFilters(){renderVehicles()}function getFilteredVehicles(){const e=document.getElementById("searchFilter").value.toLowerCase(),t=document.getElementById("marcaFilter").value,a=document.getElementById("blindagemFilter").value,n=document.getElementById("seguradoraFilter").value,o=document.getElementById("revisaoFilter").value,s=new Date,i=new Date;return i.setDate(i.getDate()+30),fleetData.vehicles.filter((l,c)=>{if(e){if(!`${l.marca} ${l.modelo} ${l.placa} ${l.chassi} ${l.renavam} ${l.oficina} ${l.seguradora} ${l.observacoes}`.toLowerCase().includes(e))return!1}if(t&&l.marca!==t)return!1;if(a&&l.blindagem!==a)return!1;if(n&&l.seguradora!==n)return!1;if(o){const e=l.proxRevisao?new Date(l.proxRevisao+"T00:00:00"):null;if("vencida"===o&&(!e||e>=s))return!1;if("proxima"===o&&(!e||e<s||e>i))return!1;if("ok"===o&&(!e||e<=i))return!1}return!0})}function renderVehicles(){const e=document.getElementById("vehiclesTableBody"),t=getFilteredVehicles();if(document.getElementById("vehicleCount").textContent=`${t.length} de ${fleetData.vehicles.length} veículo(s)`,0===t.length)return void(e.innerHTML='<tr><td colspan="14" style="text-align:center; padding:40px; color:#bdc3c7;"><i class="fas fa-car" style="font-size:40px; display:block; margin-bottom:10px;"></i>Nenhum veículo encontrado</td></tr>');const a=new Date,n=new Date;n.setDate(n.getDate()+30),e.innerHTML=t.map(e=>{const t=fleetData.vehicles.indexOf(e),o=e.proxRevisao?new Date(e.proxRevisao+"T00:00:00"):null;let s="revisao-ok",i="";o&&(o<a?(s="revisao-vencida",i=" (VENCIDA)"):o<=n&&(s="revisao-proxima",i=" (PRÓXIMA)"));const l=parseKm(e.kmAtual),c=parseKm(e.proxRevisaoKm);let r=0,d="#27ae60";c>0&&(r=Math.min(100,l/c*100),r>=95?d="#e74c3c":r>=80&&(d="#f39c12"));const m=calcularEstatisticasAbastecimento(e),u=m.custoPorKm>0?`<div class="custo-km-badge">💰 R$ ${m.custoPorKm}/km</div>`:"";return`<tr data-vehicle-index="${t}">\n            <td>\n                <div class="marca-modelo">\n                    <span class="marca">${e.marca}</span>\n                    <span class="modelo">${e.modelo}</span>\n                    ${u}\n                </div>\n            </td>\n            <td>${e.ano}</td>\n            <td><strong>${e.placa}</strong></td>\n            <td style="font-size:11px;">${e.chassi||"-"}</td>\n            <td style="font-size:11px;">${e.renavam||"-"}</td>\n            <td class="${s}">${formatDate(e.proxRevisao)}${i}</td>\n            <td>${e.proxRevisaoKm||"-"}</td>\n            <td>\n                <div class="km-bar">\n                    <span>${e.kmAtual||"-"}</span>\n                    ${c>0?`<div class="km-progress"><div class="km-progress-fill" style="width:${r}%; background:${d};"></div></div>`:""}\n                </div>\n            </td>\n            <td style="font-size:12px; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(e.oficina)}">${e.oficina||"-"}</td>\n            <td>${"SIM"===e.blindagem?'<span class="badge badge-success">SIM</span>':'<span class="badge badge-danger">NÃO</span>'}</td>\n            <td class="${getBlindagemRevClass(e.revBlindagem)}">${formatDate(e.revBlindagem)}</td>\n            <td><span class="badge badge-primary">${e.seguradora||"-"}</span></td>\n            <td>\n                <div class="action-btns">\n                    <button class="btn-icon view" title="Detalhes" data-action="view"><i class="fas fa-eye"></i></button>\n                    <button class="btn-icon history" title="Histórico KM" data-action="history"><i class="fas fa-history"></i></button>\n                    <button class="btn-icon fuel" title="Abastecimentos" data-action="fuel"><i class="fas fa-gas-pump"></i></button>\n                    <button class="btn-icon edit" title="Editar" data-action="edit"><i class="fas fa-edit"></i></button>\n                    <button class="btn-icon delete" title="Excluir" data-action="delete"><i class="fas fa-trash"></i></button>\n                </div>\n            </td>\n            <td class="obs-text" title="${escapeHtml(e.observacoes)}">${e.observacoes||"-"}</td>\n        </tr>`}).join(""),setupTableActions()}function setupTableActions(){const e=document.getElementById("vehiclesTableBody");e.removeEventListener("click",handleTableClick),e.addEventListener("click",handleTableClick)}function handleTableClick(e){const t=e.target.closest("button[data-action]");if(!t)return;const a=t.dataset.action,n=t.closest("tr"),o=parseInt(n.dataset.vehicleIndex);if(!isNaN(o))switch(a){case"view":viewVehicle(o);break;case"history":openHistoryModal(o);break;case"fuel":openAbastecimentosModal(o);break;case"edit":editVehicle(o);break;case"delete":deleteVehicle(o)}}function getBlindagemRevClass(e){if(!e)return"";const t=new Date(e+"T00:00:00"),a=new Date,n=new Date;return n.setDate(n.getDate()+30),t<a?"revisao-vencida":t<=n?"revisao-proxima":"revisao-ok"}function updateStatusCards(){const e=fleetData.vehicles,t=new Date;document.getElementById("totalVehicles").textContent=e.length,document.getElementById("totalBlindados").textContent=e.filter(e=>"SIM"===e.blindagem).length;const a=e.filter(e=>!!e.proxRevisao&&new Date(e.proxRevisao+"T00:00:00")<t).length;document.getElementById("totalRevisaoVencida").textContent=a;const n=[...new Set(e.map(e=>e.seguradora).filter(e=>e))].length;document.getElementById("totalSeguradoras").textContent=n}function buildRevisionAlerts(){const e=new Date;e.setHours(0,0,0,0);const t=new Date(e);t.setDate(t.getDate()+30);const a=[],n=[];return fleetData.vehicles.forEach(o=>{if(!o.proxRevisao)return;const s=new Date(o.proxRevisao+"T00:00:00");if(s<e)a.push({vehicle:o,revisionDate:s});else if(s<=t){const t=Math.floor((s-e)/864e5);n.push({vehicle:o,revisionDate:s,days:t})}}),a.sort((e,t)=>e.revisionDate-t.revisionDate),n.sort((e,t)=>e.revisionDate-t.revisionDate),{overdue:a,soon:n}}function renderRevisionAlerts(){const{overdue:e,soon:t}=buildRevisionAlerts(),a=e.length+t.length,n=document.getElementById("alertsSection"),o=document.getElementById("alertsList");if(0===a)return void(n.style.display="none");n.style.display="block";let s="";e.length>0&&(s+=`<div class="alert-group-title alert-group-overdue">\n            <i class="fas fa-exclamation-triangle"></i>\n            Revisões Vencidas (${e.length})\n        </div>`,e.forEach(({vehicle:e,revisionDate:t})=>{const a=Math.floor(((new Date).setHours(0,0,0,0)-t)/864e5),n=0===a?"Vence Hoje":`${a} dia(s) em atraso`;s+=`\n                <div class="alert-item alert-overdue">\n                    <div class="alert-icon overdue"><i class="fas fa-exclamation-triangle"></i></div>\n                    <div class="alert-info">\n                        <strong>${e.marca} ${e.modelo} — ${e.placa}</strong>\n                        <small>\n                            <span class="alert-tag overdue-tag">VENCIDA</span>\n                            ${n} · Previsão: ${formatDate(e.proxRevisao)}\n                            ${e.oficina?" · "+e.oficina:""}\n                        </small>\n                    </div>\n                    <div class="alert-actions">\n                        <button class="btn-alert-action" onclick="editVehicle('${e.placa}')" title="Editar">\n                            <i class="fas fa-edit"></i>\n                        </button>\n                    </div>\n                </div>\n            `})),t.length>0&&(s+=`<div class="alert-group-title alert-group-soon">\n            <i class="fas fa-clock"></i>\n            Revisões Próximas (${t.length})\n        </div>`,t.forEach(({vehicle:e,revisionDate:t,days:a})=>{const n=0===a?"Hoje":1===a?"Amanhã":`${a} dias`;s+=`\n                <div class="alert-item alert-soon">\n                    <div class="alert-icon soon"><i class="fas fa-clock"></i></div>\n                    <div class="alert-info">\n                        <strong>${e.marca} ${e.modelo} — ${e.placa}</strong>\n                        <small>\n                            <span class="alert-tag soon-tag">PRÓXIMA</span>\n                            Vence em ${n} · Previsão: ${formatDate(e.proxRevisao)}\n                            ${e.oficina?" · "+e.oficina:""}\n                        </small>\n                    </div>\n                    <div class="alert-actions">\n                        <button class="btn-alert-action" onclick="editVehicle('${e.placa}')" title="Editar">\n                            <i class="fas fa-edit"></i>\n                        </button>\n                    </div>\n                </div>\n            `})),o.innerHTML=s}function escapeHtml(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function parseKm(e){return e&&parseInt(String(e).replace(/\./g,"").replace(/,/g,""))||0}function calcularEstatisticasAbastecimento(e){const t=e.abastecimentos||[];if(0===t.length)return{custoPorKm:0,totalGasto:0,kmRodados:0,totalLitros:0,consumoMedio:0};const a=[...t].sort((e,t)=>parseKm(e.kmAtual)-parseKm(t.kmAtual)),n=parseKm(a[0].kmAtual),o=(parseKm(e.kmAtual)||parseKm(a[a.length-1].kmAtual))-n,s=t.reduce((e,t)=>e+(parseFloat(t.valor)||0),0),i=t.reduce((e,t)=>e+(parseFloat(t.litros)||0),0),l=i>0?o/i:0;return{custoPorKm:(o>0?s/o:0).toFixed(2),totalGasto:s.toFixed(2),kmRodados:o,totalLitros:i.toFixed(2),consumoMedio:l.toFixed(2)}}function formatDate(e){if(!e)return"-";const t=e.split("-");return 3!==t.length?e:`${t[2]}/${t[1]}/${t[0]}`}function parseDateBR(e){if(!e)return"";const t=e.split("/");return 3!==t.length?e:`${t[2]}-${t[1].padStart(2,"0")}-${t[0].padStart(2,"0")}`}function handleFileUpload(e,t){const a=e.target.files[0],n=document.getElementById(t);if(a){if("application/pdf"!==a.type)return alert("Por favor, selecione apenas arquivos PDF."),e.target.value="",void(n.textContent="");const t=(a.size/1048576).toFixed(2);n.innerHTML=`<i class="fas fa-check-circle" style="color:#28a745;"></i> ${a.name} (${t} MB)`;const o=new FileReader;o.onload=function(t){e.target.dataset.base64=t.target.result,e.target.dataset.filename=a.name},o.readAsDataURL(a)}else n.textContent=""}function openVehicleModal(e,t){console.log("openVehicleModal called with:",{vehicle:e,index:t});const a=document.getElementById("vehicleModal");if(console.log("Modal element found:",!!a),console.log("Modal current classes:",a?a.className:"N/A"),a&&a.classList.add("active"),document.getElementById("vehicleIndex").value=void 0!==t?t:-1,e){if(console.log("📝 MODO EDIÇÃO - Preenchendo campos com:",e),document.getElementById("vehicleModalTitle").innerHTML='<i class="fas fa-edit"></i> Editar Veículo',document.getElementById("vMarca").value=e.marca||"",document.getElementById("vModelo").value=e.modelo||"",document.getElementById("vAno").value=e.ano||"",document.getElementById("vPlaca").value=e.placa||"",document.getElementById("vChassi").value=e.chassi||"",document.getElementById("vRenavam").value=e.renavam||"",document.getElementById("vProxRevisao").value=e.proxRevisao||"",document.getElementById("vProxRevisaoKm").value=e.proxRevisaoKm||"",document.getElementById("vKmAtual").value=e.kmAtual||"",document.getElementById("vOficina").value=e.oficina||"",document.getElementById("vBlindagem").value=e.blindagem||"NÃO",document.getElementById("vRevBlindagem").value=e.revBlindagem||"",document.getElementById("vSeguradora").value=e.seguradora||"",document.getElementById("vIpvaVencimento").value=e.ipvaVencimento||"",document.getElementById("vLicenciamentoVencimento").value=e.licenciamentoVencimento||"",document.getElementById("vSeguroVencimento").value=e.seguroVencimento||"",document.getElementById("vObservacoes").value=e.observacoes||"",console.log("✅ Campos preenchidos. Verificando valor de vMarca:",document.getElementById("vMarca").value),e.documento){const t=document.getElementById("vDocumento");t.dataset.base64=e.documento,t.dataset.filename=e.documentoNome||"documento.pdf",document.getElementById("documentoFileName").innerHTML=`<i class="fas fa-check-circle" style="color:#28a745;"></i> ${e.documentoNome||"documento.pdf"}`}else document.getElementById("documentoFileName").textContent="";currentInvoices=e.invoices?[...e.invoices]:[],e.notasFiscais&&!e.invoices&&currentInvoices.push({id:Date.now()+"_migrated",name:e.notasFiscaisNome||"nota_fiscal.pdf",base64:e.notasFiscais,type:"pdf",observations:"Migrado do sistema antigo",uploadDate:(new Date).toISOString()}),renderInvoicesList(),currentAbastecimentos=e.abastecimentos?[...e.abastecimentos]:[]}else console.log("➕ MODO NOVO - Resetando formulário"),document.getElementById("vehicleModalTitle").innerHTML='<i class="fas fa-car"></i> Novo Veículo',document.getElementById("vehicleForm").reset(),document.getElementById("documentoFileName").textContent="",currentInvoices=[],currentAbastecimentos=[],renderInvoicesList()}function closeVehicleModal(){document.getElementById("vehicleModal").classList.remove("active"),currentInvoices=[],currentAbastecimentos=[]}async function addInvoiceFiles(){const e=document.getElementById("vNotasFiscaisUpload"),t=e.files;if(0!==t.length){for(let e of t)try{const t=await fileToBase64(e),a=e.type.startsWith("image/");currentInvoices.push({id:Date.now()+"_"+Math.random().toString(36).substr(2,9),name:e.name,base64:t,type:a?"image":"pdf",observations:"",uploadDate:(new Date).toISOString()})}catch(t){console.error("Erro ao processar arquivo:",e.name,t)}e.value="",renderInvoicesList()}else alert("Selecione pelo menos um arquivo.")}function renderInvoicesList(){const e=document.getElementById("invoicesList"),t=document.getElementById("invoicesListContent"),a=document.getElementById("invoicesCount");0!==currentInvoices.length?(e.style.display="block",a.textContent=currentInvoices.length,t.innerHTML=currentInvoices.map((e,t)=>{const a="image"===e.type?'<i class="fas fa-image"></i>':'<i class="fas fa-file-pdf"></i>',n="image"===e.type?"invoice-icon image":"invoice-icon",o=e.observations?`<div class="invoice-obs"><strong>Obs:</strong> ${e.observations}</div>`:"";return`\n            <div class="invoice-item" id="invoice_${e.id}">\n                <div class="${n}">\n                    ${a}\n                </div>\n                <div class="invoice-info">\n                    <div class="invoice-name">${e.name}</div>\n                    <div class="invoice-meta">${formatInvoiceDate(e.uploadDate)}</div>\n                    ${o}\n                    <textarea\n                        class="invoice-obs-input"\n                        placeholder="Digite observações sobre esta nota fiscal (ex: Valor, fornecedor, tipo de serviço...)"\n                        onchange="updateInvoiceObservation(${t}, this.value)"\n                        style="display:none;"\n                    >${e.observations}</textarea>\n                </div>\n                <div class="invoice-actions">\n                    <button type="button" class="btn-sm btn-info" onclick="toggleInvoiceObsInput(${t})" title="Adicionar/Editar Observações">\n                        <i class="fas fa-edit"></i>\n                    </button>\n                    <button type="button" class="btn-sm btn-success" onclick="viewInvoice(${t})" title="Visualizar">\n                        <i class="fas fa-eye"></i>\n                    </button>\n                    <button type="button" class="btn-sm btn-danger" onclick="removeInvoice(${t})" title="Remover">\n                        <i class="fas fa-trash"></i>\n                    </button>\n                </div>\n            </div>\n        `}).join("")):e.style.display="none"}function toggleInvoiceObsInput(e){const t=currentInvoices[e],a=document.getElementById(`invoice_${t.id}`),n=a.querySelector(".invoice-obs-input"),o=a.querySelector(".invoice-obs");"none"===n.style.display?(n.style.display="block",o&&(o.style.display="none"),n.focus()):(n.style.display="none",t.observations&&o&&(o.style.display="block"))}function updateInvoiceObservation(e,t){currentInvoices[e].observations=t.trim(),renderInvoicesList()}function removeInvoice(e){confirm("Remover esta nota fiscal?")&&(currentInvoices.splice(e,1),renderInvoicesList())}function viewInvoice(e){const t=currentInvoices[e];if("image"===t.type){window.open("","_blank").document.write(`\n            <html>\n                <head>\n                    <title>${t.name}</title>\n                    <style>\n                        body { margin: 0; background: #333; display: flex; align-items: center; justify-content: center; min-height: 100vh; }\n                        img { max-width: 100%; height: auto; }\n                    </style>\n                </head>\n                <body>\n                    <img src="${t.base64}" alt="${t.name}">\n                </body>\n            </html>\n        `)}else{window.open("","_blank").document.write(`\n            <html>\n                <head><title>${t.name}</title></head>\n                <body style="margin:0;">\n                    <embed src="${t.base64}" type="application/pdf" width="100%" height="100%" style="height:100vh;">\n                </body>\n            </html>\n        `)}}function downloadInvoice(e){const t=currentInvoices[e],a=document.createElement("a");a.href=t.base64,a.download=t.name,a.click()}function toggleInvoicesList(){const e=document.getElementById("invoicesListContent"),t=document.getElementById("toggleInvoicesBtn");"none"===e.style.display?(e.style.display="block",t.innerHTML='<i class="fas fa-chevron-up"></i> Recolher'):(e.style.display="none",t.innerHTML='<i class="fas fa-chevron-down"></i> Expandir')}function formatInvoiceDate(e){return new Date(e).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}function fileToBase64(e){return new Promise((t,a)=>{const n=new FileReader;n.onload=e=>t(e.target.result),n.onerror=a,n.readAsDataURL(e)})}function switchToAbastecimentosTab(){document.querySelectorAll(".vehicle-tab").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".tab-content").forEach(e=>e.classList.remove("active")),document.getElementById("tabAbastecimentos").classList.add("active"),document.getElementById("contentAbastecimentos").classList.add("active"),renderAbastecimentosList(),renderAbastecimentosStats()}async function addAbastecimento(){try{const e=document.getElementById("abastData").value,t=document.getElementById("abastKm").value.trim(),a=document.getElementById("abastValor").value.trim(),n=document.getElementById("abastCombustivel").value,o=document.getElementById("abastFormaPagamento").value,s=document.getElementById("abastLitros").value.trim(),i=document.getElementById("abastObs").value.trim();if(!e)return void alert("Informe a data do abastecimento.");if(!t)return void alert("Informe o KM atual.");if(!a||isNaN(parseFloat(a)))return void alert("Informe o valor do abastecimento.");if(!n)return void alert("Selecione o tipo de combustível.");if(!o)return void alert("Selecione a forma de pagamento.");if(currentAbastecimentos.length>0){const e=Math.max(...currentAbastecimentos.map(e=>parseKm(e.kmAtual)));if(parseKm(t)<e)return void alert("O KM atual não pode ser menor que abastecimentos anteriores.")}const l={id:Date.now()+"_"+Math.random().toString(36).substr(2,9),data:e,kmAtual:t,valor:parseFloat(a),combustivel:n,formaPagamento:o,litros:s?parseFloat(s):null,observacoes:i,lancadoDespesa:!1,despesaId:null,createdAt:(new Date).toISOString()};currentAbastecimentos.push(l);const c=parseInt(document.getElementById("vehicleIndex").value);if(c>=0&&fleetData.vehicles[c]){const o=fleetData.vehicles[c];o.kmHistory||(o.kmHistory=[]);const l=`Abastecimento - ${n} - R$ ${parseFloat(a).toFixed(2)}${s?` - ${s}L`:""}${i?` - ${i}`:""}`;o.kmHistory.push({date:e,km:t,desc:l}),o.kmHistory.sort((e,t)=>t.date.localeCompare(e.date)),o.kmHistory.length>0&&(o.kmAtual=o.kmHistory[0].km);const r=document.getElementById("vKmAtual");r&&(r.value=t),console.log("✅ Histórico de KM atualizado automaticamente:",{data:e,km:t,desc:l})}else{const e=document.getElementById("vKmAtual");e&&(!e.value||parseKm(t)>parseKm(e.value))&&(e.value=t)}if(document.getElementById("abastData").value=(new Date).toISOString().split("T")[0],document.getElementById("abastKm").value="",document.getElementById("abastValor").value="",document.getElementById("abastLitros").value="",document.getElementById("abastObs").value="",renderAbastecimentosList(),renderAbastecimentosStats(),c>=0&&fleetData.vehicles[c]&&(fleetData.vehicles[c].abastecimentos=[...currentAbastecimentos],console.log("Auto-salvando abastecimento na nuvem..."),await saveFleetData(),console.log("Abastecimento salvo na nuvem automaticamente!")),showFleetToast("Abastecimento adicionado!","success"),window.registrarAuditoria){const e=parseInt(document.getElementById("vehicleIndex").value),t=e>=0&&fleetData.vehicles[e]?fleetData.vehicles[e].placa:"?";registrarAuditoria("frota","incluir",`Abastecimento adicionado: ${t} - ${n} R$ ${parseFloat(a).toFixed(2)}`)}}catch(e){console.error("Erro em addAbastecimento:",e),alert("Erro ao adicionar abastecimento: "+e.message)}}async function removeAbastecimento(e){if((!currentAbastecimentos[e].lancadoDespesa||confirm("Este abastecimento já foi lançado em despesas. Deseja realmente excluir?"))&&confirm("Remover este abastecimento?")){currentAbastecimentos.splice(e,1),renderAbastecimentosList(),renderAbastecimentosStats();var t=parseInt(document.getElementById("vehicleIndex").value);t>=0&&fleetData.vehicles[t]&&(fleetData.vehicles[t].abastecimentos=[...currentAbastecimentos],console.log("Auto-salvando remocao de abastecimento na nuvem..."),await saveFleetData(),console.log("Remocao de abastecimento salva na nuvem!"))}}function renderAbastecimentosList(){const e=document.getElementById("abastecimentosList");if(0===currentAbastecimentos.length)return void(e.innerHTML='<div class="no-history"><i class="fas fa-info-circle"></i> Nenhum abastecimento registrado</div>');const t=[...currentAbastecimentos].sort((e,t)=>new Date(t.data)-new Date(e.data));e.innerHTML=t.map((e,t)=>{const a=currentAbastecimentos.indexOf(e),n=e.litros?(e.valor/e.litros).toFixed(2):"-",o=e.lancadoDespesa?'<span class="badge-lancado"><i class="fas fa-check"></i> Lançado</span>':`<button type="button" class="btn-sm btn-success" onclick="lancarAbastecimentoEmDespesa(${a})" title="Lançar em Despesas"><i class="fas fa-dollar-sign"></i> Lançar</button>`;return`\n            <div class="abastecimento-item">\n                <div class="abast-main">\n                    <span class="abast-date">${formatDate(e.data)}</span>\n                    <span class="abast-km">${e.kmAtual} km</span>\n                    <span class="abast-combustivel">${e.combustivel}</span>\n                    <span class="abast-valor">R$ ${e.valor.toFixed(2)}</span>\n                    <span class="abast-pagamento">${e.formaPagamento}</span>\n                </div>\n                <div class="abast-details">\n                    ${e.litros?`${e.litros}L • R$ ${n}/L`:""}\n                    ${e.observacoes?`• ${e.observacoes}`:""}\n                </div>\n                <div class="abast-actions">\n                    ${o}\n                    <button type="button" class="btn-sm btn-danger" onclick="removeAbastecimento(${a})" title="Remover">\n                        <i class="fas fa-trash"></i>\n                    </button>\n                </div>\n            </div>\n        `}).join("")}function renderAbastecimentosStats(){parseInt(document.getElementById("vehicleIndex").value);const e=calcularEstatisticasAbastecimento({kmAtual:document.getElementById("vKmAtual").value||"0",abastecimentos:currentAbastecimentos});document.getElementById("statCustoPorKm").textContent=`R$ ${e.custoPorKm}`,document.getElementById("statTotalGasto").textContent=`R$ ${e.totalGasto}`,document.getElementById("statKmRodados").textContent=`${e.kmRodados} km`,document.getElementById("statConsumoMedio").textContent=e.consumoMedio>0?`${e.consumoMedio} km/L`:"-"}async function lancarAbastecimentoEmDespesa(e){const t=currentAbastecimentos[e];if(t.lancadoDespesa)alert("Este abastecimento já foi lançado em despesas.");else if(confirm("Lançar este abastecimento em despesas?"))try{const e=parseInt(document.getElementById("vehicleIndex").value),a=fleetData.vehicles[e],n=a?.placa||document.getElementById("vPlaca")?.value||"N/A";console.log("🚗 Lançando abastecimento em despesas:",{placa:n,combustivel:t.combustivel,valor:t.valor,data:t.data});const o={description:`Abastecimento - ${n} - ${t.combustivel}`,amount:t.valor,category:"Carro",supplier:"Posto de Combustível",paymentMethod:t.formaPagamento,date:t.data,notes:`${t.litros?t.litros+"L • ":""}KM: ${t.kmAtual}${t.observacoes?" • "+t.observacoes:""}`};if("function"!=typeof window.addExpenseFromExternal)return console.error("❌ Função addExpenseFromExternal não encontrada!"),void alert("Erro: Função de adicionar despesa não disponível.\n\nPor favor, certifique-se de que:\n1. O Dashboard foi carregado corretamente\n2. O script.js contém a função addExpenseFromExternal\n3. Recarregue a página (Ctrl+Shift+R)");await window.addExpenseFromExternal(o),t.lancadoDespesa=!0,t.despesaId=`despesa_${Date.now()}`,e>=0&&fleetData.vehicles[e]&&(fleetData.vehicles[e].abastecimentos=[...currentAbastecimentos],await saveFleetData(),console.log("✅ Abastecimento marcado como lançado e salvo")),renderAbastecimentosList(),showFleetToast("Abastecimento lançado em despesas com sucesso!","success"),console.log("✅ Abastecimento lançado em despesas:",{id:t.id,despesaId:t.despesaId,valor:t.valor})}catch(e){console.error("❌ Erro ao lançar despesa:",e),alert("Erro ao lançar despesa. Tente novamente.\n\nDetalhes: "+e.message)}}async function saveVehicle(){const e=document.getElementById("vehicleForm");if(!e.checkValidity())return void e.reportValidity();const t=document.getElementById("vDocumento"),a={marca:document.getElementById("vMarca").value.toUpperCase().trim(),modelo:document.getElementById("vModelo").value.toUpperCase().trim(),ano:document.getElementById("vAno").value.trim(),placa:document.getElementById("vPlaca").value.toUpperCase().trim(),chassi:document.getElementById("vChassi").value.toUpperCase().trim(),renavam:document.getElementById("vRenavam").value.trim(),proxRevisao:document.getElementById("vProxRevisao").value,proxRevisaoKm:document.getElementById("vProxRevisaoKm").value.trim(),oficina:document.getElementById("vOficina").value.trim(),blindagem:document.getElementById("vBlindagem").value,revBlindagem:document.getElementById("vRevBlindagem").value,seguradora:document.getElementById("vSeguradora").value.toUpperCase().trim(),ipvaVencimento:document.getElementById("vIpvaVencimento").value,licenciamentoVencimento:document.getElementById("vLicenciamentoVencimento").value,seguroVencimento:document.getElementById("vSeguroVencimento").value,kmAtual:document.getElementById("vKmAtual").value.trim(),observacoes:document.getElementById("vObservacoes").value.trim(),kmHistory:[]};t.dataset.base64&&(a.documento=t.dataset.base64,a.documentoNome=t.dataset.filename),a.invoices=currentInvoices.length>0?[...currentInvoices]:[],a.abastecimentos=currentAbastecimentos.length>0?[...currentAbastecimentos]:[];const n=parseInt(document.getElementById("vehicleIndex").value),o=n>=0;if(o){const e=fleetData.vehicles[n];a.kmHistory=e.kmHistory||[],!a.documento&&e.documento&&(a.documento=e.documento,a.documentoNome=e.documentoNome),0===a.abastecimentos.length&&e.abastecimentos&&e.abastecimentos.length>0&&(a.abastecimentos=[...e.abastecimentos],console.log("⚠️ Preservando abastecimentos existentes:",e.abastecimentos.length)),0===a.invoices.length&&e.invoices&&e.invoices.length>0&&(a.invoices=[...e.invoices],console.log("⚠️ Preservando notas fiscais existentes:",e.invoices.length)),fleetData.vehicles[n]=a,console.log("✅ Veículo atualizado:",a.marca,a.modelo)}else fleetData.vehicles.push(a),console.log("✅ Novo veículo adicionado:",a.marca,a.modelo);await saveFleetData(),populateFilters(),renderVehicles(),updateStatusCards(),renderRevisionAlerts(),renderDocAlerts(),closeVehicleModal(),showFleetToast(o?`Veículo ${a.marca} ${a.modelo} atualizado com sucesso!`:`Veículo ${a.marca} ${a.modelo} cadastrado com sucesso!`,"success")}function editVehicle(e){console.log("🔧 editVehicle chamado com index:",e),console.log("📦 fleetData.vehicles length:",fleetData.vehicles.length),console.log("🚗 Veículo selecionado:",fleetData.vehicles[e]);const t=fleetData.vehicles[e];if(!t)return console.error("❌ Veículo não encontrado no índice:",e),void alert("Erro: Veículo não encontrado.");console.log("✅ Abrindo modal com veículo:",t.marca,t.modelo,"index:",e),openVehicleModal(t,e)}function deleteVehicle(e){const t=fleetData.vehicles[e];confirm(`Deseja excluir o veículo ${t.marca} ${t.modelo} (${t.placa})?`)&&(fleetData.vehicles.splice(e,1),saveFleetData(),populateFilters(),renderVehicles(),updateStatusCards(),renderRevisionAlerts())}function viewVehicle(e){const t=fleetData.vehicles[e];document.getElementById("detailModalTitle").innerHTML=`<i class="fas fa-car"></i> ${t.marca} ${t.modelo}`;const a=new Date,n=t.proxRevisao?new Date(t.proxRevisao+"T00:00:00"):null;let o='<span class="badge badge-info">-</span>';if(n)if(n<a)o='<span class="badge badge-danger">VENCIDA</span>';else{const e=Math.ceil((n-a)/864e5);o=e<=30?`<span class="badge badge-warning">EM ${e} DIAS</span>`:`<span class="badge badge-success">EM DIA (${e} dias)</span>`}const s=parseKm(t.kmAtual),i=parseKm(t.proxRevisaoKm);let l="";if(i>0&&s>0){const e=i-s;l=e<=0?'<span class="badge badge-danger">KM EXCEDIDO</span>':e<=1e3?`<span class="badge badge-warning">FALTAM ${e.toLocaleString("pt-BR")} KM</span>`:`<span class="badge badge-success">FALTAM ${e.toLocaleString("pt-BR")} KM</span>`}document.getElementById("detailContent").innerHTML=`\n        <div class="detail-item">\n            <span class="detail-label">Marca</span>\n            <span class="detail-value">${t.marca}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Modelo</span>\n            <span class="detail-value">${t.modelo}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Ano</span>\n            <span class="detail-value">${t.ano}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Placa</span>\n            <span class="detail-value">${t.placa}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Chassi</span>\n            <span class="detail-value">${t.chassi||"-"}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Renavam</span>\n            <span class="detail-value">${t.renavam||"-"}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Próxima Revisão</span>\n            <span class="detail-value">${formatDate(t.proxRevisao)} ${o}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Revisão KM</span>\n            <span class="detail-value">${t.proxRevisaoKm||"-"} ${l}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">KM Atual</span>\n            <span class="detail-value">${t.kmAtual||"-"}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Oficina</span>\n            <span class="detail-value">${t.oficina||"-"}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Blindagem</span>\n            <span class="detail-value">${"SIM"===t.blindagem?'<span class="badge badge-success">SIM</span>':'<span class="badge badge-danger">NÃO</span>'}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Revisão Blindagem</span>\n            <span class="detail-value">${formatDate(t.revBlindagem)}</span>\n        </div>\n        <div class="detail-item">\n            <span class="detail-label">Seguradora</span>\n            <span class="detail-value">${t.seguradora||"-"}</span>\n        </div>\n        <div class="detail-item detail-full">\n            <span class="detail-label">Observações</span>\n            <span class="detail-value">${t.observacoes||"-"}</span>\n        </div>\n        ${t.documento?`\n        <div class="detail-item">\n            <span class="detail-label"><i class="fas fa-file-pdf"></i> Documento do Veículo</span>\n            <span class="detail-value">\n                <button class="btn btn-sm btn-primary" onclick="downloadPDF('${escapeHtml(t.documento)}', '${escapeHtml(t.documentoNome||"documento.pdf")}')">\n                    <i class="fas fa-download"></i> Baixar\n                </button>\n                <button class="btn btn-sm btn-secondary" onclick="viewPDF('${escapeHtml(t.documento)}')">\n                    <i class="fas fa-eye"></i> Visualizar\n                </button>\n            </span>\n        </div>`:""}\n        ${renderInvoicesDetail(t)}\n    `,document.getElementById("detailModal").classList.add("active")}function renderInvoicesDetail(e){if(e.invoices&&e.invoices.length>0){const t=e.invoices.map((e,t)=>{const a="image"===e.type?'<i class="fas fa-image"></i>':'<i class="fas fa-file-pdf"></i>',n="image"===e.type?"#e74c3c":"#3498db",o=e.observations?`<div style="font-size:13px;color:#666;margin-top:5px;padding:8px;background:#f8f9fa;border-radius:4px;border-left:3px solid ${n};">\n                     <strong>Obs:</strong> ${e.observations}\n                   </div>`:"";return`\n                <div style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;padding:12px;margin-bottom:10px;">\n                    <div style="display:flex;align-items:start;gap:10px;">\n                        <div style="width:35px;height:35px;background:${n};border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;flex-shrink:0;">\n                            ${a}\n                        </div>\n                        <div style="flex:1;min-width:0;">\n                            <div style="font-weight:600;color:#2c3e50;margin-bottom:5px;word-break:break-word;">${e.name}</div>\n                            <div style="font-size:12px;color:#999;">${formatInvoiceDate(e.uploadDate)}</div>\n                            ${o}\n                        </div>\n                        <div style="display:flex;gap:5px;flex-direction:column;">\n                            <button class="btn-sm btn-success" onclick="viewInvoiceFromDetail('${escapeHtml(e.base64)}', '${e.type}', '${escapeHtml(e.name)}')">\n                                <i class="fas fa-eye"></i> Ver\n                            </button>\n                            <button class="btn-sm btn-info" onclick="downloadInvoiceFromDetail('${escapeHtml(e.base64)}', '${escapeHtml(e.name)}')">\n                                <i class="fas fa-download"></i> Baixar\n                            </button>\n                        </div>\n                    </div>\n                </div>\n            `}).join("");return`\n            <div class="detail-item detail-full">\n                <span class="detail-label"><i class="fas fa-file-invoice"></i> Notas Fiscais / Documentos (${e.invoices.length})</span>\n                <div class="detail-value" style="width:100%;">\n                    ${t}\n                </div>\n            </div>\n        `}return e.notasFiscais?`\n            <div class="detail-item">\n                <span class="detail-label"><i class="fas fa-file-invoice"></i> Notas Fiscais (Sistema Antigo)</span>\n                <span class="detail-value">\n                    <button class="btn btn-sm btn-primary" onclick="downloadPDF('${escapeHtml(e.notasFiscais)}', '${escapeHtml(e.notasFiscaisNome||"notas-fiscais.pdf")}')">\n                        <i class="fas fa-download"></i> Baixar\n                    </button>\n                    <button class="btn btn-sm btn-secondary" onclick="viewPDF('${escapeHtml(e.notasFiscais)}')">\n                        <i class="fas fa-eye"></i> Visualizar\n                    </button>\n                </span>\n            </div>\n        `:""}function viewInvoiceFromDetail(e,t,a){if("image"===t){window.open("","_blank").document.write(`\n            <html>\n                <head>\n                    <title>${a}</title>\n                    <style>\n                        body { margin: 0; background: #333; display: flex; align-items: center; justify-content: center; min-height: 100vh; }\n                        img { max-width: 100%; height: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }\n                    </style>\n                </head>\n                <body>\n                    <img src="${e}" alt="${a}">\n                </body>\n            </html>\n        `)}else{window.open("","_blank").document.write(`\n            <html>\n                <head><title>${a}</title></head>\n                <body style="margin:0;">\n                    <embed src="${e}" type="application/pdf" width="100%" height="100%" style="height:100vh;">\n                </body>\n            </html>\n        `)}}function downloadInvoiceFromDetail(e,t){const a=document.createElement("a");a.href=e,a.download=t,a.click()}function closeDetailModal(){document.getElementById("detailModal").classList.remove("active")}function openHistoryModal(e){currentHistoryIndex=e;const t=fleetData.vehicles[e];document.getElementById("historyModalTitle").innerHTML=`<i class="fas fa-history"></i> Histórico KM - ${t.marca} ${t.modelo} (${t.placa})`;const a=(new Date).toISOString().split("T")[0];document.getElementById("histDate").value=a,document.getElementById("histKm").value="",document.getElementById("histDesc").value="",renderHistory(),document.getElementById("historyModal").classList.add("active")}function closeHistoryModal(){document.getElementById("historyModal").classList.remove("active"),currentHistoryIndex=-1}async function addKmHistory(){if(currentHistoryIndex<0)return console.error("❌ currentHistoryIndex inválido:",currentHistoryIndex),void alert("Erro: veículo não identificado.");const e=document.getElementById("histDate").value,t=document.getElementById("histKm").value.trim(),a=document.getElementById("histDesc").value.trim();if(console.log("📝 Adicionando histórico KM:",{date:e,km:t,desc:a,currentHistoryIndex:currentHistoryIndex}),!e||!t)return void alert("Preencha a data e o KM.");const n=fleetData.vehicles[currentHistoryIndex];if(!n)return console.error("❌ Veículo não encontrado no índice:",currentHistoryIndex),void alert("Erro: veículo não encontrado.");n.kmHistory||(n.kmHistory=[]),n.kmHistory.push({date:e,km:t,desc:a}),console.log("✅ Histórico adicionado ao veículo:",n.marca,n.modelo),n.kmHistory.sort((e,t)=>t.date.localeCompare(e.date)),n.kmHistory.length>0&&(n.kmAtual=n.kmHistory[0].km,console.log("✅ KM atual atualizado para:",n.kmAtual)),await saveFleetData(),console.log("✅ Dados salvos na nuvem"),renderHistory(),renderVehicles(),updateStatusCards(),renderRevisionAlerts(),document.getElementById("histKm").value="",document.getElementById("histDesc").value="",showFleetToast("Histórico de KM adicionado com sucesso!","success")}function deleteKmHistory(e){if(currentHistoryIndex<0)return;const t=fleetData.vehicles[currentHistoryIndex];confirm("Remover este registro de histórico?")&&(t.kmHistory.splice(e,1),saveFleetData(),renderHistory())}function renderHistory(){const e=document.getElementById("historyList");if(currentHistoryIndex<0)return;const t=fleetData.vehicles[currentHistoryIndex].kmHistory||[];0!==t.length?(e.innerHTML=t.map((e,t)=>`\n        <div class="history-item">\n            <span class="history-date">${formatDate(e.date)}</span>\n            <span class="history-desc">${e.desc||"-"}</span>\n            <span class="history-km">${e.km} km</span>\n            <button class="btn-icon delete" data-hist-index="${t}" title="Remover" style="margin-left:10px;"><i class="fas fa-times"></i></button>\n        </div>\n    `).join(""),e.querySelectorAll("button[data-hist-index]").forEach(e=>{e.addEventListener("click",function(){deleteKmHistory(parseInt(this.dataset.histIndex))})})):e.innerHTML='<div class="no-history"><i class="fas fa-info-circle"></i> Nenhum registro de histórico</div>'}function downloadPDF(e,t){const a=document.createElement("a");a.href=e,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a)}function viewPDF(e){const t=window.open();t?t.document.write(`\n            <!DOCTYPE html>\n            <html>\n            <head>\n                <title>Visualizar PDF</title>\n                <style>\n                    body { margin: 0; padding: 0; overflow: hidden; }\n                    iframe { border: none; width: 100%; height: 100vh; }\n                </style>\n            </head>\n            <body>\n                <iframe src="${e}"></iframe>\n            </body>\n            </html>\n        `):alert("Por favor, permita pop-ups para visualizar o PDF.")}function exportFleet(){const e=getFilteredVehicles();let t="\ufeff";t+=["Marca","Modelo","Ano","Placa","Chassi","Renavam","Próxima Revisão","Revisão KM","KM Atual","Oficina","Blindagem","Rev. Blindagem","Seguradora","Observações"].join(";")+"\n",e.forEach(e=>{t+=[e.marca,e.modelo,e.ano,e.placa,e.chassi,e.renavam,formatDate(e.proxRevisao),e.proxRevisaoKm,e.kmAtual,`"${(e.oficina||"").replace(/"/g,'""')}"`,e.blindagem,formatDate(e.revBlindagem),e.seguradora,`"${(e.observacoes||"").replace(/"/g,'""')}"`].join(";")+"\n"});const a=new Blob([t],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(a),o=document.createElement("a");o.href=n,o.download=`frota_${(new Date).toISOString().split("T")[0]}.csv`,o.click(),URL.revokeObjectURL(n)}function showFleetToast(e,t="success"){const a=document.getElementById("fleetToast");a&&a.remove();const n=document.createElement("div");n.id="fleetToast",n.style.cssText=`\n        position: fixed;\n        top: 20px;\n        right: 20px;\n        padding: 15px 20px;\n        background: ${"success"===t?"#27ae60":"error"===t?"#e74c3c":"#f39c12"};\n        color: white;\n        border-radius: 8px;\n        box-shadow: 0 4px 12px rgba(0,0,0,0.3);\n        z-index: 10000;\n        font-size: 14px;\n        font-weight: 500;\n        max-width: 350px;\n        animation: slideInRight 0.3s ease-out;\n    `;const o="success"===t?"✅":"error"===t?"❌":"⚠️";n.innerHTML=`${o} ${e} <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:18px;cursor:pointer;margin-left:8px;padding:4px;">&times;</button>`,document.body.appendChild(n),setTimeout(()=>{n.parentElement&&(n.style.animation="slideOutRight 0.3s ease-in",setTimeout(()=>{n.parentElement&&n.remove()},300))},5e3)}if(document.addEventListener("DOMContentLoaded",async function(){console.log("DOM loaded, initializing frota..."),showFrotaLoading(),await loadFleetData(),populateFilters(),renderVehicles(),updateStatusCards(),renderRevisionAlerts(),renderDocAlerts(),setupEventListeners(),initDashboardSelectors(),function(){try{if(typeof Chart!=='undefined'){updateFleetDashboard();console.log('[Dashboard] Initialized directly')}else{console.log('[Dashboard] Chart.js not ready, scheduling retry');setTimeout(function(){try{updateFleetDashboard();console.log('[Dashboard] Initialized via retry')}catch(e2){console.error('[Dashboard] Retry error:',e2)}},2000)}}catch(e){console.error('[Dashboard] Init error:',e)}}(),hideFrotaLoading(),console.log("Frota initialized successfully")}),document.addEventListener("click",function(e){e.target.classList.contains("modal-overlay")&&e.target.classList.remove("active")}),document.addEventListener("keydown",function(e){"Escape"===e.key&&document.querySelectorAll(".modal-overlay.active").forEach(e=>e.classList.remove("active"))}),!document.getElementById("fleetToastStyles")){const e=document.createElement("style");e.id="fleetToastStyles",e.textContent="\n        @keyframes slideInRight {\n            from { transform: translateX(400px); opacity: 0; }\n            to { transform: translateX(0); opacity: 1; }\n        }\n        @keyframes slideOutRight {\n            from { transform: translateX(0); opacity: 1; }\n            to { transform: translateX(400px); opacity: 0; }\n        }\n    ",document.head.appendChild(e)}window.downloadPDF=downloadPDF,window.viewPDF=viewPDF,console.log("Frota.js loaded successfully");

// ============================================================
// DEDICATED ABASTECIMENTOS MODAL (accessed from action button)
// ============================================================
var _abastModalVehicleIndex = -1;

function openAbastecimentosModal(index) {
    _abastModalVehicleIndex = index;
    var v = fleetData.vehicles[index];
    if (!v) return alert('Veículo não encontrado.');
    v.abastecimentos = v.abastecimentos || [];

    document.getElementById('abastModalTitle').innerHTML =
        '<i class="fas fa-gas-pump"></i> Abastecimentos — ' + v.marca + ' ' + v.modelo + ' (' + v.placa + ')';

    // Set today's date
    document.getElementById('abastModalData').value = new Date().toISOString().split('T')[0];
    document.getElementById('abastModalKm').value = '';
    document.getElementById('abastModalValor').value = '';
    document.getElementById('abastModalLitros').value = '';
    document.getElementById('abastModalObs').value = '';
    var combSel = document.getElementById('abastModalCombustivel');
    if (combSel) combSel.selectedIndex = 0;
    var pagSel = document.getElementById('abastModalFormaPagamento');
    if (pagSel) pagSel.selectedIndex = 0;

    renderAbastModalStats(v);
    renderAbastModalList(v);
    document.getElementById('abastecimentosModal').classList.add('active');
}

function closeAbastecimentosModal() {
    document.getElementById('abastecimentosModal').classList.remove('active');
    _abastModalVehicleIndex = -1;
}

function renderAbastModalStats(v) {
    var stats = calcularEstatisticasAbastecimento(v);
    document.getElementById('abastModalStats').innerHTML = '' +
        '<div class="abast-modal-stat"><div class="stat-val">R$ ' + stats.custoPorKm + '</div><div class="stat-lbl">Custo/KM</div></div>' +
        '<div class="abast-modal-stat"><div class="stat-val">R$ ' + stats.totalGasto + '</div><div class="stat-lbl">Total Gasto</div></div>' +
        '<div class="abast-modal-stat"><div class="stat-val">' + stats.kmRodados + ' km</div><div class="stat-lbl">KM Rodados</div></div>' +
        '<div class="abast-modal-stat"><div class="stat-val">' + (stats.consumoMedio > 0 ? stats.consumoMedio + ' km/L' : '-') + '</div><div class="stat-lbl">Consumo Médio</div></div>';
}

function renderAbastModalList(v) {
    var el = document.getElementById('abastModalList');
    var abasts = v.abastecimentos || [];
    if (abasts.length === 0) {
        el.innerHTML = '<div class="no-history"><i class="fas fa-info-circle"></i> Nenhum abastecimento registrado</div>';
        return;
    }
    var sorted = abasts.slice().sort(function(a, b) { return new Date(b.data) - new Date(a.data); });
    el.innerHTML = sorted.map(function(ab, si) {
        var realIdx = abasts.indexOf(ab);
        var ppl = ab.litros ? (ab.valor / ab.litros).toFixed(2) : '-';
        var lancBtn = ab.lancadoDespesa ?
            '<span class="badge-lancado"><i class="fas fa-check"></i> Lançado</span>' :
            '<button type="button" class="btn-sm btn-success" onclick="lancarAbastModalDespesa(' + realIdx + ')" title="Lançar em Despesas"><i class="fas fa-dollar-sign"></i> Lançar</button>';
        return '<div class="abastecimento-item">' +
            '<div class="abast-main">' +
                '<span class="abast-date">' + formatDate(ab.data) + '</span>' +
                '<span class="abast-km">' + ab.kmAtual + ' km</span>' +
                '<span class="abast-combustivel">' + ab.combustivel + '</span>' +
                '<span class="abast-valor">R$ ' + ab.valor.toFixed(2) + '</span>' +
                '<span class="abast-pagamento">' + ab.formaPagamento + '</span>' +
            '</div>' +
            '<div class="abast-details">' +
                (ab.litros ? ab.litros + 'L &bull; R$ ' + ppl + '/L' : '') +
                (ab.observacoes ? ' &bull; ' + ab.observacoes : '') +
            '</div>' +
            '<div class="abast-actions">' +
                lancBtn +
                '<button type="button" class="btn-sm btn-danger" onclick="removeAbastModal(' + realIdx + ')" title="Remover"><i class="fas fa-trash"></i></button>' +
            '</div>' +
        '</div>';
    }).join('');
}

async function addAbastecimentoFromModal() {
    if (_abastModalVehicleIndex < 0) return;
    var v = fleetData.vehicles[_abastModalVehicleIndex];
    if (!v) return;

    var data = document.getElementById('abastModalData').value;
    var km = document.getElementById('abastModalKm').value.trim();
    var valor = document.getElementById('abastModalValor').value.trim();
    var combustivel = document.getElementById('abastModalCombustivel').value;
    var formaPag = document.getElementById('abastModalFormaPagamento').value;
    var litros = document.getElementById('abastModalLitros').value.trim();
    var obs = document.getElementById('abastModalObs').value.trim();

    if (!data) return alert('Informe a data do abastecimento.');
    if (!km) return alert('Informe o KM atual.');
    if (!valor || isNaN(parseFloat(valor))) return alert('Informe o valor do abastecimento.');
    if (!combustivel) return alert('Selecione o tipo de combustível.');
    if (!formaPag) return alert('Selecione a forma de pagamento.');

    v.abastecimentos = v.abastecimentos || [];

    var newAbast = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        data: data,
        kmAtual: km,
        valor: parseFloat(valor),
        combustivel: combustivel,
        formaPagamento: formaPag,
        litros: litros ? parseFloat(litros) : null,
        observacoes: obs,
        lancadoDespesa: false,
        despesaId: null,
        createdAt: new Date().toISOString()
    };
    v.abastecimentos.push(newAbast);

    // Update KM history
    v.kmHistory = v.kmHistory || [];
    var desc = 'Abastecimento - ' + combustivel + ' - R$ ' + parseFloat(valor).toFixed(2) +
        (litros ? ' - ' + litros + 'L' : '') + (obs ? ' - ' + obs : '');
    v.kmHistory.push({ date: data, km: km, desc: desc });
    v.kmHistory.sort(function(a, b) { return b.date.localeCompare(a.date); });
    if (v.kmHistory.length > 0) v.kmAtual = v.kmHistory[0].km;

    // Clear form
    document.getElementById('abastModalData').value = new Date().toISOString().split('T')[0];
    document.getElementById('abastModalKm').value = '';
    document.getElementById('abastModalValor').value = '';
    document.getElementById('abastModalLitros').value = '';
    document.getElementById('abastModalObs').value = '';

    await saveFleetData();
    renderAbastModalStats(v);
    renderAbastModalList(v);
    renderVehicles();
    updateStatusCards();
    updateFleetDashboard();
    showFleetToast('Abastecimento adicionado!', 'success');
}

async function removeAbastModal(idx) {
    if (_abastModalVehicleIndex < 0) return;
    var v = fleetData.vehicles[_abastModalVehicleIndex];
    if (!v || !v.abastecimentos || !v.abastecimentos[idx]) return;
    if (v.abastecimentos[idx].lancadoDespesa && !confirm('Este abastecimento já foi lançado em despesas. Deseja realmente excluir?')) return;
    if (!confirm('Remover este abastecimento?')) return;
    v.abastecimentos.splice(idx, 1);
    await saveFleetData();
    renderAbastModalStats(v);
    renderAbastModalList(v);
    renderVehicles();
    updateFleetDashboard();
}

async function lancarAbastModalDespesa(idx) {
    if (_abastModalVehicleIndex < 0) return;
    var v = fleetData.vehicles[_abastModalVehicleIndex];
    if (!v || !v.abastecimentos || !v.abastecimentos[idx]) return;
    var ab = v.abastecimentos[idx];
    if (ab.lancadoDespesa) return alert('Este abastecimento já foi lançado em despesas.');
    if (!confirm('Lançar este abastecimento em despesas?')) return;
    try {
        var despData = {
            description: 'Abastecimento - ' + v.placa + ' - ' + ab.combustivel,
            amount: ab.valor,
            category: 'Carro',
            supplier: 'Posto de Combustível',
            paymentMethod: ab.formaPagamento,
            date: ab.data,
            notes: (ab.litros ? ab.litros + 'L - ' : '') + 'KM: ' + ab.kmAtual + (ab.observacoes ? ' - ' + ab.observacoes : '')
        };
        if (typeof window.addExpenseFromExternal !== 'function') {
            return alert('Função de adicionar despesa não disponível. Recarregue a página.');
        }
        await window.addExpenseFromExternal(despData);
        ab.lancadoDespesa = true;
        ab.despesaId = 'despesa_' + Date.now();
        await saveFleetData();
        renderAbastModalList(v);
        showFleetToast('Abastecimento lançado em despesas!', 'success');
    } catch (e) {
        console.error('Erro ao lançar despesa:', e);
        alert('Erro ao lançar despesa: ' + e.message);
    }
}

// ============================================================
// FLEET DASHBOARD - Charts
// ============================================================
var _chartKm = null;
var _chartGasto = null;

function initDashboardSelectors() {
    var yearSel = document.getElementById('dashboardYear');
    if (!yearSel) return;
    var currentYear = new Date().getFullYear();
    yearSel.innerHTML = '';
    for (var y = currentYear; y >= currentYear - 3; y--) {
        var opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSel.appendChild(opt);
    }
    yearSel.value = currentYear;

    var monthSel = document.getElementById('dashboardMonth');
    if (monthSel) monthSel.value = new Date().getMonth();
}

function getMonthData(month, year) {
    var results = [];
    fleetData.vehicles.forEach(function(v) {
        var abasts = (v.abastecimentos || []).filter(function(ab) {
            if (!ab.data) return false;
            var d = new Date(ab.data + 'T00:00:00');
            return d.getMonth() === month && d.getFullYear() === year;
        });

        var kmEntries = (v.kmHistory || []).filter(function(h) {
            if (!h.date) return false;
            var d = new Date(h.date + 'T00:00:00');
            return d.getMonth() === month && d.getFullYear() === year;
        });

        var totalGasto = 0;
        var totalLitros = 0;
        abasts.forEach(function(ab) {
            totalGasto += parseFloat(ab.valor) || 0;
            totalLitros += parseFloat(ab.litros) || 0;
        });

        // Calculate KM driven in this month
        var allKm = (v.kmHistory || []).slice().sort(function(a, b) {
            return a.date.localeCompare(b.date);
        });
        var kmDriven = 0;
        if (allKm.length > 0) {
            // Find entries in this month range
            var monthStart = year + '-' + String(month + 1).padStart(2, '0') + '-01';
            var nextMonth = month === 11 ? (year + 1) + '-01-01' : year + '-' + String(month + 2).padStart(2, '0') + '-01';

            // Get the KM at end of month and KM at start of month
            var beforeMonth = allKm.filter(function(h) { return h.date < monthStart; });
            var inMonth = allKm.filter(function(h) { return h.date >= monthStart && h.date < nextMonth; });
            var startKm = beforeMonth.length > 0 ? parseKm(beforeMonth[beforeMonth.length - 1].km) : 0;
            var endKm = 0;

            if (inMonth.length > 0) {
                endKm = parseKm(inMonth[inMonth.length - 1].km);
                if (startKm === 0) startKm = parseKm(inMonth[0].km);
                kmDriven = endKm - startKm;
            }
        }

        results.push({
            label: v.marca + ' ' + v.modelo.split(' ')[0],
            placa: v.placa,
            kmDriven: kmDriven > 0 ? kmDriven : 0,
            totalGasto: totalGasto,
            totalLitros: totalLitros,
            abastCount: abasts.length
        });
    });
    return results;
}

function updateFleetDashboard() {
    var monthSel = document.getElementById('dashboardMonth');
    var yearSel = document.getElementById('dashboardYear');
    if (!monthSel || !yearSel) return;

    var month = parseInt(monthSel.value);
    var year = parseInt(yearSel.value);
    var data = getMonthData(month, year);

    // Summary cards
    var totalKm = 0, totalGasto = 0, totalLitros = 0;
    data.forEach(function(d) {
        totalKm += d.kmDriven;
        totalGasto += d.totalGasto;
        totalLitros += d.totalLitros;
    });
    var custoMedioKm = totalKm > 0 ? (totalGasto / totalKm).toFixed(2) : '0.00';

    document.getElementById('dashTotalKm').textContent = totalKm.toLocaleString('pt-BR') + ' km';
    document.getElementById('dashTotalGasto').textContent = 'R$ ' + totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('dashTotalLitros').textContent = totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) + ' L';
    document.getElementById('dashCustoMedioKm').textContent = 'R$ ' + custoMedioKm;

    // Charts
    var labels = data.map(function(d) { return d.placa; });
    var kmValues = data.map(function(d) { return d.kmDriven; });
    var gastoValues = data.map(function(d) { return d.totalGasto; });

    var colors = ['#667eea', '#764ba2', '#27ae60', '#e74c3c', '#f39c12', '#3498db', '#2ecc71', '#e67e22', '#9b59b6', '#1abc9c'];

    // Destroy existing charts
    if (_chartKm) { _chartKm.destroy(); _chartKm = null; }
    if (_chartGasto) { _chartGasto.destroy(); _chartGasto = null; }

    if (typeof Chart === 'undefined') {
        console.warn('[Dashboard] Chart.js not loaded yet');
        return;
    }

    var ctxKm = document.getElementById('chartKmPorVeiculo');
    if (ctxKm) {
        _chartKm = new Chart(ctxKm.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'KM Rodados',
                    data: kmValues,
                    backgroundColor: colors.slice(0, labels.length),
                    borderRadius: 6,
                    maxBarThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.parsed.y.toLocaleString('pt-BR') + ' km';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(val) { return val.toLocaleString('pt-BR') + ' km'; }
                        }
                    }
                }
            }
        });
    }

    var ctxGasto = document.getElementById('chartGastoPorVeiculo');
    if (ctxGasto) {
        _chartGasto = new Chart(ctxGasto.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gasto (R$)',
                    data: gastoValues,
                    backgroundColor: colors.slice(0, labels.length).map(function(c) { return c + 'CC'; }),
                    borderColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderRadius: 6,
                    maxBarThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return 'R$ ' + ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(val) { return 'R$ ' + val.toLocaleString('pt-BR'); }
                        }
                    }
                }
            }
        });
    }
}

function initDashboardWithRetry(attempts) {
    attempts = attempts || 0;
    if (typeof Chart !== 'undefined') {
        updateFleetDashboard();
        console.log('[Dashboard] Charts initialized successfully');
    } else if (attempts < 50) {
        setTimeout(function() { initDashboardWithRetry(attempts + 1); }, 500);
    } else {
        console.warn('[Dashboard] Chart.js failed to load after retries');
        // Populate summary cards without charts
        var month = parseInt(document.getElementById('dashboardMonth').value);
        var year = parseInt(document.getElementById('dashboardYear').value);
        var data = getMonthData(month, year);
        var totalKm = 0, totalGasto = 0, totalLitros = 0;
        data.forEach(function(d) { totalKm += d.kmDriven; totalGasto += d.totalGasto; totalLitros += d.totalLitros; });
        document.getElementById('dashTotalKm').textContent = totalKm.toLocaleString('pt-BR') + ' km';
        document.getElementById('dashTotalGasto').textContent = 'R$ ' + totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        document.getElementById('dashTotalLitros').textContent = totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) + ' L';
        document.getElementById('dashCustoMedioKm').textContent = 'R$ ' + (totalKm > 0 ? (totalGasto / totalKm).toFixed(2) : '0.00');
    }
}

// Also try when window fully loads (all resources including CDN scripts)
// Only runs if fleet data has already been loaded from cloud
window.addEventListener('load', function() {
    if (typeof Chart !== 'undefined' && fleetData.vehicles.length > 0 && document.getElementById('dashboardYear').options.length > 0) {
        updateFleetDashboard();
        console.log('[Dashboard] Charts initialized on window.load');
    }
});

// Make functions globally accessible
window.openAbastecimentosModal = openAbastecimentosModal;
window.closeAbastecimentosModal = closeAbastecimentosModal;
window.addAbastecimentoFromModal = addAbastecimentoFromModal;
window.removeAbastModal = removeAbastModal;
window.lancarAbastModalDespesa = lancarAbastModalDespesa;
window.updateFleetDashboard = updateFleetDashboard;
window.generateFleetReport = generateFleetReport;
window.renderDocAlerts = renderDocAlerts;

// ============================================================
// DOCUMENT ALERTS (IPVA / Licenciamento / Seguro)
// ============================================================

function renderDocAlerts() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var soon = new Date(today);
    soon.setDate(soon.getDate() + 30);
    var alerts = [];

    fleetData.vehicles.forEach(function(v) {
        var checks = [
            { field: 'ipvaVencimento', label: 'IPVA', icon: 'fas fa-money-bill-wave', cls: 'ipva' },
            { field: 'licenciamentoVencimento', label: 'Licenciamento', icon: 'fas fa-id-card', cls: 'lic' },
            { field: 'seguroVencimento', label: 'Seguro', icon: 'fas fa-shield-alt', cls: 'seg' }
        ];
        checks.forEach(function(c) {
            if (!v[c.field]) return;
            var d = new Date(v[c.field] + 'T00:00:00');
            if (d < today) {
                var days = Math.floor((today - d) / 86400000);
                alerts.push({ vehicle: v, date: d, days: days, type: 'overdue', label: c.label, icon: c.icon, cls: c.cls });
            } else if (d <= soon) {
                var days2 = Math.floor((d - today) / 86400000);
                alerts.push({ vehicle: v, date: d, days: days2, type: 'soon', label: c.label, icon: c.icon, cls: c.cls });
            }
        });
    });

    var section = document.getElementById('docAlertsSection');
    var list = document.getElementById('docAlertsList');
    if (!section || !list) return;

    if (alerts.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    alerts.sort(function(a, b) { return a.date - b.date; });

    var html = '';
    alerts.forEach(function(a) {
        var cssClass = a.type === 'overdue' ? 'alert-overdue' : 'alert-soon';
        var statusText = a.type === 'overdue'
            ? (a.days === 0 ? 'Vence Hoje' : a.days + ' dia(s) em atraso')
            : (a.days === 0 ? 'Vence Hoje' : 'Vence em ' + a.days + ' dia(s)');
        var tagClass = a.type === 'overdue' ? 'overdue' : 'soon';
        html += '<div class="doc-alert-item ' + cssClass + '">' +
            '<div class="da-icon ' + a.cls + '"><i class="' + a.icon + '"></i></div>' +
            '<div class="da-info">' +
                '<strong>' + a.vehicle.marca + ' ' + a.vehicle.modelo + ' — ' + a.vehicle.placa + '</strong>' +
                '<small>' +
                    '<span class="da-tag ' + a.cls + '">' + a.label.toUpperCase() + '</span> ' +
                    statusText + ' - Vencimento: ' + formatDate(a.vehicle[a.cls === 'ipva' ? 'ipvaVencimento' : a.cls === 'lic' ? 'licenciamentoVencimento' : 'seguroVencimento']) +
                '</small>' +
            '</div>' +
        '</div>';
    });
    list.innerHTML = html;
}

// ============================================================
// EVOLUTION CHART (12-month line chart)
// ============================================================

var _chartEvolucao = null;

function updateEvolutionChart() {
    if (typeof Chart === 'undefined') return;
    var canvas = document.getElementById('chartEvolucaoMensal');
    if (!canvas) return;

    var now = new Date();
    var labels = [];
    var dataKm = [];
    var dataGasto = [];
    var monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (var i = 11; i >= 0; i--) {
        var m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        var month = m.getMonth();
        var year = m.getFullYear();
        labels.push(monthNames[month] + '/' + String(year).slice(2));

        var mData = getMonthData(month, year);
        var totalKm = 0, totalGasto = 0;
        mData.forEach(function(d) { totalKm += d.kmDriven; totalGasto += d.totalGasto; });
        dataKm.push(totalKm);
        dataGasto.push(parseFloat(totalGasto.toFixed(2)));
    }

    if (_chartEvolucao) _chartEvolucao.destroy();

    _chartEvolucao = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'KM Rodados',
                    data: dataKm,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Gasto (R$)',
                    data: dataGasto,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            if (ctx.datasetIndex === 0) return ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString('pt-BR') + ' km';
                            return ctx.dataset.label + ': R$ ' + ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'KM' },
                    ticks: { callback: function(v) { return v.toLocaleString('pt-BR'); } }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'R$' },
                    grid: { drawOnChartArea: false },
                    ticks: { callback: function(v) { return 'R$ ' + v.toLocaleString('pt-BR'); } }
                }
            }
        }
    });
}

// ============================================================
// PDF FLEET REPORT (jsPDF)
// ============================================================

function generateFleetReport() {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
        alert('Biblioteca jsPDF ainda carregando. Tente novamente em alguns segundos.');
        return;
    }

    var jsPDF = (window.jspdf || jspdf).jsPDF;
    var doc = new jsPDF('landscape', 'mm', 'a4');
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var now = new Date();
    var dateStr = now.toLocaleDateString('pt-BR');
    var monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // Header
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageW, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('CASA DW - Relatorio da Frota', 15, 12);
    doc.setFontSize(10);
    doc.text('Gerado em: ' + dateStr, 15, 20);
    doc.text('Total de Veiculos: ' + fleetData.vehicles.length, pageW - 80, 12);

    // Summary section
    var month = parseInt(document.getElementById('dashboardMonth').value);
    var year = parseInt(document.getElementById('dashboardYear').value);
    var mData = getMonthData(month, year);
    var totalKm = 0, totalGasto = 0, totalLitros = 0;
    mData.forEach(function(d) { totalKm += d.kmDriven; totalGasto += d.totalGasto; totalLitros += d.totalLitros; });
    var custoMedio = totalKm > 0 ? (totalGasto / totalKm) : 0;

    doc.setTextColor(44, 62, 80);
    doc.setFontSize(14);
    doc.text('Resumo - ' + monthNames[month] + '/' + year, 15, 35);

    doc.setFontSize(10);
    doc.setFillColor(230, 240, 250);
    doc.roundedRect(15, 38, 60, 18, 3, 3, 'F');
    doc.setTextColor(52, 152, 219);
    doc.text('Total KM Rodados', 20, 44);
    doc.setFontSize(14);
    doc.text(totalKm.toLocaleString('pt-BR') + ' km', 20, 52);

    doc.setFontSize(10);
    doc.setFillColor(230, 250, 230);
    doc.roundedRect(80, 38, 60, 18, 3, 3, 'F');
    doc.setTextColor(39, 174, 96);
    doc.text('Total Combustivel', 85, 44);
    doc.setFontSize(14);
    doc.text('R$ ' + totalGasto.toLocaleString('pt-BR', {minimumFractionDigits: 2}), 85, 52);

    doc.setFontSize(10);
    doc.setFillColor(255, 240, 230);
    doc.roundedRect(145, 38, 60, 18, 3, 3, 'F');
    doc.setTextColor(243, 156, 18);
    doc.text('Total Litros', 150, 44);
    doc.setFontSize(14);
    doc.text(totalLitros.toFixed(1) + ' L', 150, 52);

    doc.setFontSize(10);
    doc.setFillColor(255, 230, 230);
    doc.roundedRect(210, 38, 60, 18, 3, 3, 'F');
    doc.setTextColor(231, 76, 60);
    doc.text('Custo Medio/KM', 215, 44);
    doc.setFontSize(14);
    doc.text('R$ ' + custoMedio.toFixed(2), 215, 52);

    // Vehicle table
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text('Detalhamento por Veiculo', 15, 65);

    var tableData = fleetData.vehicles.map(function(v) {
        var stats = calcularEstatisticasAbastecimento(v);
        var vData = mData.find(function(d) { return d.placa === v.placa; });
        return [
            v.marca + ' ' + v.modelo,
            v.placa,
            v.kmAtual || '-',
            vData ? vData.kmDriven.toLocaleString('pt-BR') : '0',
            vData ? 'R$ ' + vData.totalGasto.toFixed(2) : 'R$ 0,00',
            vData && vData.totalLitros > 0 ? vData.totalLitros.toFixed(1) + 'L' : '-',
            stats.custoPorKm > 0 ? 'R$ ' + stats.custoPorKm : '-',
            v.seguradora || '-',
            formatDate(v.proxRevisao)
        ];
    });

    doc.autoTable({
        startY: 68,
        head: [['Veiculo', 'Placa', 'KM Atual', 'KM Mes', 'Gasto Mes', 'Litros', 'R$/KM', 'Seguradora', 'Prox. Revisao']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 18 },
            6: { cellWidth: 18 },
            7: { cellWidth: 28 },
            8: { cellWidth: 25 }
        }
    });

    // Alerts section
    var finalY = doc.lastAutoTable.finalY + 10;
    if (finalY > pageH - 40) {
        doc.addPage();
        finalY = 20;
    }

    var docAlerts = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    fleetData.vehicles.forEach(function(v) {
        ['ipvaVencimento', 'licenciamentoVencimento', 'seguroVencimento'].forEach(function(field) {
            if (!v[field]) return;
            var d = new Date(v[field] + 'T00:00:00');
            var diff = Math.floor((d - today) / 86400000);
            if (diff < 30) {
                var label = field === 'ipvaVencimento' ? 'IPVA' : field === 'licenciamentoVencimento' ? 'Licenciamento' : 'Seguro';
                docAlerts.push(v.marca + ' ' + v.modelo + ' (' + v.placa + ') - ' + label + ': ' + formatDate(v[field]) + (diff < 0 ? ' [VENCIDO]' : ' [' + diff + ' dias]'));
            }
        });
        if (v.proxRevisao) {
            var rd = new Date(v.proxRevisao + 'T00:00:00');
            var rdiff = Math.floor((rd - today) / 86400000);
            if (rdiff < 30) {
                docAlerts.push(v.marca + ' ' + v.modelo + ' (' + v.placa + ') - Revisao: ' + formatDate(v.proxRevisao) + (rdiff < 0 ? ' [VENCIDA]' : ' [' + rdiff + ' dias]'));
            }
        }
    });

    if (docAlerts.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(231, 76, 60);
        doc.text('Alertas de Vencimento', 15, finalY);
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        docAlerts.forEach(function(alert, i) {
            if (finalY + 6 + (i * 5) > pageH - 10) {
                doc.addPage();
                finalY = 20;
            }
            doc.text('  - ' + alert, 15, finalY + 6 + (i * 5));
        });
    }

    // Footer
    var totalPages = doc.internal.getNumberOfPages();
    for (var p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Casa DW - Sistema de Gestao | Pagina ' + p + '/' + totalPages, pageW / 2, pageH - 5, { align: 'center' });
    }

    doc.save('relatorio_frota_' + now.toISOString().split('T')[0] + '.pdf');
    showFleetToast('Relatorio PDF gerado com sucesso!', 'success');
}

// Hook evolution chart into dashboard update
var _origUpdateFleetDashboard = updateFleetDashboard;
updateFleetDashboard = function() {
    _origUpdateFleetDashboard();
    try { updateEvolutionChart(); } catch(e) { console.error('[Evolution Chart] Error:', e); }
};
window.updateFleetDashboard = updateFleetDashboard;