export type PreviewDeployment = {
  id: string;
  name: string;
  branch: string;
  kind: 'main' | 'pull_request';
  prNumber?: number;
  url: string;
  updatedAt: string;
  sha: string;
};

export function getPreviewContext(basePath: string, origin: string) {
  const baseUrl = new URL(basePath, origin);
  const previewsSegmentIndex = baseUrl.pathname.indexOf('/previews/');

  if (previewsSegmentIndex === -1) {
    return undefined;
  }

  const repositoryBasePath = baseUrl.pathname.slice(0, previewsSegmentIndex);
  return {
    currentBasePath: baseUrl.pathname,
    manifestUrl: `${origin}${repositoryBasePath}/previews/manifest.json`,
  };
}

export function findCurrentDeployment(deployments: PreviewDeployment[], currentBasePath: string) {
  return deployments
    .map((deployment) => ({
      deployment,
      pathname: new URL(deployment.url).pathname,
    }))
    .sort((first, second) => second.pathname.length - first.pathname.length)
    .find((candidate) => currentBasePath.startsWith(candidate.pathname))?.deployment;
}

export function getPreviewRedirectUrl(deployment: PreviewDeployment, hash: string) {
  return `${deployment.url}${hash}`;
}
