import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";

export default function Layout() {
  return (
    <>
      <Navbar />
      <main><Outlet /></main>
      <Footer />
      <ChatWidget />
    </>
  );
}