import { useCategories } from "../../services/shopApi"
import { Link } from "react-router-dom";

const HomeCategories = () => {
  const { categories: categoriesData } = useCategories()
  return (
    <section className="py-16">
        <div className="max-w-7xl mx-auto ">
        <div>
            <h2 className="text-2xl font-semibold">Browse Categories</h2>
            <p className="text-sm text-app-text-light mt-1">Find the perfect items for your needs.</p>
        </div>
        <div className="flex items-center mt-8 overflow-x-scroll no-scrollbar">
            {categoriesData.map((cat)=> (
                    <Link key={cat.slug} to={`/products?category=${cat.slug}`} 
                    onClick={()=> window.scrollTo(0,0)} className="group flex
                    flex-col items-center gap-3 p-4">
                     <div>
                        <img src={cat.image} alt={cat.name} className="w-full
                    h-full object-contain rounded-full transition-all"/>
                 </div>
                 <span className="text-xs font-medium text-zinc-600
                 text-center leading-tight">{cat.name}</span>
                </Link>
                ))}
        </div>
        </div>
    </section>
  )
}

export default HomeCategories
