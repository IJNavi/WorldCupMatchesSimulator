const API_URL = 'https://development-internship-api.geopostenergy.com/WorldCup';
const GIT_USER = 'IJNavi';

const parseResponseError = async (response, fallbackMessage) => {
  const responseText = await response.text();

  if (!responseText) {
    return `${fallbackMessage} (${response.status})`;
  }

  try {
    const parsedBody = JSON.parse(responseText);
    const message =
      parsedBody?.message ??
      parsedBody?.error ??
      parsedBody?.title ??
      response.statusText;

    return `${fallbackMessage}: ${message}`.trim();
  } catch {
    return `${fallbackMessage}: ${responseText}`.trim();
  }
};

const assertFinalPayload = (data) => {
  const requiredStringFields = ['equipeA', 'equipeB'];
  const requiredNumberFields = [
    'golsEquipeA',
    'golsEquipeB',
    'golsPenaltyTimeA',
    'golsPenaltyTimeB',
  ];

  requiredStringFields.forEach((field) => {
    if (!data?.[field] || typeof data[field] !== 'string') {
      throw new Error(`Invalid final result payload: missing "${field}".`);
    }
  });

  requiredNumberFields.forEach((field) => {
    if (!Number.isFinite(data?.[field])) {
      throw new Error(`Invalid final result payload: "${field}" must be a finite number.`);
    }
  });
};

/**
 * Fetches the 32 teams and normalizes the API shape used by the UI.
 *
 * @returns {Promise<Array<{id: string, name: string}>>} Teams ready for the tournament flow.
 */
export const fetchTeams = async () => {
  const response = await fetch(`${API_URL}/GetAllTeams`, {
    headers: {
      'git-user': GIT_USER,
    },
  });

  if (!response.ok) {
    throw new Error(await parseResponseError(response, 'Failed to fetch teams'));
  }

  const teams = await response.json();

  if (!Array.isArray(teams) || teams.length !== 32) {
    throw new Error('Invalid teams response: expected exactly 32 teams from the API.');
  }

  return teams.map((team, index) => {
    if (!team?.token || !team?.nome) {
      throw new Error(`Invalid teams response: malformed team at index ${index}.`);
    }

    return {
      id: team.token,
      name: team.nome,
    };
  });
};

/**
 * Sends the final result back to the challenge API.
 *
 * @param {object} data Final match payload in the format required by the API.
 * @returns {Promise<object|string|null>} Parsed response body when available.
 */
export const sendFinalResult = async (data) => {
  assertFinalPayload(data);

  const response = await fetch(`${API_URL}/FinalResult`, {
    method: 'POST',
    headers: {
      'git-user': GIT_USER,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await parseResponseError(response, 'Failed to send final result'));
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
