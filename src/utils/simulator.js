export const shuffleArray = (array) => {
  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
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

export const createGroups = (teams) => {
  const shuffledTeams = shuffleArray(teams);
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return groupNames.reduce((groups, groupName, index) => {
    groups[groupName] = shuffledTeams
      .slice(index * 4, (index + 1) * 4)
      .map((team) => createTeamRecord(team));

    return groups;
  }, {});
};

export const generateGroupMatches = (groupTeams) => {
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

export const simulateMatch = (match) => {
  const homeGoals = Math.floor(Math.random() * 6);
  const awayGoals = Math.floor(Math.random() * 6);

  return {
    ...match,
    homeGoals,
    awayGoals,
    isPlayed: true,
  };
};

export const updateTeamStats = (team, goalsFor, goalsAgainst) => {
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

export const sortTeams = (teams) =>
  [...teams].sort((teamA, teamB) => {
    if (teamB.points !== teamA.points) {
      return teamB.points - teamA.points;
    }

    if (teamB.goalDiff !== teamA.goalDiff) {
      return teamB.goalDiff - teamA.goalDiff;
    }

    return Math.random() - 0.5;
  });

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

export const generateKnockoutMatches = (groups) => {
  const getQualifiedTeam = (groupName, position) => groups[groupName][position - 1];

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

export const simulateKnockoutMatch = (match) => {
  const homeGoals = Math.floor(Math.random() * 4);
  const awayGoals = Math.floor(Math.random() * 4);
  const penalties =
    homeGoals === awayGoals ? simulatePenaltyShootout() : null;
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

export const generateNextRound = (previousMatches, roundName) =>
  previousMatches.reduce((matches, match, index) => {
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
