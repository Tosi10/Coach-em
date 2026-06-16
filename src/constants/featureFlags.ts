/**
 * Flags de produto — ligar/desligar sem apagar código.
 *
 * Saúde / wearables: desligado na loja até MVP estável e testes reais.
 * Para reativar: `HEALTH_FEATURES_ENABLED = true` e novo build.
 */
export const HEALTH_FEATURES_ENABLED = false;

/** Botão "Iniciar treino" + janela startedAt (usado pela coleta de saúde). */
export const WORKOUT_START_FLOW_ENABLED = HEALTH_FEATURES_ENABLED;
