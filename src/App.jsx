import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

const App = () => {
  const [canvases, setCanvases] = useState([]);
  const [selectedCanvas, setSelectedCanvas] = useState(null);
  const canvasRef = useRef({});
  const [textColor, setTextColor] = useState("#000000");
  const [canvasTitle, setCanvasTitle] = useState("");
  const [fontStyle, setFontStyle] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  const createCanvas = () => {
    if (!canvasTitle.trim()) {
      return alert("Please enter a title");
    }
    const id = Date.now().toString();
    const newCanvas = { id, title: canvasTitle, json: null, thumbnail: null };
    setCanvases((prev) => [...prev, newCanvas]);
    setSelectedCanvas(newCanvas);
    setCanvasTitle("");
  };

  useEffect(() => {
    if (!selectedCanvas) return;
    const { id } = selectedCanvas;

    const newCanvas = new fabric.Canvas(`canvas-${id}`, {
      width: 800,
      height: 500,
      backgroundColor: "#f8f8f8",
      selection: true,
      preserveObjectStacking: true,
    });

    canvasRef.current[id] = newCanvas;
    if (selectedCanvas.json) {
      newCanvas.loadFromJSON(selectedCanvas.json, () => newCanvas.renderAll());
    }

    newCanvas.on("selection:cleared", updateSelectedTextStyle);
    newCanvas.on("selection:updated", updateSelectedTextStyle);

    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObject = newCanvas.getActiveObject();
        if (activeObject && !activeObject.isEditing) {
          newCanvas.remove(activeObject);
          newCanvas.requestRenderAll();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      newCanvas.dispose();
      delete canvasRef.current[id];
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCanvas]);

  const saveCanvas = () => {
    if (!selectedCanvas) return;
    const { id } = selectedCanvas;
    const canvas = canvasRef.current[id];
    const json = canvas.toJSON();
    const thumbnail = canvas.toDataURL({
      format: "png",
      multiplier: 0.5,
    });
    setCanvases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, json, thumbnail } : c))
    );
  };

  const deleteCanvas = (id) => {
    setCanvases((prev) => prev.filter((c) => c.id !== id));
    if (selectedCanvas?.id === id) {
      setSelectedCanvas(null);
    }
  };
  

  const addText = () => {
    if (!selectedCanvas) return;
    const canvas = canvasRef.current[selectedCanvas.id];
    const text = new fabric.Textbox("Hello", {
      left: 100,
      top: 100,
      fill: textColor,
      fontSize: 24,
      fontWeight: fontStyle.bold ? "bold" : "normal",
      fontStyle: fontStyle.italic ? "italic" : "normal",
      underline: fontStyle.underline,
      selectable: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const updateSelectedTextStyle = () => {
    const canvas = canvasRef.current[selectedCanvas?.id];
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      setTextColor(activeObject.fill || "#000000");
      setFontStyle({
        bold: activeObject.fontWeight === "bold",
        italic: activeObject.fontStyle === "italic",
        underline: activeObject.underline || false,
      });
    }
  };

  const applyStyleToText = (property, value) => {
    if (!selectedCanvas) return;
    const canvas = canvasRef.current[selectedCanvas.id];
    const activeObject = canvas.getActiveObject();

    if (activeObject && activeObject.type === "textbox") {
      activeObject.set({ [property]: value });
      canvas.renderAll();
    }
  };

  const addImage = (event) => {
    if (!selectedCanvas) return;
    const canvas = canvasRef.current[selectedCanvas.id];
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      fabric.Image.fromURL(e.target.result, (img) => {
        img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
        canvas.add(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter title"
        value={canvasTitle}
        onChange={(e) => setCanvasTitle(e.target.value)}
      />
      <button onClick={createCanvas}>New Canvas</button>
      <button onClick={saveCanvas} disabled={!selectedCanvas}>
        Save Canvas
      </button>
      <button onClick={addText} disabled={!selectedCanvas}>
        Add text
      </button>
      <input
        type="color"
        value={textColor}
        onChange={(e) => {
          setTextColor(e.target.value);
          applyStyleToText("fill", e.target.value);
        }}
      />

      <label>
        <input
          type="checkbox"
          checked={fontStyle.bold}
          onChange={() => {
            const newBold = !fontStyle.bold;
            setFontStyle((prev) => ({ ...prev, bold: newBold }));
            applyStyleToText("fontWeight", newBold ? "bold" : "normal");
          }}
        />
        Bold
      </label>
      <label>
        <input
          type="checkbox"
          checked={fontStyle.italic}
          onChange={() => {
            const newItalic = !fontStyle.italic;
            setFontStyle((prev) => ({ ...prev, italic: newItalic }));
            applyStyleToText("fontStyle", newItalic ? "italic" : "normal");
          }}
        />
        Italic
      </label>
      <label>
        <input
          type="checkbox"
          checked={fontStyle.underline}
          onChange={() => {
            const newUnderline = !fontStyle.underline;
            setFontStyle((prev) => ({ ...prev, underline: newUnderline }));
            applyStyleToText("underline", newUnderline);
          }}
        />
        Underline
      </label>
      <input type="file" accept="image/*" onChange={addImage} disabled={!selectedCanvas} />

      <h3>Saved Canvases</h3>
      <ul>
        {canvases.map((c) => (
          <li key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {c.thumbnail && (
              <img src={c.thumbnail} alt="thumbnail" width="400" height="300"
              
              style={{ border: "1px solid #ccc", borderRadius: "5px" }}/>
            )}
            <button onClick={() => setSelectedCanvas(c)}>{c.title}</button>
            <button onClick={() => deleteCanvas(c.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {selectedCanvas && (
        <div>
          <h3>Editing Canvas: {selectedCanvas.title}</h3>
          <canvas id={`canvas-${selectedCanvas.id}`}  />
        </div>
      )}
    </div>
  );
};

export default App;
