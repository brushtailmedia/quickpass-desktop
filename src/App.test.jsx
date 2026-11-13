import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { passGenMock, writeSecretMock, clearMock } = vi.hoisted(() => ({
  passGenMock: vi.fn(),
  writeSecretMock: vi.fn(),
  clearMock: vi.fn(),
}));

vi.mock('./core.js', () => ({
  VERSION_DICT: {
    '----': 0,
    'V.1': 64,
    'V.2': 128,
  },
  passGen: passGenMock,
}));

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  writeSecret: writeSecretMock,
  clear: clearMock,
}));

import App from './App.jsx';


async function generateAndCopy(user) {
  await fillInputs(user);
  await user.click(screen.getByRole('button', { name: /generate password/i }));
  await user.click(await screen.findByRole('button', { name: /copy to clipboard/i }));
}

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
    writeSecretMock.mockReset();
    writeSecretMock.mockResolvedValue(undefined);
    clearMock.mockReset();
    clearMock.mockResolvedValue(undefined);
    // Pretend to run inside Tauri so the native clipboard path is used.
    window.__TAURI_INTERNALS__ = {};
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

  it('copies with writeSecret and clear uses the native clear', async () => {
    const user = userEvent.setup();
    render(<App />);

    await generateAndCopy(user);

    expect(writeSecretMock).toHaveBeenCalledWith('GeneratedPassword123!');

    await user.click(screen.getByRole('button', { name: /clear clipboard/i }));

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/password cleared from clipboard/i)).toBeInTheDocument();
  });

  it('editing a field after a copy clears the clipboard but keeps the form', async () => {
    const user = userEvent.setup();
    render(<App />);

    await generateAndCopy(user);
    await user.type(screen.getByPlaceholderText(/e\.g\. github, github\/work, or user@example\.com/i), 'x');

    await waitFor(() => expect(clearMock).toHaveBeenCalledTimes(1));
    expect(screen.getByPlaceholderText(/e\.g\. github, github\/work, or user@example\.com/i)).toHaveValue('github/work x');
    expect(screen.getByPlaceholderText(/mysupersecretpassword/i)).toHaveValue('mysupersecretpassword');
    expect(screen.getByRole('button', { name: /clear clipboard/i })).toBeDisabled();

    // Further edits must not clear again.
    await user.type(screen.getByPlaceholderText(/e\.g\. github, github\/work, or user@example\.com/i), 'y');
    expect(clearMock).toHaveBeenCalledTimes(1);
  });

  it('unchecks both show toggles when the app is hidden', async () => {
    const user = userEvent.setup();
    render(<App />);

    await fillInputs(user);
    await user.click(screen.getByRole('button', { name: /generate password/i }));
    const [showMaster, showSite] = screen.getAllByRole('checkbox', { name: /^show$/i });
    await user.click(showMaster);
    await user.click(showSite);
    expect(showMaster).toBeChecked();
    expect(showSite).toBeChecked();

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(showMaster).not.toBeChecked());
    expect(showSite).not.toBeChecked();
    expect(screen.getByPlaceholderText(/mysupersecretpassword/i)).toHaveValue('mysupersecretpassword');
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  });
});
