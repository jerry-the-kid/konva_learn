type Product = {
  id: number;
  name: string;
  price: string;
};

type Coord = {
  x: number;
  y: number;
};

type KonvaItem = Product & Coord;

export type { Product, Coord, KonvaItem };
