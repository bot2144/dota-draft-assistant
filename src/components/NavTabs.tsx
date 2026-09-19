import { useTranslation } from 'react-i18next';
import { useUIStore, type ViewId } from '../store/uiStore';
import './NavTabs.css';

const TABS: { id: ViewId; labelKey: string }[] = [
  { id: 'live-draft', labelKey: 'nav.liveDraft' },
  { id: 'explorer', labelKey: 'nav.explorer' },
  { id: 'simulator', labelKey: 'nav.simulator' },
  { id: 'compare', labelKey: 'nav.compare' },
  { id: 'history', labelKey: 'nav.history' },
  { id: 'settings', labelKey: 'nav.settings' },
];

export function NavTabs() {
  const { t } = useTranslation();
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);

  return (
    <nav className="nav-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`nav-tabs__item ${view === tab.id ? 'nav-tabs__item--active' : ''}`}
          onClick={() => setView(tab.id)}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </nav>
  );
}
