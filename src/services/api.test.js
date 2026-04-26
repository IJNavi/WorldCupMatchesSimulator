import { fetchTeams, sendFinalResult } from './api';

const createApiTeams = (count) =>
  Array.from({ length: count }, (_, index) => ({
    token: `token-${index + 1}`,
    nome: `Selecao ${index + 1}`,
  }));

describe('api service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes teams from the API response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createApiTeams(32),
    });

    await expect(fetchTeams()).resolves.toEqual([
      { id: 'token-1', name: 'Selecao 1' },
      { id: 'token-2', name: 'Selecao 2' },
      { id: 'token-3', name: 'Selecao 3' },
      { id: 'token-4', name: 'Selecao 4' },
      { id: 'token-5', name: 'Selecao 5' },
      { id: 'token-6', name: 'Selecao 6' },
      { id: 'token-7', name: 'Selecao 7' },
      { id: 'token-8', name: 'Selecao 8' },
      { id: 'token-9', name: 'Selecao 9' },
      { id: 'token-10', name: 'Selecao 10' },
      { id: 'token-11', name: 'Selecao 11' },
      { id: 'token-12', name: 'Selecao 12' },
      { id: 'token-13', name: 'Selecao 13' },
      { id: 'token-14', name: 'Selecao 14' },
      { id: 'token-15', name: 'Selecao 15' },
      { id: 'token-16', name: 'Selecao 16' },
      { id: 'token-17', name: 'Selecao 17' },
      { id: 'token-18', name: 'Selecao 18' },
      { id: 'token-19', name: 'Selecao 19' },
      { id: 'token-20', name: 'Selecao 20' },
      { id: 'token-21', name: 'Selecao 21' },
      { id: 'token-22', name: 'Selecao 22' },
      { id: 'token-23', name: 'Selecao 23' },
      { id: 'token-24', name: 'Selecao 24' },
      { id: 'token-25', name: 'Selecao 25' },
      { id: 'token-26', name: 'Selecao 26' },
      { id: 'token-27', name: 'Selecao 27' },
      { id: 'token-28', name: 'Selecao 28' },
      { id: 'token-29', name: 'Selecao 29' },
      { id: 'token-30', name: 'Selecao 30' },
      { id: 'token-31', name: 'Selecao 31' },
      { id: 'token-32', name: 'Selecao 32' },
    ]);
  });

  it('surfaces API fetch errors with the response body message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => JSON.stringify({ message: 'boom' }),
    });

    await expect(fetchTeams()).rejects.toThrow('Failed to fetch teams: boom');
  });

  it('rejects malformed team payloads as an extreme case', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createApiTeams(31),
    });

    await expect(fetchTeams()).rejects.toThrow('expected exactly 32 teams');
  });

  it('returns null when the final result endpoint responds with 204', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    await expect(
      sendFinalResult({
        equipeA: 'a',
        equipeB: 'b',
        golsEquipeA: 1,
        golsEquipeB: 0,
        golsPenaltyTimeA: 0,
        golsPenaltyTimeB: 0,
      })
    ).resolves.toBeNull();
  });

  it('rejects invalid final payloads before hitting the network', async () => {
    global.fetch = vi.fn();

    await expect(
      sendFinalResult({
        equipeA: '',
        equipeB: 'b',
        golsEquipeA: 1,
        golsEquipeB: 0,
        golsPenaltyTimeA: 0,
        golsPenaltyTimeB: 0,
      })
    ).rejects.toThrow('missing "equipeA"');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('surfaces final result API failures with server details', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'payload rejected',
    });

    await expect(
      sendFinalResult({
        equipeA: 'a',
        equipeB: 'b',
        golsEquipeA: 1,
        golsEquipeB: 1,
        golsPenaltyTimeA: 4,
        golsPenaltyTimeB: 3,
      })
    ).rejects.toThrow('Failed to send final result: payload rejected');
  });
});
