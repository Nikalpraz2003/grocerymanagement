import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2, Apple } from "lucide-react";
import toast from "react-hot-toast";

import {
    adminApi,
    adminError,
    type AdminProduct,
    type Category,
    type SaveProduct,
    type ProductNutrition,
} from "../../services/adminApi";

import {
    Badge,
    Drawer,
    ErrorBox,
    Field,
    PageHeader,
    SearchBox,
    Table,
    Td,
    btnDark,
    btnLight,
    iconBtn,
    inputCls,
    rs,
} from "../../components/admin/ui";

import ImageUpload from "../../components/ImageUpload";

// ---------- Empty Product Form ----------

const emptyNutrition: ProductNutrition = {
    servingSize: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sugar: "",
    sodium: "",
};

const emptyForm: SaveProduct = {
    name: "",
    description: "",
    price: 0,
    originalPrice: 0,
    image: "",
    images: [],
    category: "",
    unit: "",
    stock: 0,
    lowStockThreshold: 10,
    isOrganic: false,
    isActive: true,
    highlights: [],
    nutrition: { ...emptyNutrition },
    storage: "",
    shelfLife: "",
    countryOfOrigin: "",
    dietaryTags: [],
    vendorId: null,
};


// ---------- Convert Product to Form ----------

const toForm = (p: AdminProduct): SaveProduct => ({
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    images: p.images ?? [],
    category: p.category,
    unit: p.unit,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    isOrganic: p.isOrganic,
    isActive: p.isActive,
    highlights: p.highlights ?? [],

    // Load existing nutrition information while editing
    nutrition: {
        servingSize: p.nutrition?.servingSize ?? "",
        calories: p.nutrition?.calories ?? "",
        protein: p.nutrition?.protein ?? "",
        carbs: p.nutrition?.carbs ?? "",
        fat: p.nutrition?.fat ?? "",
        fiber: p.nutrition?.fiber ?? "",
        sugar: p.nutrition?.sugar ?? "",
        sodium: p.nutrition?.sodium ?? "",
    },

    storage: p.storage ?? "",
    shelfLife: p.shelfLife ?? "",
    countryOfOrigin: p.countryOfOrigin ?? "",
    dietaryTags: p.dietaryTags ?? [],
    vendorId: p.vendorId ?? null,
});


// ---------- Product Drawer ----------

const ProductDrawer = ({
    product,
    categories,
    onClose,
    onSaved,
}: {
    product: AdminProduct | null;
    categories: Category[];
    onClose: () => void;
    onSaved: () => void;
}) => {

    const [form, setForm] = useState<SaveProduct>(
        product
            ? toForm(product)
            : {
                ...emptyForm,
                nutrition: { ...emptyNutrition },
                category: categories[0]?.slug ?? "",
            }
    );

    const [highlights, setHighlights] = useState(
        (product?.highlights ?? []).join("\n")
    );

    const [tags, setTags] = useState(
        (product?.dietaryTags ?? []).join(", ")
    );

    const [saving, setSaving] = useState(false);

    const set = <K extends keyof SaveProduct>(
        k: K,
        v: SaveProduct[K]
    ) => {
        setForm(f => ({ ...f, [k]: v }));
    };

    // Update one nutrition field without affecting other nutrition fields
    const setNutrition = (key: keyof ProductNutrition, value: string) => {
        setForm(f => ({
            ...f,
            nutrition: {
                ...(f.nutrition ?? emptyNutrition),
                [key]: value,
            },
        }));
    };


    // ---------- Save Product ----------

    const save = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.price <= 0) {
            toast.error("Price must be more than 0");
            return;
        }

        const nutrition = form.nutrition ?? emptyNutrition;

        // If every nutrition field is empty, send null
        const hasNutrition = Object.values(nutrition).some(
            value => value.trim() !== ""
        );

        const body: SaveProduct = {
            ...form,

            originalPrice:
                form.originalPrice > form.price
                    ? form.originalPrice
                    : form.price,

            images: form.image
                ? [
                    form.image,
                    ...form.images.filter(i => i !== form.image),
                ]
                : form.images,

            highlights: highlights
                .split("\n")
                .map(h => h.trim())
                .filter(Boolean),

            dietaryTags: tags
                .split(",")
                .map(t => t.trim())
                .filter(Boolean),

            nutrition: hasNutrition ? nutrition : null,
        };

        setSaving(true);

        try {
            if (product) {
                await adminApi.updateProduct(product._id, body);
            } else {
                await adminApi.createProduct(body);
            }

            toast.success(
                product ? "Product updated" : "Product added"
            );

            onSaved();

        } catch (err) {
            toast.error(adminError(err));
        } finally {
            setSaving(false);
        }
    };


    // ---------- UI ----------

    return (
        <form onSubmit={save}>
            <Drawer
                title={product ? "Edit product" : "Add product"}
                onClose={onClose}
                wide
                footer={
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            className={btnLight}
                        >
                            Cancel
                        </button>

                        <button
                            disabled={saving}
                            className={btnDark}
                        >
                            {saving
                                ? "Saving..."
                                : product
                                    ? "Save changes"
                                    : "Add product"}
                        </button>
                    </>
                }
            >

                {/* Vendor Information */}

                {form.vendorId && (
                    <p className="text-xs bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2">
                        This product belongs to a seller. Your changes keep it linked to them.
                    </p>
                )}


                {/* Product Name */}

                <Field label="Product name *">
                    <input
                        required
                        value={form.name}
                        onChange={e => set("name", e.target.value)}
                        className={inputCls}
                    />
                </Field>


                {/* Category and Unit */}

                <div className="grid grid-cols-2 gap-4">

                    <Field label="Category *">
                        <select
                            required
                            value={form.category}
                            onChange={e => set("category", e.target.value)}
                            className={inputCls}
                        >
                            {categories.map(c => (
                                <option key={c.slug} value={c.slug}>
                                    {c.name}
                                    {c.isActive ? "" : " (hidden)"}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field
                        label="Unit"
                        hint="e.g. 1 kg, 500 g, 1 pack"
                    >
                        <input
                            value={form.unit}
                            onChange={e => set("unit", e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                </div>


                {/* Price */}

                <div className="grid grid-cols-2 gap-4">

                    <Field label="Selling price (Rs.) *">
                        <input
                            required
                            type="number"
                            min={1}
                            step="0.01"
                            value={form.price || ""}
                            onChange={e =>
                                set("price", Number(e.target.value))
                            }
                            className={inputCls}
                        />
                    </Field>

                    <Field
                        label="Original price (Rs.)"
                        hint="Higher than selling price shows a discount"
                    >
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={form.originalPrice || ""}
                            onChange={e =>
                                set("originalPrice", Number(e.target.value))
                            }
                            className={inputCls}
                        />
                    </Field>

                </div>


                {/* Stock */}

                <div className="grid grid-cols-2 gap-4">

                    <Field label="Stock *">
                        <input
                            required
                            type="number"
                            min={0}
                            value={form.stock}
                            onChange={e =>
                                set("stock", Number(e.target.value))
                            }
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Low stock alert at">
                        <input
                            type="number"
                            min={0}
                            value={form.lowStockThreshold}
                            onChange={e =>
                                set("lowStockThreshold", Number(e.target.value))
                            }
                            className={inputCls}
                        />
                    </Field>

                </div>


                {/* Product Photo */}

                <div>
                    <span className="block text-xs font-semibold text-[#5f5a52] mb-1.5">
                        Product photo
                    </span>

                    <ImageUpload
                        value={form.image}
                        onChange={url => set("image", url)}
                        inputClassName={inputCls}
                    />
                </div>


                {/* Description */}

                <Field label="Description">
                    <textarea
                        rows={3}
                        value={form.description}
                        onChange={e => set("description", e.target.value)}
                        className={inputCls}
                    />
                </Field>


                {/* Highlights */}

                <Field
                    label="Highlights"
                    hint="One per line"
                >
                    <textarea
                        rows={3}
                        value={highlights}
                        onChange={e => setHighlights(e.target.value)}
                        className={inputCls}
                    />
                </Field>


                {/* Dietary Tags */}

                <Field
                    label="Dietary tags"
                    hint="Comma separated, e.g. Vegan, Gluten free"
                >
                    <input
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        className={inputCls}
                    />
                </Field>


                {/* Nutrition Information */}

                <div className="border border-[#e7e2d9] rounded-xl p-4 space-y-4">

                    <div className="flex items-center gap-2">
                        <div className="size-9 rounded-lg bg-green-50 flex items-center justify-center">
                            <Apple size={18} className="text-green-700" />
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[#302d28]">
                                Nutrition Information
                            </h3>

                            <p className="text-xs text-[#9a948a]">
                                Optional nutritional details for this product
                            </p>
                        </div>
                    </div>


                    {/* Serving Size */}

                    <Field
                        label="Serving Size"
                        hint="Example: 100g, 1 cup, 1 piece"
                    >
                        <input
                            value={form.nutrition?.servingSize ?? ""}
                            onChange={e =>
                                setNutrition("servingSize", e.target.value)
                            }
                            placeholder="100g"
                            className={inputCls}
                        />
                    </Field>


                    {/* Nutrition Fields */}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                        <Field label="Calories">
                            <input
                                value={form.nutrition?.calories ?? ""}
                                onChange={e =>
                                    setNutrition("calories", e.target.value)
                                }
                                placeholder="150 kcal"
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Protein">
                            <input
                                value={form.nutrition?.protein ?? ""}
                                onChange={e =>
                                    setNutrition("protein", e.target.value)
                                }
                                placeholder="5g"
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Carbs">
                            <input
                                value={form.nutrition?.carbs ?? ""}
                                onChange={e =>
                                    setNutrition("carbs", e.target.value)
                                }
                                placeholder="25g"
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Fat">
                            <input
                                value={form.nutrition?.fat ?? ""}
                                onChange={e =>
                                    setNutrition("fat", e.target.value)
                                }
                                placeholder="3g"
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Fiber">
                            <input
                                value={form.nutrition?.fiber ?? ""}
                                onChange={e =>
                                    setNutrition("fiber", e.target.value)
                                }
                                placeholder="4g"
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Sugar">
                            <input
                                value={form.nutrition?.sugar ?? ""}
                                onChange={e =>
                                    setNutrition("sugar", e.target.value)
                                }
                                placeholder="8g"
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Sodium">
                            <input
                                value={form.nutrition?.sodium ?? ""}
                                onChange={e =>
                                    setNutrition("sodium", e.target.value)
                                }
                                placeholder="120mg"
                                className={inputCls}
                            />
                        </Field>

                    </div>

                    <p className="text-[11px] text-[#9a948a]">
                        Leave fields empty if nutritional information is unavailable.
                    </p>

                </div>


                {/* Storage, Shelf Life and Country */}

                <div className="grid grid-cols-3 gap-4">

                    <Field label="Storage">
                        <input
                            value={form.storage}
                            onChange={e => set("storage", e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Shelf life">
                        <input
                            value={form.shelfLife}
                            onChange={e => set("shelfLife", e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Country">
                        <input
                            value={form.countryOfOrigin}
                            onChange={e =>
                                set("countryOfOrigin", e.target.value)
                            }
                            className={inputCls}
                        />
                    </Field>

                </div>


                {/* Product Status */}

                <div className="flex gap-6">

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.isOrganic}
                            onChange={e =>
                                set("isOrganic", e.target.checked)
                            }
                        />
                        Organic
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e =>
                                set("isActive", e.target.checked)
                            }
                        />
                        Show in shop
                    </label>

                </div>

            </Drawer>
        </form>
    );
};


// ---------- Admin Products Page ----------

const AdminProducts = () => {

    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<AdminProduct | null | "new">(null);


    // ---------- Load Products ----------

    const load = async () => {
        setLoading(true);
        setError(null);

        try {
            setProducts(
                await adminApi.products(search, category, status)
            );
        } catch (e) {
            setError(adminError(e, "Unable to load products"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [category, status]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        adminApi.categories()
            .then(setCategories)
            .catch(() => setCategories([]));
    }, []);


    // ---------- Delete Product ----------

    const remove = async (p: AdminProduct) => {

        if (!confirm(`Delete "${p.name}"?`)) return;

        try {
            const r = await adminApi.deleteProduct(p._id);
            toast.success(r.message);
            void load();
        } catch (e) {
            toast.error(adminError(e));
        }
    };


    // ---------- Page UI ----------

    return (
        <section className="p-4 sm:p-8 max-w-[1500px] mx-auto">

            <PageHeader
                title="Products"
                subtitle={`${products.length} products`}
                loading={loading}
                onRefresh={() => void load()}
            >
                <button
                    onClick={() => setEditing("new")}
                    disabled={categories.length === 0}
                    className={btnDark}
                >
                    <Plus size={16} />
                    Add product
                </button>
            </PageHeader>


            {/* Search and Filters */}

            <div className="flex flex-wrap gap-2 mb-5">

                <SearchBox
                    value={search}
                    onChange={setSearch}
                    onSubmit={() => void load()}
                    placeholder="Search products, press Enter..."
                />

                <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="px-3 py-2.5 text-sm border border-[#d9d4cb] bg-white"
                >
                    <option value="all">All categories</option>

                    {categories.map(c => (
                        <option key={c.slug} value={c.slug}>
                            {c.name}
                        </option>
                    ))}
                </select>

                <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="px-3 py-2.5 text-sm border border-[#d9d4cb] bg-white"
                >
                    <option value="all">All</option>
                    <option value="active">Showing in shop</option>
                    <option value="inactive">Hidden</option>
                </select>

            </div>


            {/* Error */}

            {error && <ErrorBox message={error} />}


            {/* Products Table */}

            <Table
                head={[
                    "Product",
                    "Category",
                    "Price",
                    "Stock",
                    "Rating",
                    "Seller",
                    "Status",
                    "",
                ]}
                empty={products.length === 0}
                loading={loading}
            >

                {products.map(p => (

                    <tr
                        key={p._id}
                        className="border-t border-[#e7e2d9]"
                    >

                        <Td>
                            <div className="flex items-center gap-3">

                                <img
                                    src={p.image}
                                    alt=""
                                    className="size-11 object-cover bg-[#f0ece4]"
                                />

                                <div>
                                    <p className="font-semibold text-xs">
                                        {p.name}
                                    </p>

                                    <p className="text-[11px] text-[#9a948a]">
                                        {p.unit}
                                    </p>
                                </div>

                            </div>
                        </Td>

                        <Td className="text-xs">
                            {p.categoryName}
                        </Td>

                        <Td>
                            <span className="font-semibold">
                                {rs(p.price)}
                            </span>

                            {p.discount > 0 && (
                                <span className="ml-1.5 text-[11px] text-[#9a948a] line-through">
                                    {rs(p.originalPrice)}
                                </span>
                            )}
                        </Td>

                        <Td>
                            {p.stock === 0
                                ? <Badge label="Out of stock" />
                                : p.stock <= p.lowStockThreshold
                                    ? <span className="text-amber-700 font-semibold">{p.stock}</span>
                                    : p.stock}
                        </Td>

                        <Td className="text-xs">
                            {p.reviewCount > 0
                                ? `${p.rating.toFixed(1)} (${p.reviewCount})`
                                : "-"}
                        </Td>

                        <Td>
                      {p.vendorId
        ? <Badge label={p.storeName || "Vendor"} />
        : <span className="text-xs text-[#9a948a]">Pasalmandu</span>}
</Td>

                        <Td>
                            <Badge label={p.isActive ? "Active" : "Hidden"} />
                        </Td>

                        <Td>
                            <div className="flex gap-2 justify-end">

                                <button
                                    onClick={() => setEditing(p)}
                                    className={iconBtn}
                                    title="Edit"
                                >
                                    <Edit3 size={15} />
                                </button>

                                <button
                                    onClick={() => void remove(p)}
                                    className={iconBtn}
                                    title="Delete"
                                >
                                    <Trash2 size={15} className="text-red-500" />
                                </button>

                            </div>
                        </Td>

                    </tr>

                ))}

            </Table>


            {/* Add / Edit Drawer */}

            {editing && (
                <ProductDrawer
                    product={editing === "new" ? null : editing}
                    categories={categories}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        void load();
                    }}
                />
            )}

        </section>
    );
};

export default AdminProducts;
