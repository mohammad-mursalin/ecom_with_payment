import PropTypes from 'prop-types';

const Skeleton = ({ width = "100%", height, className = "", variant = "rect", rounded }) => {
  const base = "skeleton";
  const variantClass = variant === "circle" ? "rounded-full" : variant === "text" ? "rounded" : "rounded-lg";

  const style = {
    width,
    ...(height ? { height } : {}),
    ...(rounded === true ? { borderRadius: '4px' }
      : rounded ? { borderRadius: rounded }
        : {}),
  };

  return <div className={`${base} ${variantClass} ${className}`} style={style} />;
};

Skeleton.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['rect', 'circle', 'text']),
  rounded: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};

export default Skeleton;