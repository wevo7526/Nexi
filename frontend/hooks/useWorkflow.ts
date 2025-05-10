import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { WorkflowType, WorkflowStep, WorkflowData } from '@/types/workflow';

interface UseWorkflowProps {
    type: WorkflowType;
}

interface UseWorkflowReturn {
    projectId: string | null;
    project: any | null;
    steps: WorkflowStep[];
    data: WorkflowData[];
    isLoading: boolean;
    error: string | null;
    fetchProject: () => Promise<void>;
    updateStep: (stepId: string, updates: Partial<WorkflowStep>) => Promise<void>;
    addData: (data: Omit<WorkflowData, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateData: (dataId: string, updates: Partial<WorkflowData>) => Promise<void>;
    deleteData: (dataId: string) => Promise<void>;
}

export function useWorkflow({ type }: UseWorkflowProps): UseWorkflowReturn {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');
    
    const [project, setProject] = useState<any | null>(null);
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [data, setData] = useState<WorkflowData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProject = async () => {
        if (!projectId) return;

        try {
            setIsLoading(true);
            setError(null);

            // Fetch project details
            const projectResponse = await fetch(`/api/projects/${projectId}`);
            if (!projectResponse.ok) throw new Error('Failed to fetch project');
            const projectData = await projectResponse.json();
            setProject(projectData);

            // Fetch workflow steps
            const stepsResponse = await fetch(`/api/workflows/${type}/steps?projectId=${projectId}`);
            if (!stepsResponse.ok) throw new Error('Failed to fetch workflow steps');
            const stepsData = await stepsResponse.json();
            setSteps(stepsData);

            // Fetch workflow data
            const dataResponse = await fetch(`/api/workflows/${type}/data?projectId=${projectId}`);
            if (!dataResponse.ok) throw new Error('Failed to fetch workflow data');
            const workflowData = await dataResponse.json();
            setData(workflowData);
        } catch (error) {
            console.error('Error fetching workflow data:', error);
            setError('Failed to load workflow data');
        } finally {
            setIsLoading(false);
        }
    };

    const updateStep = async (stepId: string, updates: Partial<WorkflowStep>) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/workflows/${type}/steps/${stepId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) throw new Error('Failed to update step');

            // Refresh steps after update
            await fetchProject();
        } catch (error) {
            console.error('Error updating step:', error);
            setError('Failed to update step');
        } finally {
            setIsLoading(false);
        }
    };

    const addData = async (newData: Omit<WorkflowData, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/workflows/${type}/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newData,
                    project_id: projectId,
                    workflow_type: type,
                }),
            });

            if (!response.ok) throw new Error('Failed to add data');

            // Refresh data after adding
            await fetchProject();
        } catch (error) {
            console.error('Error adding data:', error);
            setError('Failed to add data');
        } finally {
            setIsLoading(false);
        }
    };

    const updateData = async (dataId: string, updates: Partial<WorkflowData>) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/workflows/${type}/data/${dataId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) throw new Error('Failed to update data');

            // Refresh data after update
            await fetchProject();
        } catch (error) {
            console.error('Error updating data:', error);
            setError('Failed to update data');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteData = async (dataId: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/workflows/${type}/data/${dataId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete data');

            // Refresh data after deletion
            await fetchProject();
        } catch (error) {
            console.error('Error deleting data:', error);
            setError('Failed to delete data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchProject();
        }
    }, [projectId, type]);

    return {
        projectId,
        project,
        steps,
        data,
        isLoading,
        error,
        fetchProject,
        updateStep,
        addData,
        updateData,
        deleteData,
    };
} 