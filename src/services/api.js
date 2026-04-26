// filepath: src/services/api.js
const API_URL = 'https://development-internship-api.geopostenergy.com/WorldCup';
const GIT_USER = 'IJNavi';

export const fetchTeams = async () => {
  const response = await fetch(`${API_URL}/GetAllTeams`, {
    headers: {
      'git-user': GIT_USER,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch teams');
  }

  const teams = await response.json();

  return teams.map((team) => ({
    id: team.token,
    name: team.nome,
  }));
};

export const sendFinalResult = async (data) => {
  const response = await fetch(`${API_URL}/FinalResult`, {
    method: 'POST',
    headers: {
      'git-user': GIT_USER,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to send final result');
  }

  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
};
