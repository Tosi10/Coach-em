# 🎨 Guia Completo: Imagens do App Coach'em

## 📋 Resumo das Imagens Necessárias

Você precisa de **4 imagens principais** para o app:

1. **`icon.png`** - Ícone principal do app (iOS e Android genérico)
2. **`adaptive-icon.png`** - Ícone adaptativo para Android (moderno)
3. **`splash-icon.png`** - Logo para tela de splash (carregamento)
4. **`favicon.png`** - Ícone para web (opcional, mas recomendado)

---

## 📐 Especificações Técnicas

### 1. **icon.png** (Ícone Principal)
- **Tamanho:** 1024x1024 pixels
- **Formato:** PNG (com transparência)
- **Uso:** Ícone do app em todas as plataformas
- **Onde:** `./assets/images/icon.png`
- **Configuração no app.json:** Linha 7

**Dicas de Design:**
- Deve ser quadrado (1:1)
- Use fundo transparente ou sólido
- Logo centralizado
- Evite textos pequenos (não serão legíveis)
- Use cores vibrantes para destacar

### 2. **adaptive-icon.png** (Android Moderno)
- **Tamanho:** 1024x1024 pixels
- **Formato:** PNG (com transparência)
- **Uso:** Ícone adaptativo do Android (aparece em diferentes formas)
- **Onde:** `./assets/images/adaptive-icon.png`
- **Configuração no app.json:** Linha 22

**Dicas de Design:**
- **IMPORTANTE:** Mantenha elementos importantes no centro (círculo de 512x512)
- As bordas podem ser cortadas em alguns dispositivos
- Use fundo transparente ou cor sólida
- O Android aplica máscaras circulares/quadradas automaticamente

**Cor de fundo:** Configurada em `app.json` linha 23 (`backgroundColor`)

### 3. **splash-icon.png** (Tela de Splash/Carregamento)
- **Tamanho:** 1024x1024 pixels (recomendado)
- **Formato:** PNG (com transparência)
- **Uso:** Logo exibido na tela de carregamento inicial
- **Onde:** `./assets/images/splash-icon.png`
- **Configuração no app.json:** Linha 12

**Dicas de Design:**
- Logo centralizado
- Pode ser maior que o ícone (mais espaço na splash)
- Use fundo transparente
- O Expo redimensiona automaticamente

**Cor de fundo da splash:** Configurada em `app.json` linha 14 (`backgroundColor`)

### 4. **favicon.png** (Web - Opcional)
- **Tamanho:** 48x48 ou 96x96 pixels
- **Formato:** PNG ou ICO
- **Uso:** Ícone na aba do navegador (se publicar na web)
- **Onde:** `./assets/images/favicon.png`
- **Configuração no app.json:** Linha 35

---

## 🎨 Paleta de Cores Recomendada

Baseado no tema do seu app (laranja/escuro):

- **Cor primária:** `#fb923c` (Laranja)
- **Fundo escuro:** `#0a0a0a` (Quase preto)
- **Fundo claro:** `#ffffff` (Branco)
- **Cor de destaque:** `#f97316` (Laranja mais escuro)

---

## 📝 Onde Configurar no app.json

Todas as configurações estão no arquivo `app.json`:

```json
{
  "expo": {
    // Ícone principal (linha 7)
    "icon": "./assets/images/icon.png",
    
    // Splash screen (linhas 11-15)
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0a0a"  // ← Mude para cor escura!
    },
    
    "android": {
      // Ícone adaptativo Android (linhas 21-24)
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0a0a0a"  // ← Cor de fundo do ícone
      }
    },
    
    "web": {
      // Favicon (linha 35)
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

---

## 🔧 Como Trocar as Imagens

### Passo 1: Preparar as Imagens
1. Crie/edite suas imagens com as especificações acima
2. Salve como PNG com transparência
3. Nomeie os arquivos exatamente como:
   - `icon.png`
   - `adaptive-icon.png`
   - `splash-icon.png`
   - `favicon.png`

### Passo 2: Colocar na Pasta Correta
Coloque todas as imagens em:
```
assets/images/
```

### Passo 3: Verificar app.json
O `app.json` já está configurado com os caminhos corretos. Você só precisa:
- Substituir os arquivos na pasta `assets/images/`
- (Opcional) Ajustar `backgroundColor` no `app.json` se quiser mudar a cor de fundo

---

## 💡 Dicas Importantes

### Para o Ícone:
- ✅ Use logo simples e reconhecível
- ✅ Teste em tamanho pequeno (48x48) para ver se ainda é legível
- ✅ Evite muitos detalhes
- ✅ Use cores contrastantes

### Para a Splash Screen:
- ✅ Logo pode ser maior (mais espaço)
- ✅ Pode incluir texto "Coach'em" se quiser
- ✅ Use cor de fundo que combine com o tema do app
- ✅ Mantenha simples e profissional

### Para o Adaptive Icon (Android):
- ⚠️ **CRÍTICO:** Mantenha elementos importantes no centro
- ⚠️ As bordas podem ser cortadas em formato circular
- ✅ Use fundo sólido ou gradiente simples
- ✅ Teste como ficaria em formato circular

---

## 🎯 Exemplo de Estrutura

```
Coach-em/
├── assets/
│   └── images/
│       ├── icon.png              (1024x1024)
│       ├── adaptive-icon.png     (1024x1024)
│       ├── splash-icon.png       (1024x1024)
│       └── favicon.png           (96x96)
└── app.json                      (configurações)
```

---

## 🔄 Após Trocar as Imagens

1. **Limpar cache do Expo:**
   ```bash
   npx expo start --clear
   ```

2. **Para ver mudanças no build:**
   - As mudanças no `app.json` só aparecem em builds nativos
   - No Expo Go, pode não aparecer (usa ícone padrão)
   - Faça um novo build APK para ver as mudanças

---

## 📱 Ferramentas Úteis

### Para Criar/Editar Imagens:
- **Figma** (gratuito) - Design profissional
- **Canva** (gratuito) - Templates prontos
- **GIMP** (gratuito) - Editor de imagens
- **Photoshop** (pago) - Profissional

### Para Gerar Ícones Automaticamente:
- **Expo Icon Generator:** https://www.appicon.co/
- **Icon Kitchen (Google):** https://icon.kitchen/
- **AppIcon.co:** https://www.appicon.co/

Essas ferramentas geram todos os tamanhos automaticamente!

---

## ✅ Checklist Final

Antes de fazer o build, verifique:

- [ ] `icon.png` existe e tem 1024x1024px
- [ ] `adaptive-icon.png` existe e tem 1024x1024px
- [ ] `splash-icon.png` existe e tem 1024x1024px
- [ ] `favicon.png` existe (opcional)
- [ ] Todas as imagens estão em `assets/images/`
- [ ] `app.json` está apontando para os caminhos corretos
- [ ] `backgroundColor` da splash está configurado (recomendo `#0a0a0a` para tema escuro)

---

**Pronto! Agora você sabe exatamente quais imagens precisa e onde colocá-las.** 🎨
