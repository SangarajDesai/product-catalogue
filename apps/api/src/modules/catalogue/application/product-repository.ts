import type { Product } from "../domain/product.js";

export interface ProductRepository {
  list(): Promise<readonly Product[]>;
}
