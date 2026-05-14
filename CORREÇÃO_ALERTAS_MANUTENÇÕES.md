# Correção: Alertas de Manutenções Recorrentes

## ✅ Problema Resolvido

**Bug**: Ao editar a data de uma manutenção recorrente, ela desaparecia dos alertas de "Próximas Manutenções"

**Exemplo**:
- Manutenção "Ar condicionado central - Preserva"
- Data original: 26/03/2026
- Alterada para: 31/03/2026
- ❌ **Resultado**: Não aparecia mais nos alertas

---

## 🔍 Causa Raiz do Problema

### Como funciona o sistema de alertas:

A função `getAlertDate()` determina qual data usar para calcular alertas:

```javascript
function getAlertDate(m) {
    // Prioridade: nextDate se existir, senão date
    if (m.nextDate) return m.nextDate;
    return m.date;
}
```

**Problema**: `nextDate` tem PRIORIDADE sobre `date`

### Estrutura de dados de uma manutenção:

```json
{
    "id": "manut_123456789",
    "type": "Manutenção preventiva",
    "area": "Ar condicionado central",
    "supplier": "Preserva",
    "date": "2026-03-26",        // Data agendada
    "nextDate": "2026-04-25",    // Próxima recorrência (se houver)
    "status": "pendente",
    "recurring": "sim",
    "period": "30"               // Dias para próxima
}
```

### O que acontecia ao editar:

1. **Estado inicial**:
   ```json
   {
       "date": "2026-03-26",
       "nextDate": "2026-04-25"
   }
   ```

2. **Usuário edita `date` para "2026-03-31"**:
   ```json
   {
       "date": "2026-03-31",    // ✅ Atualizado
       "nextDate": "2026-04-25" // ❌ PERMANECEU ANTIGO!
   }
   ```

3. **getAlertDate() retorna**:
   - Ignora `date` (31/03)
   - Retorna `nextDate` (25/04) ← **DATA ERRADA!**

4. **Resultado**:
   - Sistema calcula alerta para 25/04 (fora do range de 7 dias)
   - Manutenção NÃO aparece nos alertas ❌

---

## 🛠️ Solução Implementada

### Lógica de correção no `saveManut()`:

**ANTES**:
```javascript
const record = {
    id,
    type,
    area,
    date,
    nextDate,  // ❌ Sempre mantinha o valor antigo
    // ...
};
```

**DEPOIS**:
```javascript
let existingFiles = [];
let previousDate = null;
if (editingId) {
    const existing = maintenances.find(x => x.id === editingId);
    existingFiles = existing?.files || [];
    previousDate = existing?.date; // Salvar data anterior
}

// Se a data foi alterada, limpar nextDate
let finalNextDate = nextDate;
if (editingId && previousDate && previousDate !== date) {
    console.log(`📅 Data alterada de ${previousDate} para ${date} - limpando nextDate`);
    finalNextDate = ''; // ✅ Limpar nextDate!
}

const record = {
    id,
    type,
    area,
    date,
    nextDate: finalNextDate, // ✅ Usa nextDate limpo se data mudou
    // ...
};
```

---

## 📊 Fluxo Corrigido

### Cenário: Editar data de 26/03 para 31/03

#### 1. **Estado Antes da Edição**:
```json
{
    "id": "manut_123",
    "date": "2026-03-26",
    "nextDate": "2026-04-25",
    "status": "pendente"
}
```

#### 2. **Usuário Edita**:
- Campo `date`: "2026-03-26" → "2026-03-31"
- Clica em "Salvar"

#### 3. **Sistema Detecta Mudança**:
```javascript
previousDate = "2026-03-26"
date = "2026-03-31"
previousDate !== date // true

console.log("📅 Data alterada de 2026-03-26 para 2026-03-31 - limpando nextDate")
finalNextDate = '' // ✅ LIMPO!
```

#### 4. **Estado Após Salvar**:
```json
{
    "id": "manut_123",
    "date": "2026-03-31",    // ✅ Atualizado
    "nextDate": "",          // ✅ LIMPO!
    "status": "pendente"
}
```

#### 5. **getAlertDate() Agora Retorna**:
```javascript
function getAlertDate(m) {
    if (m.nextDate) return m.nextDate; // '' → false
    return m.date; // ✅ Retorna "2026-03-31"
}
```

#### 6. **Cálculo de Alertas**:
```javascript
const today = new Date("2026-03-30"); // Hoje
const refDate = new Date("2026-03-31T00:00:00"); // Manutenção
const days = Math.floor((refDate - today) / 86400000); // 1 dia

// 1 dia <= 7 dias ✅
soon.push({ m, refDate, days }); // ✅ APARECE NOS ALERTAS!
```

---

## ✅ Benefícios da Correção

| Antes | Depois |
|-------|--------|
| ❌ Editar data quebrava alertas | ✅ Alertas funcionam após editar |
| ❌ `nextDate` ficava desatualizado | ✅ `nextDate` limpo ao mudar `date` |
| ❌ Usuário não via manutenção próxima | ✅ Manutenção aparece corretamente |
| ❌ Confusão sobre qual data vale | ✅ `date` sempre tem prioridade após edição |

---

## 🧪 Como Testar

### Teste 1: Editar Data de Manutenção

```
1. Acesse https://casadw.com.br/manutencoes.html
2. Pressione Ctrl+Shift+R (limpar cache)
3. Vá em "Manutenções"
4. Localize "Ar condicionado central - Preserva"
5. Clique em "Editar"
6. Mude a data de 26/03/2026 para 31/03/2026
7. Clique em "Salvar"
8. Vá na aba "Agenda"
9. Veja a seção "Próximas — 7 dias"

✅ ESPERADO:
   • Manutenção aparece nos alertas
   • Mostra "1 dia" ou "Amanhã"
   • Console mostra:
     "📅 Data alterada de 2026-03-26 para 2026-03-31 - limpando nextDate"
```

---

### Teste 2: Verificar Console (F12)

Ao salvar após editar data:

```javascript
📅 Data alterada de 2026-03-26 para 2026-03-31 - limpando nextDate
✅ Manutenção atualizada!
```

---

### Teste 3: Inspeção de Dados

Abra console (F12) e execute:

```javascript
// Ver manutenções
const maintenances = JSON.parse(localStorage.getItem('manut_local'));

// Encontrar a manutenção "Ar condicionado central"
const ac = maintenances.find(m => m.area === "Ar condicionado central");

console.log("Data:", ac.date);       // "2026-03-31"
console.log("NextDate:", ac.nextDate); // "" (vazio) ✅

// Verificar qual data getAlertDate usaria
const alertDate = ac.nextDate || ac.date;
console.log("Data para alertas:", alertDate); // "2026-03-31" ✅
```

---

## 📋 Situações Cobertas

### ✅ Situação 1: Editar data de manutenção pendente
- Data alterada → `nextDate` limpo
- Alertas usam nova data

### ✅ Situação 2: Editar outros campos SEM mudar data
- `nextDate` mantido (não limpo)
- Alertas continuam funcionando normalmente

### ✅ Situação 3: Concluir manutenção recorrente
- Sistema cria nova manutenção
- Nova manutenção tem `nextDate` vazio
- `date` calculado a partir do período

### ✅ Situação 4: Criar nova manutenção
- `nextDate` começa vazio
- `date` é a data agendada
- Alertas funcionam normalmente

---

## 🔧 Código Modificado

### Arquivo: `manutencoes.js`

**Função**: `saveManut()` (linhas ~854-876)

**Linhas adicionadas**:
```javascript
// Linha 855-859: Captura data anterior
let previousDate = null;
if (editingId) {
    const existing = maintenances.find(x => x.id === editingId);
    existingFiles = existing?.files || [];
    previousDate = existing?.date; // ✅ NOVO
}

// Linha 861-866: Limpeza condicional de nextDate
let finalNextDate = nextDate;
if (editingId && previousDate && previousDate !== date) {
    console.log(`📅 Data alterada de ${previousDate} para ${date} - limpando nextDate`);
    finalNextDate = ''; // ✅ NOVO
}

// Linha 868: Usa finalNextDate em vez de nextDate
nextDate: finalNextDate, // ✅ MODIFICADO
```

---

## 🎯 Comportamento Esperado

### Quando `nextDate` é usado:

1. **Manutenção recorrente concluída**:
   - Sistema cria próxima manutenção
   - `nextDate` calculado automaticamente
   - **NÃO deve ser editado manualmente**

2. **Antes de editar data**:
   ```json
   { "date": "2026-03-26", "nextDate": "2026-04-25" }
   ```

3. **Depois de editar data para 31/03**:
   ```json
   { "date": "2026-03-31", "nextDate": "" }
   ```
   ✅ `nextDate` limpo, alerta usa `date`

---

## 📊 Logs Adicionados

### No console do navegador (F12):

**Ao editar e mudar data**:
```
📅 Data alterada de 2026-03-26 para 2026-03-31 - limpando nextDate
✅ Manutenção atualizada!
```

**Ao editar sem mudar data**:
```
✅ Manutenção atualizada!
```
(sem log de data alterada)

---

## 🚀 Deploy

### Informações do Deploy:

- **Data**: 30/03/2026
- **Horário**: ~09:02
- **Arquivo**: `manutencoes.js` (84KB)
- **Backup**: `manutencoes.js.backup-alertas-20260330-120XXX`
- **Servidor**: 191.252.210.91
- **Diretório**: `/var/www/casadw/frontend/`

### Verificação:

```bash
# Confirmar linha modificada existe
grep -n "Data alterada de" /var/www/casadw/frontend/manutencoes.js

# Resultado:
865:            console.log(`📅 Data alterada de ${previousDate} para ${date} - limpando nextDate`);
```

✅ **Deploy confirmado com sucesso!**

---

## 📝 Casos de Uso

### Caso 1: Manutenção Preventiva AC
```
Antes:  26/03/2026 (não aparecia no alerta)
Editar: 31/03/2026
Depois: ✅ Aparece em "Próximas — 7 dias" (1 dia)
```

### Caso 2: Manutenção Piscina
```
Antes:  15/04/2026
Editar: 02/04/2026 (antecipou)
Depois: ✅ Aparece em "Próximas — 7 dias" (3 dias)
```

### Caso 3: Manutenção Jardim
```
Antes:  20/03/2026 (vencida)
Editar: 05/04/2026 (adiou)
Depois: ✅ Sai de "Vencidas", vai para "Próximas" (6 dias)
```

---

## ⚠️ Observações Importantes

### 1. `nextDate` é um campo INTERNO

- Calculado automaticamente pelo sistema
- **Não deve ser editado manualmente pelo usuário**
- Limpo automaticamente quando `date` muda

### 2. Campos no formulário de edição

O formulário tem campo `manutNextDate` mas:
- Geralmente está vazio para edição manual
- Preenchido apenas ao concluir recorrente
- **A correção limpa ele quando `date` muda**

### 3. Compatibilidade

A correção é **100% retrocompatível**:
- ✅ Manutenções antigas continuam funcionando
- ✅ Não afeta manutenções não-recorrentes
- ✅ Não quebra fluxo de conclusão de recorrentes

---

## 🎉 Resultado Final

### ANTES da correção:
```
Editar data de 26/03 → 31/03
❌ Manutenção sumiu dos alertas
❌ nextDate com valor antigo (25/04)
❌ Sistema usava data errada
```

### DEPOIS da correção:
```
Editar data de 26/03 → 31/03
✅ Manutenção aparece nos alertas
✅ nextDate limpo automaticamente
✅ Sistema usa data correta (31/03)
```

---

## 📚 Referências

### Funções relacionadas:

1. **getAlertDate(m)** - Linha 170
   - Determina qual data usar para alertas
   - Prioriza `nextDate` se existir

2. **buildAlertLists()** - Linha 176
   - Constrói listas de alertas vencidos e próximos
   - Usa `getAlertDate()` para cada manutenção

3. **saveManut()** - Linha 824
   - Salva/edita manutenção
   - ✅ **Agora limpa `nextDate` quando `date` muda**

4. **createRecurringMaintenance()** - Linha 1248
   - Cria próxima manutenção ao concluir recorrente
   - Define `nextDate` vazio na nova manutenção

---

**Versão**: 3.1 - Alert Fix
**Status**: ✅ Implementado e em produção
**Data**: 30/03/2026

**Agora a manutenção "Ar condicionado central - Preserva" aparece corretamente nos alertas!** 🎉
