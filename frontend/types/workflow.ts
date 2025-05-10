export type WorkflowType = 'discovery' | 'analysis' | 'solution' | 'implementation';

export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed';

export interface WorkflowStep {
    id: string;
    project_id: string;
    workflow_type: WorkflowType;
    step_number: number;
    title: string;
    description: string;
    status: WorkflowStepStatus;
    ai_assistance: boolean;
    created_at: string;
    updated_at: string;
}

export type WorkflowDataType = 'user' | 'assistant' | 'agent_response' | 'analysis' | 'solution' | 'implementation';

export interface WorkflowData {
    id: string;
    project_id: string;
    workflow_type: WorkflowType;
    content: {
        userInput?: string;
        response?: string;
        data?: any;
        [key: string]: any;
    };
    type: WorkflowDataType;
    created_at: string;
    updated_at: string;
}

export interface WorkflowComment {
    id: string;
    project_id: string;
    workflow_type: WorkflowType;
    content: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// Discovery specific types
export interface DiscoveryStep extends WorkflowStep {
    client_info?: {
        name: string;
        industry: string;
        size: string;
        challenges: string[];
    };
    stakeholder_analysis?: {
        stakeholders: Array<{
            name: string;
            role: string;
            interests: string[];
            influence: 'high' | 'medium' | 'low';
        }>;
    };
    problem_definition?: {
        problems: Array<{
            description: string;
            impact: string;
            priority: 'high' | 'medium' | 'low';
        }>;
    };
}

// Analysis specific types
export interface AnalysisStep extends WorkflowStep {
    data_points?: number;
    data_sources?: Array<{
        name: string;
        type: string;
        points: number;
    }>;
    insights?: Array<{
        title: string;
        description: string;
        confidence: number;
    }>;
}

// Solution specific types
export interface SolutionStep extends WorkflowStep {
    version: number;
    solution_status: 'draft' | 'review' | 'approved';
    ai_suggestions?: string[];
    implementation_plan?: {
        phases: Array<{
            name: string;
            duration: string;
            tasks: string[];
        }>;
    };
}

// Implementation specific types
export interface ImplementationStep extends WorkflowStep {
    priority: 'low' | 'medium' | 'high';
    assigned_to: string[];
    due_date: string;
    progress: number;
    dependencies: string[];
    blockers?: Array<{
        description: string;
        impact: string;
        resolution?: string;
    }>;
} 