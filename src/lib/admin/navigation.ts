import { getUser, onAuthChange } from '@netlify/identity';

/** Navigation reflects Identity's session; it does not own authentication state. */
export function setupAdminNavigation(header: HTMLElement) {
  let revision = 0;
  const render = (user: Awaited<ReturnType<typeof getUser>>) => {
    header.hidden = !user?.roles?.includes('admin');
    const menu = header.querySelector<HTMLDetailsElement>('.admin-mobile-nav');
    if (header.hidden && menu) menu.open = false;
  };
  const unsubscribe = onAuthChange((_event, user) => {
    revision++;
    render(user);
  });
  // An older session lookup must not overwrite a newer login/logout event.
  const initialRevision = revision;
  const renderInitial = (user: Awaited<ReturnType<typeof getUser>>) => {
    if (revision === initialRevision) render(user);
  };
  void getUser().then(renderInitial, () => renderInitial(null));
  return () => { revision++; unsubscribe(); };
}
