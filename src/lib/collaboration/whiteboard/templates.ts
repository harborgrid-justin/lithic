/**
 * Clinical Whiteboard Templates
 * Pre-built templates for body diagrams, flowcharts, and clinical checklists
 */

import { Shape } from "./canvas-engine";

export interface WhiteboardTemplate {
  id: string;
  name: string;
  description: string;
  category: "BODY_DIAGRAM" | "FLOWCHART" | "CHECKLIST" | "ASSESSMENT" | "EDUCATION";
  thumbnail?: string;
  shapes: Omit<Shape, "userId" | "userName" | "createdAt" | "updatedAt">[];
}

/**
 * Body diagram templates
 */
export const bodyDiagramTemplates: WhiteboardTemplate[] = [
  {
    id: "body-front",
    name: "Body - Anterior View",
    description: "Full body diagram, front view for marking injuries, symptoms, or surgical sites",
    category: "BODY_DIAGRAM",
    shapes: [
      // Head
      {
        id: "head",
        type: "CIRCLE",
        x: 200,
        y: 50,
        width: 80,
        height: 80,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          fillColor: "#F5E6D3",
          opacity: 1,
          lineDash: [],
        },
        data: { label: "Head" },
        layer: 0,
        locked: false,
      },
      // Torso
      {
        id: "torso",
        type: "RECTANGLE",
        x: 150,
        y: 140,
        width: 180,
        height: 250,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          fillColor: "#F5E6D3",
          opacity: 1,
          lineDash: [],
        },
        data: { label: "Torso" },
        layer: 0,
        locked: false,
      },
      // Arms
      {
        id: "left-arm",
        type: "RECTANGLE",
        x: 90,
        y: 160,
        width: 60,
        height: 200,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          fillColor: "#F5E6D3",
          opacity: 1,
          lineDash: [],
        },
        data: { label: "Left Arm" },
        layer: 0,
        locked: false,
      },
      {
        id: "right-arm",
        type: "RECTANGLE",
        x: 330,
        y: 160,
        width: 60,
        height: 200,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          fillColor: "#F5E6D3",
          opacity: 1,
          lineDash: [],
        },
        data: { label: "Right Arm" },
        layer: 0,
        locked: false,
      },
      // Legs
      {
        id: "left-leg",
        type: "RECTANGLE",
        x: 170,
        y: 390,
        width: 70,
        height: 250,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          fillColor: "#F5E6D3",
          opacity: 1,
          lineDash: [],
        },
        data: { label: "Left Leg" },
        layer: 0,
        locked: false,
      },
      {
        id: "right-leg",
        type: "RECTANGLE",
        x: 240,
        y: 390,
        width: 70,
        height: 250,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          fillColor: "#F5E6D3",
          opacity: 1,
          lineDash: [],
        },
        data: { label: "Right Leg" },
        layer: 0,
        locked: false,
      },
    ],
  },
  {
    id: "dental-chart",
    name: "Dental Chart",
    description: "Full dental chart for marking procedures and conditions",
    category: "BODY_DIAGRAM",
    shapes: [
      // Upper teeth (simplified)
      ...Array.from({ length: 16 }, (_, i) => ({
        id: `upper-${i + 1}`,
        type: "RECTANGLE" as const,
        x: 50 + i * 30,
        y: 100,
        width: 25,
        height: 40,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 1,
          fillColor: "#FFFFFF",
          opacity: 1,
          lineDash: [],
        },
        data: { label: `${i + 1}`, position: "upper" },
        layer: 0,
        locked: false,
      })),
      // Lower teeth
      ...Array.from({ length: 16 }, (_, i) => ({
        id: `lower-${i + 1}`,
        type: "RECTANGLE" as const,
        x: 50 + i * 30,
        y: 160,
        width: 25,
        height: 40,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 1,
          fillColor: "#FFFFFF",
          opacity: 1,
          lineDash: [],
        },
        data: { label: `${i + 1}`, position: "lower" },
        layer: 0,
        locked: false,
      })),
    ],
  },
];

/**
 * Clinical flowchart templates
 */
export const flowchartTemplates: WhiteboardTemplate[] = [
  {
    id: "sepsis-protocol",
    name: "Sepsis Protocol",
    description: "Clinical decision flowchart for sepsis management",
    category: "FLOWCHART",
    shapes: [
      {
        id: "start",
        type: "CIRCLE",
        x: 200,
        y: 50,
        width: 120,
        height: 120,
        rotation: 0,
        style: {
          strokeColor: "#2196F3",
          strokeWidth: 3,
          fillColor: "#E3F2FD",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "Suspected Sepsis" },
        layer: 0,
        locked: false,
      },
      {
        id: "vitals-check",
        type: "RECTANGLE",
        x: 150,
        y: 200,
        width: 220,
        height: 80,
        rotation: 0,
        style: {
          strokeColor: "#4CAF50",
          strokeWidth: 2,
          fillColor: "#E8F5E9",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "Check Vital Signs\nHR, BP, Temp, RR, O2" },
        layer: 0,
        locked: false,
      },
      {
        id: "labs",
        type: "RECTANGLE",
        x: 150,
        y: 320,
        width: 220,
        height: 80,
        rotation: 0,
        style: {
          strokeColor: "#FF9800",
          strokeWidth: 2,
          fillColor: "#FFF3E0",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "Stat Labs\nCBC, Lactate, Cultures" },
        layer: 0,
        locked: false,
      },
      {
        id: "treatment",
        type: "RECTANGLE",
        x: 150,
        y: 440,
        width: 220,
        height: 80,
        rotation: 0,
        style: {
          strokeColor: "#F44336",
          strokeWidth: 2,
          fillColor: "#FFEBEE",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "Initiate Treatment\nIV Fluids, Antibiotics" },
        layer: 0,
        locked: false,
      },
      // Connectors
      {
        id: "connector-1",
        type: "ARROW",
        x: 260,
        y: 170,
        width: 0,
        height: 30,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          opacity: 1,
          lineDash: [],
        },
        data: {},
        layer: 1,
        locked: false,
      },
      {
        id: "connector-2",
        type: "ARROW",
        x: 260,
        y: 280,
        width: 0,
        height: 40,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          opacity: 1,
          lineDash: [],
        },
        data: {},
        layer: 1,
        locked: false,
      },
      {
        id: "connector-3",
        type: "ARROW",
        x: 260,
        y: 400,
        width: 0,
        height: 40,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          opacity: 1,
          lineDash: [],
        },
        data: {},
        layer: 1,
        locked: false,
      },
    ],
  },
  {
    id: "trauma-protocol",
    name: "Trauma Assessment",
    description: "Primary and secondary trauma survey flowchart",
    category: "FLOWCHART",
    shapes: [
      {
        id: "primary-survey",
        type: "RECTANGLE",
        x: 100,
        y: 50,
        width: 150,
        height: 100,
        rotation: 0,
        style: {
          strokeColor: "#F44336",
          strokeWidth: 3,
          fillColor: "#FFEBEE",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "Primary Survey\nA-B-C-D-E" },
        layer: 0,
        locked: false,
      },
      {
        id: "airway",
        type: "RECTANGLE",
        x: 50,
        y: 180,
        width: 100,
        height: 60,
        rotation: 0,
        style: {
          strokeColor: "#2196F3",
          strokeWidth: 2,
          fillColor: "#E3F2FD",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "Airway" },
        layer: 0,
        locked: false,
      },
      {
        id: "breathing",
        type: "RECTANGLE",
        x: 170,
        y: 180,
        width: 100,
        height: 60,
        rotation: 0,
        style: {
          strokeColor: "#2196F3",
          strokeWidth: 2,
          fillColor: "#E3F2FD",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "Breathing" },
        layer: 0,
        locked: false,
      },
      {
        id: "circulation",
        type: "RECTANGLE",
        x: 290,
        y: 180,
        width: 100,
        height: 60,
        rotation: 0,
        style: {
          strokeColor: "#2196F3",
          strokeWidth: 2,
          fillColor: "#E3F2FD",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "Circulation" },
        layer: 0,
        locked: false,
      },
    ],
  },
];

/**
 * Clinical checklist templates
 */
export const checklistTemplates: WhiteboardTemplate[] = [
  {
    id: "surgical-safety",
    name: "Surgical Safety Checklist",
    description: "WHO Surgical Safety Checklist",
    category: "CHECKLIST",
    shapes: [
      {
        id: "title",
        type: "TEXT",
        x: 50,
        y: 30,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 1,
          opacity: 1,
          lineDash: [],
          fontSize: 24,
          fontFamily: "Arial",
        },
        data: { text: "Surgical Safety Checklist" },
        layer: 0,
        locked: false,
      },
      // Sign In
      {
        id: "sign-in-header",
        type: "RECTANGLE",
        x: 50,
        y: 80,
        width: 400,
        height: 40,
        rotation: 0,
        style: {
          strokeColor: "#1976D2",
          strokeWidth: 2,
          fillColor: "#BBDEFB",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "SIGN IN - Before Induction" },
        layer: 0,
        locked: false,
      },
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `sign-in-${i}`,
        type: "STICKY_NOTE" as const,
        x: 50,
        y: 130 + i * 60,
        width: 380,
        height: 50,
        rotation: 0,
        style: {
          strokeColor: "#E0E0E0",
          strokeWidth: 1,
          opacity: 1,
          lineDash: [],
        },
        data: {
          text: [
            "□ Patient identity confirmed",
            "□ Site marked",
            "□ Anesthesia safety check complete",
            "□ Pulse oximeter on patient",
            "□ Known allergies reviewed",
          ][i],
          color: "#FFFFFF",
        },
        layer: 0,
        locked: false,
      })),
      // Time Out
      {
        id: "time-out-header",
        type: "RECTANGLE",
        x: 50,
        y: 440,
        width: 400,
        height: 40,
        rotation: 0,
        style: {
          strokeColor: "#F57C00",
          strokeWidth: 2,
          fillColor: "#FFE0B2",
          opacity: 1,
          lineDash: [],
        },
        data: { text: "TIME OUT - Before Skin Incision" },
        layer: 0,
        locked: false,
      },
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `time-out-${i}`,
        type: "STICKY_NOTE" as const,
        x: 50,
        y: 490 + i * 60,
        width: 380,
        height: 50,
        rotation: 0,
        style: {
          strokeColor: "#E0E0E0",
          strokeWidth: 1,
          opacity: 1,
          lineDash: [],
        },
        data: {
          text: [
            "□ Team introductions complete",
            "□ Procedure confirmed",
            "□ Anticipated critical events discussed",
            "□ Antibiotic prophylaxis given",
          ][i],
          color: "#FFFFFF",
        },
        layer: 0,
        locked: false,
      })),
    ],
  },
  {
    id: "discharge-checklist",
    name: "Patient Discharge Checklist",
    description: "Comprehensive discharge planning checklist",
    category: "CHECKLIST",
    shapes: [
      {
        id: "title",
        type: "TEXT",
        x: 50,
        y: 30,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 1,
          opacity: 1,
          lineDash: [],
          fontSize: 20,
          fontFamily: "Arial",
        },
        data: { text: "Discharge Checklist" },
        layer: 0,
        locked: false,
      },
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `discharge-${i}`,
        type: "STICKY_NOTE" as const,
        x: 50,
        y: 80 + i * 60,
        width: 400,
        height: 50,
        rotation: 0,
        style: {
          strokeColor: "#E0E0E0",
          strokeWidth: 1,
          opacity: 1,
          lineDash: [],
        },
        data: {
          text: [
            "□ Discharge summary completed",
            "□ Medications reconciled",
            "□ Follow-up appointments scheduled",
            "□ Patient education provided",
            "□ Home care arrangements confirmed",
            "□ Medical equipment ordered",
            "□ Transportation arranged",
            "□ Emergency contact information verified",
          ][i],
          color: "#FFF9C4",
        },
        layer: 0,
        locked: false,
      })),
    ],
  },
];

/**
 * Assessment templates
 */
export const assessmentTemplates: WhiteboardTemplate[] = [
  {
    id: "pain-scale",
    name: "Pain Assessment Scale",
    description: "Visual pain scale for patient assessment",
    category: "ASSESSMENT",
    shapes: [
      {
        id: "title",
        type: "TEXT",
        x: 150,
        y: 30,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 1,
          opacity: 1,
          lineDash: [],
          fontSize: 20,
          fontFamily: "Arial",
        },
        data: { text: "Pain Scale (0-10)" },
        layer: 0,
        locked: false,
      },
      ...Array.from({ length: 11 }, (_, i) => ({
        id: `pain-${i}`,
        type: "CIRCLE" as const,
        x: 50 + i * 50,
        y: 100,
        width: 40,
        height: 40,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 2,
          fillColor: `hsl(${120 - i * 12}, 100%, 50%)`,
          opacity: 0.7,
          lineDash: [],
        },
        data: { text: i.toString() },
        layer: 0,
        locked: false,
      })),
    ],
  },
  {
    id: "falls-risk",
    name: "Falls Risk Assessment",
    description: "Visual falls risk assessment tool",
    category: "ASSESSMENT",
    shapes: [
      {
        id: "title",
        type: "TEXT",
        x: 150,
        y: 30,
        rotation: 0,
        style: {
          strokeColor: "#000000",
          strokeWidth: 1,
          opacity: 1,
          lineDash: [],
          fontSize: 20,
          fontFamily: "Arial",
        },
        data: { text: "Falls Risk Assessment" },
        layer: 0,
        locked: false,
      },
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `falls-${i}`,
        type: "STICKY_NOTE" as const,
        x: 50,
        y: 80 + i * 70,
        width: 400,
        height: 60,
        rotation: 0,
        style: {
          strokeColor: "#E0E0E0",
          strokeWidth: 1,
          opacity: 1,
          lineDash: [],
        },
        data: {
          text: [
            "History of falls: □ Yes □ No",
            "Mobility issues: □ Yes □ No",
            "Medications affecting balance: □ Yes □ No",
            "Cognitive impairment: □ Yes □ No",
            "Visual impairment: □ Yes □ No",
            "Environmental hazards: □ Yes □ No",
          ][i],
          color: i < 2 ? "#FFCDD2" : i < 4 ? "#FFF9C4" : "#C8E6C9",
        },
        layer: 0,
        locked: false,
      })),
    ],
  },
];

/**
 * Get all templates
 */
export const allTemplates: WhiteboardTemplate[] = [
  ...bodyDiagramTemplates,
  ...flowchartTemplates,
  ...checklistTemplates,
  ...assessmentTemplates,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WhiteboardTemplate | undefined {
  return allTemplates.find((template) => template.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: WhiteboardTemplate["category"]
): WhiteboardTemplate[] {
  return allTemplates.filter((template) => template.category === category);
}

/**
 * Create shapes from template
 */
export function createShapesFromTemplate(
  templateId: string,
  userId: string,
  userName: string
): Shape[] {
  const template = getTemplateById(templateId);
  if (!template) return [];

  const now = new Date();

  return template.shapes.map((shape) => ({
    ...shape,
    id: `${shape.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    userId,
    userName,
    createdAt: now,
    updatedAt: now,
  }));
}
