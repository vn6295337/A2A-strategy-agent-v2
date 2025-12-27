import React, { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  User,
  Database,
  Search,
  Brain,
  MessageSquare,
  Edit3,
  FileOutput,
  Server,
  Loader2,
  Network,
  GitBranch,
} from "lucide-react"
import type { MCPStatus } from "@/lib/api"

// === TYPES ===

type NodeStatus = 'idle' | 'executing' | 'completed' | 'failed' | 'skipped'
type CacheState = 'idle' | 'hit' | 'miss' | 'checking'

interface ProcessFlowProps {
  currentStep: string
  completedSteps: string[]
  mcpStatus: MCPStatus
  llmProvider?: string
  cacheHit?: boolean
  stockSelected?: boolean
  isSearching?: boolean
}

// === CONSTANTS ===

const NODE_SIZE = 44
const ICON_SIZE = 14
const MCP_SIZE = 36
const MCP_ICON_SIZE = 14
const LLM_WIDTH = 52
const LLM_HEIGHT = 24

const GAP = 72
const CONNECTOR_PAD = 2
const GROUP_PAD = 8

// ADJUSTED VALUES FOR TIGHT FIT
const ROW_GAP = 68            // Slight reduction to tighten vertical flow
const ROW1_Y = 32             // Pushes top row down so Group Box fits (32 - 30 = 2px from top)
const ROW2_Y = ROW1_Y + ROW_GAP
const ROW3_Y = ROW2_Y + ROW_GAP
const BYPASS_Y = 5            // Above nodes for cache bypass elbow

// SVG dimensions
const SVG_HEIGHT = 220        // Height for 3-row layout with bypass line
const SVG_WIDTH = 560
const NODE_COUNT = 7
const FLOW_WIDTH = GAP * (NODE_COUNT - 1) + NODE_SIZE
const FLOW_START_X = NODE_SIZE / 2  // Left-aligned with half-node margin

const NODES = {
  input: { x: FLOW_START_X, y: ROW1_Y },
  cache: { x: FLOW_START_X + GAP, y: ROW1_Y },
  a2a: { x: FLOW_START_X + GAP * 2, y: ROW1_Y },
  analyzer: { x: FLOW_START_X + GAP * 3, y: ROW1_Y },
  critic: { x: FLOW_START_X + GAP * 4, y: ROW1_Y },
  editor: { x: FLOW_START_X + GAP * 5, y: ROW1_Y },
  output: { x: FLOW_START_X + GAP * 6, y: ROW1_Y },
  exchange: { x: FLOW_START_X, y: ROW2_Y },
  researcher: { x: FLOW_START_X + GAP * 2, y: ROW3_Y },
}

const MCP_START_X = NODES.researcher.x + NODE_SIZE / 2 + 40
const MCP_GAP = 44
const MCP_SERVERS = [
  { id: 'financials', label: 'Fin', x: MCP_START_X },
  { id: 'valuation', label: 'Val', x: MCP_START_X + MCP_GAP },
  { id: 'volatility', label: 'Vol', x: MCP_START_X + MCP_GAP * 2 },
  { id: 'macro', label: 'Mac', x: MCP_START_X + MCP_GAP * 3 },
  { id: 'news', label: 'News', x: MCP_START_X + MCP_GAP * 4 },
  { id: 'sentiment', label: 'Sent', x: MCP_START_X + MCP_GAP * 5 },
]

const AGENTS_CENTER_X = (NODES.analyzer.x + NODES.editor.x) / 2
const LLM_PROVIDERS = [
  { id: 'groq', name: 'Groq', x: AGENTS_CENTER_X - 56 },
  { id: 'gemini', name: 'Gemini', x: AGENTS_CENTER_X },
  { id: 'openrouter', name: 'OpenRouter', x: AGENTS_CENTER_X + 56 },
]

const AGENTS_GROUP = {
  x: NODES.analyzer.x - NODE_SIZE / 2 - GROUP_PAD,
  y: ROW1_Y - NODE_SIZE / 2 - GROUP_PAD,
  width: NODES.editor.x - NODES.analyzer.x + NODE_SIZE + GROUP_PAD * 2,
  height: NODE_SIZE + GROUP_PAD * 2,
}

const LLM_GROUP = {
  x: LLM_PROVIDERS[0].x - LLM_WIDTH / 2 - GROUP_PAD,
  y: ROW2_Y - LLM_HEIGHT / 2 - GROUP_PAD,
  width: LLM_PROVIDERS[2].x - LLM_PROVIDERS[0].x + LLM_WIDTH + GROUP_PAD * 2,
  height: LLM_HEIGHT + GROUP_PAD * 2,
}

const MCP_GROUP = {
  x: MCP_SERVERS[0].x - MCP_SIZE / 2 - GROUP_PAD,
  y: ROW3_Y - MCP_SIZE / 2 - GROUP_PAD,
  width: MCP_SERVERS[5].x - MCP_SERVERS[0].x + MCP_SIZE + GROUP_PAD * 2,
  height: MCP_SIZE + GROUP_PAD * 2,
}

// === HELPER FUNCTIONS ===

function normalizeStep(step: string): string {
  const lower = step.toLowerCase()
  if (lower === 'analyst') return 'analyzer'
  if (lower === 'completed') return 'output'
  return lower
}

function getNodeStatus(
  stepId: string,
  currentStep: string,
  completedSteps: string[],
  cacheHit?: boolean
): NodeStatus {
  const normalizedCurrent = normalizeStep(currentStep)
  const normalizedCompleted = completedSteps.map(normalizeStep)

  if (normalizedCompleted.includes(stepId)) return 'completed'
  if (normalizedCurrent === stepId) return 'executing'
  if (cacheHit && ['researcher', 'analyzer', 'critic', 'editor'].includes(stepId)) {
    return 'skipped'
  }
  return 'idle'
}

// === SVG SUB-COMPONENTS ===

function ArrowMarkers() {
  return (
    <defs>
      {['idle', 'executing', 'completed'].map((status) => (
        <marker
          key={status}
          id={`arrow-${status}`}
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L0,5 L5,2.5 z" fill={`var(--pf-connector-${status})`} />
        </marker>
      ))}
    </defs>
  )
}

function SVGNode({
  x,
  y,
  icon: Icon,
  label,
  status,
  isDiamond = false,
  cacheState,
  isAgent = false,
}: {
  x: number
  y: number
  icon: React.ElementType
  label: string
  status: NodeStatus
  isDiamond?: boolean
  cacheState?: CacheState
  isAgent?: boolean
}) {
  const isExecuting = status === 'executing' || cacheState === 'checking'
  const opacity = status === 'idle' && !cacheState ? 0.5 : status === 'skipped' ? 0.4 : 1
  const strokeWidth = isAgent ? 2.5 : 2

  return (
    <g opacity={opacity} className="transition-opacity duration-300">
      <rect
        x={x - NODE_SIZE / 2}
        y={y - NODE_SIZE / 2}
        width={NODE_SIZE}
        height={NODE_SIZE}
        rx={isDiamond ? 4 : 8}
        strokeWidth={strokeWidth}
        className={cn(
          "pf-node",
          cacheState ? `pf-cache-${cacheState}` : `pf-node-${status}`,
          isAgent && "pf-agent",
          isExecuting && "pf-pulse"
        )}
        transform={isDiamond ? `rotate(45 ${x} ${y})` : undefined}
      />
      <foreignObject
        x={x - ICON_SIZE / 2}
        y={y - NODE_SIZE / 2 + 9}
        width={ICON_SIZE}
        height={ICON_SIZE}
      >
        <div className="flex items-center justify-center w-full h-full">
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          ) : (
            <Icon className="w-3.5 h-3.5 text-white" />
          )}
        </div>
      </foreignObject>
      <text
        x={x}
        y={y + NODE_SIZE / 2 - 7}
        textAnchor="middle"
        className={cn(
          "text-[8px] font-medium transition-colors duration-300",
          status === 'idle' || status === 'skipped' ? 'pf-text-idle' : 'pf-text-active'
        )}
      >
        {label}
      </text>
    </g>
  )
}

// === MAIN COMPONENT ===

export function ProcessFlow({
  currentStep,
  completedSteps,
  mcpStatus,
  llmProvider = 'groq',
  cacheHit = false,
  stockSelected = false,
  isSearching = false,
}: ProcessFlowProps) {

  // Logic derivations
  const inputStatus = stockSelected ? 'completed' : getNodeStatus('input', currentStep, completedSteps, cacheHit)
  const exchangeStatus = stockSelected ? 'completed' : isSearching ? 'executing' : 'idle'
  const analyzerStatus = getNodeStatus('analyzer', currentStep, completedSteps, cacheHit)
  const criticStatus = getNodeStatus('critic', currentStep, completedSteps, cacheHit)
  const editorStatus = getNodeStatus('editor', currentStep, completedSteps, cacheHit)
  const outputStatus = getNodeStatus('output', currentStep, completedSteps, cacheHit)
  const researcherStatus = getNodeStatus('researcher', currentStep, completedSteps, cacheHit)
  const a2aStatus = researcherStatus === 'executing' ? 'executing' : researcherStatus === 'completed' ? 'completed' : 'idle'

  const cacheState: CacheState = useMemo(() => {
    if (currentStep === 'cache') return 'checking'
    if (completedSteps.includes('cache')) return cacheHit ? 'hit' : 'miss'
    return 'idle'
  }, [currentStep, completedSteps, cacheHit])

  const conn = (from: NodeStatus | CacheState, to: NodeStatus): NodeStatus => {
    if (from === 'completed' || from === 'miss' || from === 'hit') {
        return to === 'idle' ? 'idle' : to === 'executing' ? 'executing' : 'completed'
    }
    return 'idle'
  }

  // Positioning helpers
  const nodeRight = (n: { x: number }) => n.x + NODE_SIZE / 2 + CONNECTOR_PAD
  const nodeLeft = (n: { x: number }) => n.x - NODE_SIZE / 2 - CONNECTOR_PAD
  const nodeBottom = (n: { y: number }) => n.y + NODE_SIZE / 2 + CONNECTOR_PAD
  const nodeTop = (n: { y: number }) => n.y - NODE_SIZE / 2 - CONNECTOR_PAD

  return (
    <div className="w-full">
      <div className="w-full max-w-[700px]">
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="xMidYMin meet" className="w-full h-auto">
          <ArrowMarkers />

          {/* Group Backgrounds */}
          <rect {...AGENTS_GROUP} rx={8} fill="none" stroke="var(--pf-group-stroke)" strokeWidth={1} strokeDasharray="4 3" opacity={0.35} />
          <rect {...LLM_GROUP} rx={8} fill="none" stroke="var(--pf-group-stroke)" strokeWidth={1} strokeDasharray="4 3" opacity={0.35} />
          <rect {...MCP_GROUP} rx={8} fill="none" stroke="var(--pf-group-stroke)" strokeWidth={1} strokeDasharray="4 3" opacity={0.35} />

          {/* Connectors */}
          <line x1={nodeRight(NODES.input)} y1={ROW1_Y} x2={nodeLeft(NODES.cache)} y2={ROW1_Y}
                strokeWidth={1.4} markerEnd={`url(#arrow-${conn(inputStatus, cacheState === 'idle' ? 'idle' : 'completed')})`}
                className={cn("pf-connector", `pf-connector-${conn(inputStatus, cacheState === 'idle' ? 'idle' : 'completed')}`)} />

          <line x1={nodeRight(NODES.cache)} y1={ROW1_Y} x2={nodeLeft(NODES.a2a)} y2={ROW1_Y}
                strokeWidth={1.4} markerEnd={`url(#arrow-${cacheState === 'miss' ? conn('miss', a2aStatus) : 'idle'})`}
                className={cn("pf-connector", `pf-connector-${cacheState === 'miss' ? conn('miss', a2aStatus) : 'idle'}`)} />

          {/* Cache Bypass Elbow (cache hit path) */}
          <path
            d={`M ${NODES.cache.x} ${nodeTop(NODES.cache)} L ${NODES.cache.x} ${BYPASS_Y} L ${NODES.output.x} ${BYPASS_Y} L ${NODES.output.x} ${nodeTop(NODES.output)}`}
            fill="none"
            strokeWidth={1.4}
            markerEnd={`url(#arrow-${cacheState === 'hit' ? 'completed' : 'idle'})`}
            className={cn("pf-connector", cacheState === 'hit' ? "pf-connector-completed" : "pf-connector-idle")}
            opacity={cacheState === 'hit' ? 1 : 0.3}
          />

          {/* Nodes */}
          <SVGNode x={NODES.input.x} y={NODES.input.y} icon={User} label="Input" status={inputStatus} />
          <SVGNode x={NODES.cache.x} y={NODES.cache.y} icon={Database} label="Cache" status={cacheState === 'idle' ? 'idle' : 'completed'} isDiamond cacheState={cacheState} />
          <SVGNode x={NODES.a2a.x} y={NODES.a2a.y} icon={Network} label="A2A" status={a2aStatus} />
          <SVGNode x={NODES.analyzer.x} y={NODES.analyzer.y} icon={Brain} label="Analyzer" status={analyzerStatus} isAgent />
          <SVGNode x={NODES.critic.x} y={NODES.critic.y} icon={MessageSquare} label="Critic" status={criticStatus} isAgent />
          <SVGNode x={NODES.editor.x} y={NODES.editor.y} icon={Edit3} label="Editor" status={editorStatus} isAgent />
          <SVGNode x={NODES.output.x} y={NODES.output.y} icon={FileOutput} label="Output" status={outputStatus} />

          <SVGNode x={NODES.exchange.x} y={NODES.exchange.y} icon={GitBranch} label="Exchange" status={exchangeStatus} />
          <SVGNode x={NODES.researcher.x} y={NODES.researcher.y} icon={Search} label="Research" status={researcherStatus} isAgent />

          {/* MCP Servers */}
          {MCP_SERVERS.map((mcp) => {
            const status = researcherStatus === 'executing' ? 'executing' : researcherStatus === 'completed' ? 'completed' : 'idle';
            return (
              <g key={mcp.id} opacity={status === 'executing' ? 1 : status === 'completed' ? 0.6 : 0.3}>
                <rect x={mcp.x - MCP_SIZE / 2} y={ROW3_Y - MCP_SIZE / 2} width={MCP_SIZE} height={MCP_SIZE} rx={4}
                      className={cn("pf-node", status === 'executing' ? 'pf-node-executing pf-pulse' : status === 'completed' ? 'pf-node-completed' : 'pf-node-idle')} />
                <text x={mcp.x} y={ROW3_Y + MCP_SIZE / 2 - 5} textAnchor="middle" className="text-[7px] font-medium pf-text-mcp">{mcp.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default ProcessFlow
