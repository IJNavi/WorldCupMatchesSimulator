# World Cup Matches Simulator

Aplicacao web desenvolvida para o processo seletivo de Estagio Desenvolvimento 2026. O projeto consome a API oficial da prova, sorteia as 32 selecoes em grupos, simula toda a Copa do Mundo e envia o resultado da final para registro do campeao.

## Stack

- React 19
- Vite 5
- Tailwind CSS 4
- JavaScript

## Funcionalidades

- Consumo da API `GetAllTeams` com header `git-user`
- Sorteio aleatorio das 32 selecoes em 8 grupos de 4 times
- Geracao da fase de grupos com 3 rodadas e 2 partidas por rodada
- Simulacao de resultados da fase de grupos
- Classificacao por pontos, saldo de gols e sorteio aleatorio
- Cruzamento olimpico nas oitavas de final
- Simulacao de quartas, semifinal e final
- Decisao por penaltis em caso de empate no mata-mata
- Envio do resultado da final para a API `FinalResult`
- Interface responsiva para desktop e smartphone
- Reinicio rapido da simulacao para executar novas Copas

## Como executar

### Requisitos

- Node.js 20 ou superior
- npm 10 ou superior

### Instalacao

```bash
npm install
```

### Ambiente de desenvolvimento

```bash
npm run dev
```

Abra a URL exibida pelo Vite no navegador, normalmente `http://localhost:5173`.

### Build de producao

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Como validar a aplicacao

1. Aguarde o carregamento inicial das 32 selecoes.
2. Verifique se os grupos `A` a `H` foram criados com 4 selecoes cada.
3. Clique em `Simular grupos` e confirme se todas as partidas recebem placar.
4. Confira se `Pts` e `SG` variam corretamente entre os times do grupo.
5. Clique em `Ir para oitavas` e valide os confrontos do cruzamento olimpico.
6. Avance ate a final usando os botoes de simulacao.
7. Confira o campeao exibido na tela final e a mensagem de envio para a API.
8. Use `Reiniciar copa` ou `Simular nova copa` para testar um novo sorteio.

## Integracao com a API

Base URL:

```text
https://development-internship-api.geopostenergy.com/WorldCup
```

Endpoints utilizados:

- `GET /GetAllTeams`
- `POST /FinalResult`

Header obrigatorio em todas as requisicoes:

```text
git-user: IJNavi
```

Payload enviado na final:

```json
{
  "equipeA": "uuid",
  "equipeB": "uuid",
  "golsEquipeA": 1,
  "golsEquipeB": 1,
  "golsPenaltyTimeA": 4,
  "golsPenaltyTimeB": 3
}
```

## Estrutura principal

- `src/App.jsx`: fluxo da interface, simulacao e navegacao entre fases
- `src/services/api.js`: integracao com a API externa
- `src/utils/simulator.js`: regras de sorteio, classificacao e mata-mata

## Observacoes

- Os resultados das partidas sao gerados de forma aleatoria.
- Em caso de empate na fase eliminatoria, a classificacao eh decidida por disputa de penaltis.
- O projeto foi ajustado para evitar scroll horizontal em dispositivos moveis e melhorar a experiencia de teste manual.
