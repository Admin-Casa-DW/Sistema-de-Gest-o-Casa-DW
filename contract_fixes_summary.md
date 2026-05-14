# Correções Aplicadas - Sistema de Contratos

## Data: 26/03/2026

---

## Resumo das Correções

Foram aplicadas as seguintes correções no sistema de contratos da aba Manutenções:

### 1. **Migração Automática de Contratos Existentes**
**Problema:** Contratos cadastrados antes da implementação do campo `renewed` não tinham esse campo, causando erros na lógica de renovação e status.

**Solução:** Adicionada função de migração automática na função `loadContracts()`:
```javascript
// Migrar contratos antigos que não têm o campo 'renewed'
contracts = contracts.map(contract => {
    if (contract.renewed === undefined) {
        return { ...contract, renewed: false };
    }
    return contract;
});
```

**Resultado:** Todos os contratos existentes agora têm o campo `renewed = false`, permitindo renovações múltiplas.

---

### 2. **Custo Mensal Total - Apenas Contratos Ativos**
**Problema:** O dashboard estava somando todos os contratos, incluindo vencidos e renovados.

**Solução:** Filtro aplicado para considerar apenas contratos ativos (não vencidos E não renovados):
```javascript
const activeContractsForCost = contracts.filter(c => {
    const endDate = new Date(c.endDate);
    return endDate >= today && !c.renewed;
});
```

**Localização:** Função `updateContractsDashboard()` - linha 1602

---

### 3. **Preservação de Arquivo ao Editar**
**Problema:** Ao editar um contrato sem fazer upload de novo arquivo, o arquivo existente era perdido.

**Solução:** Lógica de preservação implementada:
```javascript
if (currentContractFile) {
    if (currentContractFile.data) {
        fileData = currentContractFile;  // Arquivo existente
    } else {
        fileData = await new Promise(...);  // Novo upload
    }
} else if (editingContractId) {
    const existingContract = contracts.find(c => c.id === editingContractId);
    fileData = existingContract?.file || null;  // Preserva arquivo original
}
```

**Localização:** Função `saveContract()` - linhas 1435-1457

---

### 4. **Renovações Múltiplas**
**Problema:** Sistema bloqueava segunda renovação do mesmo contrato.

**Solução:** Cada renovação marca apenas o contrato ATUAL como renovado, mas o NOVO contrato criado tem `renewed = false`:
```javascript
// Marcar contrato atual como renovado
contracts[index].renewed = true;

// Criar novo contrato
const newContract = {
    ...contract,
    id: Date.now().toString(),
    renewed: false  // Permite renovar novamente no futuro
};
```

**Localização:** Função `renewContract()` - linhas 1809-1820

---

### 5. **Status "Renovado" Corrigido**
**Problema:** Contratos renovados mostravam status "Vencido" ao invés de "Renovado".

**Solução:** Prioridade de verificação: primeiro checa se foi renovado, depois verifica vencimento:
```javascript
if (contract.renewed) {
    statusClass = 'renewed';
    statusText = 'Renovado';
} else if (daysUntilExpiration < 0) {
    statusClass = 'expired';
    statusText = 'Vencido';
}
```

**Localização:** Função `renderFilteredContracts()` - linhas 1685-1694

---

### 6. **Logs de Debug Adicionados**
Para facilitar diagnóstico de problemas futuros, foram adicionados console.log em:
- Renovação de contratos
- Edição de contratos
- Criação de novos contratos
- Migração de dados

---

## Como Testar as Correções

### Teste 1: Renovações Múltiplas (Elevator Elevadores)
1. Abrir a aba Manutenções → Contratos
2. Localizar contrato "Elevator Elevadores"
3. Clicar em "Renovar" - deve criar novo contrato com período 15/03/2026 - 15/03/2027
4. O contrato anterior deve mostrar status "Renovado" (azul)
5. O novo contrato deve mostrar status "Ativo" (verde)
6. Clicar em "Renovar" novamente - deve criar terceiro contrato com período 16/03/2027 - 16/03/2028

### Teste 2: Status Renovado
1. Após renovar qualquer contrato
2. Verificar que o contrato antigo mostra badge azul com texto "Renovado"
3. Botão "Renovar" não deve aparecer em contratos já renovados

### Teste 3: Editar Contrato
1. Selecionar qualquer contrato existente
2. Clicar em "Editar"
3. Alterar apenas o nome do responsável ou telefone (NÃO fazer upload de novo arquivo)
4. Salvar
5. Verificar que o arquivo anexado continua disponível
6. Clicar em "Ver Arquivo" para confirmar

### Teste 4: Custo Mensal Total
1. No dashboard de contratos, observar o card "Custo Mensal Total"
2. Verificar que apenas contratos com status "Ativo" ou "A Vencer" são somados
3. Contratos "Renovados" e "Vencidos" NÃO devem entrar no cálculo

### Teste 5: Console de Debug (F12)
1. Abrir o console do navegador (F12)
2. Realizar operações (renovar, editar, criar)
3. Observar logs detalhados mostrando cada etapa do processo
4. Em caso de erro, os logs ajudarão a identificar o problema

---

## Importante: Limpeza de Cache

**ATENÇÃO:** Após a atualização, é necessário limpar o cache do navegador para garantir que o novo código seja carregado:

1. **Chrome/Edge:** Ctrl + Shift + Delete → Limpar dados de navegação → Imagens e arquivos em cache
2. **Firefox:** Ctrl + Shift + Delete → Cache
3. **Ou simplesmente:** Ctrl + F5 na página para forçar reload sem cache

---

## Arquivos Atualizados

- `/var/www/casadw/frontend/manutencoes.js` (77KB → 78KB)
  - Adicionada migração automática
  - Adicionados logs de debug
  - Todas as correções aplicadas

---

## Status das Correções

✅ Custo mensal total - apenas contratos ativos
✅ Editar contrato - preservação de arquivo
✅ Renovações múltiplas - sem bloqueio
✅ Status "Renovado" - exibição correta
✅ Migração automática - contratos existentes
✅ Logs de debug - diagnóstico facilitado

---

## Suporte

Se algum problema persistir após limpar o cache:
1. Abrir console do navegador (F12)
2. Reproduzir o problema
3. Copiar mensagens de erro ou logs exibidos
4. Reportar com os detalhes

---

**Versão:** 1.1 - Migração e Debug
**Data:** 26/03/2026
**Desenvolvedor:** SuperAgent - CREAO
