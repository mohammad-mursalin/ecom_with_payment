import React, { useState, createContext, useContext } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const showToast = (msg) => {
    setMessage(msg);
    setIsError(msg.toLowerCase().includes("error") || msg.toLowerCase().includes("failed"));
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ position: 'fixed', top: '70px', right: '20px', zIndex: 9999 }}>
        <Toast 
          show={show} 
          onClose={handleClose} 
          bg={isError ? "danger" : "success"}
          autohide
          delay={2500}
        >
          <Toast.Header>
            <strong className="me-auto">{isError ? "Error" : "Success"}</strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </ToastContext.Provider>
  );
};
export default Toast;