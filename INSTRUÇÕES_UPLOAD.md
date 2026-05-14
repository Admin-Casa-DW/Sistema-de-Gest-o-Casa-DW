# Instruções para Aplicar as Correções

## Opção 1: Upload Manual via Painel KingHost (Mais Fácil)

### Passo 1: Fazer Backup
1. Acesse o painel da KingHost
2. Vá em "Gerenciador de Arquivos"
3. Localize os arquivos:
   - `manutencoes.js`
   - `manutencoes.html`
4. Faça download de ambos (backup)
5. Renomeie os downloads para:
   - `manutencoes.js.backup`
   - `manutencoes.html.backup`

### Passo 2: Upload dos Arquivos Corrigidos
1. No gerenciador de arquivos da KingHost
2. Faça upload dos novos arquivos (substituindo os antigos):
   - `manutencoes.js` (novo)
   - `manutencoes.html` (novo)
3. Confirme a substituição

### Passo 3: Testar
1. Abra https://casadw.com.br/manutencoes.html
2. Pressione Ctrl+Shift+R (refresh forçado)
3. Faça login
4. Acesse a aba "Contratos"
5. Teste as funcionalidades

---

## Opção 2: Upload via FTP

### Requisitos
- Cliente FTP (FileZilla, WinSCP, etc.)
- Credenciais FTP da KingHost

### Passos
1. Conecte via FTP ao servidor: 191.252.210.91
2. Navegue até o diretório do projeto
3. Faça backup dos arquivos atuais (download)
4. Faça upload dos novos arquivos:
   - `manutencoes.js`
   - `manutencoes.html`
5. Teste no navegador

---

## Opção 3: Via SSH (Se Disponível)

Se você tiver acesso SSH ao servidor:

```bash
# 1. Conectar ao servidor
ssh usuario@191.252.210.91

# 2. Ir para o diretório do projeto (ajuste o caminho)
cd /var/www/html  # ou caminho correto

# 3. Fazer backup
cp manutencoes.js manutencoes.js.backup
cp manutencoes.html manutencoes.html.backup

# 4. Baixar os novos arquivos
# (você precisa disponibilizar via URL ou usar scp)

# 5. Reiniciar servidor web (se necessário)
sudo systemctl restart nginx  # ou apache2
```

---

## Verificando se as Correções Foram Aplicadas

Após fazer upload, abra o console do navegador (F12) e procure por:

```
✅ Contratos salvos com sucesso
```

Ou execute no console:

```javascript
// Verificar versão corrigida
localStorage.getItem('maintenanceContracts') ?
  console.log('✅ Versão corrigida instalada') :
  console.log('⚠️ Nenhum contrato salvo ainda');
```

---

## Testando Cada Correção

### 1. Testar Status "Renovado"
1. Abra um contrato vencido (ex: Elevator Elevadores)
2. Clique em "Renovar"
3. Confirme a renovação
4. Verifique se o status mudou para "Renovado" (roxo/lilás)
5. Filtre por "Renovados" no dropdown

✅ **Esperado**: Status deve aparecer como "Renovado"

---

### 2. Testar Segunda Renovação
1. Pegue um contrato renovado
2. Clique em "Renovar" novamente
3. Confirme

✅ **Esperado**: Deve criar novo contrato sem erros

---

### 3. Testar Salvamento de Edições
1. Clique em "Editar" em qualquer contrato
2. Mude algum campo (ex: telefone, descrição)
3. Clique em "Salvar"

✅ **Esperado**: Deve salvar sem erros

---

### 4. Testar Limpeza de Arquivos
1. Clique no botão "Limpar Arquivos" (laranja, ícone de vassoura)
2. Veja quantos arquivos podem ser removidos
3. Confirme a limpeza

✅ **Esperado**: Deve mostrar quantos arquivos foram removidos e espaço liberado

---

### 5. Testar Limite de Arquivo
1. Tente anexar um arquivo > 2MB
2. Deve mostrar erro: "Arquivo muito grande (XMB). Máximo: 2MB"

✅ **Esperado**: Não deve permitir upload

---

## Se o Erro QuotaExceededError Persistir

**SOLUÇÃO IMEDIATA**:
1. Clique no botão "Limpar Arquivos"
2. Isso deve liberar espaço suficiente

**Se não resolver**:
1. Abra o console (F12)
2. Execute:
```javascript
// Ver tamanho atual
const size = new Blob([localStorage.getItem('maintenanceContracts')]).size;
console.log('Tamanho:', (size / 1024 / 1024).toFixed(2), 'MB');
```

3. Se > 4MB, execute limpeza manual:
```javascript
// CUIDADO: Isso remove arquivos permanentemente!
const contracts = JSON.parse(localStorage.getItem('maintenanceContracts'));
const cleaned = contracts.map(c => ({...c, file: null}));
localStorage.setItem('maintenanceContracts', JSON.stringify(cleaned));
location.reload();
```

---

## Arquivos Incluídos no Pacote

1. ✅ `manutencoes.js` - Arquivo JavaScript corrigido
2. ✅ `manutencoes.html` - Arquivo HTML corrigido
3. ✅ `CORREÇÕES_CONTRATOS.md` - Documentação detalhada
4. ✅ `INSTRUÇÕES_UPLOAD.md` - Este arquivo

---

## Suporte Pós-Instalação

Se após aplicar as correções você ainda tiver problemas:

1. Abra o console do navegador (F12)
2. Vá na aba "Console"
3. Tire uma screenshot dos erros
4. Compartilhe para análise

---

## Changelog

### Versão 2.1 (27/03/2026)
- ✅ Corrigido QuotaExceededError
- ✅ Adicionado tratamento robusto de erros
- ✅ Limite de arquivo reduzido para 2MB
- ✅ Nova função de limpeza de arquivos antigos
- ✅ Filtro de contratos renovados
- ✅ Status "Renovado" funcionando
- ✅ Múltiplas renovações suportadas
- ✅ Salvamento de edições corrigido

---

**Importante**: Sempre faça backup antes de substituir arquivos!
