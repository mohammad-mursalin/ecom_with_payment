import PropTypes from 'prop-types';

const PageLoader = ({ message = "Loading..." }) => {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "300px" }}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="mt-3 text-muted">{message}</p>}
    </div>
  );
};

PageLoader.propTypes = {
  message: PropTypes.string,
};

export default PageLoader;