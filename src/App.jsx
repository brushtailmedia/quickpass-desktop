import { useState } from 'react';
import { VERSION_DICT, passGen } from './core.js';

const VERSION_KEYS = Object.keys(VERSION_DICT);

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    // Ignore; this fallback is best-effort.
  }
  document.body.removeChild(ta);
}

async function writeClipboardText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      fallbackCopy(text);
      return;
    }
  }

  fallbackCopy(text);
}

export default function App() {
  const [siteName, setSiteName] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [sitePassword, setSitePassword] = useState('');

  const [showMaster, setShowMaster] = useState(false);
  const [showSitePassword, setShowSitePassword] = useState(false);

  const [specialChars, setSpecialChars] = useState(true);
  const [fullSpecialChars, setFullSpecialChars] = useState(false);
  const [extrasVisible, setExtrasVisible] = useState(false);
  const [passwordLength, setPasswordLength] = useState(20);
  const [version, setVersion] = useState('V.1');

  const [copyEnabled, setCopyEnabled] = useState(false);
  const [clearEnabled, setClearEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('Welcome to QuickPass');

  const clearPasswordField = () => {
    setSitePassword('');
    setShowSitePassword(false);
    setCopyEnabled(false);
    setClearEnabled(false);
    setCopied(false);
  };

  const reset = () => {
    setSiteName('');
    setMasterPassword('');
    setShowMaster(false);
    clearPasswordField();
  };

  const generate = async () => {
    const normalizedSiteName = siteName.trim().toLowerCase();
    const mode = specialChars ? (fullSpecialChars ? 1 : 2) : 0;
    const key = await passGen(masterPassword, normalizedSiteName, mode, passwordLength, version);
    setSitePassword(key);
    setCopyEnabled(true);
    setClearEnabled(false);
    setStatus('Password Generated');
  };

  const copyToClipboard = async () => {
    setCopyEnabled(false);
    await writeClipboardText(sitePassword);

    setClearEnabled(true);
    setCopied(true);
    setStatus('Password Copied to Clipboard');
  };

  const clearClipboard = async () => {
    await writeClipboardText('');

    reset();
    setClearEnabled(false);
    setStatus('Password Cleared from Clipboard');
  };

  return (
    <div className="window">
      <div className="title-row">
        <h1>
          <span className="title-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path className="lock-body" d="M6.75 10h10.5A1.75 1.75 0 0 1 19 11.75v8.5A1.75 1.75 0 0 1 17.25 22h-10.5A1.75 1.75 0 0 1 5 20.25v-8.5A1.75 1.75 0 0 1 6.75 10Z" />
              <path className="lock-loop" d="M8.5 10V8.25a3.5 3.5 0 1 1 7 0V10" />
              <circle className="lock-keyhole" cx="12" cy="16.9" r="1.2" />
            </svg>
          </span>
          QuickPass
        </h1>
        <label className="checkbox-inline title-toggle">
          <input
            type="checkbox"
            checked={specialChars}
            onChange={(e) => {
              const checked = e.target.checked;
              setSpecialChars(checked);
              if (!checked) {
                setFullSpecialChars(false);
              }
              clearPasswordField();
            }}
          />
          s/char
        </label>
      </div>

      <div className="grid">
        <label className="field-label">Site Name:</label>
        <input
          className="field-input"
          placeholder="e.g. github, github/work, or user@example.com"
          value={siteName}
          onChange={(e) => {
            setSiteName(e.target.value.toLowerCase());
            clearPasswordField();
          }}
        />
        <div />

        <label className="field-label">Your Master Password:</label>
        <input
          className="field-input"
          type={showMaster ? 'text' : 'password'}
          placeholder="mysupersecretpassword"
          autoComplete="new-password"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={masterPassword}
          onChange={(e) => {
            setMasterPassword(e.target.value);
            clearPasswordField();
          }}
        />
        <label className="checkbox-inline">
          <input type="checkbox" checked={showMaster} onChange={(e) => setShowMaster(e.target.checked)} />
          show
        </label>

        <div />
        <button className="full" type="button" onClick={generate}>Generate Password</button>
        <div />

        <label className="field-label">Site Password:</label>
        <input
          className="field-input"
          type={showSitePassword ? 'text' : 'password'}
          value={sitePassword}
          readOnly
          disabled={sitePassword.length === 0}
        />
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={showSitePassword}
            disabled={sitePassword.length === 0}
            onChange={(e) => setShowSitePassword(e.target.checked)}
          />
          show
        </label>
      </div>

      <div className="button-row">
        <div className="button-spacer" />
        <button type="button" disabled={!copyEnabled} onClick={copyToClipboard}>
          {copied ? 'Copied to Clipboard' : 'Copy to Clipboard'}
        </button>
        <button type="button" disabled={!clearEnabled} onClick={clearClipboard}>Clear Clipboard</button>
      </div>

      <label className="checkbox-inline extras">
        <input type="checkbox" checked={extrasVisible} onChange={(e) => setExtrasVisible(e.target.checked)} />
        Extras:
      </label>

      {extrasVisible && (
        <div className="extras-panel">
          <label className="checkbox-inline full-special-toggle">
            <input
              type="checkbox"
              checked={fullSpecialChars}
              disabled={!specialChars}
              onChange={(e) => {
                setFullSpecialChars(e.target.checked);
                clearPasswordField();
              }}
            />
            Allow all special characters
          </label>

          <div className="radio-grid">
            <label><input type="radio" name="chars" checked={passwordLength === 8} onChange={() => { setPasswordLength(8); clearPasswordField(); }} />8 Characters</label>
            <label><input type="radio" name="chars" checked={passwordLength === 10} onChange={() => { setPasswordLength(10); clearPasswordField(); }} />10 Characters</label>
            <label><input type="radio" name="chars" checked={passwordLength === 15} onChange={() => { setPasswordLength(15); clearPasswordField(); }} />15 Characters</label>
            <label><input type="radio" name="chars" checked={passwordLength === 20} onChange={() => { setPasswordLength(20); clearPasswordField(); }} />20 Characters</label>
            <label><input type="radio" name="chars" checked={passwordLength === 32} onChange={() => { setPasswordLength(32); clearPasswordField(); }} />32 Characters</label>
            <label><input type="radio" name="chars" checked={passwordLength === 40} onChange={() => { setPasswordLength(40); clearPasswordField(); }} />40 Characters</label>
          </div>

          <div className="version-row">
            <span>Version:</span>
            <select
              value={version}
              onChange={(e) => {
                setVersion(e.target.value);
                clearPasswordField();
              }}
            >
              {VERSION_KEYS.map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>

          <p className="info">Change the version to change the output password.</p>
        </div>
      )}

      <div className="status">{status}</div>
    </div>
  );
}
