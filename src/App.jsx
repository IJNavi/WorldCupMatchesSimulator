import { useCallback, useEffect, useState } from 'react';
import { fetchTeams, sendFinalResult } from './services/api';
import {
  createGroups,
  generateGroupMatches,
  generateKnockoutMatches,
  generateNextRound,
  simulateKnockoutMatch,
  simulateMatch,
  sortTeams,
  updateTeamStats,
} from './utils/simulator';

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROUND_TITLES = {
  eighths: 'Oitavas de final',
  quarters: 'Quartas de final',
  semis: 'Semifinal',
  final: 'Final',
};

const createEmptyKnockoutState = () => ({
  eighths: [],
  quarters: [],
  semis: [],
  final: [],
});

const getTeamName = (team) => team?.name ?? 'A definir';

const getChampion = (finalMatch) => finalMatch?.winner ?? null;
const isRoundPlayed = (matches) => matches.length > 0 && matches.every((match) => match.isPlayed);

function App() {
  const [groups, setGroups] = useState({});
  const [groupMatches, setGroupMatches] = useState({});
  const [knockoutRounds, setKnockoutRounds] = useState(createEmptyKnockoutState);
  const [currentPhase, setCurrentPhase] = useState('loading');
  const [isGroupsSimulated, setIsGroupsSimulated] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTournament = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setActionError('');
      setSubmissionStatus('idle');
      setSubmissionMessage('');

      const teams = await fetchTeams();
      const initialGroups = createGroups(teams);
      const initialMatches = GROUP_NAMES.reduce((accumulator, groupName) => {
        accumulator[groupName] = generateGroupMatches(initialGroups[groupName]);
        return accumulator;
      }, {});

      setGroups(initialGroups);
      setGroupMatches(initialMatches);
      setKnockoutRounds(createEmptyKnockoutState());
      setCurrentPhase('groups');
      setIsGroupsSimulated(false);
    } catch (requestError) {
      setError(requestError.message || 'Falha ao carregar as selecoes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeTournament = async () => {
      await loadTournament();
    };

    void initializeTournament();
  }, [loadTournament]);

  const simulateGroupStage = () => {
    try {
      if (isGroupsSimulated) {
        return;
      }

      const updatedGroups = {};
      const updatedMatches = {};

      GROUP_NAMES.forEach((groupName) => {
        let rankedTeams = groups[groupName].map((team) => ({ ...team }));

        updatedMatches[groupName] = groupMatches[groupName].map((match) => {
          const simulatedMatch = simulateMatch(match);

          rankedTeams = rankedTeams.map((team) => {
            if (team.id === simulatedMatch.home.id) {
              return updateTeamStats(team, simulatedMatch.homeGoals, simulatedMatch.awayGoals);
            }

            if (team.id === simulatedMatch.away.id) {
              return updateTeamStats(team, simulatedMatch.awayGoals, simulatedMatch.homeGoals);
            }

            return team;
          });

          return simulatedMatch;
        });

        updatedGroups[groupName] = sortTeams(rankedTeams);
      });

      setGroups(updatedGroups);
      setGroupMatches(updatedMatches);
      setIsGroupsSimulated(true);
      setActionError('');
    } catch (simulationError) {
      setActionError(simulationError.message || 'Nao foi possivel simular a fase de grupos.');
    }
  };

  const startKnockoutStage = () => {
    try {
      if (!isGroupsSimulated) {
        throw new Error('Simule a fase de grupos antes de avancar para as oitavas.');
      }

      const eighths = generateKnockoutMatches(groups);

      setKnockoutRounds({
        eighths,
        quarters: [],
        semis: [],
        final: [],
      });
      setSubmissionStatus('idle');
      setSubmissionMessage('');
      setCurrentPhase('eighths');
      setActionError('');
    } catch (roundError) {
      setActionError(roundError.message || 'Nao foi possivel iniciar as oitavas de final.');
    }
  };

  const advanceKnockoutRound = (roundKey, nextRoundKey) => {
    try {
      const currentRoundMatches = knockoutRounds[roundKey];

      if (!currentRoundMatches.length) {
        throw new Error('Nao ha partidas disponiveis para esta fase.');
      }

      const simulatedMatches = currentRoundMatches.map((match) => simulateKnockoutMatch(match));

      setKnockoutRounds((previousRounds) => {
        const nextRounds = {
          ...previousRounds,
          [roundKey]: simulatedMatches,
        };

        if (nextRoundKey) {
          nextRounds[nextRoundKey] = generateNextRound(simulatedMatches, nextRoundKey);
        }

        return nextRounds;
      });

      setActionError('');
    } catch (roundError) {
      setActionError(roundError.message || 'Nao foi possivel simular esta fase eliminatoria.');
    }
  };

  const goToKnockoutPhase = (nextRoundKey) => {
    try {
      if (!nextRoundKey) {
        throw new Error('A proxima fase nao foi definida.');
      }

      const nextRoundMatches = knockoutRounds[nextRoundKey];

      if (!nextRoundMatches.length) {
        throw new Error('A proxima fase ainda nao foi montada.');
      }

      setCurrentPhase(nextRoundKey);
      setActionError('');
    } catch (roundError) {
      setActionError(roundError.message || 'Nao foi possivel avancar para a proxima fase.');
    }
  };

  const submitChampion = async (finalMatch) => {
    setSubmissionStatus('submitting');
    setSubmissionMessage('Enviando resultado da final para a API...');

    try {
      await sendFinalResult({
        equipeA: finalMatch.home.id,
        equipeB: finalMatch.away.id,
        golsEquipeA: finalMatch.homeGoals,
        golsEquipeB: finalMatch.awayGoals,
        golsPenaltyTimeA: finalMatch.penaltyGoals?.home ?? 0,
        golsPenaltyTimeB: finalMatch.penaltyGoals?.away ?? 0,
      });

      setSubmissionStatus('success');
      setSubmissionMessage('Resultado da final enviado para a API.');
    } catch (requestError) {
      setSubmissionStatus('error');
      setSubmissionMessage(
        requestError.message || 'Nao foi possivel enviar o resultado final para a API.'
      );
    }
  };

  const playFinal = async () => {
    try {
      const finalMatch = knockoutRounds.final[0];

      if (!finalMatch) {
        throw new Error('A final ainda nao foi montada para simulacao.');
      }

      const simulatedFinal = simulateKnockoutMatch(finalMatch);

        setKnockoutRounds((previousRounds) => ({
          ...previousRounds,
          final: [simulatedFinal],
        }));
        setCurrentPhase('champion');
        setActionError('');
        await submitChampion(simulatedFinal);
    } catch (finalError) {
      setSubmissionStatus('error');
      setSubmissionMessage(finalError.message || 'Nao foi possivel simular a final.');
    }
  };

  const currentMatches = knockoutRounds[currentPhase] ?? [];
  const champion = getChampion(knockoutRounds.final[0]);
  const isCurrentRoundPlayed = isRoundPlayed(currentMatches);

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-950 px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <p className="text-2xl font-semibold">Carregando selecoes da Copa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-emerald-950 px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center shadow-2xl">
          <p className="text-2xl font-semibold">Erro: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_25%),linear-gradient(180deg,_#022c22_0%,_#052e16_50%,_#04130d_100%)] px-3 py-4 text-white sm:px-5 sm:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto max-w-7xl">
        <section className="mb-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20 shadow-2xl backdrop-blur sm:mb-6">
          <div className="grid gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-4 lg:px-6">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300/80 sm:text-xs">
                    Simulador da Copa do Mundo
                  </p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Copa do Mundo 2026
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={loadTournament}
                  className="min-h-11 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
                >
                  Reiniciar copa
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm text-emerald-50/90">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Fase atual</p>
                <p className="mt-2 text-lg font-bold leading-tight sm:text-xl">
                  {currentPhase === 'groups' && 'Fase de grupos'}
                  {currentPhase === 'champion' && 'Campeao definido'}
                  {ROUND_TITLES[currentPhase]}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm text-emerald-50/90">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
                  Desempate nos grupos
                </p>
                <p className="mt-2 leading-5">Pontos, saldo de gols e sorteio aleatorio.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm text-emerald-50/90">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
                  Empate no mata-mata
                </p>
                <p className="mt-2 leading-5">Disputa por penaltis para definir o classificado.</p>
              </div>
            </div>
          </div>
        </section>

        {actionError && (
          <section className="mb-5 rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100 shadow-lg sm:mb-6">
            {actionError}
          </section>
        )}

        {currentPhase === 'groups' && (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="text-xl font-bold text-white sm:text-2xl">Fase de grupos</h2>
                <p className="mt-1 text-sm leading-5 text-emerald-50/75">
                  Cada grupo tem 3 rodadas e 6 partidas. Os 2 melhores avancam para as oitavas.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={simulateGroupStage}
                  disabled={isGroupsSimulated}
                  className="min-h-12 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-200"
                >
                  {isGroupsSimulated ? 'Grupos simulados' : 'Simular grupos'}
                </button>
                <button
                  type="button"
                  onClick={startKnockoutStage}
                  disabled={!isGroupsSimulated}
                  className="min-h-12 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
                >
                  Ir para oitavas
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {GROUP_NAMES.map((groupName) => (
                <article
                  key={groupName}
                  className="min-w-0 rounded-[1.6rem] border border-white/10 bg-white/95 p-4 text-slate-900 shadow-xl sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-emerald-700 px-3 py-3 text-white sm:px-4">
                    <h3 className="text-lg font-black sm:text-xl">Grupo {groupName}</h3>
                    <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] sm:text-xs">
                      4 selecoes
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="w-[68%] px-3 py-2 text-left">Selecao</th>
                          <th className="px-2 py-2 text-center">Pts</th>
                          <th className="px-2 py-2 text-center">SG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups[groupName]?.map((team, index) => (
                          <tr
                            key={team.id}
                            className={index < 2 ? 'bg-emerald-50' : 'bg-white'}
                          >
                            <td className="px-3 py-2 font-medium break-words">{team.name}</td>
                            <td className="px-2 py-2 text-center font-bold">{team.points}</td>
                            <td className="px-2 py-2 text-center">{team.goalDiff}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[1, 2, 3].map((roundNumber) => (
                      <div key={roundNumber} className="rounded-2xl bg-slate-100 p-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                          Rodada {roundNumber}
                        </p>
                        <div className="space-y-2">
                          {groupMatches[groupName]
                            ?.filter((match) => match.round === roundNumber)
                            .map((match) => (
                              <div
                                key={`${groupName}-${roundNumber}-${match.home.id}-${match.away.id}`}
                                className="rounded-xl bg-white px-3 py-2 shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-2 text-sm sm:gap-3">
                                  <span className="min-w-0 flex-1 break-words font-medium">
                                    {match.home.name}
                                  </span>
                                  <span className="min-w-[3.75rem] shrink-0 text-center font-black text-emerald-800 sm:min-w-16">
                                    {match.isPlayed
                                      ? `${match.homeGoals} x ${match.awayGoals}`
                                      : 'vs'}
                                  </span>
                                  <span className="min-w-0 flex-1 break-words text-right font-medium">
                                    {match.away.name}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {['eighths', 'quarters', 'semis', 'final'].includes(currentPhase) && (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="text-2xl font-black text-white sm:text-3xl">
                  {ROUND_TITLES[currentPhase]}
                </h2>
                <p className="mt-1 text-sm leading-5 text-emerald-50/75">
                  Empates sao decididos nos penaltis e o vencedor avanca na chave.
                </p>
              </div>

              <div className="w-full sm:w-auto">
                {currentPhase === 'eighths' && (
                  isCurrentRoundPlayed ? (
                    <button
                      type="button"
                      onClick={() => goToKnockoutPhase('quarters')}
                      className="min-h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/15 sm:w-auto"
                    >
                      Ir para quartas
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => advanceKnockoutRound('eighths', 'quarters')}
                      className="min-h-12 w-full rounded-full bg-amber-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-950 transition hover:bg-amber-300 sm:w-auto"
                    >
                      Simular oitavas
                    </button>
                  )
                )}
                {currentPhase === 'quarters' && (
                  isCurrentRoundPlayed ? (
                    <button
                      type="button"
                      onClick={() => goToKnockoutPhase('semis')}
                      className="min-h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/15 sm:w-auto"
                    >
                      Ir para semifinal
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => advanceKnockoutRound('quarters', 'semis')}
                      className="min-h-12 w-full rounded-full bg-amber-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-950 transition hover:bg-amber-300 sm:w-auto"
                    >
                      Simular quartas
                    </button>
                  )
                )}
                {currentPhase === 'semis' && (
                  isCurrentRoundPlayed ? (
                    <button
                      type="button"
                      onClick={() => goToKnockoutPhase('final')}
                      className="min-h-12 w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/15 sm:w-auto"
                    >
                      Ir para final
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => advanceKnockoutRound('semis', 'final')}
                      className="min-h-12 w-full rounded-full bg-amber-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-950 transition hover:bg-amber-300 sm:w-auto"
                    >
                      Simular semifinal
                    </button>
                  )
                )}
                {currentPhase === 'final' && (
                  <button
                    type="button"
                    onClick={playFinal}
                    disabled={submissionStatus === 'submitting' || isCurrentRoundPlayed}
                    className="min-h-12 w-full rounded-full bg-amber-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-200 sm:w-auto"
                  >
                    {submissionStatus === 'submitting' ? 'Enviando resultado...' : 'Simular final'}
                  </button>
                )}
              </div>
            </div>

            <div
              className={`grid gap-4 ${
                currentPhase === 'final'
                  ? 'max-w-3xl'
                  : currentPhase === 'semis'
                    ? 'md:grid-cols-2'
                    : 'md:grid-cols-2 xl:grid-cols-4'
              }`}
            >
              {currentMatches.map((match) => (
                <article
                  key={`${currentPhase}-${match.position}`}
                  className="min-w-0 rounded-[1.6rem] border border-white/10 bg-white/95 p-4 text-slate-900 shadow-xl sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-emerald-700 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white sm:text-xs">
                      Jogo {match.position}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                      {ROUND_TITLES[currentPhase]}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-100 px-3 py-3 sm:gap-3 sm:px-4">
                      <span className="min-w-0 flex-1 break-words font-semibold">
                        {getTeamName(match.home)}
                      </span>
                      <span className="min-w-[4.25rem] shrink-0 text-center text-lg font-black text-emerald-800 sm:min-w-20 sm:text-xl">
                        {match.isPlayed ? `${match.homeGoals} x ${match.awayGoals}` : 'vs'}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-right font-semibold">
                        {getTeamName(match.away)}
                      </span>
                    </div>

                    {match.penaltyGoals && (
                      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Penaltis: {match.penaltyGoals.home} x {match.penaltyGoals.away}
                      </div>
                    )}

                    {match.winner && (
                      <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                        Classificado: {match.winner.name}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {currentPhase === 'champion' && (
          <section className="mx-auto max-w-4xl rounded-[2rem] border border-amber-300/20 bg-white/95 p-5 text-center text-slate-900 shadow-2xl sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-amber-600">
              Campeao da simulacao
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-emerald-900 sm:mt-4 sm:text-5xl">
              {champion?.name ?? 'Campeao indefinido'}
            </h2>

            {knockoutRounds.final[0] && (
              <div className="mx-auto mt-6 max-w-2xl rounded-[1.75rem] bg-emerald-950 p-4 text-white sm:mt-8 sm:p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
                  Resultado da final
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 text-base font-semibold sm:gap-4 sm:text-lg">
                  <span className="min-w-0 flex-1 break-words">
                    {knockoutRounds.final[0].home.name}
                  </span>
                  <span className="min-w-[5rem] shrink-0 text-center text-2xl font-black text-amber-300 sm:min-w-24 sm:text-3xl">
                    {knockoutRounds.final[0].homeGoals} x {knockoutRounds.final[0].awayGoals}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-right">
                    {knockoutRounds.final[0].away.name}
                  </span>
                </div>
                {knockoutRounds.final[0].penaltyGoals && (
                  <p className="mt-4 text-sm text-emerald-50/80">
                    Penaltis: {knockoutRounds.final[0].penaltyGoals.home} x{' '}
                    {knockoutRounds.final[0].penaltyGoals.away}
                  </p>
                )}
              </div>
            )}

            {submissionMessage && (
              <p
                className={`mt-6 text-sm font-medium ${
                  submissionStatus === 'success'
                    ? 'text-emerald-700'
                    : submissionStatus === 'error'
                      ? 'text-red-600'
                      : 'text-slate-600'
                }`}
              >
                {submissionMessage}
              </p>
            )}

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadTournament}
                className="min-h-12 rounded-full bg-emerald-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-emerald-800"
              >
                Simular nova copa
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default App;
