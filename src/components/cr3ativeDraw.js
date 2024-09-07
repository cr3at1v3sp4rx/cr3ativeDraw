import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pencil, Eraser, Square, Circle, Type, Minus, Image as ImageIcon, Palette, Trash2 } from 'lucide-react';
import { Button } from "../components/ui/button"
import { Slider } from "../components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip"
import { Input } from "../components/ui/input"

const createPeerConnection = () => ({
  send: (data) => console.log('Sent:', data),
  onmessage: (callback) => setTimeout(() => callback({ data: 'Received data' }), 1000),
});

const Cr3ativeDraw = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(5);
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 675 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const peer = createPeerConnection();
    peer.onmessage = (event) => {
      console.log(event.data);
    };

    const resizeCanvas = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
        canvas.width = width;
        canvas.height = height;
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      // Clean up peer connection
    };
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShapes();
  }, [shapes]);

  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e) => {
    const { x, y } = getMousePos(e);
    setStartPos({ x, y });
    setIsDrawing(true);

    if (tool === 'pencil' || tool === 'eraser') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [getMousePos, tool]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;

    const { x, y } = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = color;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = lineWidth;

    switch (tool) {
      case 'pencil':
      case 'eraser':
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case 'rectangle':
      case 'circle':
      case 'line':
        // Preview the shape
        redrawCanvas();
        previewShape(ctx, startPos, { x, y });
        break;
    }
  }, [isDrawing, color, fillColor, lineWidth, tool, startPos, getMousePos, redrawCanvas]);

  const stopDrawing = useCallback((e) => {
    if (isDrawing) {
      const { x, y } = getMousePos(e);
      
      if (['rectangle', 'circle', 'line'].includes(tool)) {
        setShapes([...shapes, { tool, startPos, endPos: { x, y }, color, fillColor, lineWidth }]);
      } else if (tool === 'pencil' || tool === 'eraser') {
        // For freehand drawing, we need to capture the entire path
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL();
        setShapes([...shapes, { tool, imageData }]);
      }
    }
    setIsDrawing(false);
  }, [isDrawing, tool, startPos, shapes, color, fillColor, lineWidth, getMousePos]);

  const drawShapes = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    shapes.forEach(shape => {
      if (shape.tool === 'pencil' || shape.tool === 'eraser') {
        // For freehand drawing, we redraw the saved image data
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = shape.imageData;
      } else {
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.fillColor;
        ctx.lineWidth = shape.lineWidth;
        
        switch (shape.tool) {
          case 'rectangle':
            ctx.beginPath();
            ctx.rect(shape.startPos.x, shape.startPos.y, shape.endPos.x - shape.startPos.x, shape.endPos.y - shape.startPos.y);
            ctx.stroke();
            ctx.fill();
            break;
          case 'circle':
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(shape.endPos.x - shape.startPos.x, 2) + Math.pow(shape.endPos.y - shape.startPos.y, 2));
            ctx.arc(shape.startPos.x, shape.startPos.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
            break;
          case 'line':
            ctx.beginPath();
            ctx.moveTo(shape.startPos.x, shape.startPos.y);
            ctx.lineTo(shape.endPos.x, shape.endPos.y);
            ctx.stroke();
            break;
          case 'text':
            ctx.font = `${shape.fontSize}px Arial`;
            ctx.fillStyle = shape.color;
            ctx.fillText(shape.text, shape.position.x, shape.position.y);
            break;
        }
      }
    });
  }, [shapes]);

  const previewShape = (ctx, start, end) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = lineWidth;

    switch (tool) {
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        ctx.stroke();
        ctx.fill();
        break;
      case 'circle':
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
    }
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setShapes([]);
  }, []);

  const addText = useCallback(() => {
    if (!text) return;
    setShapes([...shapes, { tool: 'text', text, fontSize, color, position: { x: 50, y: 50 } }]);
    redrawCanvas();
  }, [text, fontSize, color, shapes, redrawCanvas]);

  const saveCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'cr3ativeDraw.png';
    link.href = dataURL;
    link.click();
  }, []);

  const loadCanvas = useCallback((e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setShapes([{ tool: 'image', imageData: canvas.toDataURL() }]);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 font-sans">
      <div className="bg-white bg-opacity-90 rounded-3xl p-8 w-full max-w-6xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">cr3ativeDraw</h1>
          <div className="flex items-center space-x-2">
            <Palette className="text-purple-600" />
            <span className="text-purple-600 font-semibold">{connectedUsers} Connected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                {[
                  { icon: Pencil, toolName: 'pencil', tooltip: 'Pencil' },
                  { icon: Eraser, toolName: 'eraser', tooltip: 'Eraser' },
                  { icon: Square, toolName: 'rectangle', tooltip: 'Rectangle' },
                  { icon: Circle, toolName: 'circle', tooltip: 'Circle' },
                  { icon: Minus, toolName: 'line', tooltip: 'Line' },
                  { icon: Type, toolName: 'text', tooltip: 'Text' },
                ].map(({ icon: Icon, toolName, tooltip }) => (
                  <Tooltip key={toolName}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tool === toolName ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setTool(toolName)}
                        className="w-10 h-10"
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Color:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full overflow-hidden"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Fill:</label>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-8 h-8 rounded-full overflow-hidden"
              />
            </div>

            <div className="w-full flex items-center space-x-2">
              <label className="text-sm font-medium">Width:</label>
              <Slider
                value={[lineWidth]}
                onValueChange={(value) => setLineWidth(value[0])}
                max={20}
                step={1}
              />
            </div>
          </div>

          <div className="space-y-4">
            {tool === 'text' && (
              <>
                <Input
                  type="text"
                  placeholder="Enter text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Font size"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <Button onClick={addText} className="w-full">Add Text</Button>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={clearCanvas} className="w-10 h-10">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear Canvas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={saveCanvas} className="w-10 h-10">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save Canvas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" component="label" className="w-10 h-10">
                    <ImageIcon className="h-5 w-5" />
                    <input type="file" hidden onChange={loadCanvas} accept="image/*" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Load Image</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div ref={containerRef} className="relative w-full aspect-video">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="bg-white rounded-2xl shadow-inner w-full h-full absolute top-0 left-0"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
};

export default Cr3ativeDraw;