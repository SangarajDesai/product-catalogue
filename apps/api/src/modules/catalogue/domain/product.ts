export type Category = Readonly<{ slug: string; name: string }>;

export type Product = Readonly<{
  id: number;
  title: string;
  description: string;
  category: Category;
  price: Readonly<{ amount: number; currency: string }>;
  imageSource: string;
}>;
