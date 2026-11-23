import type { Product } from "../domain/product.js";
import { CategoryNotFoundError } from "./errors/category-not-found-error.js";
import { ProductNotFoundError } from "./errors/product-not-found-error.js";
import type { FeaturedSelections } from "./load-catalogue.js";
import type { ProductImageProvider } from "./product-image-provider.js";
import type { ProductRepository } from "./product-repository.js";

function findProduct(products: readonly Product[], id: number) {
  const product = products.find((candidate) => candidate.id === id);
  if (!product) throw new ProductNotFoundError();
  return product;
}

export function createCatalogue(
  repository: ProductRepository,
  imageProvider: ProductImageProvider,
  featured: FeaturedSelections,
) {
  const getProduct = async (id: number) => findProduct(await repository.list(), id);

  return {
    async listFeatured() {
      const products = await repository.list();
      return featured.home.map((id) => findProduct(products, id));
    },
    async listCategories() {
      const products = await repository.list();
      const bySlug = new Map(products.map(({ category }) => [category.slug, category]));
      return [...bySlug.values()];
    },
    async getCategory(slug: string) {
      const featuredId = featured.categories.get(slug);
      if (featuredId === undefined) throw new CategoryNotFoundError();

      const members = (await repository.list()).filter(({ category }) => category.slug === slug);
      const featuredProduct = findProduct(members, featuredId);
      return {
        category: featuredProduct.category,
        featured: featuredProduct,
        products: members.filter(({ id }) => id !== featuredId),
      };
    },
    async searchProducts(term: string) {
      const query = term.toLowerCase();
      const products = await repository.list();
      return products.filter(({ title, description }) =>
        title.toLowerCase().includes(query) || description.toLowerCase().includes(query),
      );
    },
    getProduct,
    async getProductImage(id: number) {
      const product = await getProduct(id);
      return imageProvider.get(product.imageSource);
    },
  };
}
