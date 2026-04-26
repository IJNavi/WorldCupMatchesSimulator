const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const assertTeam = (team, label = 'team') => {
  if (!team || typeof team !== 'object') {
    throw new Error(`Invalid ${label}: expected an object.`);
  }

  if (!team.id || !team.name) {
    throw new Error(`Invalid ${label}: missing required "id" or "name".`);
  }
};

const assertGoals = (goalsFor, goalsAgainst) => {
  if (!Number.isFinite(goalsFor) || !Number.isFinite(goalsAgainst)) {
    throw new Error('Invalid goals: expected finite numeric values.');
  }
};

const assertMatch = (match, label = 'match') => {
  if (!match || typeof match !== 'object') {
    throw new Error(`Invalid ${label}: expected an object.`);
  }

  assertTeam(match.home, `${label}.home`);
  assertTeam(match.away, `${label}.away`);
};

const createTeamRecord = (team) => ({
  ...team,
  points: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDiff: 0,
  wins: 0,
  draws: 0,
  losses: 0,
});

const createKnockoutMatch = (home, away, round, position) => ({
  home,
  away,
  round,
  position,
  homeGoals: 0,
  awayGoals: 0,
  isPlayed: false,
  penaltyGoals: null,
  winner: null,
});

/**
 * Creates a shuffled copy of an array using the Fisher-Yates algorithm.
 *
 * @template T
 * @param {T[]} array Array to shuffle.
 * @returns {T[]} Shuffled copy without mutating the original input.
 */
export const shuffleArray = (array) => {
  if (!Array.isArray(array)) {
    throw new Error('Invalid teams list: expected an array.');
  }

  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

/**
 * Splits the 32 teams into 8 groups of 4 and resets all tournament stats.
 *
 * @param {{id: string, name: string}[]} teams Teams returned by the external API.
 * @returns {Record<string, Array<object>>} Groups keyed from A to H.
 */
export const createGroups = (teams) => {
  if (!Array.isArray(teams) || teams.length !== 32) {
    throw new Error('Invalid teams list: expected exactly 32 teams.');
  }

  teams.forEach((team, index) => assertTeam(team, `teams[${index}]`));

  const shuffledTeams = shuffleArray(teams);

  return GROUP_NAMES.reduce((groups, groupName, index) => {
    groups[groupName] = shuffledTeams
      .slice(index * 4, (index + 1) * 4)
      .map((team) => createTeamRecord(team));

    return groups;
  }, {});
};

/**
 * Generates the 6 matches from a group following the 3-round format.
 *
 * @param {Array<object>} groupTeams Teams already assigned to a single group.
 * @returns {Array<object>} Group-stage matches.
 */
export const generateGroupMatches = (groupTeams) => {
  if (!Array.isArray(groupTeams) || groupTeams.length !== 4) {
    throw new Error('Invalid group: expected exactly 4 teams.');
  }

  groupTeams.forEach((team, index) => assertTeam(team, `groupTeams[${index}]`));

  const matchups = [
    [
      [0, 1],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 3],
    ],
    [
      [0, 3],
      [1, 2],
    ],
  ];

  return matchups.flatMap((roundMatchups, roundIndex) =>
    roundMatchups.map(([homeIndex, awayIndex]) => ({
      home: groupTeams[homeIndex],
      away: groupTeams[awayIndex],
      round: roundIndex + 1,
      homeGoals: 0,
      awayGoals: 0,
      isPlayed: false,
    }))
  );
};

/**
 * Simulates a group-stage match with scores from 0 to 5.
 *
 * @param {object} match Match to simulate.
 * @returns {object} Simulated match result.
 */
export const simulateMatch = (match) => {
  assertMatch(match);

  const homeGoals = Math.floor(Math.random() * 6);
  const awayGoals = Math.floor(Math.random() * 6);

  return {
    ...match,
    homeGoals,
    awayGoals,
    isPlayed: true,
  };
};

/**
 * Updates a team's statistics after a finished match.
 *
 * @param {object} team Team record with current tournament stats.
 * @param {number} goalsFor Goals scored by the team.
 * @param {number} goalsAgainst Goals conceded by the team.
 * @returns {object} Updated team record.
 */
export const updateTeamStats = (team, goalsFor, goalsAgainst) => {
  assertTeam(team);
  assertGoals(goalsFor, goalsAgainst);

  const goalDiff = goalsFor - goalsAgainst;
  let points = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;

  if (goalsFor > goalsAgainst) {
    points = 3;
    wins = 1;
  } else if (goalsFor === goalsAgainst) {
    points = 1;
    draws = 1;
  } else {
    losses = 1;
  }

  return {
    ...team,
    points: team.points + points,
    goalsFor: team.goalsFor + goalsFor,
    goalsAgainst: team.goalsAgainst + goalsAgainst,
    goalDiff: team.goalDiff + goalDiff,
    wins: team.wins + wins,
    draws: team.draws + draws,
    losses: team.losses + losses,
  };
};

/**
 * Sorts teams by points, goal difference and random draw as final tiebreaker.
 *
 * @param {Array<object>} teams Teams to rank inside a group.
 * @returns {Array<object>} Sorted copy of the standings.
 */
export const sortTeams = (teams) => {
  if (!Array.isArray(teams)) {
    throw new Error('Invalid standings: expected an array of teams.');
  }

  teams.forEach((team, index) => assertTeam(team, `teams[${index}]`));

  return [...teams].sort((teamA, teamB) => {
    if (teamB.points !== teamA.points) {
      return teamB.points - teamA.points;
    }

    if (teamB.goalDiff !== teamA.goalDiff) {
      return teamB.goalDiff - teamA.goalDiff;
    }

    return Math.random() - 0.5;
  });
};

/**
 * Simulates a penalty shootout until a winner exists.
 *
 * @returns {{goalsA: number, goalsB: number}} Penalty score for both teams.
 */
export const simulatePenaltyShootout = () => {
  let goalsA = 0;
  let goalsB = 0;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (Math.random() > 0.5) {
      goalsA += 1;
    }

    if (Math.random() > 0.5) {
      goalsB += 1;
    }
  }

  while (goalsA === goalsB) {
    if (Math.random() > 0.5) {
      goalsA += 1;
    } else {
      goalsB += 1;
    }
  }

  return { goalsA, goalsB };
};

/**
 * Creates the round of 16 according to the Olympic crossover bracket.
 *
 * @param {Record<string, Array<object>>} groups Sorted group standings.
 * @returns {Array<object>} Round-of-16 matches.
 */
export const generateKnockoutMatches = (groups) => {
  if (!groups || typeof groups !== 'object') {
    throw new Error('Invalid groups map: expected an object keyed by group name.');
  }

  const getQualifiedTeam = (groupName, position) => {
    const group = groups[groupName];

    if (!Array.isArray(group) || group.length < 2) {
      throw new Error(`Invalid group "${groupName}": expected at least two classified teams.`);
    }

    const team = group[position - 1];
    assertTeam(team, `groups.${groupName}[${position - 1}]`);
    return team;
  };

  GROUP_NAMES.forEach((groupName) => {
    if (!(groupName in groups)) {
      throw new Error(`Missing group "${groupName}" in standings.`);
    }
  });

  return [
    createKnockoutMatch(getQualifiedTeam('A', 1), getQualifiedTeam('B', 2), 'eighths', 1),
    createKnockoutMatch(getQualifiedTeam('C', 1), getQualifiedTeam('D', 2), 'eighths', 2),
    createKnockoutMatch(getQualifiedTeam('B', 1), getQualifiedTeam('A', 2), 'eighths', 3),
    createKnockoutMatch(getQualifiedTeam('D', 1), getQualifiedTeam('C', 2), 'eighths', 4),
    createKnockoutMatch(getQualifiedTeam('E', 1), getQualifiedTeam('F', 2), 'eighths', 5),
    createKnockoutMatch(getQualifiedTeam('G', 1), getQualifiedTeam('H', 2), 'eighths', 6),
    createKnockoutMatch(getQualifiedTeam('F', 1), getQualifiedTeam('E', 2), 'eighths', 7),
    createKnockoutMatch(getQualifiedTeam('H', 1), getQualifiedTeam('G', 2), 'eighths', 8),
  ];
};

/**
 * Simulates a knockout match, resolving ties with penalties.
 *
 * @param {object} match Knockout match with both teams defined.
 * @returns {object} Simulated match including winner and penalties when needed.
 */
export const simulateKnockoutMatch = (match) => {
  assertMatch(match);

  const homeGoals = Math.floor(Math.random() * 4);
  const awayGoals = Math.floor(Math.random() * 4);
  const penalties = homeGoals === awayGoals ? simulatePenaltyShootout() : null;
  const winner =
    penalties !== null
      ? penalties.goalsA > penalties.goalsB
        ? match.home
        : match.away
      : homeGoals > awayGoals
        ? match.home
        : match.away;

  return {
    ...match,
    homeGoals,
    awayGoals,
    isPlayed: true,
    penaltyGoals:
      penalties === null
        ? null
        : {
            home: penalties.goalsA,
            away: penalties.goalsB,
          },
    winner,
  };
};

/**
 * Builds the next knockout round by pairing adjacent winners.
 *
 * @param {Array<object>} previousMatches Finished knockout matches.
 * @param {string} roundName Name of the next phase.
 * @returns {Array<object>} Matches for the next round.
 */
export const generateNextRound = (previousMatches, roundName) => {
  if (!Array.isArray(previousMatches) || previousMatches.length === 0) {
    throw new Error('Invalid knockout round: expected a non-empty list of matches.');
  }

  if (previousMatches.length % 2 !== 0) {
    throw new Error('Invalid knockout round: expected an even number of matches.');
  }

  if (!roundName) {
    throw new Error('Invalid round name: expected a non-empty string.');
  }

  previousMatches.forEach((match, index) => {
    assertMatch(match, `previousMatches[${index}]`);

    if (!match.winner) {
      throw new Error(`Missing winner for previousMatches[${index}].`);
    }
  });

  return previousMatches.reduce((matches, match, index) => {
    if (index % 2 !== 0) {
      return matches;
    }

    matches.push(
      createKnockoutMatch(
        previousMatches[index].winner,
        previousMatches[index + 1].winner,
        roundName,
        index / 2 + 1
      )
    );

    return matches;
  }, []);
};
