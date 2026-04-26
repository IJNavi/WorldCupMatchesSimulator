import {
  createGroups,
  generateGroupMatches,
  generateKnockoutMatches,
  generateNextRound,
  simulateKnockoutMatch,
  simulatePenaltyShootout,
  simulateMatch,
  sortTeams,
  updateTeamStats,
} from './simulator';

const createTeams = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `Team ${index + 1}`,
  }));

describe('simulator utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates 8 groups of 4 teams with reset statistics', () => {
    const groups = createGroups(createTeams(32));

    expect(Object.keys(groups)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    expect(groups.A).toHaveLength(4);
    expect(groups.H).toHaveLength(4);
    expect(groups.C[0]).toMatchObject({
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    });
  });

  it('rejects invalid team counts when creating groups', () => {
    expect(() => createGroups(createTeams(31))).toThrow('expected exactly 32 teams');
  });

  it('generates 6 matches across 3 rounds for a valid group', () => {
    const groupTeams = createTeams(4);
    const matches = generateGroupMatches(groupTeams);

    expect(matches).toHaveLength(6);
    expect(matches.filter((match) => match.round === 1)).toHaveLength(2);
    expect(matches.filter((match) => match.round === 2)).toHaveLength(2);
    expect(matches.filter((match) => match.round === 3)).toHaveLength(2);
    expect(matches.map((match) => [match.home.name, match.away.name])).toEqual([
      ['Team 1', 'Team 2'],
      ['Team 3', 'Team 4'],
      ['Team 1', 'Team 3'],
      ['Team 2', 'Team 4'],
      ['Team 1', 'Team 4'],
      ['Team 2', 'Team 3'],
    ]);
  });

  it('updates team statistics for wins, draws and losses', () => {
    const team = {
      id: 'team-1',
      name: 'Team 1',
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    };

    expect(updateTeamStats(team, 2, 1)).toMatchObject({
      points: 3,
      goalDiff: 1,
      wins: 1,
      draws: 0,
      losses: 0,
    });
    expect(updateTeamStats(team, 1, 1)).toMatchObject({
      points: 1,
      goalDiff: 0,
      wins: 0,
      draws: 1,
      losses: 0,
    });
    expect(updateTeamStats(team, 0, 3)).toMatchObject({
      points: 0,
      goalDiff: -3,
      wins: 0,
      draws: 0,
      losses: 1,
    });
  });

  it('sorts teams by points and goal difference', () => {
    const teams = [
      { id: 'a', name: 'A', points: 4, goalDiff: 0 },
      { id: 'b', name: 'B', points: 6, goalDiff: -1 },
      { id: 'c', name: 'C', points: 6, goalDiff: 3 },
    ];

    expect(sortTeams(teams).map((team) => team.name)).toEqual(['C', 'B', 'A']);
  });

  it('simulates group matches with scores and marks them as played', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);

    const match = { home: createTeams(2)[0], away: createTeams(2)[1] };

    expect(simulateMatch(match)).toMatchObject({
      homeGoals: 2,
      awayGoals: 2,
      isPlayed: true,
    });
  });

  it('resolves penalty shootouts with sudden death when needed', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6);

    expect(simulatePenaltyShootout()).toEqual({ goalsA: 6, goalsB: 5 });
  });

  it('simulates knockout matches and records penalty winners', () => {
    const [home, away] = createTeams(2);

    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = simulateKnockoutMatch({ home, away, round: 'final', position: 1 });

    expect(result.isPlayed).toBe(true);
    expect(result.homeGoals).toBe(0);
    expect(result.awayGoals).toBe(0);
    expect(result.penaltyGoals).toEqual({ home: 0, away: 1 });
    expect(result.winner).toEqual(away);
  });

  it('creates the Olympic crossover bracket for the round of 16', () => {
    const groups = {
      A: createTeams(4).slice(0, 2),
      B: createTeams(4).slice(0, 2).map((team, index) => ({ ...team, id: `b-${index}`, name: `B${index}` })),
      C: createTeams(4).slice(0, 2).map((team, index) => ({ ...team, id: `c-${index}`, name: `C${index}` })),
      D: createTeams(4).slice(0, 2).map((team, index) => ({ ...team, id: `d-${index}`, name: `D${index}` })),
      E: createTeams(4).slice(0, 2).map((team, index) => ({ ...team, id: `e-${index}`, name: `E${index}` })),
      F: createTeams(4).slice(0, 2).map((team, index) => ({ ...team, id: `f-${index}`, name: `F${index}` })),
      G: createTeams(4).slice(0, 2).map((team, index) => ({ ...team, id: `g-${index}`, name: `G${index}` })),
      H: createTeams(4).slice(0, 2).map((team, index) => ({ ...team, id: `h-${index}`, name: `H${index}` })),
    };

    const matches = generateKnockoutMatches(groups);

    expect(matches).toHaveLength(8);
    expect(matches[0].home.name).toBe('Team 1');
    expect(matches[0].away.name).toBe('B1');
    expect(matches[2].home.name).toBe('B0');
    expect(matches[2].away.name).toBe('Team 2');
  });

  it('creates the next knockout round from adjacent winners', () => {
    const winners = createTeams(4);
    const previousMatches = [
      { home: winners[0], away: winners[1], winner: winners[0] },
      { home: winners[2], away: winners[3], winner: winners[3] },
      { home: winners[1], away: winners[2], winner: winners[1] },
      { home: winners[0], away: winners[3], winner: winners[3] },
    ];

    const nextRound = generateNextRound(previousMatches, 'quarters');

    expect(nextRound).toHaveLength(2);
    expect(nextRound[0]).toMatchObject({
      round: 'quarters',
      position: 1,
      home: winners[0],
      away: winners[3],
    });
  });

  it('rejects incomplete knockout rounds as an extreme case', () => {
    const teams = createTeams(2);

    expect(() =>
      generateNextRound([{ home: teams[0], away: teams[1], winner: teams[0] }], 'semis')
    ).toThrow('expected an even number of matches');
  });
});
