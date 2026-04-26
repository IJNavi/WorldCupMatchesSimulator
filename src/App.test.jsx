import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { fetchTeams, sendFinalResult } from './services/api';

vi.mock('./services/api', () => ({
  fetchTeams: vi.fn(),
  sendFinalResult: vi.fn(),
}));

const createTeams = () =>
  Array.from({ length: 32 }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `Selecao ${index + 1}`,
  }));

describe('App integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an error state when the initial API request fails', async () => {
    fetchTeams.mockRejectedValue(new Error('API offline'));

    render(<App />);

    expect(await screen.findByText(/Erro: API offline/i)).toBeInTheDocument();
  });

  it('loads teams, simulates groups and advances to the round of 16 with defined teams', async () => {
    fetchTeams.mockResolvedValue(createTeams());
    sendFinalResult.mockResolvedValue(null);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(<App />);

    const simulateGroupsButton = await screen.findByRole('button', { name: /Simular grupos/i });
    const goToEighthsButton = screen.getByRole('button', { name: /Ir para oitavas/i });

    expect(goToEighthsButton).toBeDisabled();

    await userEvent.click(simulateGroupsButton);

    expect(await screen.findAllByText('0 x 0')).not.toHaveLength(0);
    await waitFor(() => expect(goToEighthsButton).toBeEnabled());

    await userEvent.click(goToEighthsButton);

    expect(await screen.findByRole('button', { name: /Simular oitavas/i })).toBeInTheDocument();
    expect(screen.queryByText('A definir')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Simular oitavas/i }));

    expect(await screen.findByRole('button', { name: /Ir para quartas/i })).toBeInTheDocument();
    expect(screen.getAllByText('0 x 0').length).toBeGreaterThan(0);
  });

  it('completes the tournament and surfaces final submission errors', async () => {
    fetchTeams.mockResolvedValue(createTeams());
    sendFinalResult.mockRejectedValue(new Error('API final indisponivel'));
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: /Simular grupos/i }));
    await userEvent.click(screen.getByRole('button', { name: /Ir para oitavas/i }));
    await userEvent.click(await screen.findByRole('button', { name: /Simular oitavas/i }));
    await userEvent.click(await screen.findByRole('button', { name: /Ir para quartas/i }));
    await userEvent.click(await screen.findByRole('button', { name: /Simular quartas/i }));
    await userEvent.click(await screen.findByRole('button', { name: /Ir para semifinal/i }));
    await userEvent.click(await screen.findByRole('button', { name: /Simular semifinal/i }));
    await userEvent.click(await screen.findByRole('button', { name: /Ir para final/i }));
    await userEvent.click(await screen.findByRole('button', { name: /Simular final/i }));

    expect(await screen.findByText(/Campeao da simulacao/i)).toBeInTheDocument();
    expect(screen.getByText(/API final indisponivel/i)).toBeInTheDocument();
    expect(screen.queryByText(/Campeao indefinido/i)).not.toBeInTheDocument();
  });
});
