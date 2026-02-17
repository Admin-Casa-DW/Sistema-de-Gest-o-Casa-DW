#!/bin/bash

# Script de Deploy Automático
# Sistema de Controle Financeiro Casa Rio

echo "🚀 Iniciando deploy do Sistema..."
echo ""

# Verificar se está em um repositório Git
if [ ! -d .git ]; then
    echo "❌ Erro: Não é um repositório Git."
    echo "Execute primeiro: git init"
    exit 1
fi

# Verificar se há alterações
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Nenhuma alteração para fazer commit."
    exit 0
fi

# Mostrar arquivos alterados
echo "📝 Arquivos modificados:"
git status --short
echo ""

# Pedir mensagem de commit
read -p "💬 Mensagem do commit (ou Enter para 'Atualização do sistema'): " commit_msg
commit_msg=${commit_msg:-"Atualização do sistema"}

# Fazer commit
echo ""
echo "📦 Fazendo commit..."
git add .
git commit -m "$commit_msg"

# Verificar se há remote configurado
if ! git remote | grep -q 'origin'; then
    echo ""
    echo "⚠️  Remote 'origin' não configurado."
    read -p "📍 URL do repositório GitHub (ex: https://github.com/user/repo.git): " repo_url
    git remote add origin "$repo_url"
fi

# Push para GitHub
echo ""
echo "⬆️  Enviando para GitHub..."
git push origin main 2>/dev/null || git push origin master 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy realizado com sucesso!"
    echo ""
    echo "🌐 Seu site será atualizado em 1-2 minutos."
    echo "💡 Dica: Limpe o cache do navegador para ver as mudanças."
else
    echo ""
    echo "❌ Erro ao fazer push."
    echo "💡 Verifique suas credenciais do GitHub."
fi
