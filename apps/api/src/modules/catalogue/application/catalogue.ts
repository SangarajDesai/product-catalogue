import type { Product } from "../domain/product.js";
import { ProductNotFoundError } from "./errors/product-not-found-error.js";
import type { ProductImageProvider } from "./product-image-provider.js";
import type { ProductRepository } from "./product-repository.js";

function findProduct(products: readonly Product[], id: number) {
  const product = products.find((candidate) => candidate.id === id);
  if (!product) throw new ProductNotFoundError();
  return product;
}

export function createCatalogue(repository: ProductRepository, imageProvider: ProductImageProvider, homeIds: readonly number[]) {
  return {
    async listFeatured() {
      const products = await repository.list();
      return homeIds.map((id) => findProduct(products, id));
    },
    async getProductImage(id: number) {
      const product = findProduct(await repository.list(), id);
      return imageProvider.get(product.imageSource);
    },
  };
}
