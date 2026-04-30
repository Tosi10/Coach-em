# 🚀 Próximos Passos - Coach'em

## ✅ Estado consolidado (2026-04-29)

- Rebranding para **Coach'em** aplicado no app, assets, textos e legal.
- Intro video novo (`Coach-emVideo.mp4`) integrado.
- Fluxo de intervalado com alertas e estabilidade de conclusão ajustado.
- Deploy do Firebase Hosting concluído: `https://futeba-96395.web.app`.
- Links legais no app apontando para:
  - `https://futeba-96395.web.app/terms/coachem`
  - `https://futeba-96395.web.app/privacy/coachem`

---

## 🎯 Prioridade imediata pré-lançamento

1. **Build de produção**
   - iOS: `eas build -p ios --profile production`
   - Android (APK testes): `eas build -p android --profile production --clear-cache`

2. **Teste em aparelho físico**
   - Rodar checklist em `CHECKLIST_TESTES_MANUAIS.md`.
   - Validar especialmente:
     - fluxo coach/athlete completo
     - treino intervalado do início ao fim
     - conclusão do treino sem travamento
     - notificações e permissões

3. **Submit em loja**
   - `eas submit` (ou auto-submit no iOS)
   - revisar metadados e screenshots finais antes de enviar

---

## 🔧 Pendências organizacionais

- **Site Vision10**: atualizar referências antigas da marca anterior para Coach'em.
- **Documentação interna**: manter novos fluxos e links legais sincronizados com README.
- **Internacionalização (próxima fase)**: iniciar i18n PT-BR/EN após estabilizar build de loja.

---

## 🌍 Próxima fase (após release inicial)

### Fase 1 — Internacionalização
- Implementar i18n com `i18next` + `react-i18next` + `expo-localization`.
- Idiomas iniciais: `pt-BR` e `en`.
- Opção manual de idioma no perfil.

### Fase 2 — Notificações avançadas
- Push remota para treinador quando atleta concluir treino (FCM/APNs + backend/function).

### Fase 3 — Produto global
- Revisar textos de App Store/Play Store em EN.
- Revisar termos/política em inglês em URL pública dedicada.
