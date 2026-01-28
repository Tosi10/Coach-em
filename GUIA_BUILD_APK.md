# 📱 Guia Completo: Build APK com Expo

## ✅ Checklist Antes do Build

### 1. Verificações Básicas
- ✅ `app.json` configurado
- ✅ Ícones e splash screen presentes (`assets/images/`)
- ✅ Package name definido: `com.coachem.app`
- ✅ Versão definida: `1.0.0`

### 2. O que você precisa ter:
- ✅ Conta no Expo (você já tem!)
- ✅ Expo CLI instalado globalmente (ou usar `npx`)
- ✅ Projeto funcionando localmente (testado no Expo Go)

---

## 🚀 Passo a Passo para Build APK

### PASSO 1: Instalar Expo CLI (se ainda não tiver)

```bash
npm install -g expo-cli
# OU use npx (não precisa instalar globalmente)
```

### PASSO 2: Fazer Login no Expo

```bash
npx expo login
# ou
expo login
```

**Você vai precisar:**
- Email da sua conta Expo
- Senha da sua conta Expo

### PASSO 3: Verificar/Criar Projeto no Expo

Você tem duas opções:

#### Opção A: Usar projeto existente no Expo
Se você já tem um projeto no Expo Dashboard, você pode:
1. Acessar [expo.dev](https://expo.dev)
2. Ver seus projetos existentes
3. Usar o `slug` do projeto existente (ou criar um novo)

#### Opção B: Criar novo projeto no Expo Dashboard
1. Acesse [expo.dev](https://expo.dev)
2. Clique em "Create a project" ou "New Project"
3. Escolha "Blank" ou "Blank (TypeScript)"
4. Anote o `slug` do projeto (ex: `coachem-app`)

**IMPORTANTE:** O `slug` no `app.json` deve corresponder ao projeto no Expo Dashboard.

### PASSO 4: Verificar/Atualizar app.json

Verifique se o `slug` no `app.json` corresponde ao projeto no Expo:

```json
{
  "expo": {
    "slug": "CoachemApp",  // ← Este deve corresponder ao projeto no Expo Dashboard
    ...
  }
}
```

**Se precisar mudar o slug:**
- Atualize no `app.json`
- OU crie um novo projeto no Expo Dashboard com o mesmo nome

### PASSO 5: Build APK (Development Build)

Para testar no físico, você tem 2 opções:

#### Opção 1: Development Build (Recomendado para testes)
```bash
npx eas build --platform android --profile development
```

**Ou usando Expo CLI (método antigo):**
```bash
expo build:android -t apk
```

**Nota:** O método antigo (`expo build:android`) foi descontinuado. Use EAS Build.

#### Opção 2: Production Build (APK para distribuição)
```bash
npx eas build --platform android --profile production
```

### PASSO 6: Configurar EAS Build (Primeira vez)

Se for a primeira vez usando EAS Build:

1. **Instalar EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Fazer login:**
```bash
eas login
```

3. **Configurar projeto:**
```bash
eas build:configure
```

Isso vai criar um arquivo `eas.json` na raiz do projeto.

### PASSO 7: Aguardar Build

- O build será feito na nuvem do Expo
- Você receberá um link para acompanhar o progresso
- Quando terminar, você pode baixar o APK diretamente

---

## 📋 Comandos Úteis

### Ver builds em andamento:
```bash
eas build:list
```

### Baixar APK após build:
```bash
eas build:download
```

### Ver status do build:
```bash
eas build:view
```

---

## ⚙️ Configuração do eas.json (Criado automaticamente)

Quando você rodar `eas build:configure`, será criado um arquivo `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

## 🔧 Troubleshooting

### Erro: "Project not found"
- Verifique se você fez login: `eas login`
- Verifique se o `slug` no `app.json` corresponde ao projeto no Expo Dashboard
- Crie um novo projeto no Expo Dashboard se necessário

### Erro: "No EAS project found"
- Execute: `eas build:configure`
- Isso vai conectar seu projeto local ao projeto no Expo

### Erro: "Build failed"
- Verifique os logs no Expo Dashboard
- Verifique se todas as dependências estão corretas
- Verifique se os ícones existem nos caminhos corretos

---

## 📝 Notas Importantes

1. **Primeira vez:** O primeiro build pode demorar mais (15-30 minutos)
2. **Builds subsequentes:** Geralmente mais rápidos (5-15 minutos)
3. **Custo:** EAS Build tem um plano gratuito com limites generosos
4. **APK vs AAB:** 
   - APK: Para instalação direta (testes)
   - AAB: Para Google Play Store (produção)

---

## 🎯 Próximos Passos Após Build

1. **Instalar no dispositivo físico:**
   - Baixe o APK
   - Transfira para o celular
   - Habilite "Fontes desconhecidas" nas configurações
   - Instale o APK

2. **Testar funcionalidades:**
   - ✅ Navegação entre telas
   - ✅ Tema claro/escuro
   - ✅ Timers e vibração
   - ✅ Persistência de dados (AsyncStorage)
   - ✅ Modais e alertas

3. **Se tudo funcionar:**
   - Pronto para continuar desenvolvimento!
   - Ou preparar para produção (Google Play Store)

---

## 💡 Dica Extra

Para builds mais rápidos durante desenvolvimento, você pode usar:
```bash
npx expo run:android
```
Isso cria um build local (mais rápido, mas requer Android Studio configurado).

---

**Boa sorte com o build! 🚀**
