'use client';

import { useState, useEffect, useRef } from 'react';
import { dicomService, ViewportSettings, DicomMetadata } from '@/services/dicom.service';

interface DicomViewerProps {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  sopInstanceUID: string;
  onAnnotate?: (annotation: any) => void;
  onMeasure?: (measurement: any) => void;
}

export default function DicomViewer({
  studyInstanceUID,
  seriesInstanceUID,
  sopInstanceUID,
  onAnnotate,
  onMeasure,
}: DicomViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metadata, setMetadata] = useState<DicomMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<ViewportSettings>({
    windowCenter: 40,
    windowWidth: 400,
    invert: false,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [presets, setPresets] = useState<any>({});

  useEffect(() => {
    loadImage();
  }, [studyInstanceUID, seriesInstanceUID, sopInstanceUID]);

  useEffect(() => {
    if (metadata && canvasRef.current) {
      renderImage();
    }
  }, [metadata, viewport]);

  const loadImage = async () => {
    try {
      setLoading(true);
      const meta = await dicomService.getMetadata(
        studyInstanceUID,
        seriesInstanceUID,
        sopInstanceUID
      );
      setMetadata(meta);

      // Set initial window/level from metadata
      if (meta.windowCenter && meta.windowWidth) {
        setViewport(prev => ({
          ...prev,
          windowCenter: Array.isArray(meta.windowCenter) ? meta.windowCenter[0] : meta.windowCenter,
          windowWidth: Array.isArray(meta.windowWidth) ? meta.windowWidth[0] : meta.windowWidth,
        }));
      }

      // Load presets
      const modalityPresets = dicomService.getWindowLevelPresets(meta.modality);
      setPresets(modalityPresets);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load image:', error);
      setLoading(false);
    }
  };

  const renderImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !metadata) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = metadata.columns;
    canvas.height = metadata.rows;

    // In a real implementation, you would:
    // 1. Load the pixel data from the DICOM file
    // 2. Apply window/level transformation
    // 3. Apply zoom, pan, rotation, flip
    // 4. Render to canvas

    // For now, show a placeholder
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(viewport.zoom, viewport.zoom);
    ctx.rotate((viewport.rotation * Math.PI) / 180);
    if (viewport.flipHorizontal) ctx.scale(-1, 1);
    if (viewport.flipVertical) ctx.scale(1, -1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw placeholder image
    ctx.fillStyle = '#333';
    ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DICOM Image Viewer', canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillText(`${metadata.modality} - ${metadata.seriesDescription}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`WC: ${viewport.windowCenter} WW: ${viewport.windowWidth}`, canvas.width / 2, canvas.height / 2 + 40);

    ctx.restore();

    // Draw patient info overlay
    drawOverlay(ctx);
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    if (!metadata) return;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';

    const padding = 10;
    const lineHeight = 18;
    let y = padding + lineHeight;

    // Top left
    ctx.fillText(`Patient: ${metadata.patientName}`, padding, y);
    y += lineHeight;
    ctx.fillText(`ID: ${metadata.patientID}`, padding, y);
    y += lineHeight;
    ctx.fillText(`DOB: ${metadata.patientBirthDate}`, padding, y);

    // Top right
    ctx.textAlign = 'right';
    y = padding + lineHeight;
    ctx.fillText(`${metadata.modality}`, canvasRef.current!.width - padding, y);
    y += lineHeight;
    ctx.fillText(`${metadata.studyDate}`, canvasRef.current!.width - padding, y);
    y += lineHeight;
    ctx.fillText(`${metadata.institutionName || ''}`, canvasRef.current!.width - padding, y);

    // Bottom left
    ctx.textAlign = 'left';
    y = canvasRef.current!.height - padding - lineHeight * 2;
    ctx.fillText(
      `${metadata.rows}x${metadata.columns}`,
      padding,
      y
    );
    y += lineHeight;
    if (metadata.sliceThickness) {
      ctx.fillText(`Slice: ${metadata.sliceThickness}mm`, padding, y);
    }

    // Bottom right
    ctx.textAlign = 'right';
    y = canvasRef.current!.height - padding - lineHeight;
    ctx.fillText(
      `Zoom: ${(viewport.zoom * 100).toFixed(0)}%`,
      canvasRef.current!.width - padding,
      y
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (activeTool === 'windowLevel') {
      // Adjust window/level
      setViewport(prev => ({
        ...prev,
        windowCenter: prev.windowCenter + dx,
        windowWidth: Math.max(1, prev.windowWidth + dy),
      }));
    } else if (activeTool === 'pan') {
      // Pan
      setViewport(prev => ({
        ...prev,
        pan: {
          x: prev.pan.x + dx,
          y: prev.pan.y + dy,
        },
      }));
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(10, prev.zoom * delta)),
    }));
  };

  const applyPreset = (presetName: string) => {
    const preset = presets[presetName];
    if (preset) {
      setViewport(prev => ({
        ...prev,
        windowCenter: preset.center,
        windowWidth: preset.width,
      }));
    }
  };

  const resetView = () => {
    setViewport({
      windowCenter: metadata?.windowCenter || 40,
      windowWidth: metadata?.windowWidth || 400,
      invert: false,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-white">Loading image...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-800 text-white p-2 space-x-2">
        {/* Tools */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTool(activeTool === 'windowLevel' ? null : 'windowLevel')}
            className={`px-3 py-1 rounded ${
              activeTool === 'windowLevel' ? 'bg-blue-600' : 'bg-gray-700'
            } hover:bg-blue-500`}
            title="Window/Level"
          >
            W/L
          </button>
          <button
            onClick={() => setActiveTool(activeTool === 'pan' ? null : 'pan')}
            className={`px-3 py-1 rounded ${
              activeTool === 'pan' ? 'bg-blue-600' : 'bg-gray-700'
            } hover:bg-blue-500`}
            title="Pan"
          >
            Pan
          </button>
          <button
            onClick={() => setActiveTool(activeTool === 'zoom' ? null : 'zoom')}
            className={`px-3 py-1 rounded ${
              activeTool === 'zoom' ? 'bg-blue-600' : 'bg-gray-700'
            } hover:bg-blue-500`}
            title="Zoom"
          >
            Zoom
          </button>
        </div>

        {/* Presets */}
        <div className="flex space-x-2">
          <select
            onChange={e => applyPreset(e.target.value)}
            className="px-2 py-1 bg-gray-700 rounded text-sm"
            defaultValue=""
          >
            <option value="">W/L Presets</option>
            {Object.keys(presets).map(preset => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </div>

        {/* Transforms */}
        <div className="flex space-x-2">
          <button
            onClick={() => setViewport(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
            title="Rotate"
          >
            Rotate
          </button>
          <button
            onClick={() => setViewport(prev => ({ ...prev, flipHorizontal: !prev.flipHorizontal }))}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
            title="Flip Horizontal"
          >
            Flip H
          </button>
          <button
            onClick={() => setViewport(prev => ({ ...prev, flipVertical: !prev.flipVertical }))}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
            title="Flip Vertical"
          >
            Flip V
          </button>
          <button
            onClick={() => setViewport(prev => ({ ...prev, invert: !prev.invert }))}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
            title="Invert"
          >
            Invert
          </button>
        </div>

        {/* Reset */}
        <button
          onClick={resetView}
          className="px-3 py-1 bg-red-600 rounded hover:bg-red-500"
          title="Reset"
        >
          Reset
        </button>
      </div>

      {/* Viewer */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="max-w-full max-h-full cursor-crosshair"
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 text-white text-sm p-2 flex justify-between">
        <div>
          WC: {viewport.windowCenter.toFixed(0)} | WW: {viewport.windowWidth.toFixed(0)}
        </div>
        <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
        <div>
          {metadata?.rows}x{metadata?.columns} | {metadata?.modality}
        </div>
      </div>
    </div>
  );
}
