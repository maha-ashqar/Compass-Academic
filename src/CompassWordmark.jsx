const CompassWordmark = ({ size = 20, navy = "#000a33", gold = "#cca43b", showAcademy = true }) => {
  const iconSize = size * 0.86;

  return (
    <span className="compass-wordmark" style={{ fontSize: `${size}px` }}>
      <span style={{ color: navy }}>C</span>

      <span
        className="compass-wordmark-o"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg viewBox="0 0 48 48" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" fill="none" stroke={navy} strokeWidth="4.5" />
          <path d="M30.5 17.5L25.8 25.8L17.5 30.5L22.2 22.2L30.5 17.5Z" fill={navy} />
        </svg>
      </span>

      <span style={{ color: navy }}>mpass</span>

      {showAcademy && (
        <span className="compass-wordmark-academy" style={{ color: gold }}>
          &nbsp;Academy
        </span>
      )}
    </span>
  );
};

export default CompassWordmark;