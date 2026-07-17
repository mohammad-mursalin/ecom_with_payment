import { useChat } from "../Context/ChatContext";
import ChatPanel from "./ChatPanel";
import ChatButton from "./ChatButton";
import { useRef } from "react";

export default function ChatWidget() {
  const { isOpen } = useChat();
  const buttonRef = useRef(null);

  return (
    <>
      {isOpen && <ChatPanel buttonRef={buttonRef} />}
      {!isOpen && <ChatButton ref={buttonRef} />}
    </>
  );
}
