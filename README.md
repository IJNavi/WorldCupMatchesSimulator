# World Cup Matches Simulator

Aplicacao web desenvolvida para o processo seletivo de Estagio Desenvolvimento 2026. O projeto consome a API oficial da prova, sorteia as 32 selecoes em grupos, simula toda a Copa do Mundo e envia o resultado da final para registro do campeão.

## Stack

- React 19
- Vite 5
- Tailwind CSS 4
- JavaScript
- Vitest
- Testing Library

## Funcionalidades

- Consumo da API `GetAllTeams` com header `git-user`
- Sorteio aleatorio das 32 selecoes em 8 grupos de 4 times
- Geracao da fase de grupos com 3 rodadas e 2 partidas por rodada
- Simulacao de resultados da fase de grupos
- Classificacao por pontos, saldo de gols e sorteio aleatorio
- Cruzamento olimpico nas oitavas de final
- Simulacao de quartas, semifinal e final
- Exibicao dos resultados de cada fase antes de avancar para a proxima etapa
- Decisao por penaltis em caso de empate no mata-mata
- Exibicao direta da tela do campeao apos simular a final
- Envio do resultado da final para a API `FinalResult`
- Interface responsiva para desktop e smartphone
- Reinicio rapido da simulacao para executar novas Copas
- Tratamento de erros para falhas de API, payload invalido e estados inconsistentes do torneio

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

### Testes

Executa toda a suite:

```bash
npm run test
```

Executa em modo watch:

```bash
npm run test:watch
```

## Fluxo da simulacao

1. A aplicacao carrega as 32 selecoes da API.
2. As selecoes sao sorteadas em 8 grupos, de `A` a `H`.
3. Ao clicar em `Simular grupos`, todas as 3 rodadas de cada grupo recebem placar.
4. Os grupos sao reordenados por pontos, saldo de gols e sorteio aleatorio.
5. Ao clicar em `Ir para oitavas`, o chaveamento olimpico eh montado.
6. Em cada fase do mata-mata:
   - o usuario clica em `Simular ...`;
   - os placares e penaltis ficam visiveis;
   - depois surge o botao para avancar para a fase seguinte.
7. Ao clicar em `Simular final`, a aplicacao vai direto para a tela do campeao.
8. O resultado da final eh enviado para a API e a interface exibe o status desse envio.

## Como validar a aplicacao

1. Aguarde o carregamento inicial das 32 selecoes.
2. Verifique se os grupos `A` a `H` foram criados com 4 selecoes cada.
3. Clique em `Simular grupos` e confirme se todas as partidas recebem placar.
4. Confira se `Pts` e `SG` variam corretamente entre os times do grupo.
5. Clique em `Ir para oitavas` e valide os confrontos do cruzamento olimpico.
6. Em cada fase eliminatoria, confirme se os resultados aparecem antes do avancar.
7. Confira se penaltis aparecem quando houver empate.
8. Na final, confirme se o app navega direto para a tela do campeao.
9. Valide a mensagem de sucesso ou erro no envio do resultado para a API.
10. Use `Reiniciar copa` ou `Simular nova copa` para testar um novo sorteio.

## Testes automatizados

A suite cobre:

- Testes unitarios das regras de simulacao em `src/utils/simulator.test.js`
- Testes de integracao da camada de API em `src/services/api.test.js`
- Testes de integracao da interface em `src/App.test.jsx`
- Casos extremos como:
  - quantidade invalida de selecoes
  - grupo com tamanho incorreto
  - fase eliminatoria incompleta
  - payload final invalido
  - erro da API na carga inicial
  - erro da API ao registrar o campeao

## Docstrings e documentacao interna

O projeto usa JSDoc nas funcoes exportadas de dominio e integracao para facilitar manutencao, navegacao no editor e entendimento das regras da simulacao.

Arquivos com docstrings relevantes:

- `src/utils/simulator.js`
- `src/services/api.js`

## Integracao com a API

Substitua a URL em src/services/api.js.example pelo URL da API a ser utilizada, o placeholder é:

```text
https://{BASE_URL}/WorldCup
```

Remova os comentários e renomeie o arquivo removendo .example para utilizar a aplicação.

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

## Configuração de arquivos sensíveis e uso da API

Por questões de segurança, os arquivos que expõem a URL da API original não são versionados diretamente. Para utilizar a aplicação, siga as instruções abaixo:

- Os arquivos `Prompt usado no início do projeto.txt.example`, `README.md.example` e `src/services/api.js.example` são fornecidos como exemplos.
- Para que a aplicação funcione corretamente, você deve:
  1. Remover o sufixo `.example` do nome do arquivo que deseja utilizar (por exemplo, renomeie `src/services/api.js.example` para `src/services/api.js`).
  2. Substituir o placeholder `{BASE_URL}` pela URL real da API que você irá utilizar.
- Alternativamente, você pode criar uma cópia do arquivo `.example` sem o sufixo e inserir a URL da API desejada.
- Não compartilhe arquivos com a URL real da API em repositórios públicos.

**Atenção:** Os arquivos originais que expõem a URL da API (`Prompt usado no início do projeto.txt`, `README.md`, `src/services/api.js`) estão listados no `.gitignore` para evitar exposição acidental.

## Licencas e custos

Fora as duas APIs fornecidas pelo teste, o projeto usa apenas bibliotecas open source instaladas localmente via npm. Verificando os metadados das versoes instaladas em `node_modules`, todos os pacotes principais utilizados neste projeto estao sob licenca `MIT`, ou seja, sem custo de uso e sem exigencia de licenca paga para este contexto de estudo, portfolio ou uso nao comercial.

Pacotes verificados localmente:

- `react@19.2.5` - MIT
- `react-dom@19.2.5` - MIT
- `vite@5.4.0` - MIT
- `@vitejs/plugin-react@4.3.0` - MIT
- `tailwindcss@4.2.4` - MIT
- `@tailwindcss/vite@4.2.4` - MIT
- `vitest@4.1.5` - MIT
- `jsdom@24.1.3` - MIT
- `@testing-library/react@16.3.2` - MIT
- `@testing-library/jest-dom@6.9.1` - MIT
- `@testing-library/user-event@14.6.1` - MIT
- `eslint@10.2.1` - MIT
- `@eslint/js@10.0.1` - MIT
- `eslint-plugin-react-hooks@7.1.1` - MIT
- `eslint-plugin-react-refresh@0.5.2` - MIT
- `globals@17.5.0` - MIT

Observacoes importantes:

- Nao foi identificado no projeto nenhum servico pago, SaaS obrigatorio ou dependencia proprietaria alem das APIs fornecidas pelo desafio.
- Nao ha indicio de bibliotecas com licenca copyleft forte exigindo abertura do codigo do projeto por simples uso dessas dependencias.
- Isso nao substitui revisao juridica formal, mas para o contexto deste projeto a pilha utilizada eh compativel com uso gratuito e open source.

## Estrutura principal

- `src/App.jsx`: fluxo da interface, estados da simulacao e navegacao entre fases
- `src/services/api.js`: integracao com a API externa e validacao das respostas
- `src/utils/simulator.js`: regras de sorteio, classificacao, mata-mata e validacoes de dominio
- `src/**/*.test.*`: cobertura automatizada de unidade, integracao e casos extremos

## Observacoes

- Os resultados das partidas sao gerados de forma aleatoria.
- Em caso de empate na fase eliminatoria, a classificacao eh decidida por disputa de penaltis.
- O projeto foi ajustado para evitar scroll horizontal em dispositivos moveis e melhorar a experiencia de teste manual.
- A aplicacao usa `base` configurada no Vite para publicar corretamente no GitHub Pages.
