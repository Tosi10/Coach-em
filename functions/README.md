# Cloud Functions – Coach'em

## createAthleteByCoach

Permite que o **treinador** crie a conta do atleta (Firebase Auth + Firestore `users` + `coachemAthletes`) para o atleta poder fazer login com email e senha provisória. O treinador continua logado.

### Deploy

1. Instale as dependências e compile:
   ```bash
   cd functions
   npm install
   npm run build
   ```

2. Faça login no Firebase e selecione o projeto **futeba-96395** (db futeba):
   ```bash
   npx firebase login
   npx firebase use futeba-96395
   ```

3. Faça o deploy:
   ```bash
   npm run deploy
   ```
   Ou, na raiz do projeto: `npx firebase deploy --only functions`

### Regras

- Apenas usuários autenticados com `users/{uid}.userType === 'COACH'` podem chamar.
- O atleta é criado no Auth com o email e a senha provisória informados.
- O documento em `coachemAthletes/{uid}` usa o `uid` do Auth como ID, para que o atleta apareça na lista do treinador e receba treinos com `athleteId = uid`.
