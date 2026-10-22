import Features from "../components/Home/Features";
import Hero from "../components/Home/Hero";
import HomeCategories from "../components/Home/HomeCategories";
import PopularProduct from "../components/Home/PopularProduct";
import AppPromoBanner from "../components/Home/AppPromoBanner";
import Newsletter from "../components/Home/Newsletter";
import BecomeSellerWidget from "../components/Home/BecomeSellerWidget";

const Home = () => {
    return (
        <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Hero />
            <Features />
            <HomeCategories />
            <PopularProduct />
            <AppPromoBanner />
            <Newsletter />
            <BecomeSellerWidget />
        </div>
    );
};

export default Home;
