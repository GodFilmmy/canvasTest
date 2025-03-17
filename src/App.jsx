import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

const App = () => {
  const [canvases, setCanvases] = useState([]);
  const [selectedCanvas, setSelectedCanvas] = useState(null);
  const canvasRef = useRef({});
  const [textColor, setTextColor] = useState("#000000");
  const [canvasTitle, setCanvasTitle] = useState("");
  const [fontStyle, setFontStyle] = useState({ bold: false, italic: false, underline: false });

  // Create a new canvas
  const createCanvas = () => {
    if (!canvasTitle.trim()) return alert("Please enter a title for the canvas.");
    const id = Date.now().toString();
    const newCanvas = { id, title: canvasTitle, json: null };
    setCanvases((prev) => [...prev, newCanvas]);
    setSelectedCanvas(newCanvas);
    setCanvasTitle("");
  };

  // Initialize canvas
  useEffect(() => {
    if (!selectedCanvas) return;
    const { id } = selectedCanvas;

    const newCanvas = new fabric.Canvas(`canvas-${id}`, {
      width: 800,
      height: 500,
      backgroundColor: "#f0f0f0",
      selection: true,
      preserveObjectStacking: true,
    });

    canvasRef.current[id] = newCanvas;

    if (selectedCanvas.json) {
      newCanvas.loadFromJSON(selectedCanvas.json, () => newCanvas.renderAll());
    }

    // Detect object selection changes
    newCanvas.on("selection:created", updateSelectedTextStyles);
    newCanvas.on("selection:updated", updateSelectedTextStyles);
    
    // Keyboard shortcuts
    const handleKeyDown = (event) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        const activeObject = newCanvas.getActiveObject();
        if (activeObject && !activeObject.isEditing) {
          newCanvas.remove(activeObject);
          newCanvas.requestRenderAll();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      newCanvas.dispose();
      delete canvasRef.current[id];
    };
  }, [selectedCanvas]);

  // Save the canvas
  const saveCanvas = () => {
    if (!selectedCanvas) return;
    const { id } = selectedCanvas;
    const canvas = canvasRef.current[id];
    const json = canvas.toJSON();
    setCanvases((prev) => prev.map((c) => (c.id === id ? { ...c, json } : c)));
  };

  // Load a saved canvas
  const loadCanvas = (canvas) => {
    setSelectedCanvas(canvas);
  };

  // Delete a canvas
  const deleteCanvas = (id) => {
    setCanvases((prev) => prev.filter((c) => c.id !== id));
    if (selectedCanvas?.id === id) {
      setSelectedCanvas(null);
    }
  };

  // Add text to canvas
  const addText = () => {
    if (!selectedCanvas) return;
    const canvas = canvasRef.current[selectedCanvas.id];
    const text = new fabric.Textbox("Hello World", {
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

  // Update styles when selecting a text object
  const updateSelectedTextStyles = () => {
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

  // Apply styling updates immediately
  const applyStyleToText = (property, value) => {
    if (!selectedCanvas) return;
    const canvas = canvasRef.current[selectedCanvas.id];
    const activeObject = canvas.getActiveObject();
    
    if (activeObject && activeObject.type === "textbox") {
      activeObject.set({ [property]: value });
      canvas.renderAll();
    }
  };

  // Add an image to the canvas
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
        placeholder="Enter canvas title"
        value={canvasTitle}
        onChange={(e) => setCanvasTitle(e.target.value)}
      />
      <button onClick={createCanvas}>New Canvas</button>
      <button onClick={saveCanvas} disabled={!selectedCanvas}>
        Save Canvas
      </button>
      <button onClick={addText} disabled={!selectedCanvas}>
        Add Text
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
          <li key={c.id}>
            <button onClick={() => loadCanvas(c)}>{c.title}</button>
            <button onClick={() => deleteCanvas(c.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {selectedCanvas && (
        <div>
          <h3>Editing Canvas: {selectedCanvas.title}</h3>
          <canvas id={`canvas-${selectedCanvas.id}`} />
        </div>
      )}
    </div>
  );
};

export default App;
