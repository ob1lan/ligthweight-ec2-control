"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, CheckCircle, XCircle, Trash2, Plus } from "lucide-react";
import { InstanceCard, ActivityLog } from "@/components/instance-card";
import { AddInstanceModal } from "@/components/add-instance-modal";
import { getInstances, addInstance, removeInstance, InstanceConfig } from "@/app/actions";

export default function Dashboard() {
    const [instances, setInstances] = useState<InstanceConfig[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const loadInstances = async () => {
            try {
                const data = await getInstances();
                setInstances(data);
            } catch (error) {
                console.error("Failed to load instances:", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        loadInstances();
    }, []);

    const handleAddInstance = async (name: string, ec2Id: string) => {
        try {
            const newInstance = await addInstance(name, ec2Id);
            if (newInstance) {
                setInstances(prev => [...prev, newInstance]);
            }
        } catch (error) {
            console.error("Failed to add instance:", error);
        }
    };

    const handleRemoveInstance = async (id: string) => {
        if (confirm("Are you sure you want to remove this instance configuration?")) {
            try {
                const success = await removeInstance(id);
                if (success) {
                    setInstances(prev => prev.filter(inst => inst.id !== id));
                }
            } catch (error) {
                console.error("Failed to remove instance:", error);
            }
        }
    };

    const addLog = (log: ActivityLog) => {
        setLogs(prev => [log, ...prev]);
    };

    const updateLog = (id: string, status: ActivityLog["status"], message: string) => {
        setLogs(prev => prev.map(log => 
            log.id === id ? { ...log, status, message } : log
        ));
    };

    const clearLogs = () => {
        setLogs([]);
    };

    if (isLoadingData) {
        return (
            <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900 p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Header */}
                <header className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 tracking-tight">
                            Instance Manager
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            EC2 Instances Control
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Instance
                        </button>
                        <ThemeToggle />
                    </div>
                </header>

                <div className="space-y-6">
                    {instances.map((instance) => (
                        <InstanceCard 
                            key={instance.id}
                            instanceId={instance.id}
                            ec2Id={instance.ec2Id}
                            title={instance.name}
                            subtitle={`${instance.name} / ${instance.ec2Id}`}
                            onLog={addLog}
                            onUpdateLog={updateLog}
                            onDelete={() => handleRemoveInstance(instance.id)}
                        />
                    ))}

                    {instances.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                            <p className="text-neutral-500 dark:text-neutral-400">No instances configured.</p>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:underline"
                            >
                                Add your first instance
                            </button>
                        </div>
                    )}
                </div>

                {/* Activity Log */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Recent Activity</h3>
                        {logs.length > 0 && (
                            <button 
                                onClick={clearLogs}
                                className="text-xs text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                                Clear
                            </button>
                        )}
                    </div>
                    
                    <div className="bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden min-h-[200px]">
                        {logs.length === 0 ? (
                            <div className="h-[200px] flex items-center justify-center text-neutral-500 dark:text-neutral-400 text-sm italic">
                                Ready for commands...
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {logs.map((log) => (
                                    <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <div className="mt-0.5">
                                            {log.status === "pending" && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                                            {log.status === "success" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                            {log.status === "error" && <XCircle className="w-4 h-4 text-rose-500" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                                    {log.action}
                                                </p>
                                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                                    {log.timestamp}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400 break-all">
                                                {log.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <AddInstanceModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onAdd={handleAddInstance}
                />
            </div>
        </div>
    );
}