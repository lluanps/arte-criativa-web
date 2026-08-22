import { SVGProps } from "react";

/**
 * Ícones de linha desenhados na mão (mesmo estilo/traço em todos), sem depender de
 * nenhuma fonte de ícone ou CDN externo — o Artifact/CSP do projeto não permite isso,
 * e manter tudo inline evita mais uma dependência externa no bundle.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="4,11 12,4 20,11" />
      <path d="M6 10v10h4v-6h4v6h4V10" />
    </Base>
  );
}

export function IconBox(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8 12 4l8 4-8 4Z" />
      <path d="M4 8v8l8 4 8-4V8" />
      <line x1="12" y1="12" x2="12" y2="20" />
    </Base>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </Base>
  );
}

export function IconBag(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 8h12l-1 12H7Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </Base>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14" r="1.3" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconBook(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5c3-1 5-1 8 .5 3-1.5 5-1.5 8-.5v14c-3-1-5-1-8 .5-3-1.5-5-1.5-8-.5Z" />
      <line x1="12" y1="5.5" x2="12" y2="19.5" />
    </Base>
  );
}

export function IconCandle(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="9" y="9" width="6" height="12" rx="1.5" />
      <path d="M12 3c1.6 2 2.1 3.3.1 5-2-1.7-1.5-3-.1-5Z" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconCup(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
      <line x1="9" y1="3.5" x2="9" y2="6" />
      <line x1="12.5" y1="3.5" x2="12.5" y2="6" />
    </Base>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.6" y1="4.6" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.4" y2="19.4" />
      <line x1="4.6" y1="19.4" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.4" y2="4.6" />
    </Base>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </Base>
  );
}

export function IconMonitor(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </Base>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Base>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13,6 19,12 13,18" />
    </Base>
  );
}

export function IconCheckCircle(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="8,12 11,15 16,9" />
    </Base>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 21 19H3Z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <path d="M8 7v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </Base>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17Z" />
      <line x1="14" y1="8" x2="17" y2="11" />
    </Base>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </Base>
  );
}

export function IconX(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </Base>
  );
}

export function IconLogOut(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
      <polyline points="12,16 17,12 12,8" />
      <line x1="17" y1="12" x2="8" y2="12" />
    </Base>
  );
}

export function IconLock(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Base>
  );
}

export function IconStar(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5 14.5 9.2 20.5 9.9 16 13.9 17.3 20 12 16.8 6.7 20 8 13.9 3.5 9.9 9.5 9.2Z" />
    </Base>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11 4 12.3 8 16 9.3 12.3 10.6 11 14.6 9.7 10.6 6 9.3 9.7 8Z" fill="currentColor" stroke="none" />
      <path d="M17.5 14 18.3 16.3 20.5 17.1 18.3 17.9 17.5 20.2 16.7 17.9 14.5 17.1 16.7 16.3Z" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" />
    </Base>
  );
}
