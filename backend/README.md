# Backend - Sistema de Gestão Casa DW

API Node.js + Express + MongoDB + Cloudinary para gerenciamento financeiro, frota e manutenções residenciais.

## 🚀 Deploy Rápido no Render.com (GRATUITO)

**Leia o guia completo:** [DEPLOY_RENDER.md](./DEPLOY_RENDER.md)

### Resumo em 3 passos:

1. **Criar conta Cloudinary** (gratuito): https://cloudinary.com/users/register_free
2. **Deploy no Render**: https://render.com/ → New Web Service → Conectar GitHub
3. **Configurar variáveis de ambiente**:
   - `MONGODB_URI` (já configurado)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

Seu backend ficará em: `https://casadw-backend.onrender.com`

---

## 📋 Tecnologias

- **Node.js** 18+
- **Express** 4.18
- **MongoDB** 6.3 (via MongoDB Atlas)
- **Cloudinary** 2.0 (armazenamento de arquivos)
- **CORS** habilitado

---

## 🔌 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Health check |
| `GET` | `/api/sync/:userId` | Obter dados do usuário |
| `POST` | `/api/sync` | Salvar dados do usuário |
| `POST` | `/api/upload` | Upload de arquivo para Cloudinary |
| `DELETE` | `/api/upload` | Deletar arquivo do Cloudinary |

---

## 🏃 Rodar Localmente

```bash
# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Edite .env com suas credenciais

# Iniciar servidor
npm start
```

Servidor rodando em: `http://localhost:3000`

---

## 📦 Estrutura

```
backend/
├── server.js           # API principal
├── package.json        # Dependências
├── render.yaml         # Config deploy Render.com
├── .gitignore          # Arquivos ignorados
└── DEPLOY_RENDER.md    # Guia completo de deploy
```

---

## 🔐 Variáveis de Ambiente Necessárias

```env
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=production
PORT=3000
```

---

## 📝 Licença

MIT
