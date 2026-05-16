import { useState } from 'react';
import './DevDatabaseTransfer.css';
import {
  PAGES_APP_URL,
  TRANSFER_IMPORTED_TYPE,
  TRANSFER_PAYLOAD_TYPE,
  TRANSFER_READY_TYPE,
  isPagesOrigin,
  isTransferMessage,
} from './devDatabaseTransferProtocol';
import { exportDatabaseSnapshot } from '../modules/persistence/rankingRepository';

type TransferStatus = 'idle' | 'sending' | 'done' | 'failed';

const TRANSFER_TIMEOUT_MS = 20000;

export function DevDatabaseTransfer() {
  const [status, setStatus] = useState<TransferStatus>('idle');

  async function handleTransfer() {
    if (status === 'sending') {
      return;
    }

    setStatus('sending');
    const pagesOrigin = new URL(PAGES_APP_URL).origin;
    const snapshot = await exportDatabaseSnapshot().catch(() => undefined);

    if (!snapshot) {
      setStatus('failed');
      return;
    }

    const pagesWindow = window.open(PAGES_APP_URL, 'moviemash-pages-db-transfer');

    if (!pagesWindow) {
      setStatus('failed');
      return;
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      setStatus('failed');
    }, TRANSFER_TIMEOUT_MS);

    function sendSnapshot() {
      pagesWindow?.postMessage({ type: TRANSFER_PAYLOAD_TYPE, snapshot }, pagesOrigin);
    }

    function cleanup() {
      window.clearTimeout(timeoutId);
      window.removeEventListener('message', handleMessage);
    }

    function handleMessage(event: MessageEvent) {
      if (!isPagesOrigin(event.origin) || !isTransferMessage(event.data)) {
        return;
      }

      if (event.data.type === TRANSFER_READY_TYPE) {
        sendSnapshot();
        return;
      }

      if (event.data.type === TRANSFER_IMPORTED_TYPE) {
        cleanup();
        setStatus('done');
      }
    }

    window.addEventListener('message', handleMessage);
    window.setTimeout(sendSnapshot, 1200);
  }

  return (
    <button
      type="button"
      className={`dev-db-transfer dev-db-transfer--${status}`}
      disabled={status === 'sending'}
      onClick={handleTransfer}
    >
      {status === 'idle' ? 'Dump DB to Pages' : null}
      {status === 'sending' ? 'Dumping...' : null}
      {status === 'done' ? 'Pages DB updated' : null}
      {status === 'failed' ? 'Dump failed' : null}
    </button>
  );
}
