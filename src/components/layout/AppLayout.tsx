import { Outlet } from "react-router-dom";
import Banner from "./Banner";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatbotWidget from "../common/ChatbotWidget";

const AppLayout = () => {
    return (
        <>
            <Banner />
            <Navbar />
            <main className="min-h-screen">
                <Outlet />
            </main>
            <Footer />
            <ChatbotWidget />
        </>
    );
};

export default AppLayout;