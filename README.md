# 💼 Sistema de Controle Financeiro Casa Rio

Sistema completo de controle financeiro com gerenciamento de despesas, receitas e frota de veículos.

## 🌐 Acesso Online

**URL do Sistema:** _Será configurado após deploy no GitHub Pages_

**Credenciais de Acesso:**
- **Usuário:** admin
- **Senha:** admin

## 🚀 Características Principais

### ✨ Funcionalidades

- **Navegação por Meses**: Selecione e visualize despesas de qualquer mês de 2025
- **Dashboard Completo**: Visualização de entradas, despesas e saldo em cards informativos
- **Upload de Notas Fiscais**:
  - Upload de múltiplos arquivos (imagens e PDFs)
  - Captura por câmera (mobile)
  - Conversão automática de imagens para PDF
  - Suporte a PDFs multipáginas
  - Visualização de notas fiscais em nova janela
- **Gerenciamento de Despesas**:
  - Adicionar, editar e excluir despesas
  - Campos: Data, Descrição, Categoria, Fornecedor, Valor, Forma de Pagamento, Vencimento
  - Anexar notas fiscais (opcional)
- **Formas de Pagamento**:
  - Cartão de Crédito
  - Reembolso
  - Conta Corrente
  - Outros
- **Filtros Avançados**:
  - Busca por texto (descrição ou fornecedor)
  - Filtro por categoria
  - Filtro por forma de pagamento
- **Gráficos Interativos**:
  - Gráfico de pizza: Despesas por categoria
  - Gráfico de barras: Evolução mensal
- **Exportação de Dados**: Exporte despesas do mês em formato JSON
- **Armazenamento Automático**: Dados salvos automaticamente no navegador (LocalStorage)

### 📊 Categorias Disponíveis

- Alimentação
- Transporte
- Farmácia
- Manutenção
- Hotel
- Escritório
- Carro
- Outros

## 🎨 Interface

- Design moderno com gradiente purple-blue
- Cards informativos para métricas principais
- Tabela responsiva com todas as despesas
- Modal elegante para adicionar/editar despesas
- Preview de notas fiscais antes de salvar
- Ícones FontAwesome para melhor UX
- Notificações toast para feedback ao usuário
- Totalmente responsivo para mobile e desktop

## 📱 Recursos Mobile

- Captura de notas fiscais pela câmera
- Interface adaptativa para telas pequenas
- Upload de múltiplas fotos
- Conversão automática de fotos para PDF

## 💾 Armazenamento

Todos os dados são armazenados localmente no navegador usando LocalStorage, incluindo:
- Dados das despesas
- Notas fiscais em formato base64
- PDFs convertidos

**Nota**: Por usar base64, o armazenamento é limitado pelo navegador (geralmente 5-10MB). Para uso em produção, recomenda-se integração com backend.

## 🔧 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com gradientes e animações
- **JavaScript (Vanilla)**: Lógica da aplicação
- **Chart.js**: Gráficos interativos
- **jsPDF**: Conversão de imagens para PDF
- **Font Awesome**: Ícones
- **LocalStorage API**: Persistência de dados

## 📖 Como Usar

### Adicionar uma Despesa

1. Clique no botão "Nova Despesa"
2. Preencha os campos obrigatórios:
   - Data
   - Descrição
   - Categoria
   - Fornecedor
   - Valor
   - Forma de Pagamento
3. Opcionalmente:
   - Defina uma data de vencimento
   - Faça upload de notas fiscais (múltiplos arquivos)
   - Ou capture uma foto usando a câmera
4. Clique em "Salvar"

### Upload de Notas Fiscais

- **Selecionar Arquivos**: Clique no botão e escolha imagens (JPG, PNG) ou PDFs
- **Usar Câmera**: Clique no botão câmera para capturar foto diretamente (mobile)
- **Múltiplos Arquivos**: Selecione várias fotos que serão combinadas em um único PDF
- **Visualizar**: Clique no ícone PDF na tabela para abrir a nota em nova janela
- **Remover**: Clique no X na prévia para remover um arquivo antes de salvar

### Navegar pelos Meses

Use o seletor de mês no cabeçalho para alternar entre os 12 meses de 2025. Os dados são filtrados automaticamente.

### Filtrar Despesas

Use os campos de busca e filtros para encontrar despesas específicas:
- **Buscar**: Digite descrição ou fornecedor
- **Categoria**: Selecione categoria específica
- **Forma de Pagamento**: Filtre por método de pagamento

### Editar/Excluir

- **Editar**: Clique no ícone de lápis na linha da despesa
- **Excluir**: Clique no ícone de lixeira (será solicitada confirmação)

### Exportar Dados

Clique no botão "Exportar" para baixar as despesas do mês atual em formato JSON.

## 🎯 Análise do Excel Original

O sistema foi desenvolvido baseado na estrutura do arquivo "Controle_Financeiro_MATRIZ.xlsx":
- **Sheets**: 12 meses de 2025 + MODELO + CONF
- **Estrutura**: Data, Descrição, Categoria, Fornecedor, Total, Vencimento
- **Categorias**: Alimentação, Hotel, Transporte, Escritório, Farmácia, Manutenção, Carro, Outros
- **Fornecedores**: Amoedo, Carrefour, Detail Wash, Droga Raia, etc.

## 🔒 Segurança e Privacidade

- Todos os dados ficam armazenados localmente no navegador
- Nenhuma informação é enviada para servidores externos
- Notas fiscais são armazenadas em formato base64 no LocalStorage
- Limpe os dados do navegador para remover todas as informações

## 📋 Requisitos

- Navegador moderno com suporte a:
  - ES6+ JavaScript
  - LocalStorage API
  - FileReader API
  - Canvas API (para jsPDF)
- Conexão com internet para carregar:
  - Chart.js (CDN)
  - jsPDF (CDN)
  - Font Awesome (CDN)

## 🌐 Acesso

O sistema está hospedado e pode ser acessado através do link fornecido após o deploy.

## 📄 Licença

Sistema desenvolvido para uso interno - Controle Financeiro Casa Rio

---

**Desenvolvido com CREAO** | Sistema de Controle Financeiro v1.0 | 2025
