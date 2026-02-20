# 🚀 Deploy do Backend no Render.com (GRATUITO)

## Passo 1: Obter Credenciais do Cloudinary

O Cloudinary é usado para armazenar comprovantes e imagens. Você precisa criar uma conta gratuita:

1. Acesse: https://cloudinary.com/users/register_free
2. Crie uma conta gratuita (10GB de armazenamento)
3. Após o login, acesse **Dashboard** e copie:
   - `Cloud Name` (ex: `dcasadw`)
   - `API Key` (ex: `123456789012345`)
   - `API Secret` (ex: `abcdefghijklmnopqrstuvwxyz123`)

**⚠️ IMPORTANTE:** Guarde essas credenciais - você vai precisar na configuração do Render.

---

## Passo 2: Fazer Push do Backend para GitHub

O backend precisa estar no repositório GitHub para o Render.com conseguir fazer deploy.

### Opção A: Criar pasta `backend/` no repositório existente

```bash
# No repositório Admin-Casa-DW/Sistema-de-Gest-o-Casa-DW
# Adicionar pasta backend/
```

### Opção B: Criar repositório separado (recomendado)

1. Acesse: https://github.com/new
2. Nome do repositório: `casadw-backend`
3. Deixe como **público**
4. **NÃO** marque "Add README"
5. Clique em "Create repository"

---

## Passo 3: Deploy no Render.com

### 3.1 Criar conta no Render

1. Acesse: https://render.com/
2. Clique em **"Get Started"**
3. Faça login com sua conta GitHub (Admin-Casa-DW)
4. Autorize o Render a acessar seus repositórios

### 3.2 Criar Web Service

1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub:
   - Se criou repositório separado: selecione `casadw-backend`
   - Se usou pasta no repo existente: selecione `Sistema-de-Gest-o-Casa-DW`
3. Clique em **"Connect"**

### 3.3 Configurar o Service

Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `casadw-backend` |
| **Region** | `Oregon (US West)` ou `Frankfurt (EU)` |
| **Branch** | `main` |
| **Root Directory** | `backend` (se estiver em pasta) ou deixe vazio |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

### 3.4 Configurar Variáveis de Ambiente

Role até **"Environment Variables"** e adicione:

| Key | Value | Onde obter |
|-----|-------|------------|
| `MONGODB_URI` | `mongodb+srv://casario:casario123@cluster0.mongodb.net/casadw?retryWrites=true&w=majority` | Já configurado no MongoDB Atlas |
| `CLOUDINARY_CLOUD_NAME` | `SEU_CLOUD_NAME` | Dashboard do Cloudinary |
| `CLOUDINARY_API_KEY` | `SUA_API_KEY` | Dashboard do Cloudinary |
| `CLOUDINARY_API_SECRET` | `SEU_API_SECRET` | Dashboard do Cloudinary |
| `NODE_ENV` | `production` | - |
| `PORT` | `3000` | - |

**⚠️ ATENÇÃO:** Substitua `SEU_CLOUD_NAME`, `SUA_API_KEY` e `SEU_API_SECRET` pelas credenciais reais do Cloudinary!

### 3.5 Deploy

1. Clique em **"Create Web Service"**
2. Aguarde 2-5 minutos enquanto o Render faz o build e deploy
3. Quando aparecer **"Live"** com bolinha verde, seu backend está no ar! 🎉

---

## Passo 4: Testar o Backend

Seu backend estará disponível em:
```
https://casadw-backend.onrender.com
```

**Teste o Health Check:**
```bash
curl https://casadw-backend.onrender.com
```

Resposta esperada:
```json
{
  "status": "OK",
  "message": "API Casa DW funcionando!",
  "timestamp": "2026-02-20T...",
  "db": "MongoDB conectado"
}
```

---

## Passo 5: Conectar Frontend ao Backend

Agora você precisa atualizar o frontend para usar a URL do Render:

### Opção 1: Atualizar `config.js`

```javascript
const API_URL = 'https://casadw-backend.onrender.com';
```

### Opção 2: Criar `.env` no frontend (se usar build tools)

```
VITE_API_URL=https://casadw-backend.onrender.com
REACT_APP_API_URL=https://casadw-backend.onrender.com
```

---

## 🔥 Limitações do Plano Free do Render

- ⏱️ **Sleep após 15min de inatividade**: primeira requisição pode demorar 30-50 segundos
- 💾 **750 horas/mês**: suficiente para uso pessoal/teste
- 🌍 **Domínio**: `*.onrender.com` (não customizável no free)

### Solução para o Sleep:

Use um serviço de ping a cada 10 minutos:
- https://uptimerobot.com/ (gratuito)
- Ou configure um cron job para fazer `GET https://casadw-backend.onrender.com` a cada 10min

---

## 📊 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Health check |
| `GET` | `/api/sync/:userId` | Obter dados do usuário |
| `POST` | `/api/sync` | Salvar dados do usuário |
| `POST` | `/api/upload` | Upload de arquivo para Cloudinary |
| `DELETE` | `/api/upload` | Deletar arquivo do Cloudinary |

---

## 🆘 Troubleshooting

### Erro: "Application failed to respond"
- Verifique se `PORT` está configurado nas env vars
- Verifique se o `npm start` está correto no `package.json`

### Erro: "MongoDB connection failed"
- Verifique se `MONGODB_URI` está correta
- Teste a conexão no MongoDB Compass

### Erro: "Cloudinary upload failed"
- Verifique se as 3 variáveis do Cloudinary estão corretas
- Teste as credenciais no dashboard do Cloudinary

### Deploy travado no Build
- Verifique os logs no Render
- Certifique-se que `package.json` está correto
- Node version >= 18 (definido no `engines`)

---

## 🔄 Próximos Passos

Após o backend estar no ar:

1. ✅ Testar upload de comprovantes
2. ✅ Testar sincronização de dados
3. ✅ Configurar CORS se necessário (já está configurado)
4. ✅ Configurar UptimeRobot para evitar sleep
5. 📱 Testar integração completa frontend + backend

---

## 💰 Upgrade para Paid (Opcional)

Se o sleep incomodar ou quiser domínio customizado:

| Plano | Preço | Benefícios |
|-------|-------|------------|
| **Starter** | $7/mês | Sem sleep, 512MB RAM, domínio customizado |
| **Standard** | $25/mês | 2GB RAM, melhor performance |

Mas o **Free** é suficiente para começar!
