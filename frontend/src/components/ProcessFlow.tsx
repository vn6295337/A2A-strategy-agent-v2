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

type NodeStatus = 'idle' | 'executing' | 'completed' | 'failed' | 'skipped'
type CacheState = 'idle' | 'hit' | 'miss' | 'checking'

interface ProcessFlowProps {
  currentStep: string
  completedSteps: string[]
  mcpStatus: MCPStatus
  llmProvider?: string
  cacheHit?: boolean
}

// === CONSTANTS ===

const NODE_SIZE = 52
const MCP_SIZE = 48
const LLM_WIDTH = 56
const LLM_HEIGHT = 28
const ICON_SIZE = 14
const MCP_ICON_SIZE = 16
const GAP = 90

// Row Y positions (increased gap for bypass path)
const ROW1_Y = 70
const ROW2_Y = 160
const ROW3_Y = 250

// Node X positions (uniform 90px gap)
const NODES = {
  input: { x: 50, y: ROW1_Y },
  cache: { x: 50 + GAP, y: ROW1_Y },           // 140
  a2a: { x: 50 + GAP * 2, y: ROW1_Y },         // 230
  analyzer: { x: 50 + GAP * 3, y: ROW1_Y },    // 320
  critic: { x: 50 + GAP * 4, y: ROW1_Y },      // 410
  editor: { x: 50 + GAP * 5, y: ROW1_Y },      // 500
  output: { x: 50 + GAP * 6, y: ROW1_Y },      // 590
  exchange: { x: 50, y: ROW2_Y },
  researcher: { x: 50 + GAP * 2, y: ROW3_Y },  // Below A2A
}

// MCP Server positions (start after researcher)
const MCP_START_X = NODES.researcher.x + NODE_SIZE / 2 + 60
const MCP_SERVERS = [
  { id: 'financials', label: 'Fin', x: MCP_START_X },
  { id: 'valuation', label: 'Val', x: MCP_START_X + 55 },
  { id: 'volatility', label: 'Vol', x: MCP_START_X + 110 },
  { id: 'macro', label: 'Mac', x: MCP_START_X + 165 },
  { id: 'news', label: 'News', x: MCP_START_X + 220 },
  { id: 'sentiment', label: 'Sent', x: MCP_START_X + 275 },
]

// LLM Provider positions (centered under agents group)
const AGENTS_CENTER_X = (NODES.analyzer.x + NODES.editor.x) / 2
const LLM_PROVIDERS = [
  { name: 'Groq', x: AGENTS_CENTER_X - 70 },
  { name: 'Gemini', x: AGENTS_CENTER_X },
  { name: 'OpenRouter', x: AGENTS_CENTER_X + 70 },
]

// Group box calculations
const AGENTS_GROUP = {
  x: NODES.analyzer.x - NODE_SIZE / 2 - 10,
  y: ROW1_Y - NODE_SIZE / 2 - 10,
  width: NODES.editor.x - NODES.analyzer.x + NODE_SIZE + 20,
  height: NODE_SIZE + 20,
}

const LLM_GROUP = {
  x: LLM_PROVIDERS[0].x - LLM_WIDTH / 2 - 10,
  y: ROW2_Y - LLM_HEIGHT / 2 - 10,
  width: LLM_PROVIDERS[2].x - LLM_PROVIDERS[0].x + LLM_WIDTH + 20,
  height: LLM_HEIGHT + 20,
}

const MCP_GROUP = {
  x: MCP_SERVERS[0].x - MCP_SIZE / 2 - 10,
  y: ROW3_Y - MCP_SIZE / 2 - 10,
  width: MCP_SERVERS[5].x - MCP_SERVERS[0].x + MCP_SIZE + 20,
  height: MCP_SIZE + 20,
}

// === HELPER FUNCTIONS ===

function getNodeStatus(
  stepId: string,
  currentStep: string,
  completedSteps: string[],
  cacheHit?: boolean
): NodeStatus {
  if (completedSteps.includes(stepId)) return 'completed'
  if (currentStep === stepId) return 'executing'
  if (cacheHit && ['researcher', 'analyzer', 'critic', 'editor', 'a2a_client'].includes(stepId)) {
    return 'skipped'
  }
  return 'idle'
}

// CSS class helpers
function getNodeClass(status: NodeStatus): string {
  return `pf-node pf-node-${status}`
}

function getCacheClass(state: CacheState): string {
  if (state === 'idle') return 'pf-node pf-node-idle'
  return `pf-node pf-cache-${state}`
}

function getConnectorClass(status: NodeStatus): string {
  return `pf-connector pf-connector-${status}`
}

function getLLMClass(status: NodeStatus): string {
  return `pf-llm pf-llm-${status}`
}

function getTextClass(status: NodeStatus): string {
  return status === 'idle' || status === 'skipped' ? 'pf-text-idle' : 'pf-text-active'
}

function getLLMTextClass(status: NodeStatus): string {
  return `pf-llm-text-${status}`
}

// === SVG COMPONENTS ===

function ArrowMarkers() {
  return (
    <defs>
      {/* Single arrow (for → and ↓) */}
      <marker
        id="arrow-idle"
        markerWidth="10"
        markerHeight="10"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="var(--pf-connector-idle)" />
      </marker>
      <marker
        id="arrow-executing"
        markerWidth="10"
        markerHeight="10"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="var(--pf-connector-executing)" />
      </marker>
      <marker
        id="arrow-completed"
        markerWidth="10"
        markerHeight="10"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="var(--pf-connector-completed)" />
      </marker>

      {/* Reverse arrows (for ↔ start) */}
      <marker
        id="arrow-start-idle"
        markerWidth="10"
        markerHeight="10"
        refX="1"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M9,0 L9,6 L0,3 z" fill="var(--pf-connector-idle)" />
      </marker>
      <marker
        id="arrow-start-executing"
        markerWidth="10"
        markerHeight="10"
        refX="1"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M9,0 L9,6 L0,3 z" fill="var(--pf-connector-executing)" />
      </marker>
      <marker
        id="arrow-start-completed"
        markerWidth="10"
        markerHeight="10"
        refX="1"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M9,0 L9,6 L0,3 z" fill="var(--pf-connector-completed)" />
      </marker>
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
}: {
  x: number
  y: number
  icon: React.ElementType
  label: string
  status: NodeStatus
  isDiamond?: boolean
  cacheState?: CacheState
}) {
  const nodeClass = cacheState ? getCacheClass(cacheState) : getNodeClass(status)
  const isActive = status === 'executing' || cacheState === 'checking'
  const opacity = status === 'idle' && !cacheState ? 0.5 : status === 'skipped' ? 0.4 : 1

  return (
    <g opacity={opacity} className={isActive ? 'pf-glow' : ''}>
      {/* Node container */}
      <rect
        x={x - NODE_SIZE / 2}
        y={y - NODE_SIZE / 2}
        width={NODE_SIZE}
        height={NODE_SIZE}
        rx={isDiamond ? 4 : 8}
        strokeWidth={2}
        className={cn(nodeClass, isActive && 'pf-pulse')}
        transform={isDiamond ? `rotate(45 ${x} ${y})` : undefined}
      />

      {/* Icon at top */}
      <foreignObject
        x={x - ICON_SIZE / 2}
        y={y - NODE_SIZE / 2 + 8}
        width={ICON_SIZE}
        height={ICON_SIZE}
      >
        <div className="flex items-center justify-center w-full h-full">
          {isActive ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          ) : (
            <Icon className="w-3.5 h-3.5 text-white" />
          )}
        </div>
      </foreignObject>

      {/* Label inside container */}
      <text
        x={x}
        y={y + NODE_SIZE / 2 - 8}
        textAnchor="middle"
        className={cn('text-[7px] font-medium', getTextClass(status))}
      >
        {label}
      </text>
    </g>
  )
}

function MCPServer({
  x,
  y,
  label,
  status,
}: {
  x: number
  y: number
  label: string
  status: NodeStatus
}) {
  const isActive = status === 'executing'
  const opacity = status === 'idle' ? 0.5 : 1

  return (
    <g opacity={opacity} className={isActive ? 'pf-glow' : ''}>
      <rect
        x={x - MCP_SIZE / 2}
        y={y - MCP_SIZE / 2}
        width={MCP_SIZE}
        height={MCP_SIZE}
        rx={6}
        strokeWidth={1}
        className={cn(getNodeClass(status), isActive && 'pf-pulse')}
      />

      <foreignObject
        x={x - MCP_ICON_SIZE / 2}
        y={y - MCP_SIZE / 2 + 8}
        width={MCP_ICON_SIZE}
        height={MCP_ICON_SIZE}
      >
        <div className="flex items-center justify-center w-full h-full">
          <Server className="w-4 h-4 text-white" />
        </div>
      </foreignObject>

      <text
        x={x}
        y={y + MCP_SIZE / 2 - 8}
        textAnchor="middle"
        className="text-[10px] font-medium pf-text-mcp"
      >
        {label}
      </text>
    </g>
  )
}

function LLMProvider({
  x,
  y,
  name,
  status,
}: {
  x: number
  y: number
  name: string
  status: NodeStatus
}) {
  const isActive = status === 'executing'
  const opacity = status === 'idle' ? 0.5 : 1

  return (
    <g opacity={opacity}>
      <rect
        x={x - LLM_WIDTH / 2}
        y={y - LLM_HEIGHT / 2}
        width={LLM_WIDTH}
        height={LLM_HEIGHT}
        rx={4}
        strokeWidth={1}
        className={cn(getLLMClass(status), isActive && 'pf-pulse')}
      />

      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className={cn('text-[10px] font-medium', getLLMTextClass(status))}
      >
        {name}
      </text>
    </g>
  )
}

function GroupBox({
  x,
  y,
  width,
  height,
}: {
  x: number
  y: number
  width: number
  height: number
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={8}
      strokeWidth={1}
      className="pf-group"
    />
  )
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  status,
  biDirectional = false,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  status: NodeStatus
  biDirectional?: boolean
}) {
  const markerEnd = `url(#arrow-${status})`
  const markerStart = biDirectional ? `url(#arrow-start-${status})` : undefined

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      strokeWidth={2}
      markerEnd={markerEnd}
      markerStart={markerStart}
      className={getConnectorClass(status)}
    />
  )
}

function ArrowPath({
  d,
  status,
}: {
  d: string
  status: NodeStatus
}) {
  return (
    <path
      d={d}
      strokeWidth={2}
      fill="none"
      markerEnd={`url(#arrow-${status})`}
      className={getConnectorClass(status)}
    />
  )
}

// === MAIN COMPONENT ===

export function ProcessFlow({
  currentStep,
  completedSteps,
  mcpStatus,
  cacheHit = false,
}: ProcessFlowProps) {
  // Calculate statuses
  const inputStatus = getNodeStatus('input', currentStep, completedSteps, cacheHit)
  const a2aStatus = getNodeStatus('a2a_client', currentStep, completedSteps, cacheHit)
  const analyzerStatus = getNodeStatus('analyzer', currentStep, completedSteps, cacheHit)
  const criticStatus = getNodeStatus('critic', currentStep, completedSteps, cacheHit)
  const editorStatus = getNodeStatus('editor', currentStep, completedSteps, cacheHit)
  const outputStatus = getNodeStatus('output', currentStep, completedSteps, cacheHit)
  const researcherStatus = getNodeStatus('researcher', currentStep, completedSteps, cacheHit)
  const exchangeStatus = getNodeStatus('exchange_match', currentStep, completedSteps, cacheHit)

  // Cache state
  const cacheState: CacheState =
    currentStep === 'cache' ? 'checking' :
    completedSteps.includes('cache') ? (cacheHit ? 'hit' : 'miss') :
    'idle'

  // LLM status
  const llmActive = ['analyzer', 'critic', 'editor'].some(s =>
    currentStep === s || completedSteps.includes(s)
  )
  const llmStatus: NodeStatus = ['analyzer', 'critic', 'editor'].some(s => currentStep === s)
    ? 'executing'
    : llmActive ? 'completed' : 'idle'

  // Connector status helper
  const conn = (from: NodeStatus, to: NodeStatus): NodeStatus =>
    from === 'completed' && to !== 'idle' ? 'completed' :
    from === 'executing' ? 'executing' : 'idle'

  // Bypass connector status (for cache hit path)
  const bypassStatus: NodeStatus = cacheHit && completedSteps.includes('cache') ? 'completed' : 'idle'

  return (
    <div className="w-full p-4 overflow-x-auto">
      <svg
        viewBox="0 0 700 310"
        preserveAspectRatio="xMidYMid meet"
        className="w-full min-w-[700px]"
        style={{ minHeight: '310px' }}
      >
        <ArrowMarkers />

        {/* === CONNECTORS === */}

        {/* Cache bypass elbow (above Row 1) */}
        <ArrowPath
          d={`M ${NODES.cache.x} ${NODES.cache.y - NODE_SIZE/2 - 5}
              L ${NODES.cache.x} 15
              L ${NODES.output.x} 15
              L ${NODES.output.x} ${NODES.output.y - NODE_SIZE/2 - 5}`}
          status={bypassStatus}
        />

        {/* Row 1: Horizontal arrows */}
        <Arrow
          x1={NODES.input.x + NODE_SIZE/2 + 2}
          y1={ROW1_Y}
          x2={NODES.cache.x - NODE_SIZE/2 - 12}
          y2={ROW1_Y}
          status={conn(inputStatus, cacheState === 'idle' ? 'idle' : 'completed')}
        />
        <Arrow
          x1={NODES.cache.x + NODE_SIZE/2 + 12}
          y1={ROW1_Y}
          x2={NODES.a2a.x - NODE_SIZE/2 - 12}
          y2={ROW1_Y}
          status={cacheState === 'miss' ? conn('completed' as NodeStatus, a2aStatus) : 'idle'}
        />
        <Arrow
          x1={NODES.a2a.x + NODE_SIZE/2 + 2}
          y1={ROW1_Y}
          x2={AGENTS_GROUP.x - 12}
          y2={ROW1_Y}
          status={conn(a2aStatus, analyzerStatus)}
        />
        <Arrow
          x1={NODES.analyzer.x + NODE_SIZE/2 + 2}
          y1={ROW1_Y}
          x2={NODES.critic.x - NODE_SIZE/2 - 12}
          y2={ROW1_Y}
          status={conn(analyzerStatus, criticStatus)}
        />
        <Arrow
          x1={NODES.critic.x + NODE_SIZE/2 + 2}
          y1={ROW1_Y}
          x2={NODES.editor.x - NODE_SIZE/2 - 12}
          y2={ROW1_Y}
          status={conn(criticStatus, editorStatus)}
        />
        <Arrow
          x1={AGENTS_GROUP.x + AGENTS_GROUP.width + 2}
          y1={ROW1_Y}
          x2={NODES.output.x - NODE_SIZE/2 - 12}
          y2={ROW1_Y}
          status={conn(editorStatus, outputStatus)}
        />

        {/* Input to Exchange (down arrow) */}
        <Arrow
          x1={NODES.input.x}
          y1={NODES.input.y + NODE_SIZE/2 + 2}
          x2={NODES.exchange.x}
          y2={NODES.exchange.y - NODE_SIZE/2 - 12}
          status={conn(inputStatus, exchangeStatus)}
        />

        {/* A2A ↔ Researcher (bi-directional vertical) */}
        <Arrow
          x1={NODES.a2a.x}
          y1={NODES.a2a.y + NODE_SIZE/2 + 2}
          x2={NODES.researcher.x}
          y2={NODES.researcher.y - NODE_SIZE/2 - 12}
          status={conn(a2aStatus, researcherStatus)}
          biDirectional
        />

        {/* Agents group ↔ LLM group (bi-directional) */}
        <Arrow
          x1={AGENTS_CENTER_X}
          y1={AGENTS_GROUP.y + AGENTS_GROUP.height + 2}
          x2={AGENTS_CENTER_X}
          y2={LLM_GROUP.y - 12}
          status={llmStatus}
          biDirectional
        />

        {/* Researcher ↔ MCP group (bi-directional horizontal) */}
        <Arrow
          x1={NODES.researcher.x + NODE_SIZE/2 + 2}
          y1={ROW3_Y}
          x2={MCP_GROUP.x - 12}
          y2={ROW3_Y}
          status={researcherStatus}
          biDirectional
        />

        {/* === GROUP BOXES === */}

        <GroupBox {...AGENTS_GROUP} />
        <GroupBox {...LLM_GROUP} />
        <GroupBox {...MCP_GROUP} />

        {/* === NODES === */}

        {/* Row 1: Main flow */}
        <SVGNode x={NODES.input.x} y={NODES.input.y} icon={User} label="Input" status={inputStatus} />
        <SVGNode x={NODES.cache.x} y={NODES.cache.y} icon={Database} label="Cache" status={cacheState === 'idle' ? 'idle' : 'completed'} isDiamond cacheState={cacheState} />
        <SVGNode x={NODES.a2a.x} y={NODES.a2a.y} icon={Network} label="A2A" status={a2aStatus} />
        <SVGNode x={NODES.analyzer.x} y={NODES.analyzer.y} icon={Brain} label="Analyzer" status={analyzerStatus} />
        <SVGNode x={NODES.critic.x} y={NODES.critic.y} icon={MessageSquare} label="Critic" status={criticStatus} />
        <SVGNode x={NODES.editor.x} y={NODES.editor.y} icon={Edit3} label="Editor" status={editorStatus} />
        <SVGNode x={NODES.output.x} y={NODES.output.y} icon={FileOutput} label="Output" status={outputStatus} />

        {/* Row 2: Exchange + LLM Providers */}
        <SVGNode x={NODES.exchange.x} y={NODES.exchange.y} icon={GitBranch} label="Exchange" status={exchangeStatus} />

        {LLM_PROVIDERS.map((llm) => (
          <LLMProvider
            key={llm.name}
            x={llm.x}
            y={ROW2_Y}
            name={llm.name}
            status={llmStatus}
          />
        ))}

        {/* Row 3: Researcher + MCP Servers */}
        <SVGNode x={NODES.researcher.x} y={NODES.researcher.y} icon={Search} label="Research" status={researcherStatus} />

        {MCP_SERVERS.map((mcp) => (
          <MCPServer
            key={mcp.id}
            x={mcp.x}
            y={ROW3_Y}
            label={mcp.label}
            status={mcpStatus[mcp.id as keyof MCPStatus] || 'idle'}
          />
        ))}
      </svg>
    </div>
  )
}

export default ProcessFlow
