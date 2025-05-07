import { useEffect, useRef, useState } from 'react';
import { Image, Layer, Stage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import './App.css';
import AutosizeInput from 'react-input-autosize';

type Image = {
  id: number;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type CanvasText = {
  id: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
};

interface URLImageProps {
  image: Image;
  isSelectedImage: boolean;
  onSelectImage: VoidFunction;
  onCoordsChange: ({ x, y }: { x: number; y: number }) => void;
}

function downloadURI(uri, name) {
  var link = document.createElement('a');
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const URLImage = ({
  image,
  isSelectedImage,
  onSelectImage,
  onCoordsChange,
}: URLImageProps) => {
  const [img] = useImage(image.src, 'anonymous');
  const trRef = useRef<any>();
  const imageRef = useRef<any>();

  useEffect(() => {
    if (isSelectedImage) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelectedImage]);

  return (
    <>
      <Image
        onClick={onSelectImage}
        onTap={onSelectImage}
        ref={imageRef}
        image={img}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        // offsetX={img ? img.width / 2 : 0}
        // offsetY={img ? img.height / 2 : 0}
        draggable
        onDragEnd={(e) => {
          onCoordsChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
      />
      {isSelectedImage && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize to a minimum size
            if (newBox.width < 50 || newBox.height < 50) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

const createRandomId = () => Math.random() * 10;
const MAX_WIDTH = 300;
const MAX_HEIGHT = 300;

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragUrlRef = useRef<string>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const [images, setImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);

  const [texts, setTexts] = useState<CanvasText[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<number | null>(null);
  const [editedTextValue, setEditedTextValue] = useState({
    textValue: '',
    x: 50,
    y: 50,
  });
  const [selectedEditTextId, setSelectedEditTextId] = useState(0);

  const [imageSources, setImageSources] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        if (selectedImage !== 0) {
          setImages((prev) => prev.filter((img) => img.id !== selectedImage));
          setSelectedImage(0);
        }

        if (selectedTextId !== null) {
          setTexts((prev) => prev.filter((txt) => txt.id !== selectedTextId));
          setSelectedTextId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, selectedTextId]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize(); // Initial call

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const stageRef = useRef<any>();

  const handleExport = () => {
    const uri = stageRef.current.toDataURL();

    // we also can save uri as file
    downloadURI(uri, 'stage.png');
  };

  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      style={{
        display: 'flex',
        paddingTop: '10rem',
        paddingInline: '5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          gap: '10px',
        }}
      >
        <button onClick={handleExport}>
          Click here to export stage as image
        </button>
        <button
          onClick={() => {
            const id = Math.random();
            setTexts((prev) => [
              ...prev,
              { id, text: 'New Text', x: 50, y: 50, fontSize: 24 },
            ]);
            setSelectedTextId(id);
          }}
        >
          Add Text
        </button>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              setImageSources((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
          }}
        />
        {imageSources.map((src, index) => (
          <img
            key={index}
            alt="draggable"
            src={src}
            width={100}
            style={{ margin: '10px', border: '1px solid #ccc', cursor: 'grab' }}
            draggable="true"
            onDragStart={() => {
              dragUrlRef.current = src;
            }}
          />
        ))}
      </div>
      <div
        ref={containerRef}
        style={{
          width: '1050px',
          height: '550px',
          border: '1px solid black',
          margin: '50px auto',
          position: 'relative',
        }}
        onDrop={(e) => {
          e.preventDefault();
          const imageUrl = dragUrlRef.current;
          if (!containerRef.current || !imageUrl) return;

          const rect = containerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const id = createRandomId();
          const img = new window.Image();

          img.src = imageUrl;
          img.onload = () => {
            const { width, height } = img;

            // Calculate scale factor
            const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);

            // Add the image to canvas state
            setImages((prevs) => [
              ...(prevs ?? []),
              {
                id,
                src: dragUrlRef.current!,
                x,
                y,
                width: width * scale,
                height: height * scale,
              },
            ]);

            setSelectedImage(id);
          };

          // setImages((prevs) => [
          //   ...(prevs ?? []),
          //   {
          //     id,
          //     src: imageUrl,
          //     x,
          //     y,
          //   },
          // ]);

          // setSelectedImage(id);
          // dragUrlRef.current = undefined;
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {editedTextValue.textValue && (
          <AutosizeInput
            value={editedTextValue.textValue}
            onChange={(e) => {
              setEditedTextValue((prevValues) => ({
                textValue: e.target.value,
                x: prevValues.x,
                y: prevValues.y,
              }));
            }}
            inputRef={(el) => {
              inputRef.current = el;
            }}
            inputStyle={{
              fontSize: '24px',
              position: 'absolute',
              top: `${editedTextValue.y}px`,
              left: `${editedTextValue.x}px`,
              lineHeight: 0,
              zIndex: '2',
            }}
            onBlur={() => {
              setTexts((prevTexts) => {
                return prevTexts.map((text) => {
                  if (text.id === selectedTextId) {
                    return { ...text, text: editedTextValue.textValue };
                  }

                  return text;
                });
              });

              setEditedTextValue({
                textValue: '',
                x: 50,
                y: 50,
              });
              setSelectedEditTextId(0);
              setSelectedImage(0);
            }}
          />
        )}
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          ref={stageRef}
          onClick={() => {
            setSelectedImage(0);
          }}
        >
          <Layer
            onClick={(e) => {
              e.cancelBubble = true;
            }}
          >
            {images &&
              images.map((img) => (
                <>
                  <URLImage
                    key={img.id}
                    image={img}
                    isSelectedImage={selectedImage === img.id}
                    onSelectImage={() => {
                      setSelectedImage(img.id);
                      setSelectedTextId(0);
                    }}
                    onCoordsChange={(newAttrs) => {
                      setImages((prev) =>
                        prev?.map((item) =>
                          item.id === img.id ? { ...item, ...newAttrs } : item,
                        ),
                      );
                    }}
                  />
                </>
              ))}

            {texts.map((txt) => (
              <Text
                key={txt.id}
                text={txt.text}
                x={txt.x}
                y={txt.y}
                visible={txt.id !== selectedEditTextId}
                fontSize={txt.fontSize}
                draggable
                // fill={selectedTextId === txt.id ? 'red' : 'black'}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedTextId(txt.id);
                }}
                onDblClick={(e) => {
                  e.cancelBubble = true;
                  // setEditedText(txt.text);

                  setEditedTextValue({
                    textValue: txt.text,
                    x: txt.x,
                    y: txt.y,
                  });

                  inputRef.current?.focus();
                  // setSelectedTextId(txt.id);
                  setSelectedEditTextId(txt.id);
                }}
                onDragEnd={(e) => {
                  const newX = e.target.x();
                  const newY = e.target.y();
                  setTexts((prev) =>
                    prev.map((t) =>
                      t.id === txt.id ? { ...t, x: newX, y: newY } : t,
                    ),
                  );
                }}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default App;
