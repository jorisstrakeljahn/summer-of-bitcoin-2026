"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { TransactionReport } from "@/lib/chain-lens/types";
import { FlowInputNode } from "./FlowInputNode";
import { FlowOutputNode } from "./FlowOutputNode";
import { FlowTxNode } from "./FlowTxNode";
import { FlowFeeNode } from "./FlowFeeNode";
import { FlowLegend } from "./FlowLegend";

const nodeTypes = {
  flowInput: FlowInputNode,
  flowOutput: FlowOutputNode,
  flowTx: FlowTxNode,
  flowFee: FlowFeeNode,
};

export type SelectedNode =
  | { type: "input"; index: number }
  | { type: "output"; index: number }
  | { type: "tx" }
  | { type: "fee" };

interface TransactionFlowProps {
  report: TransactionReport;
  onNodeSelect: (selection: SelectedNode | null) => void;
  selectedNodeId: string | null;
}

// Colors used for edge/node highlighting states
const ORANGE = "#f97316"; // selected path accent
const GRAY = "#71717a"; // default edge color
const GRAY_DIM = "#3f3f46"; // dimmed (non-selected) edges

/** Scale edge thickness proportionally to value, clamped to [1.5, 8] pixels. */
function clampThickness(value: number, max: number): number {
  if (max === 0) return 2;
  const ratio = value / max;
  return Math.max(1.5, Math.min(8, ratio * 8));
}

function getConnectedEdgeIds(nodeId: string, edges: Edge[]): Set<string> {
  const ids = new Set<string>();
  for (const e of edges) {
    if (e.source === nodeId || e.target === nodeId) ids.add(e.id);
  }
  return ids;
}

function getConnectedNodeIds(nodeId: string, edges: Edge[]): Set<string> {
  const ids = new Set<string>();
  ids.add(nodeId);
  for (const e of edges) {
    if (e.source === nodeId) ids.add(e.target);
    if (e.target === nodeId) ids.add(e.source);
  }
  return ids;
}

// Layout constants (px)
const NODE_H = 80;   // height per node slot
const ROW_GAP = 44;  // vertical gap between nodes
const COL_TX = 320;  // x-position of center tx node
const COL_OUT = 650;  // x-position of output column

/** Shared layout context passed to sub-builders. */
interface LayoutCtx {
  startY: number;
  maxVal: number;
  totalOut: number;
}

function buildInputNodes(report: TransactionReport, startY: number, maxInputVal: number): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  report.vin.forEach((vin, i) => {
    const id = `in-${i}`;
    nodes.push({
      id,
      type: "flowInput",
      position: { x: 0, y: startY + i * (NODE_H + ROW_GAP) },
      data: {
        label: `Input #${i}`,
        address: vin.address,
        sats: vin.prevout.value_sats,
        scriptType: vin.script_type,
        proportion: vin.prevout.value_sats / report.total_input_sats,
        hasTimelock: vin.relative_timelock.enabled,
      },
    });
    edges.push({
      id: `e-${id}`,
      source: id,
      target: "tx",
      animated: true,
      style: {
        stroke: GRAY,
        strokeWidth: clampThickness(vin.prevout.value_sats, maxInputVal),
      },
    });
  });

  return { nodes, edges };
}

function buildOutputNodes(report: TransactionReport, ctx: LayoutCtx): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const dustOutputs = new Set(
    report.vout.filter((v) => v.value_sats < 546 && v.script_type !== "op_return").map((v) => v.n),
  );

  report.vout.forEach((vout, i) => {
    const id = `out-${i}`;
    nodes.push({
      id,
      type: "flowOutput",
      position: { x: COL_OUT, y: ctx.startY + i * (NODE_H + ROW_GAP) },
      data: {
        label: `Output #${i}`,
        address: vout.address,
        sats: vout.value_sats,
        scriptType: vout.script_type,
        proportion: ctx.totalOut > 0 ? vout.value_sats / ctx.totalOut : 0,
        isDust: dustOutputs.has(vout.n),
        isOpReturn: vout.script_type === "op_return",
      },
    });
    edges.push({
      id: `e-${id}`,
      source: "tx",
      target: id,
      animated: true,
      style: {
        stroke: GRAY,
        strokeWidth: clampThickness(vout.value_sats, ctx.maxVal),
      },
    });
  });

  return { nodes, edges };
}

function buildFeeNode(report: TransactionReport, ctx: LayoutCtx, feeIdx: number): { nodes: Node[]; edges: Edge[] } {
  const hasHighFee = report.warnings.some((w) => w.code === "HIGH_FEE");

  const nodes: Node[] = [{
    id: "fee",
    type: "flowFee",
    position: { x: COL_OUT, y: ctx.startY + feeIdx * (NODE_H + ROW_GAP) },
    data: {
      sats: report.fee_sats,
      rate: report.fee_rate_sat_vb,
      highFee: hasHighFee,
      proportion: ctx.totalOut > 0 ? report.fee_sats / ctx.totalOut : 0,
    },
  }];

  const edges: Edge[] = [{
    id: "e-fee",
    source: "tx",
    target: "fee",
    animated: true,
    style: {
      stroke: GRAY,
      strokeDasharray: "5 3",
      strokeWidth: clampThickness(report.fee_sats, ctx.maxVal),
    },
  }];

  return { nodes, edges };
}

/**
 * Build the ReactFlow graph from a transaction report.
 *
 * Layout (3-column):
 *   x=0       inputs   (left column)
 *   x=COL_TX  tx node  (center, vertically centered)
 *   x=COL_OUT outputs + fee node  (right column)
 *
 * Edge thickness scales with satoshi value so the user can visually
 * compare relative amounts at a glance.
 */
function buildGraph(report: TransactionReport): { nodes: Node[]; edges: Edge[] } {
  const inputCount = report.vin.length;
  const outputCount = report.vout.length + 1; // +1 for fee node

  const inputTotalH = inputCount * (NODE_H + ROW_GAP);
  const outputTotalH = outputCount * (NODE_H + ROW_GAP);
  const totalH = Math.max(inputTotalH, outputTotalH);

  const maxInputVal = Math.max(...report.vin.map((v) => v.prevout.value_sats), 1);
  const maxOutputVal = Math.max(...report.vout.map((v) => v.value_sats), report.fee_sats, 1);
  const totalOut = report.total_output_sats + report.fee_sats;

  // Center tx node vertically
  const txNode: Node = {
    id: "tx",
    type: "flowTx",
    position: { x: COL_TX, y: totalH / 2 - 30 },
    data: {
      txid: report.txid,
      segwit: report.segwit,
      rbf: report.rbf_signaling,
      version: report.version,
    },
  };

  const inputStartY = (totalH - inputTotalH) / 2;
  const outputStartY = (totalH - outputTotalH) / 2;
  const outCtx: LayoutCtx = { startY: outputStartY, maxVal: maxOutputVal, totalOut };

  const inputs = buildInputNodes(report, inputStartY, maxInputVal);
  const outputs = buildOutputNodes(report, outCtx);
  const fee = buildFeeNode(report, outCtx, report.vout.length);

  return {
    nodes: [txNode, ...inputs.nodes, ...outputs.nodes, ...fee.nodes],
    edges: [...inputs.edges, ...outputs.edges, ...fee.edges],
  };
}

/**
 * Apply visual highlighting when a node is selected.
 *
 * Connected nodes and edges get the orange accent color, while
 * everything else is dimmed to 25% opacity. This guides the user's
 * eye along the value flow path of the clicked node.
 */
function applyHighlight(
  baseNodes: Node[],
  baseEdges: Edge[],
  selectedId: string | null,
): { nodes: Node[]; edges: Edge[] } {
  if (!selectedId) return { nodes: baseNodes, edges: baseEdges };

  const connectedNodes = getConnectedNodeIds(selectedId, baseEdges);
  const connectedEdges = getConnectedEdgeIds(selectedId, baseEdges);

  const nodes = baseNodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      highlighted: connectedNodes.has(n.id),
      selected: n.id === selectedId,
    },
    style: connectedNodes.has(n.id) ? {} : { opacity: 0.35 },
  }));

  const edges = baseEdges.map((e) => {
    if (connectedEdges.has(e.id)) {
      return {
        ...e,
        style: {
          ...e.style,
          stroke: ORANGE,
        },
        animated: true,
      };
    }
    return {
      ...e,
      style: { ...e.style, stroke: GRAY_DIM, opacity: 0.25 },
      animated: false,
    };
  });

  return { nodes, edges };
}

export function TransactionFlow({ report, onNodeSelect, selectedNodeId }: TransactionFlowProps) {
  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => buildGraph(report), [report]);

  const { nodes: highlightedNodes, edges: highlightedEdges } = useMemo(
    () => applyHighlight(baseNodes, baseEdges, selectedNodeId),
    [baseNodes, baseEdges, selectedNodeId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(highlightedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(highlightedEdges);

  useMemo(() => {
    setNodes(highlightedNodes.map((hn) => {
      const existing = nodes.find((n) => n.id === hn.id);
      return existing
        ? { ...hn, position: existing.position }
        : hn;
    }));
    setEdges(highlightedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedNodes, highlightedEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.id === "tx") {
      onNodeSelect({ type: "tx" });
    } else if (node.id === "fee") {
      onNodeSelect({ type: "fee" });
    } else if (node.id.startsWith("in-")) {
      onNodeSelect({ type: "input", index: parseInt(node.id.slice(3), 10) });
    } else if (node.id.startsWith("out-")) {
      onNodeSelect({ type: "output", index: parseInt(node.id.slice(4), 10) });
    }
  }, [onNodeSelect]);

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div className="h-[65vh] min-h-[400px] rounded-lg border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        minZoom={0.3}
        maxZoom={2.5}
      >
        <Panel position="bottom-left">
          <FlowLegend />
        </Panel>
      </ReactFlow>
    </div>
  );
}
