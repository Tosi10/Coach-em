# Teste — limites por plano (sem RevenueCat ainda)

Esta fase só lê **`subscriptionTier`** (e opcionalmente **`subscriptionExpiresAt`**) em `users/{uid}` do treinador. Se o campo não existir, o app trata como **`free`** — **nada muda** para quem já usa o app na loja.

## O que validar

1. **Comportamento atual (grátis)**  
   - Login como treinador **sem** alterar o Firestore.  
   - Confirmar: até **3** atletas, **5** treinos-modelo, **7** exercícios (mensagens de limite iguais às de antes).

2. **Simular Pro (manual no Console Firebase)**  
   - Abra **Firestore** → coleção `users` → documento do **UID do treinador**.  
   - Adicione:
     - `subscriptionTier` (string): `pro`
     - `subscriptionExpiresAt` (timestamp): **data futura** (ex.: daqui a 1 ano)  
       *Se não definir expiração, `pro` vale até você remover o campo — útil para teste interno.*

3. **Repetir fluxos no app**  
   - Deve permitir até **25** atletas, **50** treinos-modelo, **100** exercícios.  
   - Tente passar de um limite: deve aparecer erro de limite do **plano Pro** (não só “gratuito”).

4. **Expiração**  
   - Ajuste `subscriptionExpiresAt` para **passado** e salve.  
   - O app e a Cloud Function `createAthleteByCoach` devem voltar a usar limites **grátis**.

## Cloud Functions

Após alterar código em `functions/src`, publiquem com:

`cd functions && npm run build`

e depois `firebase deploy --only functions` (ou o fluxo que vocês já usam).

Sem deploy da function, **criar atleta com login** ainda pode usar só o limite antigo fixo no servidor até a nova versão estar no ar.

## Próxima fase (quando formos fazer)

Integração **RevenueCat + webhook** para preencher `subscriptionTier` / `subscriptionExpiresAt` automaticamente, sem editar o Console na mão.
