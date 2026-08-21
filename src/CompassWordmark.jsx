const ICON_VIEWBOX = "0 0 48 48";
const NEEDLE_PATH = "M30.5 17.5L25.8 25.8L17.5 30.5L22.2 22.2L30.5 17.5Z";

const CompassWordmark = ({
  size = 20,
  navy = "#082d47",
  academyColor = "#24b8ec",
  showAcademy = true,
}) => {
  const iconSize = size * 0.86;

  const wordmarkStyle = {
    display: "inline-flex",
    alignItems: "center",
    flexWrap: "nowrap",
    width: "max-content",
    maxWidth: "100%",
    fontSize: `${size}px`,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const iconWrapperStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: `0 0 ${iconSize}px`,
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    margin: "0 1px",
  };

  const academyStyle = {
    color: academyColor,
    display: "inline-block",
    marginLeft: "6px",
  };

  return (
    <span className="compass-wordmark" style={wordmarkStyle}>
      <span style={{ color: navy }}>C</span>

      <span className="compass-wordmark-o" style={iconWrapperStyle}>
        <svg
          viewBox={ICON_VIEWBOX}
          width={iconSize}
          height={iconSize}
          aria-hidden="true"
          style={{ display: "block", flexShrink: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="24" cy="24" r="20" fill="none" stroke={navy} strokeWidth="4.5" />
          <path d={NEEDLE_PATH} fill={navy} />
        </svg>
      </span>

      <span style={{ color: navy }}>mpass</span>

      {showAcademy && (
        <span className="compass-wordmark-academy" style={academyStyle}>
          Academy
        </span>
      )}
    </span>
  );
};

export default CompassWordmark;