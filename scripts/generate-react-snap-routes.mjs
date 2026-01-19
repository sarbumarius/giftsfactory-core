import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "scripts", "react-snap-routes.json");

const routes = new Set([
  "/",
  "/reduceri",
  "/intrebari-frecvente",
  "/contact",
  "/recenzii",
  "/despre-mine",
  "/creeaza-produs",
  "/wishlist",
  "/cont",
  "/en",
  "/en/reduceri",
  "/en/intrebari-frecvente",
  "/en/contact",
  "/en/recenzii",
  "/en/about-me",
  "/en/create-unique-product",
  "/en/wishlist",
  "/en/cont",
]);

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
};

const categoriesDir = path.join(root, "public", "cache_app", "categorii");
if (fs.existsSync(categoriesDir)) {
  const files = fs.readdirSync(categoriesDir).filter((file) => file.endsWith(".json"));
  files.forEach((file) => {
    const data = readJson(path.join(categoriesDir, file));
    const info = data?.info;
    const slug = info?.slug;
    if (slug) {
      routes.add(`/categorie/${slug}`);
    }
    const slugEn = info?.slug_en || slug;
    if (slugEn) {
      routes.add(`/en/category/${slugEn}`);
    }
  });
}

const productsDir = path.join(root, "public", "cache_app", "produse");
if (fs.existsSync(productsDir)) {
  const files = fs.readdirSync(productsDir).filter((file) => file.endsWith(".json"));
  files.forEach((file) => {
    const data = readJson(path.join(productsDir, file));
    const slug = data?.slug;
    if (slug) {
      routes.add(`/produs/${slug}`);
    }
    const slugEn = data?.slug_en || slug;
    if (slugEn) {
      routes.add(`/en/product/${slugEn}`);
    }
  });
}

const sortedRoutes = Array.from(routes).sort();
fs.writeFileSync(outputPath, JSON.stringify(sortedRoutes, null, 2), "utf8");
const packageJsonPath = path.join(root, "package.json");
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.reactSnap = packageJson.reactSnap || {};
  packageJson.reactSnap.include = sortedRoutes;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
} catch (error) {
  console.warn(`Failed to update package.json reactSnap include: ${error}`);
}
console.log(`Wrote ${sortedRoutes.length} routes to ${outputPath}`);
