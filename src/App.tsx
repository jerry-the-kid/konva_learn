import Konva from 'konva';
import { useRef, useState } from 'react';
import { Group, Image, Layer, Rect, Stage, Text } from 'react-konva';
import useImage from 'use-image';

const CELL_WIDTH = 350;
const CELL_HEIGHT = 150;
const GRID_ROWS = 4;
const GRID_COLS = 2;
const GRID_GAP = 10;
const GRID_PADDING_HORIZONTAL = 40;
const GRID_PADDING_VERTICAL = 80;

type Product = {
  id: number;
  name: string;
  price: string;
};

const productList: Product[] = [
  { id: Math.random(), name: 'Heineken 0.0 | 330 ml', price: '10,10 £' },
  { id: Math.random(), name: 'Heineken Original | 330 ml', price: '10,10 £' },
  { id: Math.random(), name: 'Heineken Silver | 330 ml', price: '10,10 £' },
];

type Coord = {
  x: number;
  y: number;
};

type KonvaItem = Product & Coord;

function calculateOverlap(
  itemX: number,
  itemY: number,
  gridX: number,
  gridY: number,
) {
  const xOverlap = Math.max(
    0,
    Math.min(itemX + CELL_WIDTH, gridX + CELL_WIDTH) - Math.max(itemX, gridX),
  );
  const yOverlap = Math.max(
    0,
    Math.min(itemY + CELL_HEIGHT, gridY + CELL_HEIGHT) - Math.max(itemY, gridY),
  );

  const overlapArea = xOverlap * yOverlap;
  const rectArea = CELL_WIDTH * CELL_HEIGHT;

  const percentage = (overlapArea / rectArea) * 100;
  return percentage;
}

export default function App() {
  const stageRef = useRef<Konva.Stage>(null);
  const [menuItems, setMenuItems] = useState<Product[]>(productList);
  const [konvaItems, setKonvaItems] = useState<KonvaItem[]>([]);
  const snapCoords = useRef<Coord>({ x: 0, y: 0 });

  // Inside your component
  const [beerImage] = useImage('/images/bottle.svg'); // Adjust image path accordingly

  const coords: Coord[] = Array.from(
    { length: GRID_ROWS * GRID_COLS },
    (_, i) => {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const x = col * (CELL_WIDTH + GRID_GAP) + GRID_PADDING_HORIZONTAL;
      const y = row * (CELL_HEIGHT + GRID_GAP) + GRID_PADDING_VERTICAL;
      return { x, y };
    },
  );

  const canvasWidth =
    CELL_WIDTH * GRID_COLS +
    GRID_GAP * (GRID_COLS - 1) +
    GRID_PADDING_HORIZONTAL * 2;

  const canvasHeight =
    CELL_HEIGHT * GRID_ROWS +
    GRID_GAP * (GRID_ROWS - 1) +
    GRID_PADDING_VERTICAL * 2;

  const getPerfectDropCoords = (x: number, y: number): Coord => {
    const { maxCoord } = coords.reduce(
      (acc, coord) => {
        const overlap = calculateOverlap(x, y, coord.x, coord.y);
        if (overlap > acc.maxValue) {
          return {
            maxValue: overlap,
            maxCoord: coord,
          };
        }
        return acc;
      },
      {
        maxValue: -Infinity,
        maxCoord: { x: 0, y: 0 },
      },
    );
    return maxCoord;
  };

  const handleDragEnd = (
    e: Konva.KonvaEventObject<DragEvent>,
    index: number,
  ) => {
    const { x, y } = snapCoords.current;
    setKonvaItems((prevItems) => {
      const updatedItems = [...prevItems];

      const overlapItemIndex = updatedItems.findIndex(
        (item) => Math.trunc(item.x) === x && Math.trunc(item.y) === y,
      );

      if (overlapItemIndex !== -1 && overlapItemIndex !== index) {
        updatedItems[overlapItemIndex] = {
          ...updatedItems[overlapItemIndex],
          x: updatedItems[index].x,
          y: updatedItems[index].y,
        };
      }

      updatedItems[index] = {
        ...updatedItems[index],
        x: x + Math.random() * 0.001,
        y: y + Math.random() * 0.001,
      };
      return updatedItems;
    });
  };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Sidebar */}
      <div style={{ width: 250, padding: 10, background: '#f3f3f3' }}>
        <h3>Menu Items</h3>
        {menuItems.map((product) => (
          <div
            key={product.id}
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData(
                'application/json',
                JSON.stringify(product),
              )
            }
            style={{
              border: '1px solid #ccc',
              padding: 10,
              marginBottom: 10,
              cursor: 'grab',
              background: 'white',
            }}
          >
            <strong>{product.name}</strong>
            <br />
            <span>{product.price}</span>
          </div>
        ))}
      </div>

      {/* Canvas Wrapper */}
      <div
        onDrop={(e) => {
          const data: Product = JSON.parse(
            e.dataTransfer.getData('application/json'),
          );
          const dropCoord = getPerfectDropCoords(
            e.nativeEvent.offsetX,
            e.nativeEvent.offsetY,
          );
          setKonvaItems((prev) => [
            ...prev,
            { ...data, id: Math.random(), ...dropCoord },
          ]);
          setMenuItems((prev) => prev.filter((item) => item.id !== data.id));
        }}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '2px dashed #ccc',
          background: '#eee',
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        <Stage ref={stageRef} width={canvasWidth} height={canvasHeight}>
          <Layer>
            {/* Grid */}
            {coords.map((coord, i) => (
              <Group key={i} x={coord.x} y={coord.y}>
                <Rect
                  width={CELL_WIDTH}
                  height={CELL_HEIGHT}
                  fill="#fafafa"
                  stroke="#ccc"
                  dash={[4, 4]}
                />
                <Text
                  text="Place product here"
                  fontSize={14}
                  fill="#aaa"
                  width={CELL_WIDTH}
                  height={CELL_HEIGHT}
                  align="center"
                  verticalAlign="middle"
                />
              </Group>
            ))}

            {/* Dropped Items */}
            {konvaItems.map((item, idx) => (
              <Group
                key={idx}
                x={item.x}
                y={item.y}
                draggable
                onDragEnd={(e) => handleDragEnd(e, idx)}
                onDragMove={(e) => {
                  e.target.moveToTop();
                  const { x, y } = e.target.position();
                  const maxCoord = getPerfectDropCoords(x, y);
                  snapCoords.current = maxCoord || { x: 0, y: 0 };
                }}
              >
                <Rect
                  width={CELL_WIDTH}
                  height={CELL_HEIGHT}
                  fill="#eee"
                  stroke="#aaa"
                  shadowBlur={4}
                  cornerRadius={10}
                />

                <Text
                  text={`${item.name} | ${'330ml'}`}
                  fontSize={14}
                  fontStyle="bold"
                  fill="#111"
                  x={10}
                  y={10}
                />

                <Text
                  text="Non-alcoholic beer"
                  fontSize={12}
                  fill="#555"
                  x={10}
                  y={30}
                />

                {beerImage && (
                  <Image
                    image={beerImage}
                    x={CELL_WIDTH - 75}
                    y={10}
                    width={50}
                    height={50}
                  />
                )}

                <Text
                  text={`${item.price} £`}
                  fontSize={16}
                  fontStyle="bold"
                  fill="#000"
                  x={10}
                  y={CELL_HEIGHT - 30}
                />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
