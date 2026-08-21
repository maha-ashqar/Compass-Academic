const NEEDLE_PATH = "M31.5 16.5L25.6 25.6L16.5 31.5L22.4 22.4L31.5 16.5Z";

const CompassIcon = ({
  size = 36,
  needleColor = "#000a33",
  badgeColor = "#ffffff",
  spin = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={spin ? "compass-icon-spin" : ""}
  >
    <circle cx="24" cy="24" r="23" fill={badgeColor} />
    <circle cx="24" cy="24" r="18.5" stroke={needleColor} strokeWidth="1.6" opacity="0.9" />

    <g className="compass-needle">
      <path d={NEEDLE_PATH} fill={needleColor} />
    </g>

    <circle cx="24" cy="24" r="2.6" fill={badgeColor} />
    <circle cx="24" cy="24" r="2.6" stroke={needleColor} strokeWidth="1.3" />
  </svg>
);

export default CompassIcon;