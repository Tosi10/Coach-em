## Deploy rápido no Firebase Hosting (Treina+)

Este guia publica as páginas legais do Treina+ no Firebase Hosting:

- Política de Privacidade
- Termos de Uso

Arquivos prontos:

- `hosting/legal/privacy-treinamais.html`
- `hosting/legal/terms-treinamais.html`

---

### 1) Copiar arquivos para o projeto que hospeda seu site

No projeto das landing pages (ex.: `Vision10`), coloque:

- `public/privacy/treinamais/index.html` (copie de `privacy-treinamais.html`)
- `public/terms/treinamais/index.html` (copie de `terms-treinamais.html`)

Estrutura final esperada:

```text
public/
  privacy/
    treinamais/
      index.html
  terms/
    treinamais/
      index.html
```

---

### 2) Conferir `firebase.json`

No projeto do hosting, garanta algo semelhante a:

```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
```

Se seu `firebase.json` já funciona para o site, normalmente não precisa mudar nada.

---

### 3) Deploy

No terminal, dentro do projeto do site:

```bash
firebase login
firebase use <SEU_PROJETO_FIREBASE>
firebase deploy --only hosting
```

---

### 4) URLs finais

Depois do deploy, valide:

- `https://futeba-96395.web.app/privacy/treinamais`
- `https://futeba-96395.web.app/terms/treinamais`

Se depois você conectar domínio próprio, apenas substitua o domínio mantendo os caminhos.

---

### 5) Atualizar links no app e nos docs

No Coach-em/Treina+:

- `TERMOS_DE_USO.md` deve apontar para `.../privacy/treinamais`
- no app, botão de Política/Termos deve abrir essas URLs
- no App Store Connect e Play Console, usar essas URLs oficiais

---

### 6) Contato oficial de suporte (Vision10)

- E-mail: `adm.ecg.19@gmail.com`
- WhatsApp: `+55 41 99252-2854`

