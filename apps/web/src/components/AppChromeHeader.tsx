import type { ReactNode } from 'react';
import { useT } from '../i18n';
import { Icon } from './Icon';

const APP_BRAND_NAME = 'CubeCloud Open Design';

interface Props {
  actions?: ReactNode;
  children?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  showTrafficSpace?: boolean;
  fileActionsBefore?: ReactNode;
}

export const APP_CHROME_FILE_ACTIONS_ID = 'app-chrome-file-actions';
export const APP_CHROME_FILE_ACTIONS_SELECTOR = `#${APP_CHROME_FILE_ACTIONS_ID}`;

export function AppChromeHeader({
  actions,
  children,
  onBack,
  backLabel,
  showTrafficSpace = true,
  fileActionsBefore,
}: Props) {
  const t = useT();
  const resolvedBackLabel = backLabel ?? t('project.backToProjects');

  return (
    <header className="app-chrome-header">
      {showTrafficSpace ? <div className="app-chrome-traffic-space" aria-hidden /> : null}
      <div className="app-chrome-brand" aria-label={APP_BRAND_NAME}>
        <span className="app-chrome-mark" aria-hidden>
          <img
            src="/cubecloud-icon.svg"
            alt=""
            className="brand-mark-img"
            width={20}
            height={20}
            draggable={false}
          />
        </span>
        <span className="app-chrome-name">{APP_BRAND_NAME}</span>
      </div>
      {onBack ? (
        <button
          type="button"
          className="app-chrome-back"
          onClick={onBack}
          title={resolvedBackLabel}
          aria-label={resolvedBackLabel}
        >
          <Icon name="arrow-left" size={15} />
        </button>
      ) : null}
      {children ? <div className="app-chrome-content">{children}</div> : null}
      <div className="app-chrome-drag" aria-hidden />
      {fileActionsBefore ? fileActionsBefore : null}
      <div id={APP_CHROME_FILE_ACTIONS_ID} className="app-chrome-file-actions" />
      {actions ? <div className="app-chrome-actions">{actions}</div> : null}
    </header>
  );
}

export function SettingsIconButton({
  onClick,
  title,
  ariaLabel,
}: {
  onClick: () => void;
  title: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      className="settings-icon-btn"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
    >
      <Icon name="settings" size={17} />
    </button>
  );
}
