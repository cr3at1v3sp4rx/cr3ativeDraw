import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pencil, Eraser, Square, Circle, Type, Minus, Image as ImageIcon, Palette, Menu } from 'lucide-react';
import { Button } from "../components/ui/button"
import { Slider } from "../components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip"
import { Input } from "../components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/ui/sheet"

const createPeerConnection = () => ({
  send: (data) => console.log('Sent:', data),
  onmessage: (callback) => setTimeout(() => callback({ data: 'Received data' }), 1000),
});

const CreativeDraw = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(5);
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const peer = createPeerConnection();
    peer.onmessage = (event) => {
      console.log(event.data);
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const getPointerPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const { x, y } = getPointerPos(e);
    setStartPos({ x, y });
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [getPointerPos]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const { x, y } = getPointerPos(e);
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.rect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
        ctx.stroke();
        ctx.fill();
        break;
      case 'circle':
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
        break;
      case 'line':
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
    }
  }, [isDrawing, color, fillColor, lineWidth, tool, startPos, getPointerPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const addText = useCallback(() => {
    if (!text) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(text, 50, 50);
  }, [text, fontSize, color]);

  const saveCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'drawing.png';
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
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const renderToolbar = () => (
    <div className="flex flex-wrap gap-2 mb-4">
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
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>

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

      <div className="w-32 flex items-center space-x-2">
        <label className="text-sm font-medium">Width:</label>
        <Slider
          value={[lineWidth]}
          onValueChange={(value) => setLineWidth(value[0])}
          max={20}
          step={1}
        />
      </div>

      {tool === 'text' && (
        <>
          <Input
            type="text"
            placeholder="Enter text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-40"
          />
          <Input
            type="number"
            placeholder="Font size"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-24"
          />
          <Button onClick={addText}>Add Text</Button>
        </>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={clearCanvas}>
              <ImageIcon className="h-4 w-4" />
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
            <Button variant="outline" size="icon" onClick={saveCanvas}>
              <ImageIcon className="h-4 w-4" />
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
            <Button variant="outline" size="icon" component="label">
              <ImageIcon className="h-4 w-4" />
              <input type="file" hidden onChange={loadCanvas} accept="image/*" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Load Image</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl p-4 md:p-8 w-full max-w-5xl shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800">CreativeDraw</h1>
          <div className="flex items-center space-x-2">
            <Palette className="text-gray-600" />
            <span className="text-gray-600 font-semibold">{connectedUsers} Connected</span>
          </div>
        </div>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              {renderToolbar()}
            </SheetContent>
          </Sheet>
        ) : (
          renderToolbar()
        )}

        <div className="relative w-full aspect-video">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="bg-white rounded-2xl shadow-inner w-full h-full absolute top-0 left-0"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
};

export default CreativeDraw;