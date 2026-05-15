import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { passGenMock } = vi.hoisted(() => ({
  passGenMock: vi.fn(),
}));

vi.mock('./core.js', () => ({
  VERSION_DICT: {
    '----': 0,
    'V.1': 64,
    'V.2': 128,
  },
  passGen: passGenMock,
}));

import App from './App.jsx';

async function fillInputs(user, siteName = 'GitHub/Work ', masterPassword = 'mysupersecretpassword') {
  await user.type(
    screen.getByPlaceholderText(/e\.g\. github, github\/work, or user@example\.com/i),
    siteName
  );
  await user.type(screen.getByPlaceholderText(/mysupersecretpassword/i), masterPassword);
}

describe('App', () => {
  beforeEach(() => {
    passGenMock.mockReset();
    passGenMock.mockResolvedValue('GeneratedPassword123!');
  });

  it('calls passGen with normalized site input and default limited mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await fillInputs(user);
    await user.click(screen.getByRole('button', { name: /generate password/i }));

    await waitFor(() => {
      expect(passGenMock).toHaveBeenCalledWith(
        'mysupersecretpassword',
        'github/work',
        2,
        20,
        'V.1'
      );
    });

    expect(screen.getByDisplayValue('GeneratedPassword123!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeEnabled();
  });

  it('uses full-special mode when enabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('checkbox', { name: /extras:/i }));
    await user.click(screen.getByRole('checkbox', { name: /allow all special characters/i }));
    await fillInputs(user);
    await user.click(screen.getByRole('button', { name: /generate password/i }));

    await waitFor(() => {
      expect(passGenMock).toHaveBeenCalledWith(
        'mysupersecretpassword',
        'github/work',
        1,
        20,
        'V.1'
      );
    });
  });

  it('uses no-special mode when s/char is disabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('checkbox', { name: /s\/char/i }));
    await fillInputs(user);
    await user.click(screen.getByRole('button', { name: /generate password/i }));

    await waitFor(() => {
      expect(passGenMock).toHaveBeenCalledWith(
        'mysupersecretpassword',
        'github/work',
        0,
        20,
        'V.1'
      );
    });
  });

  it('copy and clear flow resets generated state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await fillInputs(user);
    await user.click(screen.getByRole('button', { name: /generate password/i }));

    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
    await user.click(copyButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied to clipboard/i })).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: /clear clipboard/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /clear clipboard/i }));

    expect(screen.getByPlaceholderText(/e\.g\. github, github\/work, or user@example\.com/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/mysupersecretpassword/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /clear clipboard/i })).toBeDisabled();
  });
});
