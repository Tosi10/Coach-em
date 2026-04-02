# Treina+ - Guia de Configuração Inicial

## 🚀 Estrutura do Projeto

O projeto está organizado seguindo as melhores práticas de arquitetura:

```
/app              # Rotas com Expo Router
  /(auth)         # Rotas de autenticação (login, registro)
  /(tabs)         # Rotas principais do app (tabs navigation)
/src
  /components     # Componentes reutilizáveis
  /services       # Serviços (Firebase, APIs)
  /types          # Interfaces TypeScript
  /hooks          # Custom hooks (useAuth, etc.)
```

## 🔥 Configuração do Firebase

### 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Siga o assistente de criação

### 2. Obter Credenciais

1. No Firebase Console, vá em **Project Settings** (ícone de engrenagem)
2. Role até a seção **Your apps**
3. Se não tiver um app web, clique em **Add app** > **Web** (ícone `</>`)
4. Registre o app e copie as credenciais

### 3. Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto (baseado no `.env.example`)
2. Preencha com suas credenciais do Firebase:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=sua-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=seu-app-id
```

### 4. Configurar Firestore Database

1. No Firebase Console, vá em **Firestore Database**
2. Clique em **Create database**
3. Escolha modo **Production** ou **Test** (para desenvolvimento)
4. Escolha uma localização (ex: `europe-west` para Suíça)

### 5. Configurar Authentication

1. No Firebase Console, vá em **Authentication**
2. Clique em **Get started**
3. Habilite **Email/Password** como método de login

### 6. Configurar Storage (para vídeos)

1. No Firebase Console, vá em **Storage**
2. Clique em **Get started**
3. Aceite as regras padrão (você pode ajustar depois)

## 📦 Instalação de Dependências

As dependências já foram instaladas, mas caso precise reinstalar:

```bash
npm install
```

## 🎨 NativeWind (Tailwind CSS)

O NativeWind já está configurado. Para usar classes do Tailwind:

```tsx
<View className="flex-1 bg-white p-4">
  <Text className="text-2xl font-bold text-neutral-900">
    Treina+
  </Text>
</View>
```

## 🏃 Executar o Projeto

```bash
npx expo start
```

Depois, pressione:
- `a` para Android
- `i` para iOS
- `w` para Web

## 📚 Próximos Passos

1. ✅ Estrutura de pastas criada
2. ✅ Interfaces TypeScript definidas
3. ✅ Firebase configurado
4. ✅ Autenticação implementada
5. ⏭️ Próximo: Implementar telas principais (Dashboard, Biblioteca de Exercícios, etc.)

## 🎯 Conceitos TypeScript Importantes

### Interfaces vs Types

- **Interfaces**: Use para objetos que representam contratos (User, Exercise)
- **Types**: Use para unions, intersections, ou tipos mais complexos

### Enums

```typescript
enum UserType {
  COACH = 'COACH',
  ATHLETE = 'ATHLETE',
}
```

Garante que apenas valores válidos sejam aceitos.

### Generics

```typescript
function getData<T>(id: string): Promise<T> {
  // ...
}
```

Permite criar funções reutilizáveis com type safety.

## 🔒 Segurança

- **Nunca** commite o arquivo `.env` no Git
- Configure regras de segurança no Firestore
- Use variáveis de ambiente para credenciais sensíveis

## 📖 Recursos

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Firebase Docs](https://firebase.google.com/docs)
- [NativeWind Docs](https://www.nativewind.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

