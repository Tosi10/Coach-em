# 🏃 Coach'em - MVP de Gestão de Performance Esportiva

## 📋 Sobre o Projeto

Coach'em é um MVP (Produto Mínimo Viável) focado na gestão de performance esportiva, conectando Treinadores a Atletas em um fluxo profissional de elite.

**Desenvolvedor:** Rodrigo (ex-atleta profissional de futebol, em transição para tecnologia)  
**Mentor:** Antonio (programador sênior, professor e mentor)  
**Objetivo:** Mercado de trabalho na Suíça (Lausanne) - código limpo, profissional, estilo suíço (minimalista e funcional)

---

## 🛠️ Stack Tecnológica

- **Framework:** React Native com Expo (Expo Router)
- **Linguagem:** TypeScript (strict mode)
- **Estilização:** NativeWind v4.2.1 (Tailwind CSS)
- **Backend:** Firebase (Auth, Firestore, Storage) - configurado mas não conectado ainda
- **Navegação:** Expo Router (file-based routing)

---

## 📁 Estrutura do Projeto

```
CoachemApp/
├── app/                    # Rotas (Expo Router)
│   ├── (auth)/            # Rotas de autenticação
│   ├── (tabs)/            # Rotas principais (tabs navigation)
│   ├── select-user-type.tsx # Seleção de tipo de usuário
│   └── _layout.tsx        # Layout principal
├── src/
│   ├── components/        # Componentes reutilizáveis
│   ├── hooks/             # Custom hooks
│   ├── services/          # Serviços (Firebase, APIs)
│   └── types/             # Interfaces TypeScript
└── components/            # Componentes do template Expo
```

---

## 🚀 Como Executar

### Pré-requisitos:
- Node.js instalado
- Expo CLI (ou use `npx expo`)
- Expo Go no dispositivo/emulador

### Instalação:
```bash
npm install
```

### Executar:
```bash
npx expo start
```

### Comandos úteis:
- `npx expo start --clear` - Limpar cache
- `a` - Abrir no Android
- `i` - Abrir no iOS
- `w` - Abrir no Web
- `r` - Recarregar app

---

## 🎯 Funcionalidades (MVP)

### Planejadas:
1. ✅ Dois tipos de usuário: COACH (Treinador) e ATHLETE (Atleta)
2. ⏳ Biblioteca de Repertório: Lista de exercícios (com upload de vídeos)
3. ⏳ Workflow de Treino: 3 blocos obrigatórios
   - Aquecimento (Warm-up)
   - Parte Principal (Work)
   - Finalização/Alongamento (Cool Down)
4. ⏳ Templates: Salvar treino como modelo e atribuir a múltiplos atletas

### Status Atual:
- ✅ Estrutura base configurada
- ✅ TypeScript interfaces definidas
- ✅ Firebase configurado (não conectado ainda)
- ✅ Exemplo funcional: Contador com useState/useEffect
- 🚧 Tela de seleção de tipo de usuário (em desenvolvimento)
- ⏳ Dashboards diferentes para COACH e ATHLETE

---

## 📚 Documentação

- **`CONTEXTO_PROJETO.md`** - Documento completo de contexto para handoff entre agentes
- **`GUIA_COMPLETO.md`** - Guia de aprendizado (conceitos explicados)
- **`PLANO_APRENDIZADO.md`** - Roteiro de aprendizado passo a passo
- **`SETUP.md`** - Guia de configuração do Firebase

---

## 🔧 Configurações Importantes

### NativeWind v4:
- Configurado em `babel.config.js` (presets, não plugins)
- `metro.config.js` com `withNativeWind`
- `global.css` importado no `_layout.tsx`

### TypeScript:
- Strict mode ativado
- Todas as interfaces em `src/types/index.ts`
- Path aliases configurados (`@/*`)

### Firebase:
- Configuração em `src/services/firebase.config.ts`
- Usar variáveis de ambiente (`.env`)
- **Nota:** Ainda não conectado - usando dados mockados para aprendizado

---

## 📝 Convenções de Código

- **TypeScript strict mode** - sempre tipar
- **Interfaces bem definidas** - tudo documentado
- **Componentes reutilizáveis** - em `src/components/`
- **Hooks customizados** - em `src/hooks/`
- **Serviços separados** - em `src/services/`
- **Design Swiss-style** - minimalista e funcional

---

## 🎓 Metodologia de Desenvolvimento

Este projeto é também um **projeto de aprendizado**. O desenvolvimento segue:
- Explicação linha por linha
- Código escrito pelo desenvolvedor (não gerado automaticamente)
- Passo a passo, sem pular etapas
- Foco em entender o "porquê", não apenas o "como"

---

## 📦 Dependências Principais

```json
{
  "expo": "~54.0.30",
  "expo-router": "~6.0.21",
  "react-native": "0.81.5",
  "typescript": "~5.9.2",
  "nativewind": "^4.2.1",
  "firebase": "^12.7.0",
  "tailwindcss": "^3.3.2"
}
```

---

## 🔐 Variáveis de Ambiente

Criar arquivo `.env` na raiz:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 📄 Licença

Projeto privado - desenvolvimento em andamento

---

## 👥 Contato

- **Desenvolvedor:** Rodrigo
- **Repositório:** https://github.com/Tosi10/Coach-em.git

---

**Status:** 🚧 Em desenvolvimento ativo (fase de aprendizado e MVP)

