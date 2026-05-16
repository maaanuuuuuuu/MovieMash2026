import { useEffect, useMemo, useState } from 'react';
import {
  findCurrentDeployment,
  getPreviewContext,
  getPreviewRedirectUrl,
  type PreviewDeployment,
} from './BranchPreviewSelectorModel';
import './BranchPreviewSelector.css';

type PreviewManifest = {
  deployments: PreviewDeployment[];
};

export function BranchPreviewSelector() {
  const previewContext = useMemo(() => getPreviewContext(import.meta.env.BASE_URL, window.location.origin), []);
  const [deployments, setDeployments] = useState<PreviewDeployment[]>([]);

  // Load the manifest only when this build is running from a GitHub Pages preview path.
  useEffect(() => {
    if (!previewContext) {
      return;
    }

    let mounted = true;

    void fetch(previewContext.manifestUrl, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((manifest: PreviewManifest | undefined) => {
        if (mounted) {
          setDeployments(manifest?.deployments ?? []);
        }
      })
      .catch(() => {
        if (mounted) {
          setDeployments([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [previewContext]);

  if (!previewContext || deployments.length <= 1) {
    return null;
  }

  const currentDeployment = findCurrentDeployment(deployments, previewContext.currentBasePath);

  function handleChange(nextDeploymentId: string) {
    const nextDeployment = deployments.find((deployment) => deployment.id === nextDeploymentId);

    if (!nextDeployment) {
      return;
    }

    window.location.href = getPreviewRedirectUrl(nextDeployment, window.location.hash);
  }

  return (
    <aside className="branch-preview-selector" aria-label="GitHub Pages preview selector">
      <label htmlFor="branch-preview-selector">Preview</label>
      <select
        id="branch-preview-selector"
        value={currentDeployment?.id ?? ''}
        onChange={(event) => handleChange(event.target.value)}
      >
        {deployments.map((deployment) => (
          <option key={deployment.id} value={deployment.id}>
            {deployment.name}
          </option>
        ))}
      </select>
    </aside>
  );
}
