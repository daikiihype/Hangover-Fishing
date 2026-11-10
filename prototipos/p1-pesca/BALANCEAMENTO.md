# Protótipo P1 — Registro de balanceamento

**Status:** valores **iniciais** **[PROTÓTIPO]**, escolhidos por simulação em 08/11/2026. **Não calibrados com pessoas.**
**Fonte da verdade:** `src/logic/config.js`. Esta página explica cada valor e de onde ele veio.
Valores marcados com ⚙ podem ser ajustados no celular (☰ MENU → Parâmetros), sem editar código.

---

## 1. Parâmetros

### Entrada
| Parâmetro | Valor | Significado | Origem |
|---|---|---|---|
| `holdThresholdMs` ⚙ | 200 ms | Limiar toque × segurar | Mesmo do P0 |

### Fase A — Arremesso
| Parâmetro | Valor | Significado | Origem |
|---|---|---|---|
| `castMinChargeMs` | 200 ms | Soltar antes disso cancela o arremesso | Igual ao limiar: um toque não arremessa |
| `castCycleMs` ⚙ | 1600 ms | Ciclo do medidor de força, 0 → 100% → 0 | GDD 6.2: "força **e timing**". Pico em 0,8 s |
| `castMinDistance` / `castMaxDistance` | 6 m / 30 m | Distância com força 0% / 100% | Escala de jogo |
| `castFlightBaseMs` + `castFlightPerPowerMs` | 450 + 450 × força | Voo da boia (0,45 a 0,9 s) | Curto, para não travar o ritmo |

### Fase B — Espera
| Parâmetro | Valor | Significado | Origem |
|---|---|---|---|
| `waitMinMs` ⚙ / `waitMaxMs` ⚙ | 2,5 s / 8 s | Tempo até a mordida, sorteado com distribuição uniforme | Mais curto que os 4–12 s da sugestão S3, para gerar mais mordidas por minuto de teste |
| `nibbleMin` / `nibbleMax` | 0 / 2 | "Beliscadas" (sinais falsos) antes da mordida | GDD 6.3 (ondulações). Treinam a diferença entre beliscada e mordida (S4) |
| `emptyReelSpeed` | 14 m/s | Recolher a linha vazia (30 m ≈ 2,1 s) | Rápido: o GDD 6.6 pede "sem espera artificial" |

### Fase C — Mordida e fisgada
| Parâmetro | Valor | Significado | Origem |
|---|---|---|---|
| `reactionWindowMs` ⚙ | 1000 ms | Janela para um **novo** toque depois do sinal | Generosa para iniciantes e para a distração de duas pessoas na mesma tela. Registrada em cada evento `mordida` e `fisgada` |

### Fase D — Briga e tensão
| Parâmetro | Valor | Significado |
|---|---|---|
| `initialTension` | 0,40 | Tensão no momento da fisgada (zona segura) |
| `slackMax` / `alertMin` / `criticalMin` | 0,20 / 0,65 / 0,85 | Limites das zonas frouxa / segura / alerta / crítica |
| `reelTensionRate` ⚙ | 0,18 /s | Subida da tensão só por segurar |
| `pullTensionRate` ⚙ | 0,50 /s | Subida extra por unidade de puxão do peixe |
| `slackPullFactor` | 0,70 | Quanto o puxão ainda pesa quando o jogador solta |
| `relaxRate` ⚙ | 0,40 /s | Queda da tensão ao soltar |
| `reelSpeed` ⚙ | 3 m/s | Recolhimento com o peixe parado |
| `pullReelResist` | 0,60 | Quanto o puxão freia o recolhimento |
| `lineOutSpeed` | 2 m/s | Linha que o peixe leva por unidade de puxão quando o jogador solta |
| `criticalBreakMs` ⚙ | 1000 ms | Tempo **acumulado** na zona crítica para a linha romper |
| `slackEscapeMs` ⚙ | 2000 ms | Tempo **acumulado** na zona frouxa para o peixe escapar |
| `riskRecoveryRate` | 0,5 | Fora da zona de risco, o acumulado "descansa" na metade da velocidade em que subiu (GDD 7.3) |
| `slackTireFactor` | 0,25 | Com a linha frouxa, o peixe cansa 4× mais devagar |
| `maxLineDistance` | 36 m | O peixe não leva linha além disso |

Fórmulas, a cada passo de 10 ms (`FishingPlayer._fightStep`):

```
puxão  = (corrida ? runPull : restPull) × (0,35 + 0,65 × energia) × força_do_peixe   (suavizado)
segurando: tensão += (reelTensionRate + puxão × pullTensionRate) × dt
           distância −= reelSpeed × (1 − pullReelResist × puxão) × dt
soltando:  tensão += (−relaxRate + puxão × pullTensionRate × slackPullFactor) × dt
           distância += lineOutSpeed × puxão × dt
energia −= tireRate × (frouxa ? slackTireFactor : 1) × dt
```

Leitura prática (peixe descansado): segurar durante uma **arrancada** leva a tensão do meio do verde ao vermelho em menos de 1 s. Soltar durante uma arrancada alivia bem devagar (de −0,05 a −0,15 /s, conforme o peixe), enquanto o peixe leva linha. Por isso o jogador precisa "ler" o peixe, e não só a barra.

### Fase E — Resultado
| Parâmetro | Valor | Significado |
|---|---|---|
| `resultCaughtMs` | 2200 ms | Duração do cartão de captura (S9: até ~2 s) |
| `resultLostMs` | 1600 ms | Duração de "escapou" / "linha rompeu" |
| `resultSkipAfterMs` | 600 ms | Depois disso, um toque já começa o próximo arremesso |

### Perfis de peixe — provisórios, **não são espécies reais** (GDD 8)
| Perfil | Chance | Peso | Puxão descanso / corrida | Corrida | Descanso | Cansaço |
|---|---|---|---|---|---|---|
| Peixe rápido ("rápido e curto") | 45% | 0,3–1,2 kg | 0,20 / 0,75 | 0,5–1,0 s | 0,7–1,5 s | 0,12 /s |
| Peixe pesado ("lento e pesado") | 25% | 2–6 kg | 0,40 / 0,85 | 1,5–2,8 s | 1,5–2,5 s | 0,08 /s |
| Peixe arisco ("imprevisível") | 30% | 0,8–3 kg | 0,10 / 1,00 | 0,3–1,6 s | 0,4–2,2 s | 0,09 /s |

Dentro de cada perfil, o peixe mais pesado puxa até 15% mais forte (`strength` de 0,85 a 1,15).

---

## 2. Simulação (`node tests/simulacao-balanceamento.js`)

80 brigas por célula, arremesso a 30 m, fisgada com 250 ms de reação. Os "estilos" são jogadores virtuais que **soltam** acima de um nível de tensão e **seguram** abaixo de outro, com atraso de reação aleatório.
Formato: % capturado · R = linha rompida · F = fuga · duração mediana da briga.

| Estilo (solta / segura / atraso) | Rápido | Pesado | Arisco |
|---|---|---|---|
| atento (0,72 / 0,45 / 200 ms) | 100% · 11,2 s | 100% · 18,6 s | 100% · 12,9 s |
| médio (0,82 / 0,35 / 300 ms) | 100% · 10,7 s | 100% · 17,9 s | 100% · 13,1 s |
| desleixado (0,90 / 0,30 / 400 ms) | 100% · 11,9 s | 100% · 18,3 s | 100% · 13,1 s |
| muito desleixado (0,97 / 0,25 / 500 ms) | 90% (R8) · 11,1 s | **38% (R50)** · 16,0 s | 73% (R22) · 12,5 s |
| reação lenta (0,85 / 0,35 / 900 ms) | 100% · 11,0 s | 100% · 18,3 s | 99% (R1) · 13,1 s |
| sempre segura | 0% (R80) | 0% (R80) | 0% (R80) |
| nunca segura | 0% (F80) | 0% (F80) | 0% (F80) |

### Como os valores foram escolhidos
1. **Primeira versão** (tensão do puxão 0,25; crítica 1,5 s; frouxa 2,5 s; recuperação 1,0): **nenhum** estilo perdia, nem o "muito desleixado". A tensão não oferecia desafio.
2. **Ajuste:** o puxão passou a pesar mais (0,25 → 0,50; e 0,5 → 0,7 quando solto), os limites encurtaram (1,5 → 1,0 s; 2,5 → 2,0 s) e o risco "descansa" mais devagar (1,0 → 0,5). Resultado: quem deixa a tensão encostar no vermelho perde linha, principalmente com o peixe pesado. Quem reage, mesmo devagar, vence.
3. O peixe pesado cansava devagar demais (brigas de ~21 s): cansaço 0,06 → 0,08 (~18 s).
4. Segurar sempre rompe e nunca segurar deixa escapar, em 100% dos casos: os dois riscos funcionam.

### Limitação importante
Os jogadores virtuais **veem a tensão exata** a cada 10 ms. Pessoas olham a tela de vez em quando, dividem a atenção com o outro jogador e erram o tempo. A dificuldade real será **maior** do que a da tabela. A tabela serve para **comparar** ajustes, não para prever a experiência.

---

## 3. O que calibrar no celular (sugestão de roteiro)

| Pergunta | Onde olhar | Ajuste provável |
|---|---|---|
| A janela de 1 s está fácil demais ou difícil? | Painel: "última reação"; relatório: mediana dos tempos de reação | `reactionWindowMs` (⚙). Se a mediana for < 400 ms e ninguém perder, reduzir para 700–800 ms |
| Os jogadores tocam sem parar durante a espera? (GDD S1) | Contador "prematuros" | Se for alto e as fisgadas forem fáceis, reduzir a janela |
| A espera é longa ou curta demais? | Sensação dos jogadores | `waitMinMs` / `waitMaxMs` (⚙) |
| A linha rompe "do nada"? | Contador "rompidas" × relato | Aumentar `criticalBreakMs` (⚙) ou reduzir `pullTensionRate` (⚙) |
| O peixe escapa sem o jogador entender por quê? | Contador "fugas" × relato | Aumentar `slackEscapeMs` (⚙) |
| A briga dura demais? | Relatório: duração de cada briga | Aumentar `reelSpeed` (⚙) |

Registrar cada ajuste e o motivo na seção 4.

---

## 4. Histórico de ajustes

| Data | Parâmetro | De → Para | Motivo | Quem |
|---|---|---|---|---|
| 08/11/2026 | valores iniciais | — | Simulação (seção 2) | Claude |
| 08/11/2026 | nenhum valor | — | Patch 01: só regras (D3, D4); parâmetros inalterados | Claude |
| 08/11/2026 | nenhum valor | — | Ajuste de UX "ARREMESSO CANCELADO": só aviso visual; balanceamento inalterado | Claude |
| 08/11/2026 | nenhum valor | — | Aviso estendido ao menu e ao retrato: só aviso visual; balanceamento inalterado | Claude |
| | | | | |

---

## 5. Decisões aprovadas que afetarão o balanceamento (pendentes)

Revisão da direção criativa de 08/11/2026 (GDD, seção 16.6). **Atualização Patch 01 (08/11/2026):** D3 e D4 foram implementados, sem mudar nenhum valor numérico desta página. A simulação da seção 2 continua idêntica. Nada foi calibrado com pessoas.

| Decisão | O que muda no balanceamento | Situação |
|---|---|---|
| D1 — distância com significado | Arremesso **curto**: mais acessível e rápido, peixes tendem a ser menores. **Médio**: equilíbrio entre espera, tamanho e dificuldade. **Longo**: chance de peixes maiores e mais interessantes, briga potencialmente mais difícil. Hoje `castMinDistance`/`castMaxDistance` só definem onde a briga começa, e a escolha do perfil e do peso **não** depende da distância | Relação exata (espécies, peso, espera, resistência) **a definir** pela direção criativa antes da implementação |
| D4 — espera preservada | Após um recolhimento interrompido, o tempo restante da espera é mantido (antes era sorteado de novo entre `waitMinMs` e `waitMaxMs`). O tempo recolhendo não conta como espera | **Implementado no Patch 01**; validação física pendente (B5, B9) |
| D5 — risco acumulado | `criticalBreakMs`, `slackEscapeMs` e `riskRecoveryRate` continuam sujeitos a balanceamento após os testes B7, B8 e B13 | Aguardando teste físico |
| D3 — beliscadas | `nibbleMin`/`nibbleMax` mantidos; as beliscadas são só visuais | **Bipe removido no Patch 01**; validação física pendente (B5) |
