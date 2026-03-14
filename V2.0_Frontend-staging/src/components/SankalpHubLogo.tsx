interface LogoProps {
  variant?: 'dark' | 'light'
  height?: number
  className?: string
}

export default function SankalpHubLogo({
  variant = 'dark',
  height = 52,
  className = '',
}: LogoProps) {
  const src = variant === 'light'
    ? '/sankalphub-logo-light.svg'
    : '/sankalphub-logo-dark.svg'

  return (
    <img
      src={src}
      alt="SankalpHub"
      height={height}
      className={className}
      style={{ display: 'block', height }}
    />
  )
}
