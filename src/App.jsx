import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

const App = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [textColor, setTextColor] = useState("#000000");

  useEffect(() => {
    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 500,
      backgroundColor: "#f0f0f0",
      selection: true,
      preserveObjectStacking: true, 
    });

    setCanvas(newCanvas);

    newCanvas.on("object:selected", () => {
      newCanvas.selection = true;
    });

    return () => {
      newCanvas.dispose();
    };
  }, []);

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.Textbox("Hello World", {
      left: 100,
      top: 100,
      fill: textColor,
      fontSize: 24,
      selectable: true,
      evented: true,
      hasControls: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const changeColor = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      activeObject.set("fill", textColor);
      canvas.requestRenderAll();
    }
  };

  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        img.set({
          left: 50,
          top: 50,
          scaleX: 0.5,
          scaleY: 0.5,
          selectable: true,
          evented: true,
          hasControls: true,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <button onClick={addText}>Add Text</button>
      <input
        type="color"
        value={textColor}
        onChange={(e) => setTextColor(e.target.value)}
      />
      <button onClick={changeColor}>Change Text Color</button>
      <input type="file" accept="image/*" onChange={addImage} />
      <canvas ref={canvasRef} />
    </div>
  );
};

export default App;
