// Shared design system for Mission Control

export const colors = {
  bg: '#07090D',
  cardBg: '#0D1117',
  cardBgElevated: '#141B24',
  border: '#1C2534',
  borderSubtle: 'rgba(56, 161, 87, 0.1)',
  text: '#F0F6FC',
  textMuted: '#7D8A99',
  textSubtle: '#4A5568',
  accent: '#38A157',
  accentDark: '#2D8444',
  purple: '#9F7AEA',
  blue: '#63B3ED',
  yellow: '#E3B341',
  green: '#38A157',
  orange: '#F6AD55',
  red: '#FF7B72',
}

export const glows = {
  green: 'rgba(56, 161, 87, 0.12)',
  greenLow: 'rgba(56, 161, 87, 0.08)',
  greenSubtle: 'rgba(56, 161, 87, 0.04)',
}

export const typography = {
  pageTitle: {
    fontSize: '30px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 600,
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
  },
  small: {
    fontSize: '12px',
    fontWeight: 400,
  },
  tiny: {
    fontSize: '11px',
    fontWeight: 500,
  },
}

export const spacing = {
  page: '32px',
  section: '24px',
  card: '16px',
  element: '12px',
  tight: '8px',
}

export const borders = {
  radius: {
    small: '6px',
    medium: '8px',
    large: '12px',
    xl: '16px',
  },
  width: '1px',
  color: '#1C2534',
}

export const shadows = {
  green: '0 0 40px rgba(56, 161, 87, 0.08)',
  greenSubtle: '0 0 24px rgba(56, 161, 87, 0.04)',
  card: '0 4px 20px rgba(0, 0, 0, 0.4)',
}

export const cardStyle = {
  background: `linear-gradient(180deg, ${colors.cardBg} 0%, rgba(56, 161, 87, 0.02) 100%)`,
  border: `1px solid ${colors.border}`,
  borderRadius: borders.radius.large,
  boxShadow: shadows.card,
}

export const cardStyleAccent = {
  background: `linear-gradient(180deg, ${colors.cardBg} 0%, rgba(56, 161, 87, 0.04) 100%)`,
  border: `1px solid rgba(56, 161, 87, 0.15)`,
  borderRadius: borders.radius.large,
  boxShadow: shadows.greenSubtle,
}

export const buttonPrimary = {
  background: colors.accent,
  border: `1px solid ${colors.accent}`,
  borderRadius: borders.radius.medium,
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  padding: '10px 16px',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

export const buttonSecondary = {
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  borderRadius: borders.radius.medium,
  color: colors.textMuted,
  fontSize: '14px',
  fontWeight: 500,
  padding: '10px 16px',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

export const inputStyle = {
  width: '100%',
  background: colors.cardBg,
  border: `1px solid ${colors.border}`,
  borderRadius: borders.radius.medium,
  padding: '12px 14px',
  color: colors.text,
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: 'inherit',
}

export const BackdropTopRight = () => (
  <div
    style={{
      position: 'fixed',
      top: '-15%',
      right: '-10%',
      width: '700px',
      height: '700px',
      background: `radial-gradient(circle, ${glows.green} 0%, transparent 60%)`,
      pointerEvents: 'none',
      zIndex: 0,
      filter: 'blur(80px)',
    }}
  />
)

export const BackdropBottomLeft = () => (
  <div
    style={{
      position: 'fixed',
      bottom: '-15%',
      left: '10%',
      width: '600px',
      height: '600px',
      background: `radial-gradient(circle, ${glows.greenLow} 0%, transparent 55%)`,
      pointerEvents: 'none',
      zIndex: 0,
      filter: 'blur(70px)',
    }}
  />
)

export const BackdropCenter = () => (
  <div
    style={{
      position: 'fixed',
      top: '40%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '900px',
      height: '350px',
      background: `radial-gradient(ellipse, ${glows.greenSubtle} 0%, transparent 70%)`,
      pointerEvents: 'none',
      zIndex: 0,
      filter: 'blur(100px)',
    }}
  />
)

export const PageContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    padding: spacing.page,
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
    minHeight: '100vh',
  }}>
    <BackdropTopRight />
    <BackdropBottomLeft />
    <BackdropCenter />
    <div style={{ position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  </div>
)

export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) => (
  <div style={{ marginBottom: spacing.section }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: subtitle ? '8px' : 0,
    }}>
      <h1 style={{
        fontSize: typography.pageTitle.fontSize,
        fontWeight: typography.pageTitle.fontWeight,
        margin: 0,
        letterSpacing: typography.pageTitle.letterSpacing,
        background: 'linear-gradient(135deg, #F0F6FC 0%, #38A157 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {title}
      </h1>
      {action}
    </div>
    {subtitle && (
      <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
        {subtitle}
      </p>
    )}
  </div>
)
