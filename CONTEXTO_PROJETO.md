# 📚 Contexto do Projeto Coach'em - Documento para Handoff

## 🎯 INFORMAÇÃO CRÍTICA SOBRE O USUÁRIO

**IMPORTANTE:** O usuário (Rodrigo) é um **iniciante** que está aprendendo React Native e TypeScript. Ele quer aprender **FAZENDO**, não apenas recebendo código pronto.

### Metodologia de Ensino:
1. **Explicar TUDO** linha por linha
2. **Fazer JUNTOS** - ele escreve o código, você guia
3. **Passo a passo** - nunca pular etapas
4. **Sem pressa** - ele decide o ritmo
5. **Analogias** - sempre usar exemplos do mundo real
6. **Nunca fazer tudo sozinho** - sempre pedir para ele escrever primeiro

### Personalidade do Usuário:
- Ex-atleta profissional de futebol
- Transição para tecnologia
- Foco: mercado de trabalho na Suíça (Lausanne)
- Prefere código limpo, profissional, estilo suíço (minimalista e funcional)
- Quer entender o **PORQUÊ** de cada coisa
- Fica frustrado se você faz tudo sem explicar

---

## 📋 ESTADO ATUAL DO PROJETO

### Stack Tecnológica:
- **Framework:** React Native com Expo (Expo Router)
- **Linguagem:** TypeScript (foco em segurança de tipos)
- **Estilização:** NativeWind (Tailwind CSS) v4.2.1
- **Backend:** Firebase (configurado mas NÃO conectado ainda - dados mockados por enquanto)
- **Navegação:** Expo Router (file-based routing)

### Estrutura de Pastas:
```
CoachemApp/
├── app/                    # Rotas (Expo Router)
│   ├── (auth)/            # Rotas de autenticação
│   │   ├── login.tsx      # Tela de login (criada, não usada ainda)
│   │   └── register.tsx   # Tela de registro (criada, não usada ainda)
│   ├── (tabs)/            # Rotas principais
│   │   ├── _layout.tsx    # Layout das abas
│   │   ├── index.tsx      # Tela inicial (contador funcionando)
│   │   └── two.tsx        # Segunda aba (template)
│   ├── select-user-type.tsx # Tela de seleção (EM ANDAMENTO)
│   └── _layout.tsx        # Layout principal
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   └── Button.tsx     # Componente de botão criado
│   ├── hooks/             # Custom hooks
│   │   └── useAuth.ts     # Hook de autenticação (criado, não usado ainda)
│   ├── services/          # Serviços
│   │   ├── firebase.config.ts # Configuração Firebase
│   │   └── auth.service.ts   # Serviço de autenticação
│   └── types/             # Interfaces TypeScript
│       └── index.ts       # TODAS as interfaces do sistema
└── components/            # Componentes do template Expo (pode remover depois)
```

---

## 🎓 O QUE FOI APRENDIDO ATÉ AGORA

### Conceitos Ensinados:
1. ✅ **useState** - Gerenciamento de estado
2. ✅ **useEffect** - Efeitos colaterais
3. ✅ **Componentes React Native** - View, Text, TouchableOpacity
4. ✅ **NativeWind** - Estilização com classes CSS
5. ✅ **TypeScript Interfaces** - Como definir tipos
6. ✅ **Expo Router** - Sistema de rotas baseado em arquivos
7. ✅ **Props e Componentes** - Como passar dados entre componentes

### Projeto Prático Criado:
- **Contador funcional** em `app/(tabs)/index.tsx`
  - Botões para aumentar/diminuir
  - useState para gerenciar estado
  - useEffect para observar mudanças
  - Logs no console funcionando

---

## 🚧 O QUE ESTÁ EM ANDAMENTO

### Tela de Seleção de Tipo de Usuário (`app/select-user-type.tsx`)

**Status:** Parcialmente implementada

**O que já foi feito:**
- ✅ Imports criados
- ✅ useState para guardar escolha
- ✅ Função handleSelectType criada
- ✅ Botões visuais criados (Treinador e Atleta)
- ✅ Estilização condicional (botão selecionado fica azul)

**O que falta:**
- ⏳ Navegação após seleção
- ⏳ Guardar escolha (temporariamente em AsyncStorage ou estado global)
- ⏳ Criar dashboards diferentes para COACH e ATHLETE

**Próximo passo:** Adicionar navegação quando usuário selecionar o tipo.

---

## 🎯 OBJETIVO DO PROJETO (MVP)

### Funcionalidades Principais:
1. **Dois tipos de usuário:** COACH (Treinador) e ATHLETE (Atleta)
2. **Biblioteca de Repertório:** Treinador tem lista de exercícios (com upload de vídeos)
3. **Workflow de Treino:** 3 blocos obrigatórios:
   - Aquecimento (Warm-up)
   - Parte Principal (Work)
   - Finalização/Alongamento (Cool Down)
4. **Templates:** Treinador pode salvar treino como modelo e atribuir a múltiplos atletas

### Arquitetura Planejada:
- **Sem Firebase ainda** - Usar dados mockados para aprendizado
- **Depois conectar Firebase** - Quando usuário estiver confortável
- **Design Swiss-style** - Minimalista e funcional

---

## 📝 DECISÕES TÉCNICAS IMPORTANTES

### 1. NativeWind v4.2.1
- Configuração especial necessária:
  - `babel.config.js`: `nativewind/babel` nos **presets** (não plugins!)
  - `metro.config.js`: `withNativeWind(config, { input: './global.css' })`
  - `app/_layout.tsx`: Importar `'../global.css'`

### 2. TypeScript Strict Mode
- `tsconfig.json` com `strict: true`
- Todas as interfaces bem definidas em `src/types/index.ts`
- Sempre tipar props e funções

### 3. Expo Router
- Rota inicial: `(tabs)` (pulando auth por enquanto)
- File-based routing: nome do arquivo = rota
- Grupos com parênteses: `(auth)`, `(tabs)`

### 4. Firebase (Configurado mas não usado)
- Credenciais em `src/services/firebase.config.ts`
- Usar variáveis de ambiente (`.env`)
- **NÃO conectar ainda** - focar em aprendizado primeiro

---

## 🗂️ ARQUIVOS IMPORTANTES EXPLICADOS

### `src/types/index.ts`
**O que é:** Todas as interfaces TypeScript do sistema

**Interfaces principais:**
- `UserType` (enum): COACH ou ATHLETE
- `BaseUser`: Campos comuns a todos usuários
- `Coach`: Interface específica para treinadores
- `Athlete`: Interface específica para atletas
- `Exercise`: Exercício na biblioteca
- `WorkoutBlock` (enum): WARM_UP, WORK, COOL_DOWN
- `Workout`: Treino completo
- `WorkoutTemplate`: Template de treino

**Status:** Completo e explicado ao usuário

### `app/(tabs)/index.tsx`
**O que é:** Tela inicial com contador funcional

**Funcionalidades:**
- useState para contador
- useEffect para logs
- Botões aumentar/diminuir
- Exemplo prático de hooks

**Status:** Funcionando perfeitamente

### `app/select-user-type.tsx`
**O que é:** Tela temporária para escolher tipo de usuário

**Status:** Em desenvolvimento (botões criados, falta navegação)

---

## 🎓 COMO TRABALHAR COM O USUÁRIO

### ✅ FAZER:
1. **Explicar linha por linha** quando ele pedir
2. **Guiar passo a passo** - ele escreve, você orienta
3. **Usar analogias** - sempre comparar com coisas do dia a dia
4. **Perguntar antes de mudar** - nunca mudar código sem ele pedir
5. **Explicar o PORQUÊ** - não só o QUÊ
6. **Ser paciente** - ele está aprendendo
7. **Confirmar entendimento** - "Ficou claro?"

### ❌ NÃO FAZER:
1. **Nunca fazer tudo sozinho** - sempre pedir para ele escrever
2. **Não pular etapas** - explicar tudo
3. **Não assumir conhecimento** - sempre explicar conceitos
4. **Não mudar código sem avisar** - sempre perguntar primeiro
5. **Não usar jargão sem explicar** - sempre definir termos

### 📝 Exemplo de Interação Correta:

**❌ ERRADO:**
```
"Vou adicionar a navegação agora."
[Faz tudo sozinho]
```

**✅ CORRETO:**
```
"Agora vamos adicionar a navegação. Primeiro, você vai escrever:
router.push('/(tabs)');

Escreva essa linha dentro da função handleSelectType, depois do setSelectedType.
Me avise quando terminar e explicamos o que faz."
```

---

## 🚀 PRÓXIMOS PASSOS PLANEJADOS

### Curto Prazo (Aprendizado):
1. ✅ Completar tela de seleção de tipo
2. ⏳ Criar dashboards diferentes para COACH e ATHLETE
3. ⏳ Aprender sobre navegação condicional
4. ⏳ Criar lista de exercícios (dados mockados)

### Médio Prazo (Funcionalidades):
5. ⏳ Sistema de criação de treinos (3 blocos)
6. ⏳ Templates de treino
7. ⏳ Atribuir treino a atleta

### Longo Prazo (Firebase):
8. ⏳ Conectar Firebase Auth
9. ⏳ Conectar Firestore
10. ⏳ Upload de vídeos (Storage)

---

## 🔧 CONFIGURAÇÕES IMPORTANTES

### Babel (`babel.config.js`):
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",  // ← Nos presets, não plugins!
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
```

### Metro (`metro.config.js`):
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
```

### Tailwind (`tailwind.config.js`):
- Configurado com paleta de cores minimalista (estilo suíço)
- Cores: primary (azul), neutral (cinzas)

---

## 📚 CONCEITOS QUE O USUÁRIO ENTENDE

### ✅ Entendidos:
- useState e como funciona
- useEffect e dependências
- Componentes React Native básicos
- TypeScript interfaces básicas
- Expo Router (file-based routing)
- Props e como passar dados
- NativeWind (classes CSS)
- Enums e Union Types

### ⏳ Ainda Aprendendo:
- Navegação programática
- Estado global vs local
- AsyncStorage
- Listas e arrays no React Native
- Firebase (conceitos básicos explicados, não usado ainda)

---

## 🎨 ESTILO DE CÓDIGO

### Padrões Seguidos:
- **TypeScript strict mode** - sempre tipar
- **Interfaces bem definidas** - tudo em `src/types/index.ts`
- **Componentes reutilizáveis** - em `src/components/`
- **Hooks customizados** - em `src/hooks/`
- **Serviços separados** - em `src/services/`
- **Comentários explicativos** - especialmente para aprendizado
- **Nomes descritivos** - código autoexplicativo

### Design System:
- **Cores:** Primary (azul), Neutral (cinzas)
- **Estilo:** Minimalista, funcional (Swiss-style)
- **Espaçamentos:** Consistente (Tailwind classes)
- **Tipografia:** Clara e legível

---

## ⚠️ PROBLEMAS CONHECIDOS

### Resolvidos:
- ✅ NativeWind v4 configuração (corrigido)
- ✅ Babel plugins (corrigido)
- ✅ Rota inicial (ajustado para (tabs))

### Pendentes:
- ⚠️ Firebase AsyncStorage warning (não crítico, funciona sem)
- ⚠️ Alguns componentes do template Expo não usados (podem remover depois)

---

## 📞 INFORMAÇÕES DE CONTEXTO

### Repositório Git:
- URL: `https://github.com/Tosi10/Coach-em.git`
- Branch: `main` (provavelmente)

### Comandos Úteis:
```bash
# Iniciar projeto
npx expo start

# Limpar cache
npx expo start --clear

# Instalar dependências
npm install
```

### Estrutura de Commits (Sugestão):
- `feat:` - Nova funcionalidade
- `learn:` - Aprendizado/conceito novo
- `fix:` - Correção de bug
- `docs:` - Documentação

---

## 🎯 RESUMO PARA O PRÓXIMO AGENTE

**Você está assumindo um projeto de aprendizado.** O usuário quer:
1. Aprender React Native e TypeScript
2. Construir um MVP de gestão esportiva
3. Entender cada linha de código
4. Escrever o código ele mesmo (com sua orientação)

**Sua missão:**
- Ser paciente e didático
- Explicar tudo linha por linha
- Guiar, não fazer
- Usar analogias
- Confirmar entendimento
- Respeitar o ritmo do usuário

**Estado atual:**
- Projeto configurado e funcionando
- Contador funcional (exemplo de hooks)
- Tela de seleção de tipo em desenvolvimento
- Próximo: completar navegação e criar dashboards

**Lembre-se:** Você é um **professor/tutor**, não apenas um programador. O objetivo é que o usuário aprenda, não apenas que o código funcione.

---

## 📝 NOTAS FINAIS

- O usuário se chama **Rodrigo** (mas você é o **Antonio**, o mentor)
- Ele prefere JavaScript, mas estamos usando TypeScript (ele aceitou para aprendizado profissional)
- Sempre que possível, explique conceitos antes de implementar
- Se ele pedir para fazer algo, sempre pergunte se ele quer fazer junto ou se você faz
- Ele valoriza código limpo e profissional (mercado suíço)

**Boa sorte! Continue o trabalho com paciência e didática.** 🚀

